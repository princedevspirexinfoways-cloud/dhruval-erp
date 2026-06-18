import mongoose, { Schema, Document } from 'mongoose';
import { AuditableDocument } from '../types/models';

export interface IGreyFabricInward extends AuditableDocument {
  grnNumber: string;
  purchaseOrderId?: mongoose.Types.ObjectId; // Optional - can be direct stock entry
  purchaseOrderNumber?: string; // Optional - for direct stock entry
  // Supplier info will be populated from Purchase Order or entered directly
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  
  // Inventory Integration
  inventoryItemId?: mongoose.Types.ObjectId;
  inventoryItemCode?: string;
  
  // Entry Type - New field to distinguish between PO-based and direct stock entry
  entryType: 'purchase_order' | 'direct_stock_entry' | 'transfer_in' | 'adjustment';
  
  // Material Source - New field to distinguish between own and client materials
  materialSource: 'own_material' | 'client_provided' | 'job_work_material';
  
  // Client Material Information - New section for client-provided materials
  clientMaterialInfo?: {
    clientId: mongoose.Types.ObjectId;
    clientName: string;
    clientOrderId?: mongoose.Types.ObjectId;
    clientOrderNumber?: string;
    clientMaterialCode?: string;
    clientBatchNumber?: string;
    clientLotNumber?: string;
    clientProvidedDate?: Date;
    clientInstructions?: string;
    clientQualitySpecs?: string;
    returnRequired: boolean;
    returnDeadline?: Date;
    clientContactPerson?: string;
    clientContactPhone?: string;
    clientContactEmail?: string;
    
    // Production Output Tracking
    productionOutputs: Array<{
      productionOrderId: mongoose.Types.ObjectId;
      productionOrderNumber: string;
      outputQuantity: number;
      outputUnit: string;
      outputType: 'finished_goods' | 'semi_finished' | 'waste';
      outputDate: Date;
      qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
      outputStatus: 'pending' | 'completed' | 'returned_to_client' | 'kept_as_stock';
      clientReturnQuantity?: number;
      keptAsStockQuantity?: number;
      returnDate?: Date;
      notes?: string;
    }>;
    
    // Material Consumption Tracking
    materialConsumption: {
      totalConsumed: number;
      wasteQuantity: number;
      returnableQuantity: number;
      consumedDate?: Date;
      consumptionNotes?: string;
    };
    
    // Client Material Balance Tracking
    clientMaterialBalance: {
      totalReceived: number;
      totalConsumed: number;
      totalWaste: number;
      totalReturned: number;
      totalKeptAsStock: number;
      currentBalance: number;
      lastUpdated: Date;
      balanceHistory: Array<{
        date: Date;
        transactionType: 'received' | 'consumed' | 'waste' | 'returned' | 'kept_as_stock' | 'adjustment';
        quantity: number;
        reference: string; // GRN number, Production Order, etc.
        notes?: string;
      }>;
    };
  };
  
  // Fabric Details
  fabricDetails: {
    fabricType: 'cotton' | 'polyester' | 'viscose' | 'blend' | 'other';
    fabricGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
    gsm: number;
    width: number;
    color: string;
    design?: string;
    pattern?: string;
    finish?: string;
  };
  
  // Quantity Information
  quantity: {
    receivedQuantity: number;
    unit: 'meters' | 'yards' | 'pieces';
    acceptedQuantity: number;
    rejectedQuantity: number;
    shortQuantity: number;
    excessQuantity: number;
  };
  
  // Grey Stock Lot-wise Tracking - New section
  greyStockLots: Array<{
    lotNumber: string;
    lotQuantity: number; // meters/yards in this lot
    lotUnit: 'meters' | 'yards' | 'pieces';
    lotStatus: 'active' | 'consumed' | 'damaged' | 'reserved';
    receivedDate: Date;
    expiryDate?: Date;
    qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
    storageLocation: {
      warehouseId: mongoose.Types.ObjectId;
      warehouseName: string;
      rackNumber?: string;
      shelfNumber?: string;
      binNumber?: string;
    };
    costPerUnit: number;
    totalCost: number;
    remarks?: string;
  }>;
  
