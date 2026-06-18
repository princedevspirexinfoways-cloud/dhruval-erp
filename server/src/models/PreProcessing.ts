import mongoose, { Schema, Document } from 'mongoose';
import { AuditableDocument } from '../types/models';

export interface IPreProcessing extends AuditableDocument {
  batchNumber: string;
  productionOrderId?: mongoose.Types.ObjectId;
  productionOrderNumber?: string;
  greyFabricInwardId?: mongoose.Types.ObjectId;
  grnNumber?: string;
  
  // Process Details
  processType: 'desizing' | 'bleaching' | 'scouring' | 'mercerizing' | 'combined';
  processName: string;
  processDescription?: string;
  
  // Input Materials (Multiple fabrics can be processed together)
  inputMaterials: Array<{
    fabricType: string;
    fabricGrade: string;
    gsm: number;
    width: number;
    color: string;
    quantity: number;
    unit: 'meters' | 'yards' | 'pieces';
    weight: number;
    inventoryItemId?: mongoose.Types.ObjectId; // Reference to inventory item
  }>;
  
  // Chemical Recipe
  chemicalRecipe: {
    recipeName: string;
    recipeVersion: string;
    chemicals: Array<{
      chemicalId: mongoose.Types.ObjectId;
      chemicalName: string;
      quantity: number;
      unit: 'kg' | 'liters' | 'grams' | 'ml';
      concentration: number;
      temperature: number;
      ph: number;
    }>;
    totalRecipeCost: number;
  };
  
  // Process Parameters
  processParameters: {
    temperature: {
      min: number;
      max: number;
      actual: number;
      unit: 'celsius' | 'fahrenheit';
    };
    pressure: {
      min: number;
      max: number;
      actual: number;
      unit: 'bar' | 'psi';
    };
    ph: {
      min: number;
      max: number;
      actual: number;
    };
    time: {
      planned: number;
      actual: number;
      unit: 'minutes' | 'hours';
    };
    speed: {
      planned: number;
      actual: number;
      unit: 'm/min' | 'yards/min';
    };
  };
  
  // Machine Assignment
  machineAssignment: {
    machineId?: string; // Changed from ObjectId to string since no Machine model exists
    machineName?: string;
    machineType?: string;
    capacity?: number;
    efficiency?: number;
  };
  
  // Worker Assignment
  workerAssignment: {
    workers: Array<{
      workerId: mongoose.Types.ObjectId;
      workerName: string;
      role: 'operator' | 'supervisor' | 'helper';
      shift: 'morning' | 'evening' | 'night';
      hoursWorked: number;
    }>;
    supervisorId?: mongoose.Types.ObjectId;
    supervisorName?: string;
  };
  
  // Process Timing
  timing: {
    plannedStartTime: Date;
    actualStartTime?: Date;
    plannedEndTime: Date;
    actualEndTime?: Date;
    plannedDuration: number; // in minutes
    actualDuration?: number; // in minutes
    setupTime: number; // in minutes
    cleaningTime: number; // in minutes
    downtime: number; // in minutes
    reasonForDelay?: string;
  };
  
  // Quality Control
  qualityControl: {
    preProcessCheck: {
      fabricCondition: 'good' | 'fair' | 'poor';
      defects: string[];
      notes: string;
      checkedBy?: mongoose.Types.ObjectId;
      checkedByName?: string;
      checkDate: Date;
    };
    inProcessCheck: {
      temperature: number;
      ph: number;
      color: string;
      consistency: 'good' | 'fair' | 'poor';
      notes: string;
      checkedBy?: mongoose.Types.ObjectId;
      checkedByName?: string;
      checkTime: Date;
    };
    postProcessCheck: {
      whiteness: number;
      absorbency: 'excellent' | 'good' | 'fair' | 'poor';
      strength: number;
      shrinkage: number;
      defects: string[];
      qualityGrade: 'A' | 'B' | 'C' | 'D';
      notes: string;
      checkedBy?: mongoose.Types.ObjectId;
      checkedByName?: string;
      checkDate: Date;
    };
  };
  
  // Output Material
  outputMaterial: {
    quantity: number;
    unit: 'meters' | 'yards' | 'pieces';
    weight: number;
    gsm: number;
    width: number;
    color: string;
    quality: 'A' | 'B' | 'C' | 'D';
    defects: string[];
    location: {
      warehouseId?: mongoose.Types.ObjectId;
      warehouseName?: string;
      rackNumber?: string;
      shelfNumber?: string;
    };
  };
  
  // Waste Management
  wasteManagement: {
    wasteGenerated: {
      quantity: number;
      unit: 'kg' | 'liters';
      type: 'chemical' | 'fabric' | 'water' | 'other';
      disposalMethod: 'recycle' | 'dispose' | 'reuse';
      cost: number;
    }[];
    totalWasteCost: number;
    environmentalCompliance: boolean;
    complianceNotes?: string;
  };
  
