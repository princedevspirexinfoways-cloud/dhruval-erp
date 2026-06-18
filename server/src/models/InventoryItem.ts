import mongoose, { Schema, model } from 'mongoose';
import { IInventoryItem, IItemLocation, IItemSupplier } from '@/types/models';

const ItemLocationSchema = new Schema<IItemLocation>({
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouseName: { type: String },
  zone: { type: String },
  rack: { type: String },
  bin: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const ItemSupplierSchema = new Schema<IItemSupplier>({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String },
  supplierCode: { type: String },
  isPrimary: { type: Boolean, default: false },
  leadTime: { type: Number, min: 0 },
  minOrderQuantity: { type: Number, min: 0 },
  lastSupplyDate: { type: Date },
  lastSupplyRate: { type: Number, min: 0 },
  qualityRating: { type: Number, min: 0, max: 5 }
}, { _id: false });

const InventoryItemSchema = new Schema<IInventoryItem>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true
  },

  // Item Identification - Company-wise Unique
  itemCode: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 100
  },
  itemName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  },
  itemDescription: { 
    type: String,
    maxlength: 1000
  },
  barcode: {
    type: String,
    maxlength: 50
  },
  qrCode: { 
    type: String,
    maxlength: 100
  },

  // Company-wise Unique Identification
  companyItemCode: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  internalSKU: { 
    type: String,
    uppercase: true,
    trim: true
  },

  // Categorization
  category: {
    primary: {
      type: String,
      required: true,
      trim: true
    },
    secondary: { type: String, trim: true },
    tertiary: { type: String, trim: true }
  },

  productType: {
    type: String,
    enum: ['saree', 'african', 'garment', 'digital_print', 'custom', 'chemical', 'dye', 'machinery', 'yarn', 'thread', 'fent_bleach', 'longation_bleach']
  },

  // Design Reference - Linked to Design Model
  designId: {
    type: Schema.Types.ObjectId,
    ref: 'Design',
    index: true
  },
  
  // Legacy design info fields (kept for backward compatibility, can be populated from Design)
  designInfo: {
    designNumber: { type: String, trim: true, index: true },
    designName: { type: String, trim: true },
    designCategory: { type: String, trim: true },
    season: { type: String, enum: ['spring', 'summer', 'monsoon', 'winter', 'all_season'] },
    collection: { type: String, trim: true },
    artworkFile: { type: String },
    colorVariants: [{ type: String }],
    sizeVariants: [{ type: String }],
  },

  // Technical Specifications
  specifications: {
    // Fabric Specifications
    gsm: { type: Number, min: 0, index: true },
    width: { type: Number, min: 0 },
    length: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    color: { type: String, trim: true, index: true },
    colorCode: { type: String, trim: true }, // Pantone/RGB color code
    design: { type: String, trim: true },
    pattern: { type: String, trim: true },
    fabricComposition: { type: String, trim: true },
    threadCount: { type: Number, min: 0 },
    weaveType: { type: String, enum: ['plain', 'twill', 'satin', 'jacquard', 'dobby', 'other'] },
    finish: { type: String, trim: true }, // Mercerized, Sanforized, etc.

    // Textile Quality Parameters
    tensileStrength: { type: Number, min: 0 },
    shrinkage: { type: Number, min: 0, max: 100 },
    colorFastness: { type: Number, min: 1, max: 5 },
    pilling: { type: Number, min: 1, max: 5 },

    // Chemical Specifications
    concentration: { type: Number, min: 0, max: 100 },
    purity: { type: Number, min: 0, max: 100 },
    phLevel: { type: Number, min: 0, max: 14 },
    
    // Special Bleach Specifications (Fent/Longation)
    bleachType: { type: String, enum: ['fent_bleach', 'longation_bleach', 'regular_bleach', 'other'] },
    bleachStrength: { type: Number, min: 0, max: 100 }, // Percentage strength
    activeIngredient: { type: String }, // Chemical composition
    dilutionRatio: { type: String }, // e.g., "1:10", "1:20"
    applicationMethod: { type: String, enum: ['spray', 'immersion', 'brush', 'other'] },
    temperatureRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 100 }
    },
    processingTime: { type: Number, min: 0 }, // Minutes
    safetyPrecautions: [String], // Safety instructions
    msdsRequired: { type: Boolean, default: true }, // Material Safety Data Sheet
    msdsUrl: { type: String }, // URL to MSDS document

    // Batch & Inward Information
    batchNumber: { type: String, trim: true, index: true },
    lotNumber: { type: String, trim: true },
    challan: { type: String, trim: true },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },

    // Purchase Order Linkage (for tracking partial receipts)
    poNumber: { type: String, trim: true, index: true },
    poOrderedQuantity: { type: Number, min: 0 },
    poReceivedQuantity: { type: Number, min: 0 },
    
    // Additional Fields
    hsnCode: { type: String, trim: true },
    attributeName: { type: String, trim: true },
    grossQuantity: { type: Number, min: 0 },
    tareWeight: { type: Number, min: 0, max: 100 }, // Percentage
    fold: { type: Number }, // Can be positive or negative
    date: { type: Date },
    lrNumber: { type: String, trim: true },
    transportNumber: { type: String, trim: true },

    // Custom Attributes
    customAttributes: { type: Schema.Types.Mixed }
  },

  // Stock Management
  stock: {
    currentStock: { type: Number, default: 0, min: 0, index: true },
    reservedStock: { type: Number, default: 0, min: 0 },
    availableStock: { type: Number, default: 0, min: 0 },
    inTransitStock: { type: Number, default: 0, min: 0 },
    damagedStock: { type: Number, default: 0, min: 0 },

    unit: { type: String, required: true, trim: true },
    alternateUnit: { type: String, trim: true },
    conversionFactor: { type: Number, default: 1, min: 0 },
    netQuantity: { type: Number, min: 0 },

    // Stock Levels
    reorderLevel: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    maxStockLevel: { type: Number, default: 0, min: 0 },
    economicOrderQuantity: { type: Number, min: 0 },

    // Valuation
    valuationMethod: { 
      type: String, 
      enum: ['FIFO', 'LIFO', 'Weighted Average'], 
      default: 'FIFO' 
    },
    averageCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0, min: 0 }
  },

  // Location Tracking - Multi-warehouse
  locations: [ItemLocationSchema],

  // Pricing Information
  pricing: {
    costPrice: { type: Number, min: 0 },
    standardCost: { type: Number, min: 0 },
    lastPurchasePrice: { type: Number, min: 0 },
    averagePurchasePrice: { type: Number, min: 0 },
    sellingPrice: { type: Number, min: 0 },
    mrp: { type: Number, min: 0 },
    marginPercentage: { type: Number, min: 0, max: 100 },
    pricePerNetQty: { type: Number, min: 0 },
    gst: { type: Number, min: 0, max: 100 }, // Percentage
    finalPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' }
  },

  // Price History - Track all price changes
  priceHistory: [{
    price: { type: Number, required: true, min: 0 },
    previousPrice: { type: Number, min: 0 },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true }
  }],

  // Supplier Information
  suppliers: [ItemSupplierSchema],

  // Quality Parameters
  quality: {
    qualityGrade: { 
      type: String, 
      enum: ['A+', 'A', 'B+', 'B', 'C'], 
      default: 'A' 
    },
    defectPercentage: { type: Number, default: 0, min: 0, max: 100 },
    qualityCheckRequired: { type: Boolean, default: true },
    qualityParameters: [String],
    lastQualityCheck: { type: Date },
    qualityNotes: { type: String },
    certifications: [String]
  },

  // Manufacturing Details (for finished goods)
  manufacturing: {
    bomId: { type: Schema.Types.ObjectId, ref: 'BillOfMaterial' },
    manufacturingCost: { type: Number, min: 0 },
    laborCost: { type: Number, min: 0 },
    overheadCost: { type: Number, min: 0 },
    manufacturingTime: { type: Number, min: 0 },
    shelfLife: { type: Number, min: 0 },
    batchSize: { type: Number, min: 0 }
  },

  // Ageing and Quality Tracking
  ageing: {
    ageInDays: { type: Number, default: 0, min: 0, index: true },
    ageCategory: {
      type: String,
      enum: ['fresh', 'good', 'aging', 'old', 'obsolete'],
      default: 'fresh',
      index: true
    },
    lastMovementDate: { type: Date, default: Date.now },
    turnoverRate: { type: Number, default: 0, min: 0 }, // Times per year
    daysInStock: { type: Number, default: 0, min: 0 },
    slowMovingThreshold: { type: Number, default: 90 }, // Days
    obsoleteThreshold: { type: Number, default: 365 }, // Days
  },

  // Quality Control
  qualityControl: {
    qualityGrade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C', 'Reject'], default: 'A' },
    qualityScore: { type: Number, min: 0, max: 100, default: 100 },
    defectRate: { type: Number, min: 0, max: 100, default: 0 },
    lastQualityCheck: { type: Date },
    qualityCheckDue: { type: Date },
    qualityNotes: [{
      date: { type: Date, default: Date.now },
      inspector: { type: String },
      grade: { type: String },
      notes: { type: String },
      images: [String]
    }],
    requiresInspection: { type: Boolean, default: false }
  },



  // Tracking & Audit
  tracking: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastStockUpdate: { type: Date },
    lastMovementDate: { type: Date },
    totalInward: { type: Number, default: 0, min: 0 },
    totalOutward: { type: Number, default: 0, min: 0 },
    totalAdjustments: { type: Number, default: 0 }
  },

  // Status & Flags
  status: {
    isActive: { type: Boolean, default: true },
    isDiscontinued: { type: Boolean, default: false },
    isFastMoving: { type: Boolean, default: false },
    isSlowMoving: { type: Boolean, default: false },
    isObsolete: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false }
  },

  // Production Information (for working inventory and finished goods)
  productionInfo: {
    batchId: { type: Schema.Types.ObjectId, ref: 'ProductionBatch' },
    batchNumber: { type: String },
    stageNumber: { type: Number },
    sourceItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
    producedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    transferredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    productionDate: { type: Date },
    transferDate: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completionDate: { type: Date }
  },

  // Batch Output Tracking
  batchOutputInfo: {
    sourceBatchId: { type: Schema.Types.ObjectId, ref: 'ProductionBatch' },
    sourceBatchNumber: { type: String },
    outputIndex: { type: Number }, // Index in batch outputMaterials array
    grnId: { type: Schema.Types.ObjectId, ref: 'GreyFabricInward' },
    grnNumber: { type: String },
    materialSource: { type: String, enum: ['own_material', 'client_provided', 'job_work_material'] },
    clientId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    clientName: { type: String },
    clientOrderId: { type: Schema.Types.ObjectId, ref: 'CustomerOrder' },
    clientOrderNumber: { type: String },
    
    // Elongation Information
    elongationInfo: {
      inputQuantity: { type: Number, min: 0 },
      inputUnit: { type: String },
      outputQuantity: { type: Number, min: 0 },
      outputUnit: { type: String },
      elongationPercentage: { type: Number, min: 0 },
      elongationQuantity: { type: Number, min: 0 },
      elongationReason: { type: String, enum: ['stitching', 'processing', 'finishing', 'natural_stretch', 'other'] },
      elongationNotes: { type: String },
      qualityImpact: { type: String, enum: ['positive', 'neutral', 'negative'] },
      approvedBy: { type: String },
      approvalDate: { type: Date }
    },
    
    // Client Output Tracking
    clientOutputInfo: {
      isClientMaterial: { type: Boolean, default: false },
      returnToClient: { type: Boolean, default: false },
      returnQuantity: { type: Number, min: 0 },
      keepAsStock: { type: Boolean, default: false },
      stockQuantity: { type: Number, min: 0 },
      clientReturnDate: { type: Date },
      clientInstructions: { type: String }
    }
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  images: [String],
  documents: [String]
}, {
  timestamps: true,
  collection: 'inventory_items'
});

