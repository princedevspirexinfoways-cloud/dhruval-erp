import { Schema, model, Types, models } from 'mongoose';

// Printing Entry Schema
const PrintingSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Linked Information
  partyName: { type: String, required: true },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  orderNumber: { type: String },
  lotNumber: { type: String, required: true },
  designNumber: { type: String, required: true },
  quality: { type: String, required: true },

  // Input Meter (Auto from After Bleaching / Batch Center)
  totalMeterReceived: { type: Number, required: true, min: 0 },
  source: {
    type: String,
    enum: ['after_bleaching', 'batch_center'],
    required: true
  },
  sourceId: { type: Schema.Types.ObjectId }, // Reference to source

  // Printing Details
  screenNo: { type: String },
  designScreen: { type: String },
  printingType: {
    type: String,
    enum: ['reactive', 'pigment', 'digital', 'kitenge'],
    required: true
  },
  operatorName: { type: String },
  machineName: { type: String },
  date: { type: Date, required: true, default: Date.now },

  // Printing Output
  printedMeter: { type: Number, default: 0, min: 0 },
  rejectedMeter: { type: Number, default: 0, min: 0 },
  pendingMeter: { type: Number, min: 0 }, // Auto: Received - Printed - Rejected
  remarks: { type: String },
  instructions: { type: String },

  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'on_hold'],
    default: 'pending'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'printings'
});

// Pre-save middleware to auto-calculate pending meter
PrintingSchema.pre('save', function(next) {
  this.pendingMeter = this.totalMeterReceived - this.printedMeter - this.rejectedMeter;

  // Update status
  if (this.printedMeter === 0 && this.rejectedMeter === 0) {
    this.status = 'pending';
  } else if (this.pendingMeter > 0) {
    this.status = 'in_progress';
  } else if (this.pendingMeter === 0) {
    this.status = 'completed';
  }

  next();
});

// Indexes - Optimized for common query patterns
PrintingSchema.index({ companyId: 1, lotNumber: 1 });
PrintingSchema.index({ companyId: 1, orderNumber: 1 });
PrintingSchema.index({ companyId: 1, status: 1 });
PrintingSchema.index({ companyId: 1, date: -1 }); // For getAll queries with sort
PrintingSchema.index({ companyId: 1, status: 1, date: -1 }); // Compound for filtered queries
PrintingSchema.index({ companyId: 1, customerId: 1 });

export interface IPrinting {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  partyName: string;
  customerId?: Types.ObjectId;
  orderNumber?: string;
  lotNumber: string;
  designNumber: string;
  quality: string;
  totalMeterReceived: number;
  source: 'after_bleaching' | 'batch_center';
  sourceId?: Types.ObjectId;
  screenNo?: string;
  designScreen?: string;
  printingType: 'reactive' | 'pigment' | 'digital' | 'kitenge';
  operatorName?: string;
  machineName?: string;
  date: Date;
  printedMeter: number;
  rejectedMeter: number;
  pendingMeter: number;
  remarks?: string;
  instructions?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if model already exists to prevent overwrite error during lazy loading
export default (models['Printing'] || model<IPrinting>('Printing', PrintingSchema)) as any;

