import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialTracking {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  itemCode?: string;
  categoryId?: mongoose.Types.ObjectId;
  categoryName?: string;
  unit: string;
  quantityGiven: number; // Total material given
  quantityUsed: number; // Material used in production
  quantityReturned: number; // Material returned to company
  quantityRemaining: number; // Material still with worker (calculated)
  quantityWasted?: number; // Material wasted/lost
  rate?: number; // Rate per unit
  totalValue?: number; // Total value of material
  notes?: string;
}

export interface IJobWorkerAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  
  // Worker Reference
  workerId: mongoose.Types.ObjectId;
  workerName: string;
  workerCode: string;
  
  // Job Details
  assignmentNumber: string; // Unique assignment number
  jobWorkId?: mongoose.Types.ObjectId; // Reference to JobWork if exists
  jobType: string; // Type of job: 'printing', 'dyeing', 'washing', etc.
  jobDescription?: string;
  
  // Job Status
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  
  // Dates
  assignedDate: Date;
  expectedCompletionDate?: Date;
  actualCompletionDate?: Date;
  startDate?: Date;
  
  // Material Tracking
  materials: IMaterialTracking[];
  
  // Output Tracking
  outputQuantity?: number;
  outputUnit?: string;
  outputQuality?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
  outputNotes?: string;
  
  // Financial
  jobRate?: number; // Rate for the job
  totalAmount?: number; // Total amount to be paid
  advancePaid?: number; // Advance payment made
  balanceAmount?: number; // Remaining balance
  paymentStatus?: 'pending' | 'partial' | 'paid';
  paymentDate?: Date;
  
  // Quality & Notes
  qualityRating?: number; // 1-5 rating
  qualityNotes?: string;
  remarks?: string;
  issues?: string[];
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialTrackingSchema = new Schema<IMaterialTracking>({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  itemCode: String,
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  categoryName: String,
  unit: {
    type: String,
    required: true
  },
  quantityGiven: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  quantityUsed: {
    type: Number,
    min: 0,
    default: 0
  },
  quantityReturned: {
    type: Number,
    min: 0,
    default: 0
  },
  quantityRemaining: {
    type: Number,
    min: 0,
    default: 0
  },
  quantityWasted: {
    type: Number,
    min: 0,
    default: 0
  },
  rate: {
    type: Number,
    min: 0
  },
  totalValue: {
    type: Number,
    min: 0
  },
  notes: String
}, { _id: false });

const JobWorkerAssignmentSchema = new Schema<IJobWorkerAssignment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: 'JobWorker',
      required: true,
      index: true
    },
    workerName: {
      type: String,
      required: true
    },
    workerCode: {
      type: String,
      required: true
    },
    assignmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    jobWorkId: {
      type: Schema.Types.ObjectId,
      ref: 'JobWork',
      index: true
    },
    jobType: {
      type: String,
      required: true,
      enum: ['printing', 'dyeing', 'washing', 'finishing', 'cutting', 'packing', 'stitching', 'quality_check', 'other'],
      index: true
    },
    jobDescription: {
      type: String,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'on_hold', 'cancelled'],
      default: 'assigned',
      index: true
    },
    assignedDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    expectedCompletionDate: {
      type: Date
    },
    actualCompletionDate: {
      type: Date
    },
    startDate: {
      type: Date
    },
    materials: [MaterialTrackingSchema],
    outputQuantity: {
      type: Number,
      min: 0
    },
    outputUnit: {
      type: String
    },
    outputQuality: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C', 'Reject']
    },
    outputNotes: String,
    jobRate: {
      type: Number,
      min: 0
    },
    totalAmount: {
      type: Number,
      min: 0
    },
    advancePaid: {
      type: Number,
      min: 0,
      default: 0
    },
    balanceAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending'
    },
    paymentDate: {
      type: Date
    },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5
    },
    qualityNotes: String,
    remarks: String,
    issues: [String],
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
    collection: 'jobworkerassignments'
  }
);

// Indexes
JobWorkerAssignmentSchema.index({ companyId: 1, workerId: 1 });
JobWorkerAssignmentSchema.index({ companyId: 1, status: 1 });
JobWorkerAssignmentSchema.index({ companyId: 1, jobType: 1 });
JobWorkerAssignmentSchema.index({ companyId: 1, assignedDate: 1 });
JobWorkerAssignmentSchema.index({ workerId: 1, status: 1 });
JobWorkerAssignmentSchema.index({ jobWorkId: 1 });

// Virtual for calculating remaining quantity
JobWorkerAssignmentSchema.virtual('materialsSummary').get(function() {
  const summary = {
    totalItems: this.materials.length,
    totalGiven: 0,
    totalUsed: 0,
    totalReturned: 0,
    totalRemaining: 0,
    totalWasted: 0,
    totalValue: 0
  };
  
  this.materials.forEach((material: IMaterialTracking) => {
    summary.totalGiven += material.quantityGiven || 0;
    summary.totalUsed += material.quantityUsed || 0;
    summary.totalReturned += material.quantityReturned || 0;
    summary.totalRemaining += material.quantityRemaining || 0;
    summary.totalWasted += material.quantityWasted || 0;
    summary.totalValue += material.totalValue || 0;
  });
  
  return summary;
});

// Pre-save middleware to calculate remaining quantity and balance
JobWorkerAssignmentSchema.pre('save', function (next) {
  // Calculate remaining quantity for each material
  this.materials.forEach((material: IMaterialTracking) => {
    material.quantityRemaining = Math.max(0, 
      (material.quantityGiven || 0) - 
      (material.quantityUsed || 0) - 
      (material.quantityReturned || 0) - 
      (material.quantityWasted || 0)
    );
    
    // Calculate total value if rate is provided
    if (material.rate && material.quantityGiven) {
      material.totalValue = material.rate * material.quantityGiven;
    }
  });
  
  // Calculate balance amount
  if (this.totalAmount !== undefined && this.advancePaid !== undefined) {
    this.balanceAmount = Math.max(0, (this.totalAmount || 0) - (this.advancePaid || 0));
  }
  
  // Update payment status
  if (this.totalAmount && this.advancePaid !== undefined) {
    if (this.advancePaid === 0) {
      this.paymentStatus = 'pending';
    } else if (this.advancePaid >= this.totalAmount) {
      this.paymentStatus = 'paid';
    } else {
      this.paymentStatus = 'partial';
    }
  }
  
  // Generate assignment number if not provided
  if (!this.assignmentNumber) {
    this.assignmentNumber = `JWA${Date.now().toString().slice(-8)}`;
  }
  
  next();
});

export const JobWorkerAssignment = mongoose.model<IJobWorkerAssignment>('JobWorkerAssignment', JobWorkerAssignmentSchema);
export default JobWorkerAssignment;