// Compound Indexes for optimal performance
InventoryItemSchema.index({ companyId: 1, itemCode: 1 }, { unique: true });
InventoryItemSchema.index({ companyId: 1, 'category.primary': 1 });
InventoryItemSchema.index({ companyId: 1, productType: 1 });
InventoryItemSchema.index({ companyId: 1, 'stock.currentStock': 1 });

// Enhanced indexes for textile industry
InventoryItemSchema.index({ companyId: 1, designId: 1 });
InventoryItemSchema.index({ companyId: 1, 'designInfo.designNumber': 1 });
InventoryItemSchema.index({ companyId: 1, 'specifications.gsm': 1 });
InventoryItemSchema.index({ companyId: 1, 'specifications.color': 1 });
InventoryItemSchema.index({ companyId: 1, 'specifications.batchNumber': 1 });
InventoryItemSchema.index({ companyId: 1, 'ageing.ageCategory': 1 });
InventoryItemSchema.index({ companyId: 1, 'ageing.ageInDays': 1 });
InventoryItemSchema.index({ companyId: 1, 'qualityControl.qualityGrade': 1 });

// Text search index
InventoryItemSchema.index({
  itemName: 'text',
  itemDescription: 'text',
  'designInfo.designNumber': 'text',
  'designInfo.designName': 'text',
  'specifications.color': 'text'
});
InventoryItemSchema.index({ companyId: 1, 'status.isActive': 1 });
InventoryItemSchema.index({ companyId: 1, 'stock.currentStock': 1, 'stock.reorderLevel': 1 });

