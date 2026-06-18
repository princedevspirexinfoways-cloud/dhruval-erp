import { Schema, model, Types, models } from 'mongoose';

// Felt Schema (resting/stabilizing fabric before folding)
const FeltSchema = new Schema({
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

  // Input Meter (Auto from Finishing)
  inputMeter: { type: Number, required: true, min: 0 },
  finishingId: { type: Schema.Types.ObjectId, ref: 'Finishing' },

  // Felt Details
  feltDuration: { type: Number }, // Hours or days
  durationUnit: {
    type: String,
    enum: ['hours', 'days'],
    default: 'hours'
  },
  dateIn: { type: Date, required: true, default: Date.now },
  dateOut: { type: Date },

  // Output
  feltMeter: { type: Number, default: 0, min: 0 },
  lossMeter: { type: Number, default: 0, min: 0 },

  // Status
  status: {
    type: String,
    enum: ['in_felt', 'completed'],
    default: 'in_felt'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'felts'
});

// Pre-save middleware
FeltSchema.pre('save', function(next) {
  // Calculate felt meter if not set
  if (!this.feltMeter && this.inputMeter) {
    this.feltMeter = this.inputMeter - (this.lossMeter || 0);
  }

  // Update status when dateOut is set
  if (this.dateOut) {
    this.status = 'completed';
  }

  next();
});

// Indexes
FeltSchema.index({ companyId: 1, lotNumber: 1 });
FeltSchema.index({ companyId: 1, status: 1 });
FeltSchema.index({ companyId: 1, dateIn: -1 });
FeltSchema.index({ companyId: 1, customerId: 1 });

export interface IFelt {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  inputMeter: number;
  finishingId?: Types.ObjectId;
  feltDuration?: number;
  durationUnit: 'hours' | 'days';
  dateIn: Date;
  dateOut?: Date;
  feltMeter: number;
  lossMeter: number;
  status: 'in_felt' | 'completed';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export default (models['Felt'] || model<IFelt>('Felt', FeltSchema)) as any;


