import { Schema, model } from 'mongoose';
import { IWarehouse, IWarehouseZone, IWarehouseLocation } from '@/types/models';

const WarehouseLocationSchema = new Schema<IWarehouseLocation>({
  locationCode: { type: String, required: true, uppercase: true, trim: true },
  locationName: { type: String, required: true, trim: true },
  locationType: { 
    type: String, 
    enum: ['rack', 'bin', 'shelf', 'floor', 'yard', 'dock', 'staging'], 
    required: true 
  },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, default: 0 }
  },
  dimensions: {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 }
  },
  capacity: {
    maxWeight: { type: Number, required: true, min: 0 }, // in kg
    maxVolume: { type: Number, required: true, min: 0 }, // in cubic meters
    maxItems: { type: Number, required: true, min: 0 }
  },
  currentUtilization: {
    currentWeight: { type: Number, default: 0, min: 0 },
    currentVolume: { type: Number, default: 0, min: 0 },
    currentItems: { type: Number, default: 0, min: 0 }
  },
  restrictions: {
    itemTypes: [String], // Allowed item types
    hazardousAllowed: { type: Boolean, default: false },
    temperatureControlled: { type: Boolean, default: false },
    temperatureRange: {
      min: { type: Number },
      max: { type: Number }
    },
    humidityControlled: { type: Boolean, default: false },
    humidityRange: {
      min: { type: Number },
      max: { type: Number }
    }
  },
  equipment: [String], // Forklifts, cranes, etc.
  barcode: { type: String, unique: true, sparse: true },
  qrCode: { type: String },
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, { _id: false });

