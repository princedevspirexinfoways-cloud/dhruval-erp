import mongoose, { Schema, Document } from 'mongoose';

export interface IDispatch extends Document {
  // Basic Information
  dispatchNumber: string;
  dispatchDate: Date;
  dispatchType: 'pickup' | 'delivery' | 'transfer' | 'return';
  status: 'pending' | 'in-progress' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  
  // Source Information (optional when invoice-linked)
  sourceWarehouseId?: mongoose.Types.ObjectId;
  
  // Customer Order or Invoice (spec: one of these required; prefer Invoice-linked)
  customerOrderId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  
  // Delivery Information (spec: Vehicle No, Driver Name/Phone, Transport Name, Loading Date/Time)
  vehicleNumber?: string;
  deliveryPersonName?: string;
  deliveryPersonNumber?: string;
  transportName?: string;
  loadingDate?: Date;
  loadingTime?: string;
  
  // Kata Chithi / Weigh Slip (spec: mandatory upload for every shipment)
  weighSlipUrls?: string[];
  kataChithiUrls?: string[];
  
  // Partial dispatch: item-wise qty + pending balance
  dispatchItems?: {
    designNo?: string;
    productName?: string;
    quantity: number;
    unit: string;
    dispatchedQty: number;
    pendingQty?: number;
  }[];
  pendingBalance?: number;
  
  // Documents
  documents?: {
    photos: string[];
  };
  
  // Notes
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const dispatchSchema = new Schema<IDispatch>({
  // Basic Information
  dispatchNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dispatchDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dispatchType: {
    type: String,
    enum: ['pickup', 'delivery', 'transfer', 'return'],
    default: 'pickup'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delivered', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Source Information (simplified; optional when dispatch is invoice-linked)
  sourceWarehouseId: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: false
  },
  
  // Customer Order or Invoice (spec: prefer Invoice-linked; one of them required)
  customerOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'CustomerOrder',
    required: false
  },
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  
  // Delivery Information (spec: Vehicle No, Driver, Transport, Loading Date/Time)
  vehicleNumber: { type: String, trim: true },
  deliveryPersonName: { type: String, trim: true },
  deliveryPersonNumber: { type: String, trim: true },
  transportName: { type: String, trim: true },
  loadingDate: { type: Date },
  loadingTime: { type: String, trim: true },
  
  // Kata Chithi / Weigh Slip (mandatory upload per shipment)
  weighSlipUrls: [{ type: String, trim: true }],
  kataChithiUrls: [{ type: String, trim: true }],
  
  // Partial dispatch items and pending balance
  dispatchItems: [{
    designNo: { type: String, trim: true },
    productName: { type: String, trim: true },
    quantity: { type: Number, min: 0 },
    unit: { type: String, trim: true },
    dispatchedQty: { type: Number, min: 0 },
    pendingQty: { type: Number, min: 0 }
  }],
  pendingBalance: { type: Number, min: 0 },
  
  // Documents
  documents: {
    photos: [{
      type: String,
      trim: true
    }]
  },
  
  // Notes
  notes: { type: String, trim: true }
}, {
  timestamps: true
});

// Indexes for better query performance
dispatchSchema.index({ companyId: 1, createdAt: -1 });
// dispatchNumber index is automatically created by unique: true
dispatchSchema.index({ status: 1 });
dispatchSchema.index({ priority: 1 });
dispatchSchema.index({ dispatchDate: 1 });
dispatchSchema.index({ customerOrderId: 1 });
dispatchSchema.index({ sourceWarehouseId: 1 });
dispatchSchema.index({ createdBy: 1 });
dispatchSchema.index({ assignedTo: 1 });

export const Dispatch = mongoose.model<IDispatch>('Dispatch', dispatchSchema);
