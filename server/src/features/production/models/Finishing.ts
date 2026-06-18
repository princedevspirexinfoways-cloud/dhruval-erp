import { Schema, model, Types, models } from 'mongoose';

// Finishing Schema
const FinishingSchema = new Schema({
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

  // Input Meter (Auto from Washing)
  inputMeter: { type: Number, required: true, min: 0 },
  washingId: { type: Schema.Types.ObjectId, ref: 'Washing' },

  // Finishing Details
  finishWidth: { type: Number }, // Final width
  gsm: { type: Number }, // Final GSM
  finishingType: {
    type: String,
    enum: ['soft', 'stiff', 'export_finish'],
    required: true
  },
  operatorName: { type: String },
  date: { type: Date, required: true, default: Date.now },

  // Output
  finishedMeter: { type: Number, default: 0, min: 0 },
  rejectedMeter: { type: Number, default: 0, min: 0 },
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
  collection: 'finishings'
});

// Pre-save middleware
FinishingSchema.pre('save', function(next) {
  this.pendingMeter = this.inputMeter - this.finishedMeter - this.rejectedMeter;

  // Update status
  if (this.finishedMeter === 0 && this.rejectedMeter === 0) {
    this.status = 'pending';
  } else if (this.pendingMeter > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'completed';
  }

  next();
});

// Indexes
FinishingSchema.index({ companyId: 1, lotNumber: 1 });
FinishingSchema.index({ companyId: 1, finishingType: 1 });
FinishingSchema.index({ companyId: 1, status: 1 });
FinishingSchema.index({ companyId: 1, customerId: 1 });

export interface IFinishing {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  quality: string;
  inputMeter: number;
  washingId?: Types.ObjectId;
  finishWidth?: number;
  gsm?: number;
  finishingType: 'soft' | 'stiff' | 'export_finish';
  operatorName?: string;
  date: Date;
  finishedMeter: number;
  rejectedMeter: number;
  pendingMeter: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if model already exists to prevent overwrite error during lazy loading
export default (models['Finishing'] || model<IFinishing>('Finishing', FinishingSchema)) as any;

