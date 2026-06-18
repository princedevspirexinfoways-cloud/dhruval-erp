import mongoose, { Schema, Document } from 'mongoose';
import { IJobWork } from '../types/models';

export interface IJobWorkDocument extends IJobWork, Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobWorkSchema = new Schema<IJobWorkDocument>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    isJobWork: {
      type: Boolean,
      default: true,
      required: true
    },
    jobWorkerId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    jobWorkerName: {
      type: String,
      required: true
    },
    jobWorkerRate: {
      type: Number,
      required: true,
      min: 0
    },
    expectedDelivery: {
      type: Date,
      required: true
    },
    actualDelivery: {
      type: Date
    },
    jobWorkCost: {
      type: Number,
      default: 0,
      min: 0
    },
    qualityAgreement: {
      type: String
    },
    // Additional fields for comprehensive job work management
    jobWorkType: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'quality_check'],
      default: 'pending'
    },
    productionOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductionOrder'
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch'
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      default: 'meters'
    },
    // Challan Information
    challanNumber: {
      type: String,
      index: true
    },
    challanDate: {
      type: Date
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    categoryName: {
      type: String
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Subcategory'
    },
    subcategoryName: {
      type: String
    },
    itemName: {
      type: String
    },
    attributeName: {
      type: String
    },
    price: {
      type: Number,
      min: 0
    },
    lotNumber: {
      type: String
    },
    // Party Details
    partyName: {
      type: String
    },
    partyGstNumber: {
      type: String
    },
    partyAddress: {
      type: String
    },
    // Transport Details
    transportName: {
      type: String
    },
    transportNumber: {
      type: String
    },
    materialProvided: [{
      itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
      itemName: String,
      quantity: Number,
      unit: String
    }],
    materialReturned: [{
      itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
      itemName: String,
      quantity: Number,
      unit: String
    }],
    materialUsed: [{
      itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
      itemName: String,
      quantity: Number,
      unit: String
    }],
    materialWasted: [{
      itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
      itemName: String,
      quantity: Number,
      unit: String
    }],
    outputQuantity: {
      type: Number,
      min: 0
    },
    wasteQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    qualityStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'rework'],
      default: 'pending'
    },
    qualityNotes: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending'
    },
    paymentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentDate: {
      type: Date
    },
    remarks: {
      type: String
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    collection: 'jobworks'
  }
);

// Indexes for better query performance
JobWorkSchema.index({ companyId: 1, status: 1 });
JobWorkSchema.index({ companyId: 1, jobWorkerId: 1 });
JobWorkSchema.index({ companyId: 1, expectedDelivery: 1 });
JobWorkSchema.index({ companyId: 1, jobWorkType: 1 });
JobWorkSchema.index({ companyId: 1, challanNumber: 1 });
JobWorkSchema.index({ companyId: 1, categoryId: 1 });
JobWorkSchema.index({ productionOrderId: 1 });
JobWorkSchema.index({ batchId: 1 });

export const JobWork = mongoose.model<IJobWorkDocument>('JobWork', JobWorkSchema);

