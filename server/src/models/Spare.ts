import { Schema, model } from 'mongoose';
import { ISpare, ISpareCompatibility, ISpareSupplier, ISpareLocation, IMaintenanceSchedule, ISpareUsageHistory } from '@/types/models';

// Import the comprehensive schemas we created
import { MaintenanceSchedule, MaintenanceRecord } from './Maintenance';
import { QualityCheck, Certification, ComplianceStandard } from './Quality';
import { CompatibilityRecord } from './Compatibility';
import { SpareSupplier } from './Supplier';

const SpareCompatibilitySchema = new Schema<ISpareCompatibility>({
  equipmentType: { type: String, required: true, trim: true },
  equipmentModel: { type: String, required: true, trim: true },
  equipmentBrand: { type: String, required: true, trim: true },
  equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment' },
  isUniversal: { type: Boolean, default: false }
}, { _id: false });

const SpareSupplierSchema = new Schema<ISpareSupplier>({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName: { type: String, required: true, trim: true },
  supplierCode: { type: String, required: true, trim: true },
  partNumber: { type: String, required: true, trim: true },
  isPrimary: { type: Boolean, default: false },
  leadTime: { type: Number, required: true, min: 0 },
  minOrderQuantity: { type: Number, required: true, min: 0 },
  lastSupplyDate: { type: Date },
  lastSupplyRate: { type: Number, min: 0 },
  qualityRating: { type: Number, required: true, min: 1, max: 5 },
  warrantyPeriod: { type: Number, min: 0 }
}, { _id: false });