// Text search index
InventoryItemSchema.index({ 
  itemName: 'text', 
  itemCode: 'text', 
  itemDescription: 'text',
  'specifications.design': 'text',
  'specifications.color': 'text'
});

// Sparse indexes for optional unique fields
InventoryItemSchema.index({ barcode: 1 }, { sparse: true, unique: true });
InventoryItemSchema.index({ qrCode: 1 }, { sparse: true, unique: true });

// Pre-save middleware
InventoryItemSchema.pre('save', async function(next) {
  // Calculate available stock
  this.stock.availableStock = Math.max(0, this.stock.currentStock - this.stock.reservedStock);
  
  // Calculate total stock value
  this.stock.totalValue = this.stock.currentStock * this.stock.averageCost;
  
  // Update last stock update timestamp
  if (this.isModified('stock.currentStock')) {
    this.tracking.lastStockUpdate = new Date();
  }
  
  // Auto-populate designInfo from Design model if designId is set
  if (this.isModified('designId') && this.designId) {
    try {
      const Design = (await import('./Design')).default;
      const design = await Design.findById(this.designId);
      if (design) {
        this.designInfo = {
          designNumber: design.designNumber,
          designName: design.designName,
          designCategory: design.designCategory,
          season: design.season,
          collection: design.designCollection,
          artworkFile: design.artworkFile,
          colorVariants: design.colorVariants,
          sizeVariants: design.sizeVariants
        };
        
        // Increment design usage count
        if ((design as any).incrementUsage) {
          await (design as any).incrementUsage();
        } else {
          // Fallback: manually increment usage
          design.usageCount = (design.usageCount || 0) + 1;
          design.lastUsedDate = new Date();
          await design.save();
        }
      }
    } catch (error) {
      // If design not found, continue without updating designInfo
      console.warn('Design not found for designId:', this.designId);
    }
  }
  
  next();
});

