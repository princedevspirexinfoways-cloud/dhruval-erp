import { Schema, model } from 'mongoose';
import { IProductionOrder, IRawMaterial, IProductionStage, IWorkerAssignment, IMachineAssignment, IJobWork, IMaterialConsumption, IQualityControl, IApproval } from '@/types/models';

const BatchSchema = new Schema({
  batchNumber: { type: String },
  quantity: { type: Number, min: 0 },
  rate: { type: Number, min: 0 },
  consumedDate: { type: Date }
}, { _id: false });

const RawMaterialSchema = new Schema<IRawMaterial>({
  itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  itemCode: { type: String },
  itemName: { type: String },
  requiredQuantity: { type: Number, required: true, min: 0 },
  unit: { type: String },
  allocatedQuantity: { type: Number, default: 0, min: 0 },
  consumedQuantity: { type: Number, default: 0, min: 0 },
  wasteQuantity: { type: Number, default: 0, min: 0 },
  rate: { type: Number, min: 0 },
  totalCost: { type: Number, min: 0 },
  batches: [BatchSchema]
}, { _id: false });

const WorkerAssignmentSchema = new Schema<IWorkerAssignment>({
  workerId: { type: Schema.Types.ObjectId, ref: 'User' },
  workerName: { type: String },
  role: { type: String },
  assignedAt: { type: Date },
  hoursWorked: { type: Number, default: 0, min: 0 },
  hourlyRate: { type: Number, min: 0 },
  totalCost: { type: Number, default: 0, min: 0 }
}, { _id: false });

const MachineAssignmentSchema = new Schema<IMachineAssignment>({
  machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
  machineName: { type: String },
  assignedAt: { type: Date },
  hoursUsed: { type: Number, default: 0, min: 0 },
  hourlyRate: { type: Number, min: 0 },
  totalCost: { type: Number, default: 0, min: 0 }
}, { _id: false });

const JobWorkSchema = new Schema<IJobWork>({
  isJobWork: { type: Boolean, default: false },
  jobWorkerId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  jobWorkerName: { type: String },
  jobWorkerRate: { type: Number, min: 0 },
  expectedDelivery: { type: Date },
  actualDelivery: { type: Date },
  jobWorkCost: { type: Number, default: 0, min: 0 },
  qualityAgreement: { type: String }
}, { _id: false });

const MaterialConsumptionSchema = new Schema<IMaterialConsumption>({
  itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
  itemName: { type: String },
  consumedQuantity: { type: Number, min: 0 },
  unit: { type: String },
  wasteQuantity: { type: Number, default: 0, min: 0 },
  wastePercentage: { type: Number, default: 0, min: 0, max: 100 },
  batchNumber: { type: String },
  consumedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  consumedAt: { type: Date }
}, { _id: false });

const QualityCheckpointSchema = new Schema({
  checkpointName: { type: String },
  parameter: { type: String },
  expectedValue: { type: String },
  actualValue: { type: String },
  status: { type: String, enum: ['pass', 'fail', 'rework'] },
  checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  checkedAt: { type: Date },
  remarks: { type: String }
}, { _id: false });