const WarehouseZoneSchema = new Schema<IWarehouseZone>({
  zoneCode: { type: String, required: true, uppercase: true, trim: true },
  zoneName: { type: String, required: true, trim: true },
  zoneType: { 
    type: String, 
    enum: ['receiving', 'storage', 'picking', 'packing', 'shipping', 'staging', 'quarantine', 'returns'], 
    required: true 
  },
  description: { type: String },
  area: { type: Number, required: true, min: 0 }, // in square meters
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  managerName: { type: String },
  locations: [WarehouseLocationSchema],
  totalLocations: { type: Number, default: 0, min: 0 },
  occupiedLocations: { type: Number, default: 0, min: 0 },
  utilizationPercentage: { type: Number, default: 0, min: 0, max: 100 },
  accessRestrictions: {
    requiresAuthorization: { type: Boolean, default: false },
    authorizedRoles: [String],
    authorizedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    workingHours: {
      start: { type: String },
      end: { type: String }
    }
  },
  safetyRequirements: {
    ppe: [String], // Personal Protective Equipment
    safetyTraining: [String],
    hazardLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
  },
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, { _id: false });

const WarehouseSchema = new Schema<IWarehouse>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Warehouse Identification
  warehouseCode: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  warehouseName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  },
  displayName: { 
    type: String,
    trim: true,
    maxlength: 255
  },
  description: { type: String },

  // Location Information
  address: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: { type: String },
    gpsCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },

  // Contact Information
  contactInfo: {
    primaryPhone: { type: String, required: true },
    alternatePhone: { type: String },
    email: { type: String },
    fax: { type: String }
  },

  // Warehouse Details
  warehouseType: {
    type: String,
    enum: ['distribution', 'manufacturing', 'retail', 'cold_storage', 'hazardous', 'bonded', 'transit', 'cross_dock'],
    required: true
  },
  ownershipType: {
    type: String,
    enum: ['owned', 'leased', 'rented', 'shared'],
    required: true
  },
  operationType: {
    type: String,
    enum: ['automated', 'semi_automated', 'manual'],
    default: 'manual'
  },

  // Physical Specifications
  specifications: {
    totalArea: { type: Number, required: true, min: 0 }, // in square meters
    storageArea: { type: Number, required: true, min: 0 },
    officeArea: { type: Number, default: 0, min: 0 },
    yardArea: { type: Number, default: 0, min: 0 },
    height: { type: Number, required: true, min: 0 }, // in meters
    dockDoors: { type: Number, default: 0, min: 0 },
    floors: { type: Number, default: 1, min: 1 },
    constructionType: { type: String },
    roofType: { type: String },
    floorType: { type: String }
  },

  // Capacity Information
  capacity: {
    maxWeight: { type: Number, required: true, min: 0 }, // in kg
    maxVolume: { type: Number, required: true, min: 0 }, // in cubic meters
    maxPallets: { type: Number, default: 0, min: 0 },
    maxSKUs: { type: Number, default: 0, min: 0 }
  },

  // Current Utilization
  currentUtilization: {
    currentWeight: { type: Number, default: 0, min: 0 },
    currentVolume: { type: Number, default: 0, min: 0 },
    currentPallets: { type: Number, default: 0, min: 0 },
    currentSKUs: { type: Number, default: 0, min: 0 },
    utilizationPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now }
  },

  // Zones and Locations
  zones: [WarehouseZoneSchema],
  totalZones: { type: Number, default: 0, min: 0 },
  totalLocations: { type: Number, default: 0, min: 0 },

  // Management Information
  management: {
    warehouseManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    warehouseManagerName: { type: String },
    assistantManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    assistantManagerName: { type: String },
    supervisorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    totalStaff: { type: Number, default: 0, min: 0 },
    workingShifts: {
      shift1: {
        name: { type: String, default: 'Day Shift' },
        startTime: { type: String, default: '08:00' },
        endTime: { type: String, default: '16:00' },
        staffCount: { type: Number, default: 0 }
      },
      shift2: {
        name: { type: String, default: 'Evening Shift' },
        startTime: { type: String, default: '16:00' },
        endTime: { type: String, default: '00:00' },
        staffCount: { type: Number, default: 0 }
      },
      shift3: {
        name: { type: String, default: 'Night Shift' },
        startTime: { type: String, default: '00:00' },
        endTime: { type: String, default: '08:00' },
        staffCount: { type: Number, default: 0 }
      }
    }
  },

  // Operating Hours
  operatingHours: {
    monday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    friday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isOpen: { type: Boolean, default: false } },
    sunday: { start: String, end: String, isOpen: { type: Boolean, default: false } }
  },

  // Equipment and Infrastructure
  equipment: {
    forklifts: { type: Number, default: 0, min: 0 },
    cranes: { type: Number, default: 0, min: 0 },
    conveyors: { type: Number, default: 0, min: 0 },
    scanners: { type: Number, default: 0, min: 0 },
    computers: { type: Number, default: 0, min: 0 },
    printers: { type: Number, default: 0, min: 0 },
    scales: { type: Number, default: 0, min: 0 },
    other: [String]
  },

  // Technology Systems
  systems: {
    wms: { type: Boolean, default: false }, // Warehouse Management System
    wcs: { type: Boolean, default: false }, // Warehouse Control System
    rfid: { type: Boolean, default: false },
    barcode: { type: Boolean, default: true },
    voicePicking: { type: Boolean, default: false },
    automation: { type: Boolean, default: false },
    edi: { type: Boolean, default: false }, // Electronic Data Interchange
    erp: { type: Boolean, default: true }
  },

  // Compliance and Certifications
  compliance: {
    iso9001: { type: Boolean, default: false },
    iso14001: { type: Boolean, default: false },
    ohsas18001: { type: Boolean, default: false },
    fssai: { type: Boolean, default: false },
    gmp: { type: Boolean, default: false },
    haccp: { type: Boolean, default: false },
    customsClearance: { type: Boolean, default: false },
    fireNoC: { type: Boolean, default: false },
    pollutionClearance: { type: Boolean, default: false },
    licenses: [String],
    certifications: [String],
    lastAuditDate: { type: Date },
    nextAuditDate: { type: Date }
  },

  // Financial Information
  financials: {
    monthlyRent: { type: Number, default: 0, min: 0 },
    maintenanceCost: { type: Number, default: 0, min: 0 },
    utilityCost: { type: Number, default: 0, min: 0 },
    staffCost: { type: Number, default: 0, min: 0 },
    operatingCost: { type: Number, default: 0, min: 0 },
    costPerSqFt: { type: Number, default: 0, min: 0 },
    revenuePerSqFt: { type: Number, default: 0, min: 0 }
  },

  // Performance Metrics
  metrics: {
    inventoryTurnover: { type: Number, default: 0, min: 0 },
    orderFulfillmentRate: { type: Number, default: 0, min: 0, max: 100 },
    accuracyRate: { type: Number, default: 0, min: 0, max: 100 },
    onTimeDelivery: { type: Number, default: 0, min: 0, max: 100 },
    costPerOrder: { type: Number, default: 0, min: 0 },
    productivityPerEmployee: { type: Number, default: 0, min: 0 },
    damageRate: { type: Number, default: 0, min: 0, max: 100 },
    lastCalculated: { type: Date, default: Date.now }
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to documents, images, etc.

  // Status & Tracking
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'warehouses'
});