  // Stock Balance Tracking - New section
  stockBalance: {
    totalMeters: number; // Auto-calculated from lots
    totalYards: number; // Auto-calculated from lots
    totalPieces: number; // Auto-calculated from lots
    availableMeters: number; // Total minus reserved/damaged
    availableYards: number;
    availablePieces: number;
    reservedMeters: number;
    reservedYards: number;
    reservedPieces: number;
    damagedMeters: number;
    damagedYards: number;
    damagedPieces: number;
    lastUpdated: Date;
  };
  
  // Quality Parameters
  qualityParameters: {
    weight: number;
    width: number;
    gsm: number;
    colorFastness: 'excellent' | 'good' | 'fair' | 'poor';
    shrinkage: number;
    pilling: 'none' | 'slight' | 'moderate' | 'severe';
    defects: {
      holes: number;
      stains: number;
      colorVariation: number;
      other: string;
    };
  };
  
  // Physical Condition
  physicalCondition: {
    isDamaged: boolean;
    damageDescription?: string;
    isWet: boolean;
    isContaminated: boolean;
    contaminationType?: string;
    storageCondition: 'good' | 'fair' | 'poor';
  };
  
  // Documentation
  documents: {
    supplierInvoice: string[];
    qualityCertificate: string[];
    testReports: string[];
    photos: string[];
    other: string[];
  };
  
  // Status and Approval
  status: 'pending' | 'approved' | 'rejected' | 'partially_approved' | 'stock_created';
  inspectionStatus: 'pending' | 'in_progress' | 'completed' | 'not_required';
  qualityStatus: 'passed' | 'failed' | 'conditional';
  
  // Stock Status - New field
  stockStatus: 'not_created' | 'active' | 'low_stock' | 'out_of_stock' | 'consumed';
  
  // Location and Storage
  storageLocation: {
    warehouseId: mongoose.Types.ObjectId;
    warehouseName: string;
    rackNumber?: string;
    shelfNumber?: string;
    binNumber?: string;
  };
  
  // Financial Information
  financial: {
    unitPrice: number;
    totalValue: number;
    currency: string;
    gstRate: number;
    gstAmount: number;
    totalAmount: number;
  };
  
  // Inspection Details
  inspection: {
    inspectedBy: mongoose.Types.ObjectId;
    inspectedByName: string;
    inspectionDate: Date;
    inspectionNotes?: string;
    qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
    recommendedAction: 'accept' | 'reject' | 'conditional_accept' | 'return_to_supplier';
  };
  
  // Additional Information
  remarks?: string;
  specialInstructions?: string;
  tags: string[];
  
  // Batch Information
  batchNumber?: string;
  lotNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;

  // Instance Methods
  addProductionOutput(outputData: any): Promise<this>;
  updateProductionOutputStatus(productionOrderId: string, status: string, returnQuantity?: number, keptAsStockQuantity?: number): Promise<this>;
  updateMaterialConsumption(consumedQuantity: number, wasteQuantity: number, notes?: string): Promise<this>;
  updateClientMaterialBalance(transactionType: string, quantity: number, reference: string, notes?: string): Promise<this>;
  getClientMaterialSummary(): any;
}