const QualityControlSchema = new Schema<IQualityControl>({
  isRequired: { type: Boolean, default: true },
  checkpoints: [QualityCheckpointSchema],
  finalQuality: {
    checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    checkedAt: { type: Date },
    qualityGrade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C', 'Reject'] },
    defects: [String],
    defectPercentage: { type: Number, min: 0, max: 100 },
    approvedQuantity: { type: Number, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    reworkQuantity: { type: Number, default: 0, min: 0 },
    qualityNotes: { type: String },
    qualityImages: [String]
  }
}, { _id: false });

const ProductionStageSchema = new Schema<IProductionStage>({
  stageId: { type: Schema.Types.ObjectId, auto: true },
  processId: { type: Schema.Types.ObjectId, ref: 'Process' },
  stageNumber: { type: Number, required: true, min: 1 },
  stageName: { type: String, required: true },
  processType: { 
    type: String, 
    enum: [
      'grey_fabric_inward',     // GRN Entry
      'pre_processing',         // Desizing/Bleaching
      'dyeing',                 // Dyeing Process
      'printing',               // Printing Process
      'washing',                // Washing Process
      'fixing',                 // Color Fixing
      'finishing',              // Stenter, Coating
      'quality_control',        // Pass/Hold/Reject
      'cutting_packing',        // Labels & Cartons
      'dispatch_invoice'        // Stock Deduction
    ] 
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'on_hold', 'rejected', 'rework'],
    default: 'pending'
  },

  // Resource Assignment
  assignment: {
    workers: [WorkerAssignmentSchema],
    machines: [MachineAssignmentSchema],
    jobWork: JobWorkSchema
  },

  // Timing
  timing: {
    plannedStartTime: { type: Date },
    actualStartTime: { type: Date },
    plannedEndTime: { type: Date },
    actualEndTime: { type: Date },
    plannedDuration: { type: Number, min: 0 },
    actualDuration: { type: Number, min: 0 },
    breakTime: { type: Number, default: 0, min: 0 },
    overtimeHours: { type: Number, default: 0, min: 0 }
  },

  // Material Consumption
  materialConsumption: [MaterialConsumptionSchema],

  // Quality Control
  qualityControl: QualityControlSchema,

  // Output
  output: {
    producedQuantity: { type: Number, min: 0 },
    unit: { type: String },
    outputLocation: {
      warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
      location: { type: String }
    },
    batchNumber: { type: String },
    outputImages: [String],
    defectQuantity: { type: Number, default: 0, min: 0 }
  },

  // Cost Tracking
  costs: {
    materialCost: { type: Number, default: 0, min: 0 },
    laborCost: { type: Number, default: 0, min: 0 },
    machineCost: { type: Number, default: 0, min: 0 },
    overheadCost: { type: Number, default: 0, min: 0 },
    jobWorkCost: { type: Number, default: 0, min: 0 },
    totalStageCost: { type: Number, default: 0, min: 0 }
  },

  // Additional Information
  notes: { type: String },
  instructions: { type: String },
  images: [String],
  documents: [String],

  // Progress tracking
  progress: { type: Number, default: 0, min: 0, max: 100 },

  // Stage completion tracking
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ApprovalSchema = new Schema<IApproval>({
  level: { type: Number, default: 1 },
  approverRole: { type: String },
  approverId: { type: Schema.Types.ObjectId, ref: 'User' },
  approverName: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date },
  remarks: { type: String }
}, { _id: false });

const ProductionOrderSchema = new Schema<IProductionOrder>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Order Identification
  productionOrderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  orderDate: { 
    type: Date, 
    required: true, 
    default: Date.now, 
    index: true 
  },

  // Customer Reference
  customerOrderId: { type: Schema.Types.ObjectId, ref: 'CustomerOrder' },
  customerOrderNumber: { type: String },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },

  // Product Specifications
  product: {
    productType: {
      type: String,
      enum: ['saree', 'african', 'garment', 'digital_print', 'custom'],
      required: true
    },
    design: { type: String },
    designCode: { type: String },
    color: { type: String },
    colorCode: { type: String },
    gsm: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    length: { type: Number, min: 0 },
    pattern: { type: String },
    finish: { type: String },
    customSpecifications: { type: String }
  },

  // Quantity Management
  orderQuantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true },
  completedQuantity: { type: Number, default: 0, min: 0 },
  rejectedQuantity: { type: Number, default: 0, min: 0 },
  pendingQuantity: { type: Number, default: 0, min: 0 },

  // Raw Materials & BOM
  rawMaterials: [RawMaterialSchema],

  // Production Stages
  productionStages: [ProductionStageSchema],

  // Priority & Status
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent', 'rush'], 
    default: 'medium',
    index: true
  },
  status: { 
    type: String, 
    enum: ['draft', 'approved', 'in_progress', 'completed', 'cancelled', 'on_hold', 'partially_completed'], 
    default: 'draft',
    index: true
  },

  // Schedule Management
  schedule: {
    plannedStartDate: { type: Date },
    plannedEndDate: { type: Date },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    estimatedDuration: { type: Number, min: 0 },
    actualDuration: { type: Number, min: 0 },
    delayReason: { type: String }
  },

  // Cost Summary
  costSummary: {
    materialCost: { type: Number, default: 0, min: 0 },
    laborCost: { type: Number, default: 0, min: 0 },
    machineCost: { type: Number, default: 0, min: 0 },
    overheadCost: { type: Number, default: 0, min: 0 },
    jobWorkCost: { type: Number, default: 0, min: 0 },
    totalProductionCost: { type: Number, default: 0, min: 0 },
    costPerUnit: { type: Number, default: 0, min: 0 }
  },

  // Quality Summary
  qualitySummary: {
    totalProduced: { type: Number, default: 0, min: 0 },
    totalApproved: { type: Number, default: 0, min: 0 },
    totalRejected: { type: Number, default: 0, min: 0 },
    totalRework: { type: Number, default: 0, min: 0 },
    overallQualityGrade: { type: String },
    defectRate: { type: Number, min: 0, max: 100 },
    firstPassYield: { type: Number, min: 0, max: 100 }
  },

  // Approval Workflow
  approvals: [ApprovalSchema],

  // Instructions & Notes
  specialInstructions: { type: String },
  customerRequirements: { type: String },
  packingInstructions: { type: String },
  deliveryInstructions: { type: String },
  notes: { type: String },
  tags: [String],
  attachments: [String],

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'production_orders'
});

