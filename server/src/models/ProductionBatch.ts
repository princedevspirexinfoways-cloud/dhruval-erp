import { Schema, model, Document } from 'mongoose';
import Company from './Company';

// Enums and Types
export enum BatchStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  QUALITY_HOLD = 'quality_hold',
  REWORK = 'rework'
}

export enum StageStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  QUALITY_HOLD = 'quality_hold',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum QualityGrade {
  A_PLUS = 'A+',
  A = 'A',
  B_PLUS = 'B+',
  B = 'B',
  C = 'C',
  REJECT = 'Reject'
}

export enum StageType {
  // Grey Fabric Inward is inventory management, not a production stage
  GREY_FABRIC_INWARD = 'grey_fabric_inward', // GRN Entry
  PRE_PROCESSING = 'pre_processing',        // Desizing/Bleaching
  DYEING = 'dyeing',                       // Dyeing Process
  PRINTING = 'printing',                   // Printing Process
  WASHING = 'washing',                     // Washing Process
  FIXING = 'fixing',                       // Color Fixing
  FINISHING = 'finishing',                 // Stenter, Coating
  QUALITY_CONTROL = 'quality_control',     // Pass/Hold/Reject
  CUTTING_PACKING = 'cutting_packing'      // Labels & Cartons
}

// Sub-schemas
const ProductSpecificationsSchema = new Schema({
  productType: { type: String, required: true },
  fabricType: { type: String, required: true },
  gsm: { type: Number, min: 0 },
  width: { type: Number, min: 0 },
  length: { type: Number, min: 0 },
  color: { type: String },
  colorCode: { type: String },
  design: { type: String },
  pattern: { type: String },
  fabricComposition: { type: String },
  shrinkage: { type: Number, min: 0, max: 100 },
  colorFastness: { type: Number, min: 1, max: 5 },
  tensileStrength: { type: Number, min: 0 }
}, { _id: false });

const ProcessParametersSchema = new Schema({
  temperature: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    unit: { type: String, default: 'celsius' }
  },
  pressure: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    unit: { type: String, default: 'bar' }
  },
  ph: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 14 },
    actual: { type: Number, default: 7 }
  },
  time: {
    planned: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    unit: { type: String, default: 'minutes' }
  },
  speed: {
    planned: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    unit: { type: String, default: 'm/min' }
  }
}, { _id: false });

const MaterialInputSchema = new Schema({
  inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  itemName: { type: String, required: true },
  category: { type: String, enum: ['raw_material', 'chemical', 'dye', 'auxiliary', 'packaging', 'spare_parts', 'component', 'other'], default: 'raw_material' },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  costPerUnit: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  qualityGrade: { type: String, enum: Object.values(QualityGrade) },
  supplier: { type: String },
  consumptionRate: { type: Number, min: 0 }, // per unit of output
  wastePercentage: { type: Number, min: 0, max: 100, default: 0 },
  actualConsumption: { type: Number, min: 0 },
  wasteQuantity: { type: Number, min: 0, default: 0 },
  returnedQuantity: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['allocated', 'consumed', 'partial', 'returned', 'wasted'], default: 'allocated' },
  consumptionDate: { type: Date },
  consumedBy: { type: String },
  notes: { type: String },
  
  // GRN and Material Source Tracking
  grnId: { type: Schema.Types.ObjectId, ref: 'GreyFabricInward' },
  grnNumber: { type: String },
  materialSource: { type: String, enum: ['own_material', 'client_provided', 'job_work_material'], default: 'own_material' },
  clientId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  clientName: { type: String },
  clientOrderId: { type: Schema.Types.ObjectId, ref: 'CustomerOrder' },
  clientOrderNumber: { type: String },
  
  // Material Tracking for Client Materials
  clientMaterialTracking: {
    originalQuantity: { type: Number, min: 0 },
    consumedFromClient: { type: Number, min: 0, default: 0 },
    wasteFromClient: { type: Number, min: 0, default: 0 },
    returnableToClient: { type: Number, min: 0, default: 0 },
    keptAsStock: { type: Number, min: 0, default: 0 }
  }
}, { _id: false });

const MaterialOutputSchema = new Schema({
  itemName: { type: String, required: true },
  category: { type: String, enum: ['finished_goods', 'semi_finished', 'by_product', 'waste', 'scrap'], default: 'finished_goods' },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  qualityGrade: { type: String, enum: Object.values(QualityGrade) },
  defects: [{ type: String }],
  defectPercentage: { type: Number, min: 0, max: 100, default: 0 },
  outputDate: { type: Date, default: Date.now },
  producedBy: { type: String },
  warehouseLocation: {
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    warehouseName: { type: String },
    zone: { type: String },
    rack: { type: String },
    bin: { type: String }
  },
  costPerUnit: { type: Number, min: 0 },
  totalValue: { type: Number, min: 0 },
  status: { type: String, enum: ['produced', 'transferred', 'dispatched', 'returned'], default: 'produced' },
  nextStage: { type: String },
  notes: { type: String },
  
  // Elongation/Longation Tracking
  elongationTracking: {
    inputQuantity: { type: Number, min: 0 }, // Original input quantity
    inputUnit: { type: String },
    outputQuantity: { type: Number, min: 0 }, // Final output quantity
    outputUnit: { type: String },
    elongationPercentage: { type: Number, min: 0 }, // Calculated elongation %
    elongationQuantity: { type: Number, min: 0 }, // Actual elongation amount
    elongationReason: { type: String, enum: ['stitching', 'processing', 'finishing', 'natural_stretch', 'other'] },
    elongationNotes: { type: String },
    qualityImpact: { type: String, enum: ['positive', 'neutral', 'negative'] },
    approvedBy: { type: String },
    approvalDate: { type: Date }
  },
  
  // Client Material Output Tracking
  clientOutputTracking: {
    isClientMaterial: { type: Boolean, default: false },
    clientId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    clientName: { type: String },
    grnId: { type: Schema.Types.ObjectId, ref: 'GreyFabricInward' },
    grnNumber: { type: String },
    clientOrderId: { type: Schema.Types.ObjectId, ref: 'CustomerOrder' },
    clientOrderNumber: { type: String },
    returnToClient: { type: Boolean, default: false },
    returnQuantity: { type: Number, min: 0 },
    keepAsStock: { type: Boolean, default: false },
    stockQuantity: { type: Number, min: 0 },
    clientReturnDate: { type: Date },
    clientInstructions: { type: String }
  }
}, { _id: false });

const ResourceAllocationSchema = new Schema({
  resourceType: { type: String, enum: ['machine', 'operator', 'tool'], required: true },
  resourceId: { type: String, required: true },
  resourceName: { type: String, required: true },
  allocatedFrom: { type: Date, required: true },
  allocatedTo: { type: Date, required: true },
  actualUsageStart: { type: Date },
  actualUsageEnd: { type: Date },
  utilizationPercentage: { type: Number, min: 0, max: 100 },
  costPerHour: { type: Number, min: 0 },
  totalCost: { type: Number, min: 0 },
  notes: { type: String }
}, { _id: true });

