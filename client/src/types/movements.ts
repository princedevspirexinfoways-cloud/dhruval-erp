// Comprehensive Inventory Movements Model with Theme Support

export interface InventoryMovement {
  _id: string;
  movementNumber: string;
  companyId: string;
  
  // Movement Classification
  movementType: 'inward' | 'outward' | 'transfer' | 'adjustment' | 'return' | 'production_issue' | 'production_receipt' | 'damage' | 'expiry' | 'cycle_count';
  movementCategory: 'purchase' | 'sale' | 'production' | 'transfer' | 'adjustment' | 'return' | 'damage' | 'expiry' | 'cycle_count';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Item Information
  itemId: string;
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  category: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  
  // Quantity and Units
  quantity: number;
  unit: string;
  batchNumber?: string;
  serialNumbers?: string[];
  expiryDate?: string;
  
  // Location Information
  fromLocation: {
    type: 'warehouse' | 'supplier' | 'customer' | 'production' | 'external';
    warehouseId?: string;
    warehouseName?: string;
    shelf?: string;
    rack?: string;
    bin?: string;
    isExternal: boolean;
    externalName?: string;
    address?: string;
  };
  
  toLocation: {
    type: 'warehouse' | 'supplier' | 'customer' | 'production' | 'external';
    warehouseId?: string;
    warehouseName?: string;
    shelf?: string;
    rack?: string;
    bin?: string;
    isExternal: boolean;
    externalName?: string;
    address?: string;
  };
  
  // Pricing and Cost Information
  pricing: {
    unitCost: number;
    totalCost: number;
    currency: 'INR' | 'USD' | 'EUR';
    exchangeRate?: number;
    taxRate?: number;
    discountRate?: number;
    landedCost?: number;
  };
  
  // Reference Information
  referenceType?: 'purchase_order' | 'sales_order' | 'production_order' | 'transfer_request' | 'adjustment_request' | 'return_request' | 'cycle_count';
  referenceId?: string;
  referenceNumber?: string;
  poNumber?: string;
  soNumber?: string;
  invoiceNumber?: string;
  grnNumber?: string;
  deliveryNote?: string;
  
  // Approval and Authorization
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requiresApproval: boolean;
  approvalLevel: 'none' | 'supervisor' | 'manager' | 'director';
  
  // Execution Information
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  executionStatus: 'not_started' | 'in_progress' | 'completed' | 'failed';
  scheduledDate?: string;
  actualDate?: string;
  completedAt?: string;
  
  // Personnel Information
  requestedBy: string;
  requestedByName?: string;
  performedBy?: string;
  performedByName?: string;
  supervisor?: string;
  supervisorName?: string;
  driver?: string;
  driverName?: string;
  
  // Quality Control
  qualityCheck: {
    required: boolean;
    performed: boolean;
    passed: boolean;
    inspector?: string;
    inspectionDate?: string;
    remarks?: string;
    defects?: string[];
    photos?: string[];
  };
  
  // Transportation and Logistics
  transportation?: {
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    transporter?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    deliveryProof?: string[];
  };
  
  // Documentation
  documents: Array<{
    type: 'invoice' | 'grn' | 'delivery_note' | 'quality_certificate' | 'transport_document' | 'other';
    name: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  
  // Additional Information
  reason?: string;
  remarks?: string;
  internalNotes?: string;
  tags: string[];
  customFields?: Record<string, any>;
  
  // System Fields
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Audit Trail
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    remarks?: string;
  }>;
}

// Movement Form Data Interface
export interface MovementFormData {
  movementType: string;
  itemId: string;
  quantity: number;
  unit: string;
  fromLocation: {
    type: string;
    warehouseId?: string;
    isExternal: boolean;
    externalName?: string;
  };
  toLocation: {
    type: string;
    warehouseId?: string;
    isExternal: boolean;
    externalName?: string;
  };
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  remarks?: string;
  scheduledDate?: string;
  requiresApproval: boolean;
}

// Movement Statistics Interface
export interface MovementStats {
  totalMovements: number;
  movementsByType: Record<string, number>;
  movementsByStatus: Record<string, number>;
  movementsByMonth: Record<string, number>;
  totalValue: number;
  averageValue: number;
  pendingApprovals: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  topItems: Array<{
    itemId: string;
    itemName: string;
    movementCount: number;
    totalQuantity: number;
  }>;
  topWarehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    movementCount: number;
  }>;
}

// Movement Alert Interface
export interface MovementAlert {
  _id: string;
  movementId: string;
  movementNumber: string;
  type: 'approval_required' | 'overdue' | 'quality_issue' | 'transportation_delay' | 'document_missing' | 'quantity_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

// Movement Report Interface
export interface MovementReport {
  reportType: 'movement_summary' | 'movement_details' | 'approval_pending' | 'overdue_movements' | 'value_analysis' | 'efficiency_report';
  generatedAt: string;
  generatedBy: string;
  dateRange: {
    from: string;
    to: string;
  };
  filters?: {
    movementType?: string[];
    status?: string[];
    warehouse?: string[];
    item?: string[];
  };
  data: any;
  summary: {
    totalMovements: number;
    totalValue: number;
    averageProcessingTime: number;
    completionRate: number;
  };
}

// Theme-aware Movement Interface
export interface ThemeAwareMovement extends InventoryMovement {
  theme: {
    displayMode: 'light' | 'dark';
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
    };
    customizations?: {
      showBatchInfo: boolean;
      showQualityInfo: boolean;
      showTransportInfo: boolean;
      compactView: boolean;
      highlightPending: boolean;
      highlightOverdue: boolean;
    };
  };
}

// Movement with Theme Support
export interface MovementWithTheme {
  movement: InventoryMovement;
  theme: {
    mode: 'light' | 'dark';
    colors: {
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      error: string;
      info: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
    };
    styling: {
      borderRadius: string;
      shadow: string;
      spacing: string;
      fontSize: string;
    };
  };
}

// Movement Type Configuration
export interface MovementTypeConfig {
  type: string;
  label: string;
  icon: string;
  color: string;
  requiresApproval: boolean;
  requiresQualityCheck: boolean;
  requiresTransportation: boolean;
  allowedFromLocations: string[];
  allowedToLocations: string[];
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  workflowSteps: string[];
}

// Movement Workflow Interface
export interface MovementWorkflow {
  _id: string;
  movementId: string;
  currentStep: string;
  steps: Array<{
    stepId: string;
    stepName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
    assignedTo?: string;
    completedBy?: string;
    completedAt?: string;
    remarks?: string;
    requiredDocuments?: string[];
    uploadedDocuments?: string[];
  }>;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Movement Dashboard Data
export interface MovementDashboardData {
  stats: MovementStats;
  recentMovements: InventoryMovement[];
  pendingApprovals: InventoryMovement[];
  overdueMovements: InventoryMovement[];
  alerts: MovementAlert[];
  charts: {
    movementsByType: Array<{ type: string; count: number; value: number }>;
    movementsByStatus: Array<{ status: string; count: number }>;
    movementsTrend: Array<{ date: string; count: number; value: number }>;
  };
}

// Movement Search and Filter Options
export interface MovementSearchOptions {
  search?: string;
  movementType?: string[];
  status?: string[];
  warehouse?: string[];
  item?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  priority?: string[];
  approvalStatus?: string[];
  createdBy?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Movement Export Options
export interface MovementExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters: MovementSearchOptions;
  includeDocuments: boolean;
  groupBy?: string;
  dateRange: {
    from: string;
    to: string;
  };
}