// Instance methods
InventoryItemSchema.methods.checkLowStock = function(): boolean {
  return this.stock.currentStock <= this.stock.reorderLevel;
};

InventoryItemSchema.methods.isOutOfStock = function(): boolean {
  return this.stock.currentStock <= 0;
};

InventoryItemSchema.methods.getPrimarySupplier = function() {
  return this.suppliers.find(supplier => supplier.isPrimary);
};

InventoryItemSchema.methods.getLocationStock = function(warehouseId: string) {
  return this.locations.find(location => 
    location.warehouseId?.toString() === warehouseId && location.isActive
  );
};

// Batch Output Creation Methods
InventoryItemSchema.methods.createFromBatchOutput = function(batchOutput: any, batchInfo: any, elongationInfo?: any, clientInfo?: any) {
  // Set batch output information
  this.batchOutputInfo = {
    sourceBatchId: batchInfo.batchId,
    sourceBatchNumber: batchInfo.batchNumber,
    outputIndex: batchInfo.outputIndex,
    grnId: batchInfo.grnId,
    grnNumber: batchInfo.grnNumber,
    materialSource: batchInfo.materialSource,
    clientId: clientInfo?.clientId,
    clientName: clientInfo?.clientName,
    clientOrderId: clientInfo?.clientOrderId,
    clientOrderNumber: clientInfo?.clientOrderNumber,
    
    // Elongation information
    elongationInfo: elongationInfo ? {
      inputQuantity: elongationInfo.inputQuantity,
      inputUnit: elongationInfo.inputUnit,
      outputQuantity: elongationInfo.outputQuantity,
      outputUnit: elongationInfo.outputUnit,
      elongationPercentage: elongationInfo.elongationPercentage,
      elongationQuantity: elongationInfo.elongationQuantity,
      elongationReason: elongationInfo.elongationReason,
      elongationNotes: elongationInfo.elongationNotes,
      qualityImpact: elongationInfo.qualityImpact,
      approvedBy: elongationInfo.approvedBy,
      approvalDate: elongationInfo.approvalDate
    } : undefined,
    
    // Client output information
    clientOutputInfo: clientInfo ? {
      isClientMaterial: true,
      returnToClient: clientInfo.returnToClient || false,
      returnQuantity: clientInfo.returnQuantity || 0,
      keepAsStock: clientInfo.keepAsStock || false,
      stockQuantity: clientInfo.stockQuantity || 0,
      clientReturnDate: clientInfo.clientReturnDate,
      clientInstructions: clientInfo.clientInstructions
    } : {
      isClientMaterial: false,
      returnToClient: false,
      returnQuantity: 0,
      keepAsStock: true,
      stockQuantity: batchOutput.quantity,
      clientInstructions: ''
    }
  };
  
  // Set production information
  this.productionInfo = {
    batchId: batchInfo.batchId,
    batchNumber: batchInfo.batchNumber,
    producedBy: batchInfo.producedBy,
    productionDate: new Date(),
    completionDate: new Date()
  };
  
  // Update stock with elongated quantity
  const finalQuantity = elongationInfo ? elongationInfo.outputQuantity : batchOutput.quantity;
  this.stock.currentStock = finalQuantity;
  this.stock.availableStock = finalQuantity;
  this.tracking.totalInward = finalQuantity;
  this.tracking.lastStockUpdate = new Date();
  this.tracking.lastMovementDate = new Date();
  
  // Add elongation tag if applicable
  if (elongationInfo && elongationInfo.elongationPercentage > 0) {
    this.tags.push(`elongation-${elongationInfo.elongationPercentage}%`);
  }
  
  // Add client material tag if applicable
  if (clientInfo) {
    this.tags.push('client-material-output');
    this.tags.push(`client-${clientInfo.clientName}`);
  }
  
  return this.save();
};