const QualityCheckSchema = new Schema({
  checkType: { type: String, required: true },
  checkDate: { type: Date, required: true, default: Date.now },
  checkedBy: { type: String, required: true },
  checkedByName: { type: String },
  parameters: [{
    name: { type: String, required: true },
    expectedValue: { type: String },
    actualValue: { type: String, required: true },
    unit: { type: String },
    status: { type: String, enum: ['pass', 'fail', 'warning'], required: true },
    notes: { type: String }
  }],
  overallResult: { type: String, enum: ['pass', 'fail', 'conditional'], required: true },
  grade: { type: String, enum: Object.values(QualityGrade) },
  score: { type: Number, min: 0, max: 100 },
  defects: [{ type: String }],
  correctiveActions: [{ type: String }],
  notes: { type: String },
  images: [{ type: String }],
  approvedBy: { type: String },
  approvalDate: { type: Date }
}, { _id: true });

const BatchCostSchema = new Schema({
  costType: { 
    type: String, 
    enum: ['material', 'labor', 'machine', 'overhead', 'utility', 'chemical', 'dye', 'auxiliary', 'packaging', 'transport', 'quality_control', 'waste_disposal', 'maintenance', 'other'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['direct_material', 'direct_labor', 'manufacturing_overhead', 'indirect_material', 'indirect_labor', 'variable_overhead', 'fixed_overhead', 'quality_cost', 'waste_cost'], 
    required: true 
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  date: { type: Date, required: true, default: Date.now },
  stageNumber: { type: Number },
  reference: { type: String },
  approvedBy: { type: String },
  
  // Detailed cost breakdown
  unitCost: { type: Number, min: 0 },
  quantity: { type: Number, min: 0 },
  unit: { type: String },
  
  // Cost allocation
  allocatedToStage: { type: Boolean, default: true },
  allocatedToProduct: { type: Boolean, default: true },
  allocationMethod: { 
    type: String, 
    enum: ['direct', 'proportional', 'activity_based', 'standard_cost'], 
    default: 'direct' 
  },
  
  // Approval and validation
  requiresApproval: { type: Boolean, default: false },
  approvedDate: { type: Date },
  validationStatus: { 
    type: String, 
    enum: ['pending', 'validated', 'disputed', 'corrected'], 
    default: 'pending' 
  },
  disputedBy: { type: String },
  disputeReason: { type: String },
  
  // Cost center and account
  costCenter: { type: String },
  accountCode: { type: String },
  
  // Additional metadata
  supplier: { type: String },
  invoiceNumber: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'overdue', 'disputed'], 
    default: 'pending' 
  },
  paymentDate: { type: Date },
  
  notes: { type: String }
}, { _id: true });

const StageIssueSchema = new Schema({
  issueType: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  description: { type: String, required: true },
  reportedBy: { type: String, required: true },
  reportedDate: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: String },
  resolution: { type: String },
  resolvedBy: { type: String },
  resolvedDate: { type: Date },
  estimatedCost: { type: Number, min: 0 },
  actualCost: { type: Number, min: 0 }
}, { _id: true });

const StatusChangeLogSchema = new Schema({
  changeType: { 
    type: String, 
    enum: ['batch_status', 'stage_status', 'stage_transition', 'quality_approval', 'material_consumption', 'resource_allocation', 'cost_update'], 
    required: true 
  },
  entityType: { 
    type: String, 
    enum: ['batch', 'stage', 'material', 'resource', 'cost'], 
    required: true 
  },
  entityId: { type: String },
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  changeReason: { type: String, required: true },
  changedBy: { type: String, required: true },
  changedByName: { type: String },
  changedDate: { type: Date, required: true, default: Date.now },
  stageNumber: { type: Number },
  previousValues: { type: Schema.Types.Mixed },
  newValues: { type: Schema.Types.Mixed },
  notes: { type: String },
  requiresApproval: { type: Boolean, default: false },
  approvedBy: { type: String },
  approvalDate: { type: Date },
  systemGenerated: { type: Boolean, default: false }
}, { _id: true });

const MaterialConsumptionLogSchema = new Schema({
  materialId: { type: String, required: true },
  materialName: { type: String, required: true },
  stageNumber: { type: Number, required: true },
  stageName: { type: String, required: true },
  allocatedQuantity: { type: Number, required: true, min: 0 },
  consumedQuantity: { type: Number, required: true, min: 0 },
  wasteQuantity: { type: Number, min: 0, default: 0 },
  returnedQuantity: { type: Number, min: 0, default: 0 },
  consumptionDate: { type: Date, required: true, default: Date.now },
  consumedBy: { type: String, required: true },
  consumedByName: { type: String },
  costPerUnit: { type: Number, min: 0 },
  totalCost: { type: Number, min: 0 },
  notes: { type: String },
  qualityGrade: { type: String, enum: Object.values(QualityGrade) }
}, { _id: true });

const BatchStageSchema = new Schema({
  stageNumber: { type: Number, required: true, min: 1, max: 20 },
  stageName: { type: String, required: true },
  stageType: { type: String, enum: Object.values(StageType), required: true },
  
  // Status and Progress
  status: { type: String, enum: Object.values(StageStatus), default: StageStatus.NOT_STARTED },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  
  // Timeline
  plannedStartTime: { type: Date },
  actualStartTime: { type: Date },
  plannedEndTime: { type: Date },
  actualEndTime: { type: Date },
  plannedDuration: { type: Number, min: 0 }, // in minutes
  actualDuration: { type: Number, min: 0 }, // in minutes
  
  // Resources
  resourceAllocations: [ResourceAllocationSchema],
  
  // Materials
  inputMaterials: [MaterialInputSchema],
  outputMaterials: [MaterialOutputSchema],
  
  // Process Parameters
  processParameters: ProcessParametersSchema,
  
  // Quality
  qualityChecks: [QualityCheckSchema],
  qualityGate: {
    required: { type: Boolean, default: true },
    passed: { type: Boolean, default: false },
    passedBy: { type: String },
    passedDate: { type: Date },
    notes: { type: String },
    mandatoryChecks: [{ 
      checkName: { type: String, required: true },
      required: { type: Boolean, default: true },
      completed: { type: Boolean, default: false },
      completedBy: { type: String },
      completedDate: { type: Date },
      result: { type: String, enum: ['pass', 'fail', 'conditional'] },
      notes: { type: String }
    }],
    approvalRequired: { type: Boolean, default: false },
    approvedBy: { type: String },
    approvalDate: { type: Date },
    rejectionReason: { type: String },
    retestRequired: { type: Boolean, default: false }
  },
  
  // Costs
  stageCosts: [BatchCostSchema],
  totalStageCost: { type: Number, min: 0, default: 0 },
  
  // Issues and Notes
  issues: [StageIssueSchema],
  notes: [{ 
    note: { type: String, required: true },
    addedBy: { type: String, required: true },
    addedDate: { type: Date, default: Date.now }
  }],
  
  // Audit
  startedBy: { type: String },
  completedBy: { type: String },
  lastModifiedBy: { type: String },
  lastModifiedDate: { type: Date, default: Date.now }
}, { _id: true });

