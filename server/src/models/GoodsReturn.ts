import mongoose, { Schema, model } from 'mongoose';
import { IGoodsReturn } from '@/types/models';

const GoodsReturnSchema = new Schema<IGoodsReturn>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  returnNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  returnDate: {
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

  // Original challan information
  originalChallanNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  originalChallanDate: {
    type: Date
  },

  // Return details
  damagedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  returnedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  returnReason: {
    type: String,
    required: true,
    enum: ['damaged', 'defective', 'quality_issue', 'wrong_item', 'expired', 'other'],
    index: true
  },
  returnReasonDetails: {
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
    damagedStockBefore: {
      type: Number,
      default: 0,
      min: 0
    },
    damagedStockAfter: {
      type: Number,
      required: true,
      min: 0
    },
    returnedStockBefore: {
      type: Number,
      default: 0,
      min: 0
    },
    returnedStockAfter: {
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
  damagedValue: {
    type: Number,
    min: 0
  },
  returnedValue: {
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

  // Supplier/Party information
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true
  },
  supplierName: {
    type: String,
    trim: true
  },
  supplierCode: {
    type: String,
    trim: true
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

  // Return status
  returnStatus: {
    type: String,
    enum: ['pending', 'approved', 'processed', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Tracking
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
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
  collection: 'goods_returns'
});

// Compound indexes
GoodsReturnSchema.index({ companyId: 1, returnDate: -1 });
GoodsReturnSchema.index({ companyId: 1, inventoryItemId: 1 });
GoodsReturnSchema.index({ companyId: 1, status: 1 });
GoodsReturnSchema.index({ companyId: 1, returnStatus: 1 });
GoodsReturnSchema.index({ companyId: 1, originalChallanNumber: 1 });
GoodsReturnSchema.index({ companyId: 1, returnReason: 1 });

// Pre-save middleware to generate return number
GoodsReturnSchema.pre('save', async function(next) {
  if (this.isNew && !this.returnNumber) {
    try {
      const Company = (await import('./Company')).default;
      const company = await Company.findById(this.companyId);
      const companyCode = company?.companyCode || 'COMP';
      
      // Generate return number: GR-{COMPANY_CODE}-{YYYYMMDD}-{SEQ}
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      // Find the count of returns created today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const count = await mongoose.model('GoodsReturn').countDocuments({
        companyId: this.companyId,
        returnDate: { $gte: todayStart, $lte: todayEnd }
      });
      
      const sequence = String(count + 1).padStart(4, '0');
      this.returnNumber = `GR-${companyCode}-${date}-${sequence}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  
  // Calculate total quantity if not set
  if (!this.totalQuantity && this.damagedQuantity !== undefined && this.returnedQuantity !== undefined) {
    this.totalQuantity = this.damagedQuantity + this.returnedQuantity;
  }
  
  // Calculate values if unit cost is provided
  if (this.unitCost) {
    if (this.damagedQuantity !== undefined) {
      this.damagedValue = this.unitCost * this.damagedQuantity;
    }
    if (this.returnedQuantity !== undefined) {
      this.returnedValue = this.unitCost * this.returnedQuantity;
    }
    if (this.totalQuantity !== undefined) {
      this.totalValue = this.unitCost * this.totalQuantity;
    }
  }
  
  next();
});

// Instance methods
GoodsReturnSchema.methods.markAsProcessed = function(
  processedBy: string,
  notes?: string
) {
  this.returnStatus = 'processed';
  this.status = 'completed';
  if (notes) {
    this.notes = notes;
  }
  this.lastModifiedBy = new mongoose.Types.ObjectId(processedBy);
  return this.save();
};

// Static methods
GoodsReturnSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, status: 'active' });
};

GoodsReturnSchema.statics.findByInventoryItem = function(companyId: string, inventoryItemId: string) {
  return this.find({
    companyId,
    inventoryItemId,
    status: 'active'
  });
};

GoodsReturnSchema.statics.findByChallan = function(companyId: string, challanNumber: string) {
  return this.find({
    companyId,
    originalChallanNumber: challanNumber,
    status: 'active'
  });
};

GoodsReturnSchema.statics.getReturnSummary = async function(companyId: string) {
  return this.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$returnReason',
        totalDamagedQuantity: { $sum: '$damagedQuantity' },
        totalReturnedQuantity: { $sum: '$returnedQuantity' },
        totalValue: { $sum: '$totalValue' },
        count: { $sum: 1 }
      }
    }
  ]);
};

export interface IGoodsReturnModel extends mongoose.Model<IGoodsReturn> {
  findByCompany(companyId: string): Promise<IGoodsReturn[]>;
  findByInventoryItem(companyId: string, inventoryItemId: string): Promise<IGoodsReturn[]>;
  findByChallan(companyId: string, challanNumber: string): Promise<IGoodsReturn[]>;
  getReturnSummary(companyId: string): Promise<any[]>;
}

export default model<IGoodsReturn, IGoodsReturnModel>('GoodsReturn', GoodsReturnSchema);

