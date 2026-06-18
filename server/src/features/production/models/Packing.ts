import { Schema, model, Types, models } from 'mongoose';

// Packing Schema
const PackingSchema = new Schema({
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

  // Input Meter (Auto from Folding)
  inputMeter: { type: Number, required: true, min: 0 },
  foldingCheckingId: { type: Schema.Types.ObjectId, ref: 'FoldingChecking' },

  // Packing Details
  packingType: {
    type: String,
    enum: ['roll', 'bale', 'carton'],
    required: true
  },
  bardan: { type: String }, // Packaging Type
  shippingMark: { type: String },
  totalPackedBale: { type: Number, default: 0, min: 0 },
  totalPackedMeter: { type: Number, default: 0, min: 0 },
  date: { type: Date, required: true, default: Date.now },

  // Final Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'dispatch_ready'],
    default: 'pending'
  },

  // Finished Goods Inventory Link
  finishedGoodsInventoryId: { type: Schema.Types.ObjectId },
  isDispatchReady: { type: Boolean, default: false },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'packings'
});

// Pre-save middleware
PackingSchema.pre('save', function(next) {
  // Update status
  if (this.totalPackedMeter === 0) {
    this.status = 'pending';
  } else if (this.totalPackedMeter < this.inputMeter) {
    this.status = 'in_progress';
  } else {
    this.status = 'completed';
    this.isDispatchReady = true;
  }

  next();
});

// Indexes
PackingSchema.index({ companyId: 1, lotNumber: 1 });
PackingSchema.index({ companyId: 1, status: 1 });
PackingSchema.index({ companyId: 1, isDispatchReady: 1 });
PackingSchema.index({ companyId: 1, customerId: 1 });

export interface IPacking {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  lotNumber: string;
  partyName: string;
  customerId?: Types.ObjectId;
  quality: string;
  inputMeter: number;
  foldingCheckingId?: Types.ObjectId;
  packingType: 'roll' | 'bale' | 'carton';
  bardan?: string;
  shippingMark?: string;
  totalPackedBale: number;
  totalPackedMeter: number;
  date: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'dispatch_ready';
  finishedGoodsInventoryId?: Types.ObjectId;
  isDispatchReady: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export default (models['Packing'] || model<IPacking>('Packing', PackingSchema)) as any;