const InventoryTransactionSchema = new Schema({
  transactionType: { type: String, enum: ['consumption', 'production', 'waste', 'return'], required: true },
  inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  costPerUnit: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  stageNumber: { type: Number },
  transactionDate: { type: Date, required: true, default: Date.now },
  reference: { type: String },
  notes: { type: String }
}, { _id: true });

// Material Input Interface
export interface IMaterialInput {
  inventoryItemId: Schema.Types.ObjectId;
  itemName: string;
  category: 'raw_material' | 'chemical' | 'dye' | 'auxiliary' | 'packaging' | 'spare_parts' | 'component' | 'other';
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  batchNumber?: string;
  expiryDate?: Date;
  qualityGrade?: QualityGrade;
  supplier?: string;
  consumptionRate?: number;
  wastePercentage: number;
  actualConsumption?: number;
  wasteQuantity: number;
  returnedQuantity: number;
  status: 'allocated' | 'consumed' | 'partial' | 'returned' | 'wasted';
  consumptionDate?: Date;
  consumedBy?: string;
  notes?: string;
}

// Material Output Interface
export interface IMaterialOutput {
  itemName: string;
  category: 'finished_goods' | 'semi_finished' | 'by_product' | 'waste' | 'scrap';
  quantity: number;
  unit: string;
  qualityGrade?: QualityGrade;
  defects?: string[];
  notes?: string;
  productionDate?: Date;
  producedBy?: string;
  productionInfo?: {
    batchId?: string;
    batchNumber?: string;
    stageNumber?: number;
    producedBy?: string;
    productionDate?: Date;
  };
}

// Main Batch Interface
export interface IProductionBatch extends Document {
  _id: string;
  companyId: Schema.Types.ObjectId;
  batchNumber: string;
  productionOrderId?: string;
  customerOrderId?: string;
  
  // Basic Information
  productSpecifications: typeof ProductSpecificationsSchema;
  plannedQuantity: number;
  actualQuantity?: number;
  unit: string;
  
  // Status and Progress
  status: BatchStatus;
  currentStage: number;
  progress: number;
  priority: Priority;
  
  // Stages
  stages: typeof BatchStageSchema[];
  
  // Quality
  qualityGrade?: QualityGrade;
  qualityScore?: number;
  qualityIssues: string[];
  
  // Resources
  resourceAllocations: typeof ResourceAllocationSchema[];
  
  // Materials
  inputMaterials: IMaterialInput[];
  outputMaterials: IMaterialOutput[];
  
  // Costs
  costs: typeof BatchCostSchema[];
  totalCost?: number;
  costPerUnit?: number;
  
  // Timeline
  plannedStartDate: Date;
  actualStartDate?: Date;
  plannedEndDate: Date;
  actualEndDate?: Date;
  totalPlannedDuration: number; // in minutes
  totalActualDuration?: number; // in minutes
  
  // Integration
  inventoryTransactions: typeof InventoryTransactionSchema[];
  productionFlowId?: string;
  
  // Status Change Tracking
  statusChangeLogs: typeof StatusChangeLogSchema[];
  materialConsumptionLogs: typeof MaterialConsumptionLogSchema[];
  
  // Audit
  createdBy: Schema.Types.ObjectId;
  lastModifiedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  moveToNextStage(): void;
  canMoveToNextStage(): boolean;
  calculateEfficiency(): number | null;
  logStatusChange(
    changeType: string,
    entityType: string,
    newStatus: string,
    changeReason: string,
    changedBy: string,
    changedByName: string,
    options?: {
      entityId?: string;
      previousStatus?: string;
      stageNumber?: number;
      previousValues?: any;
      newValues?: any;
      notes?: string;
      requiresApproval?: boolean;
      systemGenerated?: boolean;
    }
  ): Promise<this>;
  logMaterialConsumption(
    materialId: string,
    materialName: string,
    stageNumber: number,
    stageName: string,
    allocatedQuantity: number,
    consumedQuantity: number,
    consumedBy: string,
    consumedByName: string,
    options?: {
      wasteQuantity?: number;
      returnedQuantity?: number;
      costPerUnit?: number;
      totalCost?: number;
      notes?: string;
      qualityGrade?: string;
    }
  ): Promise<this>;
  updateStageStatus(
    stageNumber: number,
    newStatus: string,
    changedBy: string,
    changedByName: string,
    reason: string,
    notes?: string
  ): Promise<this>;
  consumeMaterial(
    stageNumber: number,
    materialId: string,
    consumedQuantity: number,
    consumedBy: string,
    consumedByName: string,
    options?: {
      wasteQuantity?: number;
      returnedQuantity?: number;
      notes?: string;
      qualityGrade?: string;
    }
  ): Promise<this>;
  addMaterialOutput(
    stageNumber: number,
    outputData: {
      itemName: string;
      category: string;
      quantity: number;
      unit: string;
      qualityGrade?: string;
      defects?: string[];
      producedBy: string;
      warehouseLocation?: any;
      costPerUnit?: number;
      notes?: string;
    }
  ): Promise<this>;
  getStatusHistory(): any[];
  getMaterialConsumptionSummary(): any;
  validateStageTransition(fromStage: number, toStage: number): { valid: boolean; reason?: string };
  addQualityCheck(
    stageNumber: number,
    checkData: {
      checkType: string;
      checkedBy: string;
      checkedByName: string;
      parameters: Array<{
        name: string;
        expectedValue?: string;
        actualValue: string;
        unit?: string;
        status: 'pass' | 'fail' | 'warning';
        notes?: string;
      }>;
      overallResult: 'pass' | 'fail' | 'conditional';
      grade?: string;
      score?: number;
      defects?: string[];
      correctiveActions?: string[];
      notes?: string;
      images?: string[];
    }
  ): Promise<this>;
  passQualityGate(
    stageNumber: number,
    passedBy: string,
    passedByName: string,
    notes?: string
  ): Promise<this>;
  failQualityGate(
    stageNumber: number,
    rejectedBy: string,
    rejectedByName: string,
    rejectionReason: string,
    retestRequired?: boolean
  ): Promise<this>;
  addCost(
    costData: {
      costType: string;
      category: string;
      description: string;
      amount: number;
      stageNumber?: number;
      unitCost?: number;
      quantity?: number;
      unit?: string;
      supplier?: string;
      invoiceNumber?: string;
      costCenter?: string;
      accountCode?: string;
      notes?: string;
    },
    addedBy: string,
    addedByName: string
  ): Promise<this>;
  getCostSummary(): any;
  getProductionMetrics(): any;
  
  // Elongation calculation methods
  calculateElongation(inputQuantity: number, outputQuantity: number, inputUnit: string, outputUnit: string): {
    elongationPercentage: number;
    elongationQuantity: number;
  };
  
  addElongationTracking(outputIndex: number, elongationData: {
    inputQuantity: number;
    inputUnit: string;
    outputQuantity: number;
    outputUnit: string;
    elongationReason: string;
    elongationNotes?: string;
    qualityImpact: string;
    approvedBy: string;
  }): Promise<any>;
  
