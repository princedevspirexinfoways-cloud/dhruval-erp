import mongoose, { Schema, model } from 'mongoose';
import { IScrap } from '@/types/models';

const ScrapSchema = new Schema<IScrap>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  scrapNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  scrapDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  // Reference to original inventory item
  inventoryItemId: {
    type: Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
    index: true
  },
  itemCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemDescription: {
    type: String,
    trim: true
  },

  // Scrap details
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  scrapReason: {
    type: String,
    required: true,
    enum: ['damaged', 'defective', 'expired', 'obsolete', 'production_waste', 'quality_reject', 'other'],
    index: true
  },
  scrapReasonDetails: {
    type: String,
    trim: true
  },

  // Location information
  warehouseId: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    index: true
  },
  warehouseName: {
    type: String,
    trim: true
  },
  zone: {
    type: String,
    trim: true
  },
  rack: {
    type: String,
    trim: true
  },
  bin: {
    type: String,
    trim: true
  },

  // Stock impact
  stockImpact: {
    inventoryStockBefore: {
      type: Number,
      required: true,
      min: 0
    },
    inventoryStockAfter: {
      type: Number,
      required: true,
      min: 0
    },
    scrapStockBefore: {
      type: Number,
      default: 0,
      min: 0
    },
    scrapStockAfter: {
      type: Number,
      required: true,
      min: 0
    }
  },

  // Valuation
  unitCost: {
    type: Number,
    min: 0
  },
  totalValue: {
    type: Number,
    min: 0
  },

  // Quality details
  qualityGrade: {
    type: String,
    trim: true
  },
  defectDetails: {
    type: String,
    trim: true
  },

  // Batch/Lot information
  batchNumber: {
    type: String,
    trim: true,
    index: true
  },
  lotNumber: {
    type: String,
    trim: true
  },
  manufacturingDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },

  // Approval workflow
  approval: {
    isRequired: {
      type: Boolean,
      default: false
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    },
    approvalNotes: {
      type: String,
      trim: true
    }
  },

  // Disposal information
  disposal: {
    disposed: {
      type: Boolean,
      default: false,
      index: true
    },
    disposalDate: {
      type: Date
    },
    disposalMethod: {
      type: String,
      enum: ['sold', 'donated', 'recycled', 'destroyed', 'other']
    },
    disposalValue: {
      type: Number,
      min: 0
    },
    disposalNotes: {
      type: String,
      trim: true
    },
    disposedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Tracking
  status: {
    type: String,
    enum: ['active', 'disposed', 'cancelled'],
    default: 'active',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
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
  collection: 'scrap'
});

// Compound indexes
ScrapSchema.index({ companyId: 1, scrapDate: -1 });
ScrapSchema.index({ companyId: 1, inventoryItemId: 1 });
ScrapSchema.index({ companyId: 1, status: 1 });
ScrapSchema.index({ companyId: 1, scrapReason: 1 });
ScrapSchema.index({ companyId: 1, 'disposal.disposed': 1 });

// Pre-save middleware to generate scrap number
ScrapSchema.pre('save', async function(next) {
  if (this.isNew && !this.scrapNumber) {
    try {
      const Company = (await import('./Company')).default;
      const company = await Company.findById(this.companyId);
      const companyCode = company?.companyCode || 'COMP';
      
      // Generate scrap number: SCRAP-{COMPANY_CODE}-{YYYYMMDD}-{SEQ}
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      // Find the count of scraps created today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const count = await mongoose.model('Scrap').countDocuments({
        companyId: this.companyId,
        scrapDate: { $gte: todayStart, $lte: todayEnd }
      });
      
      const sequence = String(count + 1).padStart(4, '0');
      this.scrapNumber = `SCRAP-${companyCode}-${date}-${sequence}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  
  // Calculate total value if unit cost is provided
  if (this.unitCost && this.quantity) {
    this.totalValue = this.unitCost * this.quantity;
  }
  
  next();
});

// Instance methods
ScrapSchema.methods.markAsDisposed = function(
  disposalMethod: string,
  disposalValue: number,
  disposalNotes: string,
  disposedBy: string
) {
  this.disposal = {
    disposed: true,
    disposalDate: new Date(),
    disposalMethod: disposalMethod as any,
    disposalValue: disposalValue || 0,
    disposalNotes: disposalNotes,
    disposedBy: new mongoose.Types.ObjectId(disposedBy)
  };
  this.status = 'disposed';
  return this.save();
};

// Static methods
ScrapSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, status: 'active' });
};

ScrapSchema.statics.findByInventoryItem = function(companyId: string, inventoryItemId: string) {
  return this.find({
    companyId,
    inventoryItemId,
    status: 'active'
  });
};

ScrapSchema.statics.getScrapSummary = async function(companyId: string) {
  return this.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$scrapReason',
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalValue' },
        count: { $sum: 1 }
      }
    }
  ]);
};

export interface IScrapModel extends mongoose.Model<IScrap> {
  findByCompany(companyId: string): Promise<IScrap[]>;
  findByInventoryItem(companyId: string, inventoryItemId: string): Promise<IScrap[]>;
  getScrapSummary(companyId: string): Promise<any[]>;
}

export default model<IScrap, IScrapModel>('Scrap', ScrapSchema);














