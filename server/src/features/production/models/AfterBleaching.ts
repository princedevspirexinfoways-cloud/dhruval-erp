import { Schema, model, Types, models } from 'mongoose';

// After Bleaching Schema
const AfterBleachingSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Reference to Bleaching Process
  bleachingProcessId: {
    type: Schema.Types.ObjectId,
    ref: 'BleachingProcess',
    required: true
  },
  lotNumber: { type: String, required: true },
  partyName: { type: String, required: true },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },

  // Stock Information
  totalMeter: { type: Number, required: true, min: 0 }, // Updated meter from bleaching
  availableMeter: { type: Number, required: true, min: 0 }, // Available for next process

  // Longation (Shrinkage/Extra Meter) Handling
  longationStock: { type: Number, default: 0, min: 0 }, // Remaining meters

  // Printing Allocation
  sentToPrinting: { type: Number, default: 0, min: 0 },
  printingEntries: [{
    date: { type: Date, default: Date.now },
    meter: { type: Number, required: true, min: 0 },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],

  // Status
  status: {
    type: String,
    enum: ['available', 'partially_allocated', 'fully_allocated'],
    default: 'available'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'after_bleaching_stocks'
});

// Pre-save middleware to handle longation calculation
AfterBleachingSchema.pre('save', function(next) {
  // Calculate available meter
  this.availableMeter = this.totalMeter - this.sentToPrinting - this.longationStock;

  // Auto-calculate longation when sending to printing
  if (this.isModified('sentToPrinting') && this.sentToPrinting > 0) {
    const remaining = this.totalMeter - this.sentToPrinting;
    if (remaining > 0) {
      this.longationStock = remaining;
    }
  }

  // Update status based on allocation
  if (this.sentToPrinting === 0) {
    this.status = 'available';
  } else if (this.sentToPrinting < this.totalMeter) {
    this.status = 'partially_allocated';
  } else {
    this.status = 'fully_allocated';
  }

  next();
});

// Indexes
AfterBleachingSchema.index({ companyId: 1, lotNumber: 1 });
AfterBleachingSchema.index({ companyId: 1, partyName: 1 });
AfterBleachingSchema.index({ companyId: 1, bleachingProcessId: 1 });
AfterBleachingSchema.index({ companyId: 1, status: 1 });
AfterBleachingSchema.index({ companyId: 1, customerId: 1 });

export interface IAfterBleaching {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  bleachingProcessId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  totalMeter: number;
  availableMeter: number;
  longationStock: number;
  sentToPrinting: number;
  printingEntries: Array<{
    date: Date;
    meter: number;
    sentBy: Types.ObjectId;
  }>;
  status: 'available' | 'partially_allocated' | 'fully_allocated';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export default (models['AfterBleaching'] || model<IAfterBleaching>('AfterBleaching', AfterBleachingSchema)) as any;