  // Client material tracking methods
  trackClientMaterialConsumption(materialIndex: number, consumedQuantity: number, wasteQuantity: number): Promise<any>;
  
  updateClientMaterialOutput(outputIndex: number, clientOutputData: {
    returnToClient: boolean;
    returnQuantity?: number;
    keepAsStock: boolean;
    stockQuantity?: number;
    clientInstructions?: string;
  }): Promise<any>;
  
  getClientMaterialSummary(): any;
  
  // GRN mapping methods
  mapMaterialToGRN(materialIndex: number, grnId: string, grnNumber: string, materialSource: string, clientInfo?: any): Promise<any>;
  
  getGRNMappedMaterials(): any[];
}

// Main Batch Schema
const ProductionBatchSchema = new Schema<IProductionBatch>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },
  batchNumber: { 
    type: String, 
    required: false, 
    trim: true
  },
  productionOrderId: { 
    type: String, 
    trim: true,
    index: true
  },
  customerOrderId: { 
    type: String, 
    trim: true,
    index: true
  },
  
  // Basic Information
  productSpecifications: { 
    type: ProductSpecificationsSchema, 
    required: true 
  },
  plannedQuantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  actualQuantity: { 
    type: Number, 
    min: 0 
  },
  unit: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  // Status and Progress
  status: { 
    type: String, 
    enum: Object.values(BatchStatus), 
    default: BatchStatus.PENDING
  },
  currentStage: { 
    type: Number, 
    min: 1, 
    max: 6, 
    default: 1
  },
  progress: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  priority: { 
    type: String, 
    enum: Object.values(Priority), 
    default: Priority.MEDIUM
  },
  
  // Stages
  stages: [BatchStageSchema],
  
  // Quality
  qualityGrade: { 
    type: String, 
    enum: Object.values(QualityGrade),
    index: true
  },
  qualityScore: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  qualityIssues: [{ type: String }],
  
  // Resources
  resourceAllocations: [ResourceAllocationSchema],
  
  // Materials
  inputMaterials: [MaterialInputSchema],
  outputMaterials: [MaterialOutputSchema],
  
  // Costs
  costs: [BatchCostSchema],
  totalCost: { 
    type: Number, 
    min: 0 
  },
  costPerUnit: { 
    type: Number, 
    min: 0 
  },
  
  // Timeline
  plannedStartDate: { 
    type: Date, 
    required: true,
    index: true
  },
  actualStartDate: { 
    type: Date,
    index: true
  },
  plannedEndDate: { 
    type: Date, 
    required: true,
    index: true
  },
  actualEndDate: { 
    type: Date,
    index: true
  },
  totalPlannedDuration: { 
    type: Number, 
    min: 0, 
    required: true 
  },
  totalActualDuration: { 
    type: Number, 
    min: 0 
  },
  
  // Integration
  inventoryTransactions: [InventoryTransactionSchema],
  productionFlowId: { 
    type: String, 
    trim: true 
  },
  
  // Status Change Tracking
  statusChangeLogs: [StatusChangeLogSchema],
  materialConsumptionLogs: [MaterialConsumptionLogSchema],
  
  // Audit
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lastModifiedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true,
  collection: 'production_batches'
});

// Indexes for performance
ProductionBatchSchema.index({ companyId: 1, batchNumber: 1 }, { unique: true });
ProductionBatchSchema.index({ companyId: 1, status: 1 });
ProductionBatchSchema.index({ companyId: 1, currentStage: 1 });
ProductionBatchSchema.index({ companyId: 1, priority: 1 });
ProductionBatchSchema.index({ companyId: 1, productionOrderId: 1 });
ProductionBatchSchema.index({ companyId: 1, customerOrderId: 1 });
ProductionBatchSchema.index({ companyId: 1, 'productSpecifications.productType': 1 });
ProductionBatchSchema.index({ companyId: 1, plannedStartDate: 1 });
ProductionBatchSchema.index({ companyId: 1, plannedEndDate: 1 });
ProductionBatchSchema.index({ companyId: 1, qualityGrade: 1 });

// Pre-save middleware to generate batch number
ProductionBatchSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.batchNumber) {
      console.log('ProductionBatch: Generating batch number for company:', this.companyId);
      
      // Try to get company info
      let companyCode = 'COMP';
      try {
        const company = await Company.findById(this.companyId);
        companyCode = (company as any)?.companyCode || 'COMP';
        console.log('ProductionBatch: Company code found:', companyCode);
      } catch (companyError) {
        console.log('ProductionBatch: Error fetching company, using default code:', companyError);
      }
      
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // Find the last batch number for this company and month
      const lastBatch = await this.model('ProductionBatch')
        .findOne({ 
          companyId: this.companyId,
          batchNumber: new RegExp(`^${companyCode}-${year}${month}-`)
        })
        .sort({ batchNumber: -1 });
      
      let sequence = 1;
      if (lastBatch) {
        const lastSequence = parseInt((lastBatch as any).batchNumber.split('-').pop() || '0');
        sequence = lastSequence + 1;
      }
      
      this.batchNumber = `${companyCode}-${year}${month}-${sequence.toString().padStart(4, '0')}`;
      console.log('ProductionBatch: Generated batch number:', this.batchNumber);
    }
  } catch (error) {
    console.error('ProductionBatch: Error in pre-save middleware:', error);
    // Don't fail the save, just use a default batch number
    if (this.isNew && !this.batchNumber) {
      this.batchNumber = `BATCH-${Date.now()}`;
    }
  }
  
  next();
  
  // Initialize production stages (Grey Fabric Inward is inventory management, not production stage)
  if (this.isNew && this.stages.length === 0) {
    (this as any).stages = [
      {
        stageNumber: 1,
        stageName: 'Pre-Processing (Desizing/Bleaching)',
        stageType: StageType.PRE_PROCESSING,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      },
      {
        stageNumber: 2,
        stageName: 'Dyeing Process',
        stageType: StageType.DYEING,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      },
      {
        stageNumber: 3,
        stageName: 'Printing Process',
        stageType: StageType.PRINTING,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      },
      {
        stageNumber: 4,
        stageName: 'Washing Process',
        stageType: StageType.WASHING,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      },
      {
        stageNumber: 5,
        stageName: 'Color Fixing',
        stageType: StageType.FIXING,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      },
      {
        stageNumber: 6,
        stageName: 'Finishing (Stenter, Coating)',
        stageType: StageType.FINISHING,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      },
      {
        stageNumber: 7,
        stageName: 'Quality Control (Pass/Hold/Reject)',
        stageType: StageType.QUALITY_CONTROL,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      },
      {
        stageNumber: 8,
        stageName: 'Cutting & Packing (Labels & Cartons)',
        stageType: StageType.CUTTING_PACKING,
        status: StageStatus.NOT_STARTED,
        progress: 0,
        resourceAllocations: [],
        inputMaterials: [],
        outputMaterials: [],
        processParameters: {},
        qualityChecks: [],
        qualityGate: { required: true, passed: false },
        stageCosts: [],
        totalStageCost: 0,
        issues: [],
        notes: []
      }
    ];
  }
  
  next();
});