  // Cost Tracking
  costs: {
    chemicalCost: number;
    laborCost: number;
    machineCost: number;
    utilityCost: number;
    wasteDisposalCost: number;
    totalCost: number;
    costPerUnit: number;
  };
  
  // Status and Progress
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_hold';
  progress: number; // percentage 0-100
  
  // Additional Information
  notes?: string;
  specialInstructions?: string;
  images: string[];
  documents: string[];
  tags: string[];
  
  // Status Change Log
  statusChangeLog: Array<{
    fromStatus: string;
    toStatus: string;
    changedBy: mongoose.Types.ObjectId;
    changedByName: string;
    changedByEmail: string;
    changeDate: Date;
    changeReason: string;
    notes: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }>;

  // Approval
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  approvalDate?: Date;
  approvalNotes?: string;
}

const PreProcessingSchema = new Schema<IPreProcessing>({
  batchNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  productionOrderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'ProductionOrder'
  },
  productionOrderNumber: { type: String },
  greyFabricInwardId: { 
    type: Schema.Types.ObjectId, 
    ref: 'GreyFabricInward'
  },
  grnNumber: { type: String },
  
  // Process Details
  processType: { 
    type: String, 
    enum: ['desizing', 'bleaching', 'scouring', 'mercerizing', 'combined'], 
    required: true 
  },
  processName: { type: String, required: true },
  processDescription: { type: String },
  
  // Input Materials (Multiple fabrics can be processed together)
  inputMaterials: [{
    fabricType: { type: String, required: true },
    fabricGrade: { type: String },
    gsm: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    color: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unit: { 
      type: String, 
      enum: ['meters', 'yards', 'pieces'],
      required: true
    },
    weight: { type: Number, min: 0 },
    inventoryItemId: { 
      type: Schema.Types.ObjectId, 
      ref: 'InventoryItem',
      default: null
    }
  }],
  
  // Chemical Recipe
  chemicalRecipe: {
    recipeName: { type: String },
    recipeVersion: { type: String },
    chemicals: [{
      chemicalId: { 
        type: Schema.Types.ObjectId, 
        ref: 'InventoryItem'
      },
      chemicalName: { type: String },
      quantity: { type: Number, min: 0 },
      unit: { 
        type: String, 
        enum: ['kg', 'liters', 'grams', 'ml']
      },
      concentration: { type: Number, min: 0 },
      temperature: { type: Number },
      ph: { type: Number, min: 0, max: 14 }
    }],
    totalRecipeCost: { type: Number, min: 0 }
  },
  
  // Process Parameters
  processParameters: {
    temperature: {
      min: { type: Number },
      max: { type: Number },
      actual: { type: Number },
      unit: { 
        type: String, 
        enum: ['celsius', 'fahrenheit'], 
        default: 'celsius' 
      }
    },
    pressure: {
      min: { type: Number },
      max: { type: Number },
      actual: { type: Number },
      unit: { 
        type: String, 
        enum: ['bar', 'psi'], 
        default: 'bar' 
      }
    },
    ph: {
      min: { type: Number, min: 0, max: 14 },
      max: { type: Number, min: 0, max: 14 },
      actual: { type: Number, min: 0, max: 14 }
    },
    time: {
      planned: { type: Number, min: 0 },
      actual: { type: Number, min: 0 },
      unit: { 
        type: String, 
        enum: ['minutes', 'hours'], 
        default: 'minutes' 
      }
    },
    speed: {
      planned: { type: Number, min: 0 },
      actual: { type: Number, min: 0 },
      unit: { 
        type: String, 
        enum: ['m/min', 'yards/min'], 
        default: 'm/min' 
      }
    }
  },
  
  // Machine Assignment
  machineAssignment: {
    machineId: { 
      type: String,
      default: null
    },
    machineName: { type: String },
    machineType: { type: String },
    capacity: { type: Number, min: 0 },
    efficiency: { type: Number, min: 0, max: 100 }
  },
  
  // Worker Assignment
  workerAssignment: {
    workers: [{
      workerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User'
      },
      workerName: { type: String },
      role: { 
        type: String, 
        enum: ['operator', 'supervisor', 'helper']
      },
      shift: { 
        type: String, 
        enum: ['morning', 'evening', 'night']
      },
      hoursWorked: { type: Number, min: 0 }
    }],
    supervisorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      default: null,
      set: (value: any) => {
        if (!value || value === '') return null;
        return value;
      }
    },
    supervisorName: { type: String }
  },
  
  // Process Timing
  timing: {
    plannedStartTime: { type: Date },
    actualStartTime: { type: Date },
    plannedEndTime: { type: Date },
    actualEndTime: { type: Date },
    plannedDuration: { type: Number, min: 0 },
    actualDuration: { type: Number, min: 0 },
    setupTime: { type: Number, default: 0, min: 0 },
    cleaningTime: { type: Number, default: 0, min: 0 },
    downtime: { type: Number, default: 0, min: 0 },
    reasonForDelay: { type: String }
  },
  
  // Quality Control
  qualityControl: {
    preProcessCheck: {
      fabricCondition: { 
        type: String, 
        enum: ['good', 'fair', 'poor']
      },
      defects: [String],
      notes: { type: String },
      checkedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        default: null,
        set: (value: any) => {
          if (!value || value === '') return null;
          return value;
        }
      },
      checkedByName: { type: String },
      checkDate: { type: Date }
    },
    inProcessCheck: {
      temperature: { type: Number },
      ph: { type: Number, min: 0, max: 14 },
      color: { type: String },
      consistency: { 
        type: String, 
        enum: ['good', 'fair', 'poor']
      },
      notes: { type: String },
      checkedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        default: null,
        set: (value: any) => {
          if (!value || value === '') return null;
          return value;
        }
      },
      checkedByName: { type: String },
      checkTime: { type: Date }
    },
    postProcessCheck: {
      whiteness: { type: Number, min: 0, max: 100 },
      absorbency: { 
        type: String, 
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      strength: { type: Number, min: 0 },
      shrinkage: { type: Number, min: 0, max: 100 },
      defects: [String],
      qualityGrade: { 
        type: String, 
        enum: ['A', 'B', 'C', 'D']
      },
      notes: { type: String },
      checkedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        default: null,
        set: (value: any) => {
          if (!value || value === '') return null;
          return value;
        }
      },
      checkedByName: { type: String },
      checkDate: { type: Date }
    }
  },
  
  // Output Material
  outputMaterial: {
    quantity: { type: Number, min: 0 },
    unit: { 
      type: String, 
      enum: ['meters', 'yards', 'pieces']
    },
    weight: { type: Number, min: 0 },
    gsm: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    color: { type: String },
    quality: { 
      type: String, 
      enum: ['A', 'B', 'C', 'D']
    },
    defects: [String],
    location: {
      warehouseId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Warehouse',
        default: null,
        set: (value: any) => {
          if (!value || value === '') return null;
          return value;
        }
      },
      warehouseName: { type: String },
      rackNumber: { type: String },
      shelfNumber: { type: String }
    }
  },
  
  // Waste Management
  wasteManagement: {
    wasteGenerated: [{
      quantity: { type: Number, required: true, min: 0 },
      unit: { 
        type: String, 
        enum: ['kg', 'liters'], 
        required: true 
      },
      type: { 
        type: String, 
        enum: ['chemical', 'fabric', 'water', 'other'], 
        required: true 
      },
      disposalMethod: { 
        type: String, 
        enum: ['recycle', 'dispose', 'reuse'], 
        required: true 
      },
      cost: { type: Number, required: true, min: 0 }
    }],
    totalWasteCost: { type: Number, default: 0, min: 0 },
    environmentalCompliance: { type: Boolean, default: true },
    complianceNotes: { type: String }
  },
  
  // Cost Tracking
  costs: {
    chemicalCost: { type: Number, default: 0, min: 0 },
    laborCost: { type: Number, default: 0, min: 0 },
    machineCost: { type: Number, default: 0, min: 0 },
    utilityCost: { type: Number, default: 0, min: 0 },
    wasteDisposalCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    costPerUnit: { type: Number, default: 0, min: 0 }
  },
  
  // Status and Progress
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'quality_hold'], 
    default: 'pending',
    index: true
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  
  // Additional Information
  notes: { type: String },
  specialInstructions: { type: String },
  images: [String],
  documents: [String],
  tags: [String],
  
  // Status Change Log
  statusChangeLog: [{
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    changedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    changedByName: { type: String, required: true },
    changedByEmail: { type: String, required: true },
    changeDate: { type: Date, required: true },
    changeReason: { type: String, required: true },
    notes: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    sessionId: { type: String }
  }],
  
  // Approval
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName: { type: String },
  approvalDate: { type: Date },
  approvalNotes: { type: String }
}, {
  timestamps: true,
  collection: 'preprocessings'
});

// Indexes
PreProcessingSchema.index({ batchNumber: 1 });
PreProcessingSchema.index({ productionOrderId: 1 });
PreProcessingSchema.index({ status: 1 });
PreProcessingSchema.index({ processType: 1 });
PreProcessingSchema.index({ createdAt: -1 });

export default mongoose.model<IPreProcessing>('PreProcessing', PreProcessingSchema);
