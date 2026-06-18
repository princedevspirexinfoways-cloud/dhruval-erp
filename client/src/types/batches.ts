export interface IBatch {
  _id: string;
  companyId: string;
  batchNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  plannedStartDate: string;
  actualStartDate?: string;
  plannedEndDate: string;
  actualEndDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_check' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  machineId?: string;
  machineName?: string;
  operatorId?: string;
  operatorName?: string;
  materials: IBatchMaterial[];
  qualityRecords: IBatchQualityRecord[];
  costAnalysis: IBatchCostAnalysis;
  documents: IBatchDocument[];
  notes?: string;
  tags: string[];
  customFields?: any;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBatchMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  consumedQuantity: number;
  remainingQuantity: number;
  isActive: boolean;
}

export interface IBatchQualityRecord {
  testId: string;
  testName: string;
  testDate: string;
  testedBy: string;
  result: 'pass' | 'fail' | 'conditional';
  score: number;
  maxScore: number;
  parameters: IBatchQualityParameter[];
  notes?: string;
  isActive: boolean;
}

export interface IBatchQualityParameter {
  parameterName: string;
  expectedValue: string;
  actualValue: string;
  tolerance: string;
  status: 'pass' | 'fail' | 'within_tolerance';
}

export interface IBatchCostAnalysis {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerUnit: number;
  budget: number;
  variance: number;
  variancePercentage: number;
}

export interface IBatchDocument {
  documentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadDate: string;
  isActive: boolean;
}

export interface IBatchFormData {
  batchNumber: string;
  productId: string;
  quantity: number;
  plannedStartDate: string;
  plannedEndDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  machineId?: string;
  operatorId?: string;
  materials: Omit<IBatchMaterial, 'isActive' | 'consumedQuantity' | 'remainingQuantity'>[];
  notes?: string;
  tags: string[];
}

export interface IBatchProgress {
  batchId: string;
  currentStage: string;
  progress: number;
  estimatedCompletion: string;
  actualCompletion?: string;
  delays: IBatchDelay[];
  milestones: IBatchMilestone[];
}

export interface IBatchDelay {
  reason: string;
  duration: number;
  impact: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolutionDate?: string;
}

export interface IBatchMilestone {
  name: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'delayed';
  notes?: string;
}
