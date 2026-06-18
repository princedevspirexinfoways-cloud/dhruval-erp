import { Schema, model, Types, models } from 'mongoose';

// Longation Stock Schema (Shrinkage/Extra Meter Stock)
const LongationStockSchema = new Schema({
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
    enum: ['after_bleaching', 'hazer_silicate_curing', 'washing', 'felt'],
    required: true
  },
  sourceId: { type: Schema.Types.ObjectId }, // Reference to source entry

  // Stock Information
  meter: { type: Number, required: true, min: 0 },
  reason: { type: String }, // Shrinkage, Extra, Loss, etc.

  // Status
  status: {
    type: String,
    enum: ['available', 'allocated', 'used'],
    default: 'available'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'longation_stocks'
});

// Indexes
LongationStockSchema.index({ companyId: 1, lotNumber: 1 });
LongationStockSchema.index({ companyId: 1, status: 1 });
LongationStockSchema.index({ companyId: 1, sourceModule: 1 });
LongationStockSchema.index({ companyId: 1, customerId: 1 });

export interface ILongationStock {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  sourceModule: 'after_bleaching' | 'hazer_silicate_curing' | 'washing' | 'felt';
  sourceId?: Types.ObjectId;
  meter: number;
  reason?: string;
  status: 'available' | 'allocated' | 'used';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if model already exists to prevent overwrite error during lazy loading
export default (models['LongationStock'] || model<ILongationStock>('LongationStock', LongationStockSchema)) as any;

