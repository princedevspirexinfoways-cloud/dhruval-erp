import { Schema, model } from 'mongoose';
import { IStockMovement, IMovementLocation } from '@/types/models';

const MovementLocationSchema = new Schema<IMovementLocation>({
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouseName: { type: String },
  zone: { type: String },
  rack: { type: String },
  bin: { type: String },
  isExternal: { type: Boolean, default: false },
  externalLocation: { type: String }
}, { _id: false });

const StockMovementSchema = new Schema<IStockMovement>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true
  },

  // Movement Identification
  movementNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  movementDate: { 
    type: Date, 
    required: true, 
    default: Date.now
  },

  // Item Details
  itemId: { 
    type: Schema.Types.ObjectId, 
    ref: 'InventoryItem', 
    required: true
  },
  itemCode: { type: String },
  itemName: { type: String },

  // Movement Type & Reference
  movementType: {
    type: String,
    enum: ['inward', 'outward', 'transfer', 'adjustment', 'production_consume', 'production_output', 'return', 'damage', 'theft'],
    required: true
  },

  referenceDocument: {
    documentType: { 
      type: String, 
      enum: ['manual', 'purchase_order', 'sales_order', 'production_order', 'transfer_note', 'adjustment_note', 'return_note'] 
    },
    documentId: { type: Schema.Types.ObjectId },
    documentNumber: { type: String }
  },

  // Quantity & Valuation
  quantity: { 
    type: Number, 
    required: true,
    validate: {
      validator: function(v: number) {
        return v !== 0;
      },
      message: 'Quantity cannot be zero'
    }
  },
  unit: { 
    type: String, 
    required: true,
    trim: true
  },
  rate: { 
    type: Number, 
    min: 0 
  },
  totalValue: { 
    type: Number, 
    min: 0 
  },

  // Location Details
  fromLocation: MovementLocationSchema,
  toLocation: MovementLocationSchema,

  // Batch & Serial Tracking
  batchDetails: {
    batchNumber: { type: String },
    lotNumber: { type: String },
    serialNumbers: [String],
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },
    supplierBatch: { type: String }
  },

  // Quality Control
  qualityCheck: {
    isRequired: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    checkedAt: { type: Date },
    qualityGrade: { type: String },
    defects: [String],
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    acceptedQuantity: { type: Number, min: 0 },
    qualityNotes: { type: String },
    qualityImages: [String]
  },

  // Gate Pass & Security
  gatePass: {
    gatePassNumber: { type: String },
    vehicleNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    driverLicense: { type: String },
    transporterName: { type: String },
    securityApproval: {
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      remarks: { type: String },
      documentsVerified: [String]
    }
  },

  // Stock Impact
  stockImpact: {
    stockBefore: { type: Number, min: 0 },
    stockAfter: { type: Number, min: 0 },
    reservedBefore: { type: Number, min: 0 },
    reservedAfter: { type: Number, min: 0 },
    availableBefore: { type: Number, min: 0 },
    availableAfter: { type: Number, min: 0 }
  },

  // Cost Impact
  costImpact: {
    costBefore: { type: Number, min: 0 },
    costAfter: { type: Number, min: 0 },
    totalValueBefore: { type: Number, min: 0 },
    totalValueAfter: { type: Number, min: 0 },
    costMethod: { type: String }
  },

  // Approval Workflow
  approval: {
    isRequired: { type: Boolean, default: false },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    approvalLevel: { type: Number, default: 1 },
    approvalNotes: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'approved' 
    }
  },

  // Additional Information
  reason: { type: String },
  notes: { type: String },
  attachments: [String],
  tags: [String],

  // Tracking
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true,
  collection: 'stock_movements'
});

// Compound Indexes for optimal performance
StockMovementSchema.index({ companyId: 1, movementDate: -1 });
StockMovementSchema.index({ companyId: 1, itemId: 1, movementDate: -1 });
StockMovementSchema.index({ companyId: 1, movementType: 1, movementDate: -1 });
StockMovementSchema.index({ 'referenceDocument.documentType': 1, 'referenceDocument.documentNumber': 1 });
StockMovementSchema.index({ 'batchDetails.batchNumber': 1, movementDate: -1 });
StockMovementSchema.index({ companyId: 1, 'approval.status': 1, 'approval.isRequired': 1 });

// Unique constraint for movement number
StockMovementSchema.index({ movementNumber: 1 }, { unique: true });

// Pre-save middleware
StockMovementSchema.pre('save', function(next) {
  // Calculate total value if rate is provided
  if (this.rate && !this.totalValue) {
    this.totalValue = Math.abs(this.quantity) * this.rate;
  }
  
  // Set accepted quantity if not provided
  if (this.qualityCheck?.isCompleted && !this.qualityCheck.acceptedQuantity) {
    this.qualityCheck.acceptedQuantity = Math.abs(this.quantity) - (this.qualityCheck.rejectedQuantity || 0);
  }
  
  next();
});

// Instance methods
StockMovementSchema.methods.isInward = function(): boolean {
  return ['inward', 'production_output', 'return'].includes(this.movementType);
};

StockMovementSchema.methods.isOutward = function(): boolean {
  return ['outward', 'production_consume', 'damage', 'theft'].includes(this.movementType);
};

StockMovementSchema.methods.requiresApproval = function(): boolean {
  return this.approval?.isRequired || false;
};

StockMovementSchema.methods.isPending = function(): boolean {
  return this.approval?.status === 'pending';
};

StockMovementSchema.methods.isApproved = function(): boolean {
  return this.approval?.status === 'approved';
};

// Static methods
StockMovementSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId }).sort({ movementDate: -1 });
};

StockMovementSchema.statics.findByItem = function(companyId: string, itemId: string) {
  return this.find({ companyId, itemId }).sort({ movementDate: -1 });
};

StockMovementSchema.statics.findByDateRange = function(companyId: string, startDate: Date, endDate: Date) {
  return this.find({
    companyId,
    movementDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ movementDate: -1 });
};

StockMovementSchema.statics.findPendingApprovals = function(companyId: string) {
  return this.find({
    companyId,
    'approval.isRequired': true,
    'approval.status': 'pending'
  }).sort({ createdAt: 1 });
};

StockMovementSchema.statics.findByBatch = function(batchNumber: string) {
  return this.find({
    'batchDetails.batchNumber': batchNumber
  }).sort({ movementDate: -1 });
};

StockMovementSchema.statics.getMovementSummary = function(companyId: string, itemId: string) {
  return this.aggregate([
    {
      $match: { companyId: new Schema.Types.ObjectId(companyId), itemId: new Schema.Types.ObjectId(itemId) }
    },
    {
      $group: {
        _id: '$movementType',
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalValue' },
        count: { $sum: 1 }
      }
    }
  ]);
};

export default model<IStockMovement>('StockMovement', StockMovementSchema);