InventoryItemSchema.methods.updateClientOutputDecision = function(returnToClient: boolean, returnQuantity: number, keepAsStock: boolean, stockQuantity: number, clientInstructions?: string) {
  if (!this.batchOutputInfo?.clientOutputInfo) {
    throw new Error('This item is not a client material output');
  }
  
  this.batchOutputInfo.clientOutputInfo.returnToClient = returnToClient;
  this.batchOutputInfo.clientOutputInfo.returnQuantity = returnQuantity;
  this.batchOutputInfo.clientOutputInfo.keepAsStock = keepAsStock;
  this.batchOutputInfo.clientOutputInfo.stockQuantity = stockQuantity;
  this.batchOutputInfo.clientOutputInfo.clientInstructions = clientInstructions;
  
  if (returnToClient || keepAsStock) {
    this.batchOutputInfo.clientOutputInfo.clientReturnDate = new Date();
  }
  
  // Update stock based on decision
  if (keepAsStock) {
    this.stock.currentStock = stockQuantity;
    this.stock.availableStock = stockQuantity;
  } else {
    this.stock.currentStock = 0;
    this.stock.availableStock = 0;
  }
  
  this.tracking.lastStockUpdate = new Date();
  
  return this.save();
};

InventoryItemSchema.methods.getElongationSummary = function() {
  if (!this.batchOutputInfo?.elongationInfo) {
    return null;
  }
  
  const elongation = this.batchOutputInfo.elongationInfo;
  return {
    inputQuantity: elongation.inputQuantity,
    inputUnit: elongation.inputUnit,
    outputQuantity: elongation.outputQuantity,
    outputUnit: elongation.outputUnit,
    elongationPercentage: elongation.elongationPercentage,
    elongationQuantity: elongation.elongationQuantity,
    elongationReason: elongation.elongationReason,
    qualityImpact: elongation.qualityImpact,
    approvedBy: elongation.approvedBy,
    approvalDate: elongation.approvalDate
  };
};