const GreyFabricInwardSchema = new Schema<IGreyFabricInward>({
  grnNumber: { 
    type: String, 
    required: true, 
    unique: true
  },
  purchaseOrderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'PurchaseOrder',
    index: true
  },
  purchaseOrderNumber: { 
    type: String, 
    index: true
  },
  
  // Supplier info populated from Purchase Order or entered directly
  supplierId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Supplier'
  },
  supplierName: { type: String },
  
  // Inventory Integration
  inventoryItemId: { 
    type: Schema.Types.ObjectId, 
    ref: 'InventoryItem' 
  },
  inventoryItemCode: { type: String },
  
  // Entry Type
  entryType: { 
    type: String, 
    enum: ['purchase_order', 'direct_stock_entry', 'transfer_in', 'adjustment'], 
    required: true,
    default: 'direct_stock_entry'
  },
  
  // Material Source
  materialSource: { 
    type: String, 
    enum: ['own_material', 'client_provided', 'job_work_material'], 
    required: true,
    default: 'own_material'
  },
  
  // Client Material Information
  clientMaterialInfo: {
    clientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Customer' 
    },
    clientName: { type: String },
    clientOrderId: { 
      type: Schema.Types.ObjectId, 
      ref: 'CustomerOrder' 
    },
    clientOrderNumber: { type: String },
    clientMaterialCode: { type: String },
    clientBatchNumber: { type: String },
    clientLotNumber: { type: String },
    clientProvidedDate: { type: Date },
    clientInstructions: { type: String },
    clientQualitySpecs: { type: String },
    returnRequired: { type: Boolean, default: false },
    returnDeadline: { type: Date },
    clientContactPerson: { type: String },
    clientContactPhone: { type: String },
    clientContactEmail: { type: String },
    
    // Production Output Tracking
    productionOutputs: [{
      productionOrderId: { 
        type: Schema.Types.ObjectId, 
        ref: 'ProductionOrder', 
        required: true 
      },
      productionOrderNumber: { type: String, required: true },
      outputQuantity: { type: Number, required: true, min: 0 },
      outputUnit: { 
        type: String, 
        enum: ['meters', 'yards', 'pieces', 'kg', 'tons'], 
        required: true 
      },
      outputType: { 
        type: String, 
        enum: ['finished_goods', 'semi_finished', 'waste'], 
        required: true 
      },
      outputDate: { type: Date, required: true, default: Date.now },
      qualityGrade: { 
        type: String, 
        enum: ['A+', 'A', 'B+', 'B', 'C'], 
        required: true 
      },
      outputStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'returned_to_client', 'kept_as_stock'], 
        default: 'pending' 
      },
      clientReturnQuantity: { type: Number, min: 0 },
      keptAsStockQuantity: { type: Number, min: 0 },
      returnDate: { type: Date },
      notes: { type: String }
    }],
    
    // Material Consumption Tracking
    materialConsumption: {
      totalConsumed: { type: Number, default: 0, min: 0 },
      wasteQuantity: { type: Number, default: 0, min: 0 },
      returnableQuantity: { type: Number, default: 0, min: 0 },
      consumedDate: { type: Date },
      consumptionNotes: { type: String }
    },
    
    // Client Material Balance Tracking
    clientMaterialBalance: {
      totalReceived: { type: Number, default: 0, min: 0 },
      totalConsumed: { type: Number, default: 0, min: 0 },
      totalWaste: { type: Number, default: 0, min: 0 },
      totalReturned: { type: Number, default: 0, min: 0 },
      totalKeptAsStock: { type: Number, default: 0, min: 0 },
      currentBalance: { type: Number, default: 0, min: 0 },
      lastUpdated: { type: Date, default: Date.now },
      balanceHistory: [{
        date: { type: Date, required: true, default: Date.now },
        transactionType: { 
          type: String, 
          enum: ['received', 'consumed', 'waste', 'returned', 'kept_as_stock', 'adjustment'], 
          required: true 
        },
        quantity: { type: Number, required: true },
        reference: { type: String, required: true },
        notes: { type: String }
      }]
    }
  },
  
  // Fabric Details
  fabricDetails: {
    fabricType: { 
      type: String, 
      enum: ['cotton', 'polyester', 'viscose', 'blend', 'other'], 
      required: true 
    },
    fabricGrade: { 
      type: String, 
      enum: ['A+', 'A', 'B+', 'B', 'C', 'D'], 
      required: true 
    },
    gsm: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    color: { type: String, required: true },
    design: { type: String },
    pattern: { type: String },
    finish: { type: String }
  },
  
  // Quantity Information
  quantity: {
    receivedQuantity: { type: Number, required: true, min: 0 },
    unit: { 
      type: String, 
      enum: ['meters', 'yards', 'pieces'], 
      required: true 
    },
    acceptedQuantity: { type: Number, default: 0, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    shortQuantity: { type: Number, default: 0, min: 0 },
    excessQuantity: { type: Number, default: 0, min: 0 }
  },
  
  // Grey Stock Lot-wise Tracking
  greyStockLots: [{
    lotNumber: { type: String, required: true },
    lotQuantity: { type: Number, required: true, min: 0 },
    lotUnit: { 
      type: String, 
      enum: ['meters', 'yards', 'pieces'], 
      required: true 
    },
    lotStatus: { 
      type: String, 
      enum: ['active', 'consumed', 'damaged', 'reserved'], 
      default: 'active' 
    },
    receivedDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date },
    qualityGrade: { 
      type: String, 
      enum: ['A+', 'A', 'B+', 'B', 'C', 'D'], 
      required: true 
    },
    storageLocation: {
      warehouseId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Warehouse', 
        required: true 
      },
      warehouseName: { type: String, required: true },
      rackNumber: { type: String },
      shelfNumber: { type: String },
      binNumber: { type: String }
    },
    costPerUnit: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    remarks: { type: String }
  }],
  
  // Stock Balance Tracking
  stockBalance: {
    totalMeters: { type: Number, default: 0, min: 0 },
    totalYards: { type: Number, default: 0, min: 0 },
    totalPieces: { type: Number, default: 0, min: 0 },
    availableMeters: { type: Number, default: 0, min: 0 },
    availableYards: { type: Number, default: 0, min: 0 },
    availablePieces: { type: Number, default: 0, min: 0 },
    reservedMeters: { type: Number, default: 0, min: 0 },
    reservedYards: { type: Number, default: 0, min: 0 },
    reservedPieces: { type: Number, default: 0, min: 0 },
    damagedMeters: { type: Number, default: 0, min: 0 },
    damagedYards: { type: Number, default: 0, min: 0 },
    damagedPieces: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Quality Parameters
  qualityParameters: {
    weight: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    gsm: { type: Number, required: true, min: 0 },
    colorFastness: { 
      type: String, 
      enum: ['excellent', 'good', 'fair', 'poor'], 
      required: true 
    },
    shrinkage: { type: Number, required: true, min: 0, max: 100 },
    pilling: { 
      type: String, 
      enum: ['none', 'slight', 'moderate', 'severe'], 
      required: true 
    },
    defects: {
      holes: { type: Number, default: 0, min: 0 },
      stains: { type: Number, default: 0, min: 0 },
      colorVariation: { type: Number, default: 0, min: 0 },
      other: { type: String }
    }
  },
  
  // Physical Condition
  physicalCondition: {
    isDamaged: { type: Boolean, default: false },
    damageDescription: { type: String },
    isWet: { type: Boolean, default: false },
    isContaminated: { type: Boolean, default: false },
    contaminationType: { type: String },
    storageCondition: { 
      type: String, 
      enum: ['good', 'fair', 'poor'], 
      default: 'good' 
    }
  },
  
  // Documentation
  documents: {
    supplierInvoice: [String],
    qualityCertificate: [String],
    testReports: [String],
    photos: [String],
    other: [String]
  },
  
  // Status and Approval
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'partially_approved', 'stock_created'], 
    default: 'pending'
  },
  inspectionStatus: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'not_required'], 
    default: 'pending' 
  },
  qualityStatus: { 
    type: String, 
    enum: ['passed', 'failed', 'conditional'], 
    default: 'passed' 
  },
  
  // Stock Status
  stockStatus: { 
    type: String, 
    enum: ['not_created', 'active', 'low_stock', 'out_of_stock', 'consumed'], 
    default: 'not_created' 
  },
  
  // Location and Storage
  storageLocation: {
    warehouseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Warehouse', 
      required: true 
    },
    warehouseName: { type: String, required: true },
    rackNumber: { type: String },
    shelfNumber: { type: String },
    binNumber: { type: String }
  },
  
  // Financial Information
  financial: {
    unitPrice: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    gstRate: { type: Number, default: 0, min: 0, max: 100 },
    gstAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  
  // Inspection Details
  inspection: {
    inspectedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User'
    },
    inspectedByName: { type: String },
    inspectionDate: { type: Date },
    inspectionNotes: { type: String },
    qualityGrade: { 
      type: String, 
      enum: ['A+', 'A', 'B+', 'B', 'C', 'D']
    },
    recommendedAction: { 
      type: String, 
      enum: ['accept', 'reject', 'conditional_accept', 'return_to_supplier']
    }
  },
  
  // Additional Information
  remarks: { type: String },
  specialInstructions: { type: String },
  tags: [String],
  
  // Batch Information
  batchNumber: { type: String },
  lotNumber: { type: String },
  manufacturingDate: { type: Date },
  expiryDate: { type: Date }
}, {
  timestamps: true,
  collection: 'greyfabricinwards'
});

