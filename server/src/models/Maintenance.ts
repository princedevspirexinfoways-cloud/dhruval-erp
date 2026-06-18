import { Schema, model } from 'mongoose';
import { Types } from 'mongoose';

// Maintenance Schedule Schema
const MaintenanceScheduleSchema = new Schema({
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
  scheduleType: {
    type: String,
    required: true,
    enum: ['preventive', 'predictive', 'corrective']
  },
  frequency: {
    type: Number,
    required: true,
    min: 1
  },
  frequencyUnit: {
    type: String,
    required: true,
    enum: ['days', 'weeks', 'months', 'years']
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  maintenanceNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedTechnician: {
    type: String,
    trim: true,
    maxlength: 100
  },
  estimatedDuration: {
    type: Number,
    min: 0 // in hours
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Maintenance Record Schema
const MaintenanceRecordSchema = new Schema({
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
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['preventive', 'predictive', 'corrective', 'emergency']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  technician: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  duration: {
    type: Number,
    required: true,
    min: 0 // in hours
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  partsUsed: [{
    spareId: {
      type: Schema.Types.ObjectId,
      ref: 'Spare'
    },
    spareName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  status: {
    type: String,
    required: true,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  images: [{
    type: String // URLs to stored images
  }],
  nextMaintenanceDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MaintenanceScheduleSchema.index({ companyId: 1, spareId: 1 });
MaintenanceScheduleSchema.index({ companyId: 1, nextMaintenance: 1 });
MaintenanceScheduleSchema.index({ companyId: 1, isActive: 1 });

MaintenanceRecordSchema.index({ companyId: 1, spareId: 1 });
MaintenanceRecordSchema.index({ companyId: 1, date: -1 });
MaintenanceRecordSchema.index({ companyId: 1, status: 1 });

export const MaintenanceSchedule = model('MaintenanceSchedule', MaintenanceScheduleSchema);
export const MaintenanceRecord = model('MaintenanceRecord', MaintenanceRecordSchema);