// Compound Indexes
// Note: Most indexes are now managed centrally in database-indexes.ts
// Only keeping unique indexes that are not in the central configuration
WarehouseSchema.index({ companyId: 1, warehouseCode: 1 }, { unique: true });
WarehouseSchema.index({ companyId: 1, warehouseName: 1 });
WarehouseSchema.index({ companyId: 1, warehouseType: 1 });

// Text search index
WarehouseSchema.index({ 
  warehouseName: 'text', 
  warehouseCode: 'text',
  description: 'text'
});

// Pre-save middleware
WarehouseSchema.pre('save', function(next) {
  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = this.warehouseName;
  }
  
  // Calculate total zones and locations
  this.totalZones = this.zones.length;
  this.totalLocations = this.zones.reduce((total, zone) => total + zone.locations.length, 0);
  
  // Update utilization percentage
  if (this.capacity.maxWeight > 0) {
    this.currentUtilization.utilizationPercentage = 
      (this.currentUtilization.currentWeight / this.capacity.maxWeight) * 100;
  }
  
  next();
});

// Instance methods
WarehouseSchema.methods.getUtilizationPercentage = function(): number {
  if (this.capacity.maxWeight === 0) return 0;
  return (this.currentUtilization.currentWeight / this.capacity.maxWeight) * 100;
};

WarehouseSchema.methods.getAvailableCapacity = function() {
  return {
    weight: this.capacity.maxWeight - this.currentUtilization.currentWeight,
    volume: this.capacity.maxVolume - this.currentUtilization.currentVolume,
    pallets: this.capacity.maxPallets - this.currentUtilization.currentPallets,
    skus: this.capacity.maxSKUs - this.currentUtilization.currentSKUs
  };
};

WarehouseSchema.methods.findLocation = function(locationCode: string) {
  for (const zone of this.zones) {
    const location = zone.locations.find(loc => loc.locationCode === locationCode);
    if (location) return { zone: zone.zoneCode, location };
  }
  return null;
};

WarehouseSchema.methods.getZoneByCode = function(zoneCode: string) {
  return this.zones.find(zone => zone.zoneCode === zoneCode);
};

// Static methods
WarehouseSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

WarehouseSchema.statics.findByType = function(companyId: string, warehouseType: string) {
  return this.find({ companyId, warehouseType, isActive: true });
};

WarehouseSchema.statics.getWarehouseStats = function(companyId: string) {
  return this.aggregate([
    { $match: { companyId: new Schema.Types.ObjectId(companyId), isActive: true } },
    {
      $group: {
        _id: '$warehouseType',
        count: { $sum: 1 },
        totalArea: { $sum: '$specifications.totalArea' },
        totalCapacity: { $sum: '$capacity.maxWeight' },
        totalUtilization: { $sum: '$currentUtilization.currentWeight' },
        avgUtilization: { $avg: '$currentUtilization.utilizationPercentage' }
      }
    }
  ]);
};

export default model<IWarehouse>('Warehouse', WarehouseSchema);