// Indexes
// grnNumber index is automatically created by unique: true
GreyFabricInwardSchema.index({ supplierId: 1 });
GreyFabricInwardSchema.index({ status: 1 });
GreyFabricInwardSchema.index({ stockStatus: 1 });
GreyFabricInwardSchema.index({ entryType: 1 });
GreyFabricInwardSchema.index({ materialSource: 1 });
GreyFabricInwardSchema.index({ 'clientMaterialInfo.clientId': 1 });
GreyFabricInwardSchema.index({ 'clientMaterialInfo.clientOrderId': 1 });
GreyFabricInwardSchema.index({ 'fabricDetails.fabricType': 1 });
GreyFabricInwardSchema.index({ 'fabricDetails.color': 1 });
GreyFabricInwardSchema.index({ 'fabricDetails.gsm': 1 });
GreyFabricInwardSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate stock balances
GreyFabricInwardSchema.pre('save', function(next) {
  if (this.greyStockLots && this.greyStockLots.length > 0) {
    let totalMeters = 0;
    let totalYards = 0;
    let totalPieces = 0;
    let availableMeters = 0;
    let availableYards = 0;
    let availablePieces = 0;
    let reservedMeters = 0;
    let reservedYards = 0;
    let reservedPieces = 0;
    let damagedMeters = 0;
    let damagedYards = 0;
    let damagedPieces = 0;

    this.greyStockLots.forEach(lot => {
      switch (lot.lotUnit) {
        case 'meters':
          totalMeters += lot.lotQuantity;
          if (lot.lotStatus === 'active') availableMeters += lot.lotQuantity;
          else if (lot.lotStatus === 'reserved') reservedMeters += lot.lotQuantity;
          else if (lot.lotStatus === 'damaged') damagedMeters += lot.lotQuantity;
          break;
        case 'yards':
          totalYards += lot.lotQuantity;
          if (lot.lotStatus === 'active') availableYards += lot.lotQuantity;
          else if (lot.lotStatus === 'reserved') reservedYards += lot.lotQuantity;
          else if (lot.lotStatus === 'damaged') damagedYards += lot.lotQuantity;
          break;
        case 'pieces':
          totalPieces += lot.lotQuantity;
          if (lot.lotStatus === 'active') availablePieces += lot.lotQuantity;
          else if (lot.lotStatus === 'reserved') reservedPieces += lot.lotQuantity;
          else if (lot.lotStatus === 'damaged') damagedPieces += lot.lotQuantity;
          break;
      }
    });

    this.stockBalance = {
      totalMeters,
      totalYards,
      totalPieces,
      availableMeters,
      availableYards,
      availablePieces,
      reservedMeters,
      reservedYards,
      reservedPieces,
      damagedMeters,
      damagedYards,
      damagedPieces,
      lastUpdated: new Date()
    };

    // Update stock status
    if (totalMeters === 0 && totalYards === 0 && totalPieces === 0) {
      this.stockStatus = 'out_of_stock';
    } else if (availableMeters < 100 && availableYards < 100 && availablePieces < 10) {
      this.stockStatus = 'low_stock';
    } else if (availableMeters === 0 && availableYards === 0 && availablePieces === 0) {
      this.stockStatus = 'consumed';
    } else {
      this.stockStatus = 'active';
    }
  }
  next();
});

