import { Schema, model } from 'mongoose';

export interface IInventoryBatch {
  _id: string;
  companyId: Schema.Types.ObjectId;
  itemId: Schema.Types.ObjectId;
  batchNumber: string;
  lotNumber?: string;
  
  // Batch Details
  manufacturingDate: Date;
  expiryDate?: Date;
  receivedDate: Date;
  supplierId?: Schema.Types.ObjectId;
  supplierBatchNumber?: string;
  
  // Quantity Tracking
  initialQuantity: number;
  currentQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  unit: string;
  
  // Location Tracking
  locations: Array<{
    warehouseId: Schema.Types.ObjectId;
    warehouseName: string;
    zone?: string;
    rack?: string;
    bin?: string;
    quantity: number;
    lastUpdated: Date;
  }>;
  
  // Quality Information
  qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
  qualityScore: number;
  qualityNotes?: string;
  qualityCheckDate?: Date;
  qualityCheckedBy?: string;
  
  // Textile Specific
  specifications: {
    gsm?: number;
    width?: number;
    length?: number;
    color?: string;
    colorCode?: string;
    design?: string;
    pattern?: string;
    fabricComposition?: string;
    shrinkage?: number;
    colorFastness?: number;
    tensileStrength?: number;
  };
  
  // Process Tracking (for semi-finished goods)
  processStage?: 'grey' | 'printed' | 'washed' | 'fixed' | 'finished';
  processHistory: Array<{
    stage: string;
    startDate: Date;
    endDate?: Date;
    operator?: string;
    machineId?: string;
    notes?: string;
    qualityCheck?: {
      grade: string;
      score: number;
      notes: string;
      checkedBy: string;
      checkDate: Date;
    };
  }>;
  
  // Costing
  costPerUnit: number;
  totalCost: number;
  additionalCosts: Array<{
    type: string;
    description: string;
    amount: number;
    date: Date;
  }>;
  
  // Status
  status: 'active' | 'consumed' | 'expired' | 'damaged' | 'returned';
  isActive: boolean;
  
  // Audit
  createdBy: Schema.Types.ObjectId;
  lastModifiedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryBatchSchema = new Schema<IInventoryBatch>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },
  itemId: { 
    type: Schema.Types.ObjectId, 
    ref: 'InventoryItem', 
    required: true, 
    index: true 
  },
  batchNumber: { 
    type: String, 
    required: true, 
    trim: true,
    index: true
  },
  lotNumber: { type: String, trim: true },
  
  // Batch Details
  manufacturingDate: { type: Date, required: true },
  expiryDate: { type: Date },
  receivedDate: { type: Date, required: true, default: Date.now },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  supplierBatchNumber: { type: String, trim: true },
  
  // Quantity Tracking
  initialQuantity: { type: Number, required: true, min: 0 },
  currentQuantity: { type: Number, required: true, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  damagedQuantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, required: true, trim: true },
  
  // Location Tracking
  locations: [{
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    warehouseName: { type: String, required: true },
    zone: { type: String },
    rack: { type: String },
    bin: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }],
  
  // Quality Information
  qualityGrade: { 
    type: String, 
    enum: ['A+', 'A', 'B+', 'B', 'C', 'Reject'], 
    default: 'A',
    index: true
  },
  qualityScore: { type: Number, min: 0, max: 100, default: 100 },
  qualityNotes: { type: String },
  qualityCheckDate: { type: Date },
  qualityCheckedBy: { type: String },
  
  // Textile Specific
  specifications: {
    gsm: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    length: { type: Number, min: 0 },
    color: { type: String, trim: true },
    colorCode: { type: String, trim: true },
    design: { type: String, trim: true },
    pattern: { type: String, trim: true },
    fabricComposition: { type: String, trim: true },
    shrinkage: { type: Number, min: 0, max: 100 },
    colorFastness: { type: Number, min: 1, max: 5 },
    tensileStrength: { type: Number, min: 0 }
  },
  
  // Process Tracking
  processStage: { 
    type: String, 
    enum: ['grey', 'printed', 'washed', 'fixed', 'finished'],
    index: true
  },
  processHistory: [{
    stage: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    operator: { type: String },
    machineId: { type: String },
    notes: { type: String },
    qualityCheck: {
      grade: { type: String },
      score: { type: Number, min: 0, max: 100 },
      notes: { type: String },
      checkedBy: { type: String },
      checkDate: { type: Date }
    }
  }],
  
  // Costing
  costPerUnit: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  additionalCosts: [{
    type: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now }
  }],
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'consumed', 'expired', 'damaged', 'returned'], 
    default: 'active',
    index: true
  },
  isActive: { type: Boolean, default: true },
  
  // Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'inventory_batches'
});

// Indexes
InventoryBatchSchema.index({ companyId: 1, batchNumber: 1 }, { unique: true });
InventoryBatchSchema.index({ companyId: 1, itemId: 1 });
InventoryBatchSchema.index({ companyId: 1, processStage: 1 });
InventoryBatchSchema.index({ companyId: 1, qualityGrade: 1 });
InventoryBatchSchema.index({ companyId: 1, status: 1 });
InventoryBatchSchema.index({ companyId: 1, expiryDate: 1 });
InventoryBatchSchema.index({ companyId: 1, 'specifications.gsm': 1 });
InventoryBatchSchema.index({ companyId: 1, 'specifications.color': 1 });

export const InventoryBatch = model<IInventoryBatch>('InventoryBatch', InventoryBatchSchema);