// Pre-save middleware to calculate totals
ProductionBatchSchema.pre('save', function(next) {
  // Calculate total cost
  this.totalCost = this.costs.reduce((total, cost) => total + (cost as any).amount, 0);
  
  // Calculate cost per unit
  if (this.actualQuantity && this.actualQuantity > 0) {
    this.costPerUnit = this.totalCost / this.actualQuantity;
  } else if (this.plannedQuantity && this.plannedQuantity > 0) {
    this.costPerUnit = this.totalCost / this.plannedQuantity;
  }
  
  // Calculate overall progress based on stage progress
  if (this.stages.length > 0) {
    const totalProgress = this.stages.reduce((sum, stage) => sum + (stage as any).progress, 0);
    this.progress = Math.round(totalProgress / this.stages.length);
  }
  
  // Update current stage based on stage statuses
  const inProgressStage = this.stages.find(stage => (stage as any).status === StageStatus.IN_PROGRESS);
  if (inProgressStage) {
    this.currentStage = (inProgressStage as any).stageNumber;
  } else {
    const lastCompletedStage = this.stages
      .filter(stage => (stage as any).status === StageStatus.COMPLETED)
      .sort((a, b) => (b as any).stageNumber - (a as any).stageNumber)[0];
    
    if (lastCompletedStage) {
      this.currentStage = Math.min((lastCompletedStage as any).stageNumber + 1, 6);
    }
  }
  
  // Update batch status based on stage statuses
  const allCompleted = this.stages.every(stage => (stage as any).status === StageStatus.COMPLETED);
  const anyInProgress = this.stages.some(stage => (stage as any).status === StageStatus.IN_PROGRESS);
  const anyOnHold = this.stages.some(stage => (stage as any).status === StageStatus.ON_HOLD);
  const anyQualityHold = this.stages.some(stage => (stage as any).status === StageStatus.QUALITY_HOLD);
  
  if (allCompleted) {
    this.status = BatchStatus.COMPLETED;
    this.actualEndDate = new Date();
  } else if (anyQualityHold) {
    this.status = BatchStatus.QUALITY_HOLD;
  } else if (anyOnHold) {
    this.status = BatchStatus.ON_HOLD;
  } else if (anyInProgress) {
    this.status = BatchStatus.IN_PROGRESS;
    if (!this.actualStartDate) {
      this.actualStartDate = new Date();
    }
  }
  
  next();
});

// Instance methods
ProductionBatchSchema.methods.moveToNextStage = function() {
  if (this.currentStage < 8) { // Updated to 8 stages
    const currentStageObj = this.stages.find((s: any) => s.stageNumber === this.currentStage);
    if (currentStageObj && currentStageObj.status === StageStatus.COMPLETED) {
      this.currentStage += 1;
      const nextStageObj = this.stages.find((s: any) => s.stageNumber === this.currentStage);
      if (nextStageObj) {
        nextStageObj.status = StageStatus.NOT_STARTED;
      }
    }
  }
};

ProductionBatchSchema.methods.canMoveToNextStage = function() {
  const currentStageObj = this.stages.find(s => (s as any).stageNumber === this.currentStage);
  return currentStageObj && 
         (currentStageObj as any).status === StageStatus.COMPLETED && 
         (currentStageObj as any).qualityGate.passed && 
         this.currentStage < 6;
};

ProductionBatchSchema.methods.calculateEfficiency = function() {
  if (!this.actualStartDate || !this.actualEndDate) {
    return null;
  }
  
  const plannedDuration = this.totalPlannedDuration;
  const actualDuration = (this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 60);
  
  return plannedDuration > 0 ? (plannedDuration / actualDuration) * 100 : 0;
};