const SpareLocationSchema = new Schema<ISpareLocation>({
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouseName: { type: String, trim: true },
  zone: { type: String, trim: true },
  rack: { type: String, trim: true },
  bin: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const MaintenanceScheduleSchema = new Schema<IMaintenanceSchedule>({
  scheduleType: { 
    type: String, 
    required: true, 
    enum: ['preventive', 'predictive', 'corrective'] 
  },
  frequency: { type: Number, required: true, min: 1 },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date },
  maintenanceNotes: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const SpareUsageHistorySchema = new Schema<ISpareUsageHistory>({
  usedDate: { type: Date, required: true },
  quantity: { type: Number, required: true, min: 0 },
  equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment' },
  equipmentName: { type: String, trim: true },
  workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  workOrderNumber: { type: String, trim: true },
  usedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usedByName: { type: String, required: true, trim: true },
  reason: { type: String, required: true, trim: true },
  notes: { type: String, trim: true }
}, { _id: false });

const SpareSchema = new Schema<ISpare>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Basic Information
  spareCode: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 100
  },
  spareName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  },
  spareDescription: { 
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: { 
    type: String, 
    required: true,
    enum: ['mechanical', 'electrical', 'electronic', 'hydraulic', 'pneumatic', 'consumable', 'tool', 'safety', 'other']
  },
  subCategory: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  partNumber: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  manufacturerPartNumber: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  alternatePartNumbers: [{ 
    type: String,
    trim: true,
    maxlength: 100
  }],
  
  // Manufacturer & Brand
  manufacturer: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  brand: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  spareModel: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Physical Properties
  specifications: {
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      diameter: { type: Number, min: 0 },
      unit: { type: String, default: 'mm', trim: true }
    },
    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'kg', trim: true }
    },
    material: { type: String, trim: true },
    color: { type: String, trim: true },
    finish: { type: String, trim: true }
  },
  
  // Compatibility
  compatibility: [SpareCompatibilitySchema],
  
  // Equipment (for compatibility management)
  // equipment: [{ type: Schema.Types.ObjectId, ref: 'Equipment' }], // Removed - not in interface
  
  // Stock Management
  stock: {
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, required: true, min: 0, default: 0 },
    availableStock: { type: Number, required: true, min: 0, default: 0 },
    inTransitStock: { type: Number, required: true, min: 0, default: 0 },
    damagedStock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, trim: true },
    alternateUnit: { type: String, trim: true },
    conversionFactor: { type: Number, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    minStockLevel: { type: Number, required: true, min: 0 },
    maxStockLevel: { type: Number, required: true, min: 0 },
    economicOrderQuantity: { type: Number, min: 0 },
    averageCost: { type: Number, required: true, min: 0, default: 0 },
    totalValue: { type: Number, required: true, min: 0, default: 0 }
  },
  
  // Location Management
  locations: [SpareLocationSchema],
  
  // Pricing
  pricing: {
    costPrice: { type: Number, min: 0 },
    standardCost: { type: Number, min: 0 },
    lastPurchasePrice: { type: Number, min: 0 },
    averagePurchasePrice: { type: Number, min: 0 },
    currency: { type: String, required: true, default: 'INR', trim: true }
  },
  
  // Supplier Information
  suppliers: [SpareSupplierSchema],
  
  // Maintenance & Lifecycle
  maintenance: {
    isConsumable: { type: Boolean, required: true, default: false },
    expectedLifespan: { type: Number, min: 0 },
    maintenanceSchedule: MaintenanceScheduleSchema,
    maintenanceRecords: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceRecord' }],
    criticality: { 
      type: String, 
      required: true, 
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    failureRate: { type: Number, min: 0, max: 100 },
    mtbf: { type: Number, min: 0 }
  },
  
  // Usage & History
  usage: {
    totalUsed: { type: Number, required: true, min: 0, default: 0 },
    averageMonthlyUsage: { type: Number, required: true, min: 0, default: 0 },
    lastUsedDate: { type: Date },
    usageHistory: [SpareUsageHistorySchema]
  },
  
  // Quality & Compliance
  quality: {
    qualityGrade: { 
      type: String, 
      required: true, 
      enum: ['A+', 'A', 'B+', 'B', 'C'],
      default: 'A'
    },
    qualityCheckRequired: { type: Boolean, required: true, default: false },
    qualityParameters: [{ type: String, trim: true }],
    lastQualityCheck: { type: Date },
    qualityNotes: { type: String, trim: true },
    certifications: [{ type: String, trim: true }],
    complianceStandards: [{ type: String, trim: true }],
    qualityChecks: [{ type: Schema.Types.ObjectId, ref: 'QualityCheck' }],
    qualityCertifications: [{ type: Schema.Types.ObjectId, ref: 'Certification' }],
    complianceStandardsList: [{ type: Schema.Types.ObjectId, ref: 'ComplianceStandard' }]
  },
  
  // Storage & Handling
  storage: {
    storageConditions: { type: String, trim: true },
    temperatureRange: {
      min: { type: Number },
      max: { type: Number },
      unit: { type: String, default: 'C', trim: true }
    },
    humidityRange: {
      min: { type: Number, min: 0, max: 100 },
      max: { type: Number, min: 0, max: 100 }
    },
    specialHandling: { type: String, trim: true },
    shelfLife: { type: Number, min: 0 },
    expiryDate: { type: Date }
  },
  
  // Documentation
  documentation: {
    images: [{ type: String, trim: true }],
    manuals: [{ type: String, trim: true }],
    drawings: [{ type: String, trim: true }],
    certificates: [{ type: String, trim: true }],
    notes: { type: String, trim: true }
  },
  
  // Status & Tracking
  status: {
    isActive: { type: Boolean, required: true, default: true },
    isDiscontinued: { type: Boolean, required: true, default: false },
    isCritical: { type: Boolean, required: true, default: false },
    isObsolete: { type: Boolean, required: true, default: false },
    requiresApproval: { type: Boolean, required: true, default: false },
    isHazardous: { type: Boolean, required: true, default: false }
  },
  
  // Audit & Tracking
  tracking: {
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastStockUpdate: { type: Date },
    lastMovementDate: { type: Date },
    totalInward: { type: Number, required: true, min: 0, default: 0 },
    totalOutward: { type: Number, required: true, min: 0, default: 0 },
    totalAdjustments: { type: Number, required: true, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'spares'
});

// Compound indexes for better query performance
SpareSchema.index({ companyId: 1, spareCode: 1 }, { unique: true });
SpareSchema.index({ companyId: 1, spareName: 1 });
SpareSchema.index({ companyId: 1, partNumber: 1 });
SpareSchema.index({ companyId: 1, category: 1 });
SpareSchema.index({ companyId: 1, manufacturer: 1 });
SpareSchema.index({ companyId: 1, 'status.isActive': 1 });
SpareSchema.index({ companyId: 1, 'maintenance.criticality': 1 });
SpareSchema.index({ companyId: 1, 'stock.currentStock': 1 });

// Pre-save middleware to calculate available stock
SpareSchema.pre('save', function(next) {
  if (this.isModified('stock')) {
    (this as any).stock.availableStock = (this as any).stock.currentStock - (this as any).stock.reservedStock;
    (this as any).stock.totalValue = (this as any).stock.currentStock * (this as any).stock.averageCost;
  }
  next();
});

// Virtual for low stock alert
SpareSchema.virtual('isLowStock').get(function() {
  return (this as any).stock.currentStock <= (this as any).stock.reorderLevel;
});

// Virtual for out of stock
SpareSchema.virtual('isOutOfStock').get(function() {
  return (this as any).stock.currentStock === 0;
});

// Virtual for critical low stock
SpareSchema.virtual('isCriticalLowStock').get(function() {
  return (this as any).stock.currentStock <= (this as any).stock.minStockLevel;
});

// Ensure virtuals are included in JSON output
SpareSchema.set('toJSON', { virtuals: true });
SpareSchema.set('toObject', { virtuals: true });

const Spare = model<ISpare>('Spare', SpareSchema);

export default Spare;