InventoryItemSchema.methods.getClientMaterialSummary = function() {
  if (!this.batchOutputInfo?.clientOutputInfo?.isClientMaterial) {
    return null;
  }
  
  const clientInfo = this.batchOutputInfo.clientOutputInfo;
  const batchInfo = this.batchOutputInfo;
  
  return {
    clientId: batchInfo.clientId,
    clientName: batchInfo.clientName,
    grnNumber: batchInfo.grnNumber,
    clientOrderNumber: batchInfo.clientOrderNumber,
    returnToClient: clientInfo.returnToClient,
    returnQuantity: clientInfo.returnQuantity,
    keepAsStock: clientInfo.keepAsStock,
    stockQuantity: clientInfo.stockQuantity,
    clientReturnDate: clientInfo.clientReturnDate,
    clientInstructions: clientInfo.clientInstructions,
    elongationPercentage: this.batchOutputInfo.elongationInfo?.elongationPercentage || 0
  };
};

// Static methods
InventoryItemSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, 'status.isActive': true });
};

InventoryItemSchema.statics.findLowStockItems = function(companyId: string) {
  return this.find({
    companyId,
    'status.isActive': true,
    $expr: { $lte: ['$stock.currentStock', '$stock.reorderLevel'] }
  });
};

InventoryItemSchema.statics.findByCategory = function(companyId: string, category: string) {
  return this.find({
    companyId,
    'category.primary': category,
    'status.isActive': true
  });
};

InventoryItemSchema.statics.findBatchOutputs = function(companyId: string, batchId?: string) {
  const query: any = {
    companyId,
    'batchOutputInfo.sourceBatchId': { $exists: true },
    'status.isActive': true
  };
  
  if (batchId) {
    query['batchOutputInfo.sourceBatchId'] = batchId;
  }
  
  return this.find(query).populate('batchOutputInfo.sourceBatchId', 'batchNumber');
};

InventoryItemSchema.statics.findClientMaterialOutputs = function(companyId: string, clientId?: string) {
  const query: any = {
    companyId,
    'batchOutputInfo.clientOutputInfo.isClientMaterial': true,
    'status.isActive': true
  };
  
  if (clientId) {
    query['batchOutputInfo.clientId'] = clientId;
  }
  
  return this.find(query).populate('batchOutputInfo.clientId', 'name email');
};

InventoryItemSchema.statics.findElongatedItems = function(companyId: string, minElongationPercentage?: number) {
  const query: any = {
    companyId,
    'batchOutputInfo.elongationInfo.elongationPercentage': { $exists: true },
    'status.isActive': true
  };
  
  if (minElongationPercentage !== undefined) {
    query['batchOutputInfo.elongationInfo.elongationPercentage'] = { $gte: minElongationPercentage };
  }
  
  return this.find(query);
};

InventoryItemSchema.statics.createInventoryFromBatchOutput = async function(batchOutput: any, batchInfo: any, elongationInfo?: any, clientInfo?: any) {
  const InventoryItem = this;
  
  // Create new inventory item
  const inventoryItem = new InventoryItem({
    companyId: batchInfo.companyId,
    itemName: batchOutput.itemName,
    description: `Production output from batch ${batchInfo.batchNumber}`,
    category: {
      primary: batchOutput.category || 'finished_goods',
      secondary: 'production_output'
    },
    unit: batchOutput.unit,
    stock: {
      currentStock: elongationInfo ? elongationInfo.outputQuantity : batchOutput.quantity,
      availableStock: elongationInfo ? elongationInfo.outputQuantity : batchOutput.quantity,
      unit: batchOutput.unit,
      averageCost: 0, // Will be calculated based on material source
      totalValue: 0
    },
    pricing: {
      costPrice: 0,
      currency: 'INR'
    },
    quality: {
      qualityGrade: batchOutput.qualityGrade || 'A',
      qualityScore: 100
    },
    tracking: {
      createdBy: batchInfo.createdBy,
      totalInward: elongationInfo ? elongationInfo.outputQuantity : batchOutput.quantity,
      lastStockUpdate: new Date(),
      lastMovementDate: new Date()
    },
    tags: ['batch-output', `batch-${batchInfo.batchNumber}`],
    status: {
      isActive: true
    }
  });
  
  // Set batch output information
  await (inventoryItem as any).createFromBatchOutput(batchOutput, batchInfo, elongationInfo, clientInfo);
  
  return inventoryItem;
};

