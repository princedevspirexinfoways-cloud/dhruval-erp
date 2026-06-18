import { Schema, model, Types, models } from 'mongoose';

// Rejection Stock Schema (Waste/Rejected Stock)
const RejectionStockSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Source Information
  lotNumber: { type: String, required: true },
  partyName: { type: String, required: true },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  sourceModule: {
    type: String,
    enum: ['printing', 'finishing', 'folding_checking'],
    required: true
  },
  sourceId: { type: Schema.Types.ObjectId }, // Reference to source entry

  // Stock Information
  meter: { type: Number, required: true, min: 0 },
  reason: { type: String }, // Rejection reason
  qualityIssue: { type: String },

  // Status
  status: {
    type: String,
    enum: ['pending', 'disposed', 'reworked'],
    default: 'pending'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'rejection_stocks'
});

// Indexes
RejectionStockSchema.index({ companyId: 1, lotNumber: 1 });
RejectionStockSchema.index({ companyId: 1, status: 1 });
RejectionStockSchema.index({ companyId: 1, sourceModule: 1 });
RejectionStockSchema.index({ companyId: 1, customerId: 1 });

export interface IRejectionStock {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  sourceModule: 'printing' | 'finishing' | 'folding_checking';
  sourceId?: Types.ObjectId;
  meter: number;
  reason?: string;
  qualityIssue?: string;
  status: 'pending' | 'disposed' | 'reworked';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if model already exists to prevent overwrite error during lazy loading
export default (models['RejectionStock'] || model<IRejectionStock>('RejectionStock', RejectionStockSchema)) as any;