ProductionBatchSchema.methods.logStatusChange = function(
  changeType: string,
  entityType: string,
  newStatus: string,
  changeReason: string,
  changedBy: string,
  changedByName: string,
  options: {
    entityId?: string;
    previousStatus?: string;
    stageNumber?: number;
    previousValues?: any;
    newValues?: any;
    notes?: string;
    requiresApproval?: boolean;
    systemGenerated?: boolean;
  } = {}
) {
  const logEntry = {
    changeType,
    entityType,
    entityId: options.entityId || '',
    previousStatus: options.previousStatus || '',
    newStatus,
    changeReason,
    changedBy,
    changedByName,
    changedDate: new Date(),
    stageNumber: options.stageNumber,
    previousValues: options.previousValues,
    newValues: options.newValues,
    notes: options.notes || '',
    requiresApproval: options.requiresApproval || false,
    systemGenerated: options.systemGenerated || false
  };
  
  this.statusChangeLogs.push(logEntry);
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.logMaterialConsumption = function(
  materialId: string,
  materialName: string,
  stageNumber: number,
  stageName: string,
  allocatedQuantity: number,
  consumedQuantity: number,
  consumedBy: string,
  consumedByName: string,
  options: {
    wasteQuantity?: number;
    returnedQuantity?: number;
    costPerUnit?: number;
    totalCost?: number;
    notes?: string;
    qualityGrade?: string;
  } = {}
) {
  const consumptionLog = {
    materialId,
    materialName,
    stageNumber,
    stageName,
    allocatedQuantity,
    consumedQuantity,
    wasteQuantity: options.wasteQuantity || 0,
    returnedQuantity: options.returnedQuantity || 0,
    consumptionDate: new Date(),
    consumedBy,
    consumedByName,
    costPerUnit: options.costPerUnit || 0,
    totalCost: options.totalCost || 0,
    notes: options.notes || '',
    qualityGrade: options.qualityGrade
  };
  
  this.materialConsumptionLogs.push(consumptionLog);
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.updateStageStatus = function(
  stageNumber: number,
  newStatus: string,
  changedBy: string,
  changedByName: string,
  reason: string,
  notes?: string
) {
  const stage = this.stages.find(s => (s as any).stageNumber === stageNumber);
  if (!stage) {
    throw new Error(`Stage ${stageNumber} not found`);
  }
  
  const previousStatus = (stage as any).status;
  (stage as any).status = newStatus;
  (stage as any).lastModifiedBy = changedBy;
  (stage as any).lastModifiedDate = new Date();
  
  // Log the status change
  this.logStatusChange(
    'stage_status',
    'stage',
    newStatus,
    reason,
    changedBy,
    changedByName,
    {
      entityId: (stage as any)._id?.toString(),
      previousStatus,
      stageNumber,
      notes
    }
  );
  
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.consumeMaterial = function(
  stageNumber: number,
  materialId: string,
  consumedQuantity: number,
  consumedBy: string,
  consumedByName: string,
  options: {
    wasteQuantity?: number;
    returnedQuantity?: number;
    notes?: string;
    qualityGrade?: string;
  } = {}
) {
  const stage = this.stages.find(s => (s as any).stageNumber === stageNumber);
  if (!stage) {
    throw new Error(`Stage ${stageNumber} not found`);
  }
  
  const material = (stage as any).inputMaterials.find((m: any) => m.inventoryItemId.toString() === materialId);
  if (!material) {
    throw new Error(`Material ${materialId} not found in stage ${stageNumber}`);
  }
  
  if (material.actualConsumption + consumedQuantity > material.quantity) {
    throw new Error(`Insufficient material quantity. Available: ${material.quantity - material.actualConsumption}, Requested: ${consumedQuantity}`);
  }
  
  // Update material consumption
  material.actualConsumption = (material.actualConsumption || 0) + consumedQuantity;
  material.wasteQuantity = (material.wasteQuantity || 0) + (options.wasteQuantity || 0);
  material.returnedQuantity = (material.returnedQuantity || 0) + (options.returnedQuantity || 0);
  material.consumptionDate = new Date();
  material.consumedBy = consumedBy;
  material.status = material.actualConsumption >= material.quantity ? 'consumed' : 'partial';
  
  // Calculate costs
  const totalCost = consumedQuantity * material.costPerUnit;
  
  // Log material consumption
  this.logMaterialConsumption(
    materialId,
    material.itemName,
    stageNumber,
    (stage as any).stageName,
    material.quantity,
    consumedQuantity,
    consumedBy,
    consumedByName,
    {
      wasteQuantity: options.wasteQuantity,
      returnedQuantity: options.returnedQuantity,
      costPerUnit: material.costPerUnit,
      totalCost,
      notes: options.notes,
      qualityGrade: options.qualityGrade
    }
  );
  
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.addMaterialOutput = function(
  stageNumber: number,
  outputData: {
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    qualityGrade?: string;
    defects?: string[];
    producedBy: string;
    warehouseLocation?: any;
    costPerUnit?: number;
    notes?: string;
  }
) {
  const stage = this.stages.find(s => (s as any).stageNumber === stageNumber);
  if (!stage) {
    throw new Error(`Stage ${stageNumber} not found`);
  }
  
  const output = {
    ...outputData,
    outputDate: new Date(),
    totalValue: (outputData.costPerUnit || 0) * outputData.quantity,
    status: 'produced'
  };
  
  (stage as any).outputMaterials.push(output);
  
  // Log the output
  this.logStatusChange(
    'material_consumption',
    'material',
    'produced',
    `Material output added to stage ${stageNumber}`,
    outputData.producedBy,
    outputData.producedBy,
    {
      stageNumber,
      newValues: output,
      notes: outputData.notes
    }
  );
  
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.getStatusHistory = function() {
  return this.statusChangeLogs.sort((a: any, b: any) => b.changedDate.getTime() - a.changedDate.getTime());
};

ProductionBatchSchema.methods.getMaterialConsumptionSummary = function() {
  const summary: any = {};
  
  this.materialConsumptionLogs.forEach((log: any) => {
    if (!summary[log.materialId]) {
      summary[log.materialId] = {
        materialName: log.materialName,
        totalAllocated: 0,
        totalConsumed: 0,
        totalWaste: 0,
        totalReturned: 0,
        totalCost: 0,
        stages: []
      };
    }
    
    summary[log.materialId].totalAllocated += log.allocatedQuantity;
    summary[log.materialId].totalConsumed += log.consumedQuantity;
    summary[log.materialId].totalWaste += log.wasteQuantity;
    summary[log.materialId].totalReturned += log.returnedQuantity;
    summary[log.materialId].totalCost += log.totalCost;
    summary[log.materialId].stages.push({
      stageNumber: log.stageNumber,
      stageName: log.stageName,
      consumedQuantity: log.consumedQuantity,
      consumptionDate: log.consumptionDate
    });
  });
  
  return summary;
};

ProductionBatchSchema.methods.validateStageTransition = function(fromStage: number, toStage: number) {
  // Check if stages are sequential
  if (toStage !== fromStage + 1) {
    return { valid: false, reason: 'Stages must be sequential' };
  }
  
  const fromStageObj = this.stages.find(s => (s as any).stageNumber === fromStage);
  const toStageObj = this.stages.find(s => (s as any).stageNumber === toStage);
  
  if (!fromStageObj || !toStageObj) {
    return { valid: false, reason: 'Stage not found' };
  }
  
  // Check if from stage is completed
  if ((fromStageObj as any).status !== StageStatus.COMPLETED) {
    return { valid: false, reason: 'Previous stage must be completed' };
  }
  
  // Check quality gate
  if ((fromStageObj as any).qualityGate.required && !(fromStageObj as any).qualityGate.passed) {
    return { valid: false, reason: 'Quality gate must be passed' };
  }
  
  // Check if all required materials are consumed
  const hasUnconsumedMaterials = (fromStageObj as any).inputMaterials.some((m: any) => 
    m.status === 'allocated' || m.status === 'partial'
  );
  
  if (hasUnconsumedMaterials) {
    return { valid: false, reason: 'All materials must be consumed or returned' };
  }
  
  return { valid: true };
};

ProductionBatchSchema.methods.addQualityCheck = function(
  stageNumber: number,
  checkData: {
    checkType: string;
    checkedBy: string;
    checkedByName: string;
    parameters: Array<{
      name: string;
      expectedValue?: string;
      actualValue: string;
      unit?: string;
      status: 'pass' | 'fail' | 'warning';
      notes?: string;
    }>;
    overallResult: 'pass' | 'fail' | 'conditional';
    grade?: string;
    score?: number;
    defects?: string[];
    correctiveActions?: string[];
    notes?: string;
    images?: string[];
  }
) {
  const stage = this.stages.find(s => (s as any).stageNumber === stageNumber);
  if (!stage) {
    throw new Error(`Stage ${stageNumber} not found`);
  }
  
  const qualityCheck = {
    ...checkData,
    checkDate: new Date()
  };
  
  (stage as any).qualityChecks.push(qualityCheck);
  
  // Log the quality check
  this.logStatusChange(
    'quality_approval',
    'stage',
    checkData.overallResult,
    `Quality check performed on stage ${stageNumber}`,
    checkData.checkedBy,
    checkData.checkedByName,
    {
      stageNumber,
      newValues: qualityCheck,
      notes: checkData.notes
    }
  );
  
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.passQualityGate = function(
  stageNumber: number,
  passedBy: string,
  passedByName: string,
  notes?: string
) {
  const stage = this.stages.find(s => (s as any).stageNumber === stageNumber);
  if (!stage) {
    throw new Error(`Stage ${stageNumber} not found`);
  }
  
  (stage as any).qualityGate.passed = true;
  (stage as any).qualityGate.passedBy = passedBy;
  (stage as any).qualityGate.passedDate = new Date();
  (stage as any).qualityGate.notes = notes || '';
  
  // Log the quality gate approval
  this.logStatusChange(
    'quality_approval',
    'stage',
    'passed',
    `Quality gate passed for stage ${stageNumber}`,
    passedBy,
    passedByName,
    {
      stageNumber,
      notes
    }
  );
  
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.failQualityGate = function(
  stageNumber: number,
  rejectedBy: string,
  rejectedByName: string,
  rejectionReason: string,
  retestRequired: boolean = true
) {
  const stage = this.stages.find(s => (s as any).stageNumber === stageNumber);
  if (!stage) {
    throw new Error(`Stage ${stageNumber} not found`);
  }
  
  (stage as any).qualityGate.passed = false;
  (stage as any).qualityGate.rejectionReason = rejectionReason;
  (stage as any).qualityGate.retestRequired = retestRequired;
  (stage as any).qualityGate.approvedBy = rejectedBy;
  (stage as any).qualityGate.approvalDate = new Date();
  
  // Set stage status to quality hold
  (stage as any).status = StageStatus.QUALITY_HOLD;
  
  // Log the quality gate rejection
  this.logStatusChange(
    'quality_approval',
    'stage',
    'rejected',
    `Quality gate failed for stage ${stageNumber}`,
    rejectedBy,
    rejectedByName,
    {
      stageNumber,
      notes: rejectionReason,
      newValues: { rejectionReason, retestRequired }
    }
  );
  
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.addCost = function(
  costData: {
    costType: string;
    category: string;
    description: string;
    amount: number;
    stageNumber?: number;
    unitCost?: number;
    quantity?: number;
    unit?: string;
    supplier?: string;
    invoiceNumber?: string;
    costCenter?: string;
    accountCode?: string;
    notes?: string;
  },
  addedBy: string,
  addedByName: string
) {
  const cost = {
    ...costData,
    date: new Date(),
    approvedBy: addedBy,
    currency: 'INR',
    allocatedToStage: true,
    allocatedToProduct: true,
    allocationMethod: 'direct',
    requiresApproval: false,
    validationStatus: 'pending',
    paymentStatus: 'pending'
  };
  
  this.costs.push(cost);
  
  // Log the cost addition
  this.logStatusChange(
    'cost_update',
    'cost',
    'added',
    `Cost added: ${costData.description}`,
    addedBy,
    addedByName,
    {
      stageNumber: costData.stageNumber,
      newValues: cost,
      notes: costData.notes
    }
  );
  
  // Don't save here - let the controller handle it to avoid parallel save errors
  return this;
};

ProductionBatchSchema.methods.getCostSummary = function() {
  const summary: any = {
    totalCost: 0,
    byCategory: {},
    byStage: {},
    byCostType: {},
    costBreakdown: {
      directMaterial: 0,
      directLabor: 0,
      manufacturingOverhead: 0,
      qualityCost: 0,
      wasteCost: 0
    }
  };
  
  this.costs.forEach((cost: any) => {
    summary.totalCost += cost.amount;
    
    // By category
    if (!summary.byCategory[cost.category]) {
      summary.byCategory[cost.category] = 0;
    }
    summary.byCategory[cost.category] += cost.amount;
    
    // By stage
    if (cost.stageNumber) {
      if (!summary.byStage[cost.stageNumber]) {
        summary.byStage[cost.stageNumber] = 0;
      }
      summary.byStage[cost.stageNumber] += cost.amount;
    }
    
    // By cost type
    if (!summary.byCostType[cost.costType]) {
      summary.byCostType[cost.costType] = 0;
    }
    summary.byCostType[cost.costType] += cost.amount;
    
    // Cost breakdown
    switch (cost.category) {
      case 'direct_material':
        summary.costBreakdown.directMaterial += cost.amount;
        break;
      case 'direct_labor':
        summary.costBreakdown.directLabor += cost.amount;
        break;
      case 'manufacturing_overhead':
      case 'variable_overhead':
      case 'fixed_overhead':
        summary.costBreakdown.manufacturingOverhead += cost.amount;
        break;
      case 'quality_cost':
        summary.costBreakdown.qualityCost += cost.amount;
        break;
      case 'waste_cost':
        summary.costBreakdown.wasteCost += cost.amount;
        break;
    }
  });
  
  return summary;
};

ProductionBatchSchema.methods.getProductionMetrics = function() {
  const metrics: any = {
    efficiency: this.calculateEfficiency(),
    materialUtilization: 0,
    qualityYield: 0,
    costPerUnit: this.costPerUnit || 0,
    wastePercentage: 0,
    stageMetrics: {}
  };
  
  // Calculate material utilization
  let totalMaterialAllocated = 0;
  let totalMaterialConsumed = 0;
  let totalWaste = 0;
  
  this.materialConsumptionLogs.forEach((log: any) => {
    totalMaterialAllocated += log.allocatedQuantity;
    totalMaterialConsumed += log.consumedQuantity;
    totalWaste += log.wasteQuantity;
  });
  
  if (totalMaterialAllocated > 0) {
    metrics.materialUtilization = (totalMaterialConsumed / totalMaterialAllocated) * 100;
    metrics.wastePercentage = (totalWaste / totalMaterialAllocated) * 100;
  }
  
  // Calculate quality yield
  const totalOutput = this.stages.reduce((sum, stage) => {
    return sum + (stage as any).outputMaterials.reduce((stageSum: number, output: any) => {
      return stageSum + (output.quantity * (1 - (output.defectPercentage || 0) / 100));
    }, 0);
  }, 0);
  
  if (this.plannedQuantity > 0) {
    metrics.qualityYield = (totalOutput / this.plannedQuantity) * 100;
  }
  
  // Calculate stage metrics
  this.stages.forEach((stage: any) => {
    const stageMetrics = {
      efficiency: 0,
      materialCost: 0,
      laborCost: 0,
      overheadCost: 0,
      qualityScore: 0,
      defectRate: 0
    };
    
    // Calculate stage efficiency
    if (stage.plannedDuration && stage.actualDuration) {
      stageMetrics.efficiency = (stage.plannedDuration / stage.actualDuration) * 100;
    }
    
    // Calculate stage costs
    stage.stageCosts.forEach((cost: any) => {
      switch (cost.category) {
        case 'direct_material':
          stageMetrics.materialCost += cost.amount;
          break;
        case 'direct_labor':
          stageMetrics.laborCost += cost.amount;
          break;
        case 'manufacturing_overhead':
        case 'variable_overhead':
        case 'fixed_overhead':
          stageMetrics.overheadCost += cost.amount;
          break;
      }
    });
    
    // Calculate quality score
    if (stage.qualityChecks.length > 0) {
      const totalScore = stage.qualityChecks.reduce((sum: number, check: any) => sum + (check.score || 0), 0);
      stageMetrics.qualityScore = totalScore / stage.qualityChecks.length;
    }
    
    // Calculate defect rate
    const totalStageOutput = stage.outputMaterials.reduce((sum: number, output: any) => sum + output.quantity, 0);
    const totalDefects = stage.outputMaterials.reduce((sum: number, output: any) => 
      sum + (output.quantity * (output.defectPercentage || 0) / 100), 0);
    
    if (totalStageOutput > 0) {
      stageMetrics.defectRate = (totalDefects / totalStageOutput) * 100;
    }
    
    metrics.stageMetrics[stage.stageNumber] = stageMetrics;
  });
  
  return metrics;
};

// Elongation calculation method
ProductionBatchSchema.methods.calculateElongation = function(inputQuantity: number, outputQuantity: number, inputUnit: string, outputUnit: string) {
  // Convert units to same base unit for calculation
  let inputInMeters = inputQuantity;
  let outputInMeters = outputQuantity;
  
  // Convert to meters for consistent calculation
  if (inputUnit === 'yards') inputInMeters = inputQuantity * 0.9144;
  if (outputUnit === 'yards') outputInMeters = outputQuantity * 0.9144;
  
  const elongationQuantity = outputInMeters - inputInMeters;
  const elongationPercentage = inputInMeters > 0 ? (elongationQuantity / inputInMeters) * 100 : 0;
  
  return {
    elongationPercentage: Math.round(elongationPercentage * 100) / 100, // Round to 2 decimal places
    elongationQuantity: Math.round(elongationQuantity * 100) / 100
  };
};

// Add elongation tracking to output
ProductionBatchSchema.methods.addElongationTracking = function(outputIndex: number, elongationData: any) {
  if (outputIndex < 0 || outputIndex >= this.outputMaterials.length) {
    throw new Error('Invalid output index');
  }
  
  const output = this.outputMaterials[outputIndex];
  const elongation = this.calculateElongation(
    elongationData.inputQuantity,
    elongationData.outputQuantity,
    elongationData.inputUnit,
    elongationData.outputUnit
  );
  
  output.elongationTracking = {
    inputQuantity: elongationData.inputQuantity,
    inputUnit: elongationData.inputUnit,
    outputQuantity: elongationData.outputQuantity,
    outputUnit: elongationData.outputUnit,
    elongationPercentage: elongation.elongationPercentage,
    elongationQuantity: elongation.elongationQuantity,
    elongationReason: elongationData.elongationReason,
    elongationNotes: elongationData.elongationNotes,
    qualityImpact: elongationData.qualityImpact,
    approvedBy: elongationData.approvedBy,
    approvalDate: new Date()
  };
  
  return this.save();
};

// Track client material consumption
ProductionBatchSchema.methods.trackClientMaterialConsumption = function(materialIndex: number, consumedQuantity: number, wasteQuantity: number) {
  if (materialIndex < 0 || materialIndex >= this.inputMaterials.length) {
    throw new Error('Invalid material index');
  }
  
  const material = this.inputMaterials[materialIndex];
  
  if (material.materialSource === 'client_provided' && material.clientMaterialTracking) {
    material.clientMaterialTracking.consumedFromClient += consumedQuantity;
    material.clientMaterialTracking.wasteFromClient += wasteQuantity;
    material.clientMaterialTracking.returnableToClient = 
      material.clientMaterialTracking.originalQuantity - 
      material.clientMaterialTracking.consumedFromClient - 
      material.clientMaterialTracking.wasteFromClient;
  }
  
  material.actualConsumption = consumedQuantity;
  material.wasteQuantity = wasteQuantity;
  material.status = 'consumed';
  material.consumptionDate = new Date();
  
  return this.save();
};

// Update client material output
ProductionBatchSchema.methods.updateClientMaterialOutput = function(outputIndex: number, clientOutputData: any) {
  if (outputIndex < 0 || outputIndex >= this.outputMaterials.length) {
    throw new Error('Invalid output index');
  }
  
  const output = this.outputMaterials[outputIndex];
  
  if (!output.clientOutputTracking) {
    output.clientOutputTracking = {
      isClientMaterial: false,
      returnToClient: false,
      keepAsStock: false,
      returnQuantity: 0,
      stockQuantity: 0
    };
  }
  
  output.clientOutputTracking.returnToClient = clientOutputData.returnToClient;
  output.clientOutputTracking.returnQuantity = clientOutputData.returnQuantity || 0;
  output.clientOutputTracking.keepAsStock = clientOutputData.keepAsStock;
  output.clientOutputTracking.stockQuantity = clientOutputData.stockQuantity || 0;
  output.clientOutputTracking.clientInstructions = clientOutputData.clientInstructions;
  
  if (clientOutputData.returnToClient || clientOutputData.keepAsStock) {
    output.clientOutputTracking.clientReturnDate = new Date();
  }
  
  return this.save();
};

// Get client material summary
ProductionBatchSchema.methods.getClientMaterialSummary = function() {
  const clientMaterials = this.inputMaterials.filter(m => m.materialSource === 'client_provided');
  const clientOutputs = this.outputMaterials.filter(o => o.clientOutputTracking?.isClientMaterial);
  
  return {
    batchNumber: this.batchNumber,
    clientMaterials: clientMaterials.map(m => ({
      grnNumber: m.grnNumber,
      clientName: m.clientName,
      itemName: m.itemName,
      originalQuantity: m.clientMaterialTracking?.originalQuantity || 0,
      consumedQuantity: m.clientMaterialTracking?.consumedFromClient || 0,
      wasteQuantity: m.clientMaterialTracking?.wasteFromClient || 0,
      returnableQuantity: m.clientMaterialTracking?.returnableToClient || 0,
      keptAsStock: m.clientMaterialTracking?.keptAsStock || 0
    })),
    clientOutputs: clientOutputs.map(o => ({
      itemName: o.itemName,
      outputQuantity: o.quantity,
      returnToClient: o.clientOutputTracking?.returnToClient || false,
      returnQuantity: o.clientOutputTracking?.returnQuantity || 0,
      keepAsStock: o.clientOutputTracking?.keepAsStock || false,
      stockQuantity: o.clientOutputTracking?.stockQuantity || 0,
      elongationPercentage: o.elongationTracking?.elongationPercentage || 0
    }))
  };
};

// Map material to GRN
ProductionBatchSchema.methods.mapMaterialToGRN = function(materialIndex: number, grnId: string, grnNumber: string, materialSource: string, clientInfo?: any) {
  if (materialIndex < 0 || materialIndex >= this.inputMaterials.length) {
    throw new Error('Invalid material index');
  }
  
  const material = this.inputMaterials[materialIndex];
  
  material.grnId = grnId;
  material.grnNumber = grnNumber;
  material.materialSource = materialSource;
  
  if (materialSource === 'client_provided' && clientInfo) {
    material.clientId = clientInfo.clientId;
    material.clientName = clientInfo.clientName;
    material.clientOrderId = clientInfo.clientOrderId;
    material.clientOrderNumber = clientInfo.clientOrderNumber;
    
    // Initialize client material tracking
    material.clientMaterialTracking = {
      originalQuantity: material.quantity,
      consumedFromClient: 0,
      wasteFromClient: 0,
      returnableToClient: material.quantity,
      keptAsStock: 0
    };
  }
  
  return this.save();
};

// Get GRN mapped materials
ProductionBatchSchema.methods.getGRNMappedMaterials = function() {
  return this.inputMaterials.filter(m => m.grnId && m.grnNumber).map(m => ({
    materialIndex: this.inputMaterials.indexOf(m),
    itemName: m.itemName,
    grnId: m.grnId,
    grnNumber: m.grnNumber,
    materialSource: m.materialSource,
    clientName: m.clientName,
    quantity: m.quantity,
    unit: m.unit,
    status: m.status
  }));
};

export const ProductionBatch = model<IProductionBatch>('ProductionBatch', ProductionBatchSchema);