// Instance methods
GreyFabricInwardSchema.methods.addLot = function(lotData: any) {
  this.greyStockLots.push(lotData);
  return this.save();
};

GreyFabricInwardSchema.methods.updateLotStatus = function(lotNumber: string, status: string) {
  const lot = this.greyStockLots.find((l: any) => l.lotNumber === lotNumber);
  if (lot) {
    lot.lotStatus = status;
    return this.save();
  }
  throw new Error('Lot not found');
};

GreyFabricInwardSchema.methods.getAvailableStock = function() {
  return {
    meters: this.stockBalance.availableMeters,
    yards: this.stockBalance.availableYards,
    pieces: this.stockBalance.availablePieces
  };
};

GreyFabricInwardSchema.methods.reserveStock = function(quantity: number, unit: string) {
  // Implementation for reserving stock
  // This would be used when fabric is allocated for production
};

GreyFabricInwardSchema.methods.addProductionOutput = function(outputData: any) {
  if (this.materialSource !== 'client_provided') {
    throw new Error('Production output can only be added to client-provided materials');
  }
  
  if (!this.clientMaterialInfo) {
    throw new Error('Client material info not found');
  }
  
  this.clientMaterialInfo.productionOutputs.push(outputData);
  return this.save();
};

GreyFabricInwardSchema.methods.updateProductionOutputStatus = function(productionOrderId: string, status: string, returnQuantity?: number, keptAsStockQuantity?: number) {
  if (this.materialSource !== 'client_provided' || !this.clientMaterialInfo) {
    throw new Error('Invalid material type for production output update');
  }
  
  const output = this.clientMaterialInfo.productionOutputs.find((o: any) => 
    o.productionOrderId.toString() === productionOrderId
  );
  
  if (!output) {
    throw new Error('Production output not found');
  }
  
  output.outputStatus = status;
  if (returnQuantity !== undefined) output.clientReturnQuantity = returnQuantity;
  if (keptAsStockQuantity !== undefined) output.keptAsStockQuantity = keptAsStockQuantity;
  if (status === 'returned_to_client' || status === 'kept_as_stock') {
    output.returnDate = new Date();
  }
  
  return this.save();
};

