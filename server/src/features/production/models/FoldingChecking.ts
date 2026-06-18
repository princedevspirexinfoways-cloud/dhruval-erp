import { Schema, model, Types, models } from 'mongoose';

// Folding + Checking Schema
const FoldingCheckingSchema = new Schema({
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

  // Input Meter (Auto from Felt)
  inputMeter: { type: Number, required: true, min: 0 },
  feltId: { type: Schema.Types.ObjectId, ref: 'Felt' },

  // Folding & QC Details
  foldType: { type: String },
  checkedMeter: { type: Number, default: 0, min: 0 },
  rejectedMeter: { type: Number, default: 0, min: 0 },
  qcStatus: {
    type: String,
    enum: ['pass', 'fail', 'partial'],
    default: 'partial'
  },
  checkerName: { type: String },
  date: { type: Date, required: true, default: Date.now },

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
  collection: 'folding_checkings'
});

// Pre-save middleware
FoldingCheckingSchema.pre('save', function(next) {
  // Update status
  if (this.checkedMeter === 0 && this.rejectedMeter === 0) {
    this.status = 'pending';
  } else if (this.checkedMeter + this.rejectedMeter < this.inputMeter) {
    this.status = 'in_progress';
  } else {
    this.status = 'completed';
  }

  // Update QC status
  if (this.checkedMeter === this.inputMeter && this.rejectedMeter === 0) {
    this.qcStatus = 'pass';
  } else if (this.rejectedMeter === this.inputMeter) {
    this.qcStatus = 'fail';
  } else {
    this.qcStatus = 'partial';
  }

  next();
});

// Indexes
FoldingCheckingSchema.index({ companyId: 1, lotNumber: 1 });
FoldingCheckingSchema.index({ companyId: 1, qcStatus: 1 });
FoldingCheckingSchema.index({ companyId: 1, status: 1 });
FoldingCheckingSchema.index({ companyId: 1, customerId: 1 });

export interface IFoldingChecking {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  inputMeter: number;
  feltId?: Types.ObjectId;
  foldType?: string;
  checkedMeter: number;
  rejectedMeter: number;
  qcStatus: 'pass' | 'fail' | 'partial';
  checkerName?: string;
  date: Date;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export default (models['FoldingChecking'] || model<IFoldingChecking>('FoldingChecking', FoldingCheckingSchema)) as any;


