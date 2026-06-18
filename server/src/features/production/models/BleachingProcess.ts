import { Schema, model, Types, models } from 'mongoose';

// Mercerise Sub-Module Schema
const MerceriseSchema = new Schema({
  degree: { type: Number, min: 0 },
  width: { type: Number, min: 0 }
}, { _id: false });

// Bleaching Process Schema
const BleachingProcessSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Bleaching Entry Form
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  partyName: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  lotNumber: { type: String, required: true },
  totalBale: { type: Number, required: true, min: 0 },
  totalMeter: { type: Number, required: true, min: 0 }, // Total Meter / Total Quantity
  transportName: { type: String },

  // Mercerise Sub-Module
  mercerise: MerceriseSchema,

  // Process Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },

  // Completion Data
  completedMeter: { type: Number, min: 0 }, // Updated meter after completion
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Challan
  challanGenerated: { type: Boolean, default: false },
  challanUrl: { type: String },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'bleaching_processes'
});

// Indexes
BleachingProcessSchema.index({ companyId: 1, lotNumber: 1 });
BleachingProcessSchema.index({ companyId: 1, partyName: 1 });
BleachingProcessSchema.index({ companyId: 1, status: 1 });
BleachingProcessSchema.index({ companyId: 1, date: -1 });
BleachingProcessSchema.index({ companyId: 1, customerId: 1 });

export interface IBleachingProcess {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  customerId?: Types.ObjectId;
  partyName: string;
  date: Date;
  lotNumber: string;
  totalBale: number;
  totalMeter: number;
  transportName?: string;
  mercerise?: {
    degree?: number;
    width?: number;
  };
  status: 'pending' | 'in_progress' | 'completed';
  completedMeter?: number;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  challanGenerated: boolean;
  challanUrl?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export default (models['BleachingProcess'] || model<IBleachingProcess>('BleachingProcess', BleachingProcessSchema)) as any;