GreyFabricInwardSchema.methods.updateMaterialConsumption = function(consumedQuantity: number, wasteQuantity: number, notes?: string) {
  if (this.materialSource !== 'client_provided' || !this.clientMaterialInfo) {
    throw new Error('Invalid material type for consumption update');
  }
  
  this.clientMaterialInfo.materialConsumption.totalConsumed = consumedQuantity;
  this.clientMaterialInfo.materialConsumption.wasteQuantity = wasteQuantity;
  this.clientMaterialInfo.materialConsumption.returnableQuantity = this.quantity.receivedQuantity - consumedQuantity - wasteQuantity;
  this.clientMaterialInfo.materialConsumption.consumedDate = new Date();
  if (notes) this.clientMaterialInfo.materialConsumption.consumptionNotes = notes;
  
  // Update client material balance
  this.updateClientMaterialBalance('consumed', consumedQuantity, `Production consumption - ${this.grnNumber}`, notes);
  this.updateClientMaterialBalance('waste', wasteQuantity, `Production waste - ${this.grnNumber}`, notes);
  
  return this.save();
};

GreyFabricInwardSchema.methods.updateClientMaterialBalance = function(transactionType: string, quantity: number, reference: string, notes?: string) {
  if (this.materialSource !== 'client_provided' || !this.clientMaterialInfo) {
    throw new Error('Invalid material type for balance update');
  }
  
  const balance = this.clientMaterialInfo.clientMaterialBalance;
  
  // Add to balance history
  balance.balanceHistory.push({
    date: new Date(),
    transactionType: transactionType as any,
    quantity: quantity,
    reference: reference,
    notes: notes
  });
  
  // Update totals based on transaction type
  switch (transactionType) {
    case 'received':
      balance.totalReceived += quantity;
      balance.currentBalance += quantity;
      break;
    case 'consumed':
      balance.totalConsumed += quantity;
      balance.currentBalance -= quantity;
      break;
    case 'waste':
      balance.totalWaste += quantity;
      balance.currentBalance -= quantity;
      break;
    case 'returned':
      balance.totalReturned += quantity;
      balance.currentBalance -= quantity;
      break;
    case 'kept_as_stock':
      balance.totalKeptAsStock += quantity;
      balance.currentBalance -= quantity;
      break;
    case 'adjustment':
      balance.currentBalance += quantity;
      break;
  }
  
  balance.lastUpdated = new Date();
  
  return this.save();
};

GreyFabricInwardSchema.methods.getClientMaterialSummary = function() {
  if (this.materialSource !== 'client_provided' || !this.clientMaterialInfo) {
    throw new Error('Invalid material type for client summary');
  }
  
  const balance = this.clientMaterialInfo.clientMaterialBalance;
  const consumption = this.clientMaterialInfo.materialConsumption;
  
  return {
    clientId: this.clientMaterialInfo.clientId,
    clientName: this.clientMaterialInfo.clientName,
    grnNumber: this.grnNumber,
    fabricDetails: this.fabricDetails,
    materialBalance: {
      totalReceived: balance.totalReceived,
      totalConsumed: balance.totalConsumed,
      totalWaste: balance.totalWaste,
      totalReturned: balance.totalReturned,
      totalKeptAsStock: balance.totalKeptAsStock,
      currentBalance: balance.currentBalance,
      utilizationPercentage: balance.totalReceived > 0 ? 
        ((balance.totalConsumed + balance.totalWaste) / balance.totalReceived) * 100 : 0,
      returnPercentage: balance.totalReceived > 0 ? 
        (balance.totalReturned / balance.totalReceived) * 100 : 0,
      stockPercentage: balance.totalReceived > 0 ? 
        (balance.totalKeptAsStock / balance.totalReceived) * 100 : 0
    },
    productionOutputs: this.clientMaterialInfo.productionOutputs,
    lastUpdated: balance.lastUpdated
  };
};

