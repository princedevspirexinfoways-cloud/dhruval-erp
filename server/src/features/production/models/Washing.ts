import { Schema, model, Types, models } from 'mongoose';

// Washing Schema
const WashingSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Linked Information
  lotNumber: { type: String, required: true },
  partyName: { type: String, required: true },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },

  // Input Meter (Auto from Hazer/Silicate)
  inputMeter: { type: Number, required: true, min: 0 },
  hazerSilicateCuringId: { type: Schema.Types.ObjectId, ref: 'HazerSilicateCuring' },

  // Washing Details
  washingType: {
    type: String,
    enum: ['normal', 'soft', 'heavy'],
    required: true
  },
  operatorName: { type: String },
  date: { type: Date, required: true, default: Date.now },

  // Output
  washedMeter: { type: Number, default: 0, min: 0 },
  shrinkageMeter: { type: Number, default: 0, min: 0 }, // Loss
  pendingMeter: { type: Number, min: 0 },

  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'washings'
});

// Pre-save middleware
WashingSchema.pre('save', function(next) {
  this.pendingMeter = this.inputMeter - this.washedMeter - this.shrinkageMeter;

  // Update status
  if (this.washedMeter === 0 && this.shrinkageMeter === 0) {
    this.status = 'pending';
  } else if (this.pendingMeter > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'completed';
  }

  next();
});

// Indexes
WashingSchema.index({ companyId: 1, lotNumber: 1 });
WashingSchema.index({ companyId: 1, washingType: 1 });
WashingSchema.index({ companyId: 1, status: 1 });
WashingSchema.index({ companyId: 1, customerId: 1 });

export interface IWashing {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  inputMeter: number;
  hazerSilicateCuringId?: Types.ObjectId;
  washingType: 'normal' | 'soft' | 'heavy';
  operatorName?: string;
  date: Date;
  washedMeter: number;
  shrinkageMeter: number;
  pendingMeter: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if model already exists to prevent overwrite error during lazy loading
export default (models['Washing'] || model<IWashing>('Washing', WashingSchema)) as any;

