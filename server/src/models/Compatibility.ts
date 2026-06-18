import { Schema, model } from 'mongoose';
import { Types } from 'mongoose';

// Equipment Schema
const EquipmentSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  serialNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    required: true,
    enum: ['operational', 'maintenance', 'down', 'retired'],
    default: 'operational'
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  specifications: {
    power: {
      type: String,
      trim: true
    },
    capacity: {
      type: String,
      trim: true
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        default: 'mm'
      }
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        default: 'kg'
      }
    }
  },
  installationDate: {
    type: Date
  },
  warrantyExpiry: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compatibility Record Schema
const CompatibilityRecordSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  spareId: {
    type: Schema.Types.ObjectId,
    ref: 'Spare',
    required: true
  },
  equipmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  equipmentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  equipmentType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  equipmentModel: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  equipmentBrand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isUniversal: {
    type: Boolean,
    default: false
  },
  compatibilityNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  verifiedBy: {
    type: String,
    trim: true,
    maxlength: 100
  },
  verifiedDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['verified', 'unverified', 'incompatible', 'pending'],
    default: 'pending'
  },
  installationDate: {
    type: Date
  },
  removalDate: {
    type: Date
  },
  performanceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  issues: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  testResults: {
    dimensionalFit: {
      type: String,
      enum: ['perfect', 'good', 'acceptable', 'poor', 'incompatible']
    },
    functionalTest: {
      type: String,
      enum: ['passed', 'failed', 'partial', 'not_tested']
    },
    performanceTest: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor', 'not_tested']
    },
    safetyTest: {
      type: String,
      enum: ['passed', 'failed', 'not_tested']
    }
  },
  costImplications: {
    installationCost: {
      type: Number,
      min: 0
    },
    modificationCost: {
      type: Number,
      min: 0
    },
    additionalPartsCost: {
      type: Number,
      min: 0
    }
  },
  recommendations: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
EquipmentSchema.index({ companyId: 1, name: 1 });
EquipmentSchema.index({ companyId: 1, type: 1 });
EquipmentSchema.index({ companyId: 1, brand: 1 });
EquipmentSchema.index({ companyId: 1, status: 1 });
EquipmentSchema.index({ companyId: 1, serialNumber: 1 }, { unique: true });

CompatibilityRecordSchema.index({ companyId: 1, spareId: 1 });
CompatibilityRecordSchema.index({ companyId: 1, equipmentId: 1 });
CompatibilityRecordSchema.index({ companyId: 1, status: 1 });
CompatibilityRecordSchema.index({ companyId: 1, isUniversal: 1 });
CompatibilityRecordSchema.index({ companyId: 1, verifiedDate: -1 });

export const Equipment = model('Equipment', EquipmentSchema);
export const CompatibilityRecord = model('CompatibilityRecord', CompatibilityRecordSchema);