// Static methods
GreyFabricInwardSchema.statics.findByFabricType = function(fabricType: string) {
  return this.find({ 'fabricDetails.fabricType': fabricType });
};

GreyFabricInwardSchema.statics.findActiveStock = function() {
  return this.find({ stockStatus: 'active' });
};

GreyFabricInwardSchema.statics.findLowStock = function() {
  return this.find({ stockStatus: 'low_stock' });
};

GreyFabricInwardSchema.statics.findClientMaterials = function(clientId?: string) {
  const query: any = { materialSource: 'client_provided' };
  if (clientId) {
    query['clientMaterialInfo.clientId'] = clientId;
  }
  return this.find(query);
};

GreyFabricInwardSchema.statics.findOwnMaterials = function() {
  return this.find({ materialSource: 'own_material' });
};

GreyFabricInwardSchema.statics.findMaterialsForReturn = function() {
  return this.find({ 
    materialSource: 'client_provided',
    'clientMaterialInfo.returnRequired': true,
    status: { $in: ['approved', 'stock_created'] }
  });
};

GreyFabricInwardSchema.statics.findClientMaterialsWithProductionOutputs = function() {
  return this.find({ 
    materialSource: 'client_provided',
    'clientMaterialInfo.productionOutputs': { $exists: true, $not: { $size: 0 } }
  });
};

GreyFabricInwardSchema.statics.findClientMaterialsPendingOutput = function() {
  return this.find({ 
    materialSource: 'client_provided',
    'clientMaterialInfo.productionOutputs.outputStatus': 'pending'
  });
};

GreyFabricInwardSchema.statics.getClientMaterialSummary = function(clientId?: string) {
  const query: any = { materialSource: 'client_provided' };
  if (clientId) {
    query['clientMaterialInfo.clientId'] = clientId;
  }
  
  return this.find(query).populate('clientMaterialInfo.clientId', 'name email phone');
};

GreyFabricInwardSchema.statics.getClientMaterialBalance = function(clientId: string) {
  return this.aggregate([
    { $match: { 
      materialSource: 'client_provided',
      'clientMaterialInfo.clientId': new mongoose.Types.ObjectId(clientId)
    }},
    { $group: {
      _id: '$clientMaterialInfo.clientId',
      clientName: { $first: '$clientMaterialInfo.clientName' },
      totalGRNs: { $sum: 1 },
      totalReceived: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalReceived' },
      totalConsumed: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalConsumed' },
      totalWaste: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalWaste' },
      totalReturned: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalReturned' },
      totalKeptAsStock: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalKeptAsStock' },
      currentBalance: { $sum: '$clientMaterialInfo.clientMaterialBalance.currentBalance' },
      grns: { $push: {
        grnNumber: '$grnNumber',
        fabricType: '$fabricDetails.fabricType',
        fabricColor: '$fabricDetails.color',
        receivedQuantity: '$quantity.receivedQuantity',
        unit: '$quantity.unit',
        status: '$status',
        createdAt: '$createdAt'
      }}
    }}
  ]);
};

GreyFabricInwardSchema.statics.getClientMaterialHistory = function(clientId: string, grnId?: string) {
  const matchQuery: any = { 
    materialSource: 'client_provided',
    'clientMaterialInfo.clientId': new mongoose.Types.ObjectId(clientId)
  };
  
  if (grnId) {
    matchQuery._id = new mongoose.Types.ObjectId(grnId);
  }
  
  return this.find(matchQuery).select('grnNumber clientMaterialInfo.clientMaterialBalance fabricDetails quantity status createdAt');
};

// Static Methods Interface
export interface IGreyFabricInwardModel extends mongoose.Model<IGreyFabricInward> {
  getClientMaterialSummary(clientId?: string): Promise<any>;
  getClientMaterialBalance(clientId: string): Promise<any>;
  getClientMaterialHistory(clientId: string, grnId?: string): Promise<any>;
}

export default mongoose.model<IGreyFabricInward, IGreyFabricInwardModel>('GreyFabricInward', GreyFabricInwardSchema);