// Compound Indexes
ProductionOrderSchema.index({ companyId: 1, orderDate: -1 });
ProductionOrderSchema.index({ companyId: 1, status: 1, priority: 1 });
ProductionOrderSchema.index({ companyId: 1, customerOrderId: 1 });
ProductionOrderSchema.index({ companyId: 1, 'product.productType': 1 });
ProductionOrderSchema.index({ 'schedule.plannedStartDate': 1, 'schedule.plannedEndDate': 1 });
ProductionOrderSchema.index({ 'productionStages.status': 1 });

// Text search
ProductionOrderSchema.index({ 
  productionOrderNumber: 'text', 
  customerName: 'text',
  'product.design': 'text',
  'product.color': 'text'
});

// Pre-save middleware
ProductionOrderSchema.pre('save', function(next) {
  // Calculate pending quantity
  this.pendingQuantity = this.orderQuantity - this.completedQuantity - this.rejectedQuantity;
  
  // Calculate cost per unit
  if (this.completedQuantity > 0) {
    this.costSummary.costPerUnit = this.costSummary.totalProductionCost / this.completedQuantity;
  }
  
  // Update stage costs in total
  this.costSummary.materialCost = this.productionStages.reduce((sum, stage) => sum + stage.costs.materialCost, 0);
  this.costSummary.laborCost = this.productionStages.reduce((sum, stage) => sum + stage.costs.laborCost, 0);
  this.costSummary.machineCost = this.productionStages.reduce((sum, stage) => sum + stage.costs.machineCost, 0);
  this.costSummary.overheadCost = this.productionStages.reduce((sum, stage) => sum + stage.costs.overheadCost, 0);
  this.costSummary.jobWorkCost = this.productionStages.reduce((sum, stage) => sum + stage.costs.jobWorkCost, 0);
  
  this.costSummary.totalProductionCost = 
    this.costSummary.materialCost + 
    this.costSummary.laborCost + 
    this.costSummary.machineCost + 
    this.costSummary.overheadCost + 
    this.costSummary.jobWorkCost;
  
  next();
});

// Instance methods
ProductionOrderSchema.methods.isCompleted = function(): boolean {
  return this.status === 'completed';
};

ProductionOrderSchema.methods.isDelayed = function(): boolean {
  if (!this.schedule.plannedEndDate) return false;
  return new Date() > this.schedule.plannedEndDate && this.status !== 'completed';
};

ProductionOrderSchema.methods.getCompletionPercentage = function(): number {
  if (this.orderQuantity === 0) return 0;
  return (this.completedQuantity / this.orderQuantity) * 100;
};

ProductionOrderSchema.methods.getCurrentStage = function() {
  return this.productionStages.find(stage => stage.status === 'in_progress');
};

ProductionOrderSchema.methods.getNextStage = function() {
  return this.productionStages.find(stage => stage.status === 'pending');
};

// Static methods
ProductionOrderSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId }).sort({ orderDate: -1 });
};

ProductionOrderSchema.statics.findByStatus = function(companyId: string, status: string) {
  return this.find({ companyId, status }).sort({ orderDate: -1 });
};

ProductionOrderSchema.statics.findDelayed = function(companyId: string) {
  return this.find({
    companyId,
    'schedule.plannedEndDate': { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

export default model<IProductionOrder>('ProductionOrder', ProductionOrderSchema);