// Performance Optimization: Additional indexes (non-duplicate)
InventoryItemSchema.index({ companyId: 1, 'stock.reorderLevel': 1, 'stock.currentStock': 1 });
InventoryItemSchema.index({ companyId: 1, unitPrice: -1 });
InventoryItemSchema.index({ itemName: 'text', description: 'text' }, { name: 'item_text_search' });

// Performance Optimization: Add virtuals for computed fields
InventoryItemSchema.virtual('totalValue').get(function() {
  return (this.stock?.currentStock || 0) * (this.pricing?.costPrice || 0);
});

InventoryItemSchema.virtual('isLowStock').get(function() {
  return (this.stock?.currentStock || 0) <= (this.stock?.reorderLevel || 0);
});

InventoryItemSchema.virtual('stockStatus').get(function() {
  const currentStock = this.stock?.currentStock || 0;
  const reorderLevel = this.stock?.reorderLevel || 0;

  if (currentStock === 0) return 'out_of_stock';
  if (currentStock <= reorderLevel) return 'low_stock';
  if (currentStock <= reorderLevel * 2) return 'medium_stock';
  return 'high_stock';
});

// Performance Optimization: Add query helpers
(InventoryItemSchema.query as any).byCompany = function(companyId: string) {
  return this.where({ companyId });
};

(InventoryItemSchema.query as any).active = function() {
  return this.where({ 'status.isActive': true });
};

(InventoryItemSchema.query as any).lowStock = function() {
  return this.where({ $expr: { $lte: ['$stock.currentStock', '$stock.reorderLevel'] } });
};

(InventoryItemSchema.query as any).byCategory = function(category: string) {
  return this.where({ 'category.primary': category });
};

// Performance Optimization: Add pre-save middleware for optimization
InventoryItemSchema.pre('save', function(next) {
  // Update lastUpdated timestamp
  (this as any).lastUpdated = new Date();

  // Auto-generate item code if not provided
  if (!(this as any).itemCode && (this as any).itemName) {
    (this as any).itemCode = (this as any).itemName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) + '-' + Date.now().toString().slice(-4);
  }

  next();
});

// Performance Optimization: Add post-save middleware for cache invalidation
InventoryItemSchema.post('save', function() {
  // Clear related caches (implement cache invalidation logic here)
  // Example: cache.del(`inventory:${this.companyId}:*`);
});

// Instance Methods Interface
export interface IInventoryItemMethods {
  createFromBatchOutput(batchOutput: any, batchInfo: any, elongationInfo?: any, clientInfo?: any): Promise<this>;
  updateClientOutputDecision(returnToClient: boolean, returnQuantity: number, keepAsStock: boolean, stockQuantity: number, clientInstructions?: string): Promise<this>;
  getElongationSummary(): any;
  getClientMaterialSummary(): any;
}

// Static Methods Interface
export interface IInventoryItemModel extends mongoose.Model<IInventoryItem> {
  createInventoryFromBatchOutput(batchOutput: any, batchInfo: any, elongationInfo?: any, clientInfo?: any): Promise<IInventoryItem>;
  findBatchOutputs(companyId: string, batchId?: string): Promise<IInventoryItem[]>;
  findClientMaterialOutputs(companyId: string, clientId?: string): Promise<IInventoryItem[]>;
  findElongatedItems(companyId: string, minElongationPercentage?: number): Promise<IInventoryItem[]>;
}

export default model<IInventoryItem, IInventoryItemModel>('InventoryItem', InventoryItemSchema);
