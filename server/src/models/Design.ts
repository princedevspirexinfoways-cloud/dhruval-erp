import mongoose, { Schema, model } from 'mongoose';
import { IDesign } from '@/types/models';

const DesignSchema = new Schema<IDesign>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Required Fields
  designNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  designName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
    index: true
  },

  // Optional Design Information
  designDescription: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  designCategory: {
    type: String,
    trim: true,
    maxlength: 100
  },
  season: {
    type: String,
    enum: ['spring', 'summer', 'monsoon', 'winter', 'all_season'],
    index: true
  },
  designCollection: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // Artwork and Files
  artworkFile: {
    type: String,
    trim: true
  },
  designImage: {
    type: String,
    trim: true
  },
  designFiles: [{
    type: String,
    trim: true
  }],

  // Variants
  colorVariants: [{
    type: String,
    trim: true
  }],
  sizeVariants: [{
    type: String,
    trim: true
  }],

  // Design Specifications
  specifications: {
    pattern: {
      type: String,
      trim: true
    },
    technique: {
      type: String,
      trim: true
    },
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex', 'very_complex']
    },
    estimatedProductionTime: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // Usage Tracking
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsedDate: {
    type: Date
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },

  // Additional Information
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],

  // Audit fields
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'designs'
});

// Compound Indexes - Company-wise unique design number
DesignSchema.index({ companyId: 1, designNumber: 1 }, { unique: true });

// Additional indexes for performance
DesignSchema.index({ companyId: 1, designName: 1 });
DesignSchema.index({ companyId: 1, status: 1 });
DesignSchema.index({ companyId: 1, season: 1 });
DesignSchema.index({ companyId: 1, designCategory: 1 });

// Text search index
DesignSchema.index({
  designNumber: 'text',
  designName: 'text',
  designDescription: 'text',
  designCollection: 'text'
});

// Pre-save middleware
DesignSchema.pre('save', function(next) {
  // Ensure design number is uppercase
  if (this.isModified('designNumber')) {
    this.designNumber = this.designNumber.toUpperCase();
  }
  
  next();
});

// Instance methods
DesignSchema.methods.incrementUsage = function() {
  this.usageCount = (this.usageCount || 0) + 1;
  this.lastUsedDate = new Date();
  return this.save();
};

DesignSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

DesignSchema.methods.deactivate = function() {
  this.status = 'inactive';
  return this.save();
};

DesignSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static methods
DesignSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, status: 'active' });
};

DesignSchema.statics.findByDesignNumber = function(companyId: string, designNumber: string) {
  return this.findOne({
    companyId,
    designNumber: designNumber.toUpperCase(),
    status: 'active'
  });
};

DesignSchema.statics.findByCategory = function(companyId: string, category: string) {
  return this.find({
    companyId,
    designCategory: category,
    status: 'active'
  });
};

DesignSchema.statics.findBySeason = function(companyId: string, season: string) {
  return this.find({
    companyId,
    season,
    status: 'active'
  });
};

DesignSchema.statics.getMostUsed = function(companyId: string, limit: number = 10) {
  return this.find({
    companyId,
    status: 'active'
  })
    .sort({ usageCount: -1 })
    .limit(limit);
};

// Interface for static methods
export interface IDesignModel extends mongoose.Model<IDesign> {
  findByCompany(companyId: string): Promise<IDesign[]>;
  findByDesignNumber(companyId: string, designNumber: string): Promise<IDesign | null>;
  findByCategory(companyId: string, category: string): Promise<IDesign[]>;
  findBySeason(companyId: string, season: string): Promise<IDesign[]>;
  getMostUsed(companyId: string, limit?: number): Promise<IDesign[]>;
}

export default model<IDesign, IDesignModel>('Design', DesignSchema);

