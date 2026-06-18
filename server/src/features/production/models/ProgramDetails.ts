import { Schema, model, Types, models } from 'mongoose';

// Design Row Schema
const DesignRowSchema = new Schema({
  designNumber: { type: String, required: true },
  bale: { type: Number, required: true, min: 0 },
  meter: { type: Number, min: 0 }, // Auto-calculated: Bale × 600 × Fold
  screen: { type: String },
  instructions: { type: String }
}, { _id: true });

// Program Details Schema
const ProgramDetailsSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Basic Information
  partyName: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' }, // Reference to Customer
  orderNumber: { type: String, required: true },
  fold: { type: Number, required: true, min: 0 },

  // Design Mini Module (Row-wise Entry)
  designs: [DesignRowSchema],

  // Additional Program Details
  finishWidth: { type: Number, min: 0 },
  totalBale: { type: Number, min: 0 },
  yards: { type: Number, min: 0 },
  salvage: { type: Number, min: 0 },
  packingBardan: { type: String },
  shippingMark: { type: String },
  quality: { type: String },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'program_details'
});

// Pre-save middleware to auto-calculate meter for each design
ProgramDetailsSchema.pre('save', function(next) {
  if (this.designs && this.designs.length > 0 && this.fold) {
    this.designs.forEach((design: any) => {
      if (design.bale && !design.meter) {
        design.meter = design.bale * 600 * this.fold;
      } else if (design.bale && design.meter === 0) {
        design.meter = design.bale * 600 * this.fold;
      }
    });
  }

  // Auto-calculate totalBale if not provided
  if (!this.totalBale && this.designs && this.designs.length > 0) {
    this.totalBale = this.designs.reduce((sum: number, design: any) => {
      return sum + (design.bale || 0);
    }, 0);
  }

  next();
});

// Indexes - Optimized for common query patterns
ProgramDetailsSchema.index({ companyId: 1, orderNumber: 1 });
ProgramDetailsSchema.index({ companyId: 1, partyName: 1 });
ProgramDetailsSchema.index({ companyId: 1, customerId: 1 }); // Index for customer lookup
ProgramDetailsSchema.index({ companyId: 1, status: 1 });
ProgramDetailsSchema.index({ companyId: 1, createdAt: -1 }); // For getAll queries with sort
ProgramDetailsSchema.index({ companyId: 1, orderNumber: 1, status: 1 }); // Compound for filtered queries

export interface IProgramDetails {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  partyName: string;
  customerId?: Types.ObjectId; // Reference to Customer
  orderNumber: string;
  fold: number;
  designs: Array<{
    _id?: Types.ObjectId;
    designNumber: string;
    bale: number;
    meter: number;
    screen?: string;
    instructions?: string;
  }>;
  finishWidth?: number;
  totalBale?: number;
  yards?: number;
  salvage?: number;
  packingBardan?: string;
  shippingMark?: string;
  quality?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if model already exists to prevent overwrite error during lazy loading
export default (models['ProgramDetails'] || model<IProgramDetails>('ProgramDetails', ProgramDetailsSchema)) as any;

