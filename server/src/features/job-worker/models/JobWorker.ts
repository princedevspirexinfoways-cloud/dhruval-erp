import mongoose, { Schema, Document } from 'mongoose';

export interface IJobWorker extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  
  // Basic Details
  workerCode: string; // Unique worker code
  name: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  
  // Address Details
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    fullAddress?: string;
  };
  
  // Additional Details
  aadharNumber?: string;
  panNumber?: string;
  gstNumber?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  
  // Work Details
  specialization?: string[]; // e.g., ['printing', 'dyeing', 'washing']
  experience?: number; // in years
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  hourlyRate?: number;
  dailyRate?: number;
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean;
  
  // Metadata
  notes?: string;
  tags?: string[];
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobWorkerSchema = new Schema<IJobWorker>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    workerCode: {
      type: String,
      required: false, // Auto-generated in pre-save middleware
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    alternatePhoneNumber: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      },
      fullAddress: String
    },
    aadharNumber: {
      type: String,
      trim: true
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String
    },
    specialization: [{
      type: String,
      enum: ['printing', 'dyeing', 'washing', 'finishing', 'cutting', 'packing', 'stitching', 'quality_check', 'other']
    }],
    experience: {
      type: Number,
      min: 0
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    hourlyRate: {
      type: Number,
      min: 0
    },
    dailyRate: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    tags: [{
      type: String,
      trim: true
    }],
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
    collection: 'jobworkers'
  }
);

// Indexes for better query performance
JobWorkerSchema.index({ companyId: 1, workerCode: 1 }, { unique: true });
JobWorkerSchema.index({ companyId: 1, name: 1 });
JobWorkerSchema.index({ companyId: 1, phoneNumber: 1 });
JobWorkerSchema.index({ companyId: 1, status: 1, isActive: 1 });
JobWorkerSchema.index({ companyId: 1, specialization: 1 });
JobWorkerSchema.index({ name: 'text', workerCode: 'text', phoneNumber: 'text' });

// Pre-save middleware to generate worker code if not provided
JobWorkerSchema.pre('save', async function (next) {
  // Only generate if this is a new document and workerCode is not provided
  if (this.isNew && !this.workerCode) {
    try {
      // Get the model to avoid circular reference
      const JobWorkerModel = mongoose.model<IJobWorker>('JobWorker');
      const count = await JobWorkerModel.countDocuments({ companyId: this.companyId });
      this.workerCode = `WRK${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      // If count fails, use timestamp-based code
      this.workerCode = `WRK${Date.now().toString().slice(-8)}`;
    }
  }
  // Ensure workerCode is always set (for validation)
  if (!this.workerCode) {
    this.workerCode = `WRK${Date.now().toString().slice(-8)}`;
  }
  next();
});

export const JobWorker = mongoose.model<IJobWorker>('JobWorker', JobWorkerSchema);
export default JobWorker;

