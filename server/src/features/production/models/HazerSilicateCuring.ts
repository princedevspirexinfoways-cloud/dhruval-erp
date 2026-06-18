import { Schema, model, Types, models } from 'mongoose';

// Hazer/Silicate/Curing Schema
const HazerSilicateCuringSchema = new Schema({
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
  quality: { type: String, required: true },

  // Input Meter (Auto from Printing)
  inputMeter: { type: Number, required: true, min: 0 },
  printingId: { type: Schema.Types.ObjectId, ref: 'Printing' }, // Reference to printing

  // Process Details
  processType: {
    type: String,
    enum: ['hazer', 'silicate', 'curing'],
    required: true
  },
  chemicalUsed: { type: String },
  temperature: { type: Number },
  time: { type: Number }, // in minutes
  operatorName: { type: String },
  date: { type: Date, required: true, default: Date.now },

  // Output
  processedMeter: { type: Number, default: 0, min: 0 },
  lossMeter: { type: Number, default: 0, min: 0 }, // Shrinkage
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
  collection: 'hazer_silicate_curing'
});

// Pre-save middleware
HazerSilicateCuringSchema.pre('save', function(next) {
  this.pendingMeter = this.inputMeter - this.processedMeter - this.lossMeter;

  // Update status
  if (this.processedMeter === 0 && this.lossMeter === 0) {
    this.status = 'pending';
  } else if (this.pendingMeter > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'completed';
  }

  next();
});

// Indexes
HazerSilicateCuringSchema.index({ companyId: 1, lotNumber: 1 });
HazerSilicateCuringSchema.index({ companyId: 1, processType: 1 });
HazerSilicateCuringSchema.index({ companyId: 1, status: 1 });
HazerSilicateCuringSchema.index({ companyId: 1, customerId: 1 });

export interface IHazerSilicateCuring {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  quality: string;
  inputMeter: number;
  printingId?: Types.ObjectId;
  processType: 'hazer' | 'silicate' | 'curing';
  chemicalUsed?: string;
  temperature?: number;
  time?: number;
  operatorName?: string;
  date: Date;
  processedMeter: number;
  lossMeter: number;
  pendingMeter: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export default (models['HazerSilicateCuring'] || model<IHazerSilicateCuring>('HazerSilicateCuring', HazerSilicateCuringSchema)) as any;


