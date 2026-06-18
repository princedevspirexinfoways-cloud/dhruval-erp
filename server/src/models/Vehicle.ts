import { Schema, model, Document } from 'mongoose';

// Simplified Vehicle interface for gate pass system
export interface ISimpleVehicle extends Document {
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other';
  reason: string;
  timeIn: Date;
  timeOut?: Date;
  status: 'in' | 'out' | 'pending';
  currentStatus: 'in' | 'out' | 'pending';
  gatePassNumber?: string;
  images?: string[];
  companyId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
}

// Full Vehicle interface for compatibility
export interface IVehicle extends Document {
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other';
  reason: string;
  timeIn: Date;
  timeOut?: Date;
  status: 'in' | 'out' | 'pending';
  currentStatus: 'in' | 'out' | 'pending';
  gatePassNumber?: string;
  images?: string[];
  companyId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
}

// Simplified Vehicle Schema for Gate Pass System

const VehicleSchema = new Schema<ISimpleVehicle>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Basic Vehicle Information
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },

  // Driver Information
  driverName: {
    type: String,
    required: true,
    trim: true
  },
  driverPhone: {
    type: String,
    required: true,
    trim: true
  },

  // Gate Pass Information
  purpose: {
    type: String,
    enum: ['delivery', 'pickup', 'maintenance', 'other'],
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },

  // Time Tracking
  timeIn: {
    type: Date,
    default: Date.now,
    required: true
  },
  timeOut: {
    type: Date
  },

  // Status
  status: {
    type: String,
    enum: ['in', 'out', 'pending'],
    default: 'in',
    index: true
  },

  // Current Status (alias for compatibility)
  currentStatus: {
    type: String,
    enum: ['in', 'out', 'pending'],
    default: 'in',
    index: true
  },

  // Gate Pass Number (optional)
  gatePassNumber: {
    type: String,
    trim: true,
    sparse: true // allows multiple null values
  },

  // Images
  images: [String], // URLs to vehicle images

  // Audit fields
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'vehicles'
});

// Indexes for optimal performance
VehicleSchema.index({ companyId: 1, vehicleNumber: 1 }, { unique: true });
VehicleSchema.index({ companyId: 1, status: 1 });
VehicleSchema.index({ companyId: 1, purpose: 1 });
VehicleSchema.index({ driverPhone: 1 });
VehicleSchema.index({ timeIn: -1 });
VehicleSchema.index({ timeOut: -1 });

// Text search index
VehicleSchema.index({
  vehicleNumber: 'text',
  driverName: 'text',
  reason: 'text'
});

// Pre-save middleware
VehicleSchema.pre('save', function(next) {
  // Auto-generate gate pass number if not provided
  if (!this.gatePassNumber && this.isNew) {
    const timestamp = Date.now().toString().slice(-6);
    this.gatePassNumber = `GP${timestamp}`;
  }

  // Sync currentStatus with status
  if (this.isModified('status')) {
    this.currentStatus = this.status;
  }

  next();
});

// Pre-update middleware for findOneAndUpdate
VehicleSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  
  // Sync currentStatus with status if status is being updated
  if (update && update.status) {
    update.currentStatus = update.status;
  }
  
  next();
});

// Instance methods
VehicleSchema.methods.isCurrentlyInside = function(): boolean {
  return this.status === 'in';
};

VehicleSchema.methods.checkout = function(): void {
  this.status = 'out';
  this.currentStatus = 'out';
  this.timeOut = new Date();
};

VehicleSchema.methods.getDuration = function(): number {
  if (!this.timeOut) return 0;
  return Math.floor((this.timeOut.getTime() - this.timeIn.getTime()) / (1000 * 60)); // Duration in minutes
};

// Static methods
VehicleSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId });
};

VehicleSchema.statics.findCurrentlyInside = function(companyId: string) {
  return this.find({
    companyId,
    status: 'in'
  });
};

VehicleSchema.statics.findByPurpose = function(companyId: string, purpose: string) {
  return this.find({
    companyId,
    purpose
  });
};

VehicleSchema.statics.getVehicleStats = function(companyId: string) {
  return this.aggregate([
    { $match: { companyId: new Schema.Types.ObjectId(companyId) } },
    {
      $group: {
        _id: '$purpose',
        count: { $sum: 1 },
        inside: {
          $sum: {
            $cond: [{ $eq: ['$status', 'in'] }, 1, 0]
          }
        },
        outside: {
          $sum: {
            $cond: [{ $eq: ['$status', 'out'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

export default model<ISimpleVehicle>('Vehicle', VehicleSchema);
