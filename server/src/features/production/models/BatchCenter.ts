import { Schema, model, Types, models } from 'mongoose';

// Batch Center Schema
const BatchCenterSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Batch Entry Form
  date: { type: Date, required: true, default: Date.now },
  lotNumber: { type: String, required: true },
  partyName: { type: String, required: true }, // Auto-fill based on lot
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  quality: { type: String, required: true },
  totalMeter: { type: Number, required: true, min: 0 },
  receivedMeter: { type: Number, default: 0, min: 0 },
  pendingMeter: { type: Number, min: 0 }, // Auto-calc: Total - Received

  // Status
  status: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'batch_centers'
});

// Pre-save middleware to auto-calculate pending meter
BatchCenterSchema.pre('save', function(next) {
  this.pendingMeter = this.totalMeter - this.receivedMeter;

  // Update status based on received meter
  if (this.receivedMeter === 0) {
    this.status = 'pending';
  } else if (this.receivedMeter < this.totalMeter) {
    this.status = 'partial';
  } else {
    this.status = 'completed';
  }

  next();
});

// Indexes - Optimized for common query patterns
BatchCenterSchema.index({ companyId: 1, lotNumber: 1 });
BatchCenterSchema.index({ companyId: 1, partyName: 1 });
BatchCenterSchema.index({ companyId: 1, date: -1 }); // For getAll queries with sort
BatchCenterSchema.index({ companyId: 1, status: 1 });
BatchCenterSchema.index({ companyId: 1, status: 1, date: -1 }); // Compound for filtered queries
BatchCenterSchema.index({ companyId: 1, customerId: 1 });

export interface IBatchCenter {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  date: Date;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  quality: string;
  totalMeter: number;
  receivedMeter: number;
  pendingMeter: number;
  status: 'pending' | 'partial' | 'completed';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export default (models['BatchCenter'] || model<IBatchCenter>('BatchCenter', BatchCenterSchema)) as any;

