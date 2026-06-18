export interface InventoryItem {
  _id: string;
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  companyId: string;
  
  // Category Information
  category: {
    primary: 'raw_material' | 'finished_goods' | 'consumables' | 'spare_parts' | 'tools' | 'packaging';
    secondary?: string;
    tertiary?: string;
  };
  
  // Product Information
  productType?: string;
  brand?: string;
  model?: string;
  specifications?: {
    color?: string;
    size?: string;
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit?: 'cm' | 'inches' | 'mm';
    };
    material?: string;
    finish?: string;
    grade?: string;
  };
  
  // Stock Management
  stock: {
    unit: 'pieces' | 'kg' | 'meters' | 'liters' | 'boxes' | 'rolls' | 'sheets';
    currentStock: number;
    availableStock: number;
    reservedStock: number;
    reorderLevel: number;
    minStockLevel: number;
    maxStockLevel: number;
    economicOrderQuantity: number;
    leadTime: number; // in days
    safetyStock: number;
    valuationMethod: 'FIFO' | 'LIFO' | 'Weighted Average' | 'Standard Cost';
    averageCost: number;
    totalValue: number;
    lastStockUpdate?: string;
  };
  
  // Pricing Information
  pricing: {
    costPrice: number;
    sellingPrice: number;
    margin: number;
    currency: 'INR' | 'USD' | 'EUR';
    taxRate: number;
    discountRate?: number;
    bulkPricing?: Array<{
      minQuantity: number;
      maxQuantity?: number;
      price: number;
      discount: number;
    }>;
  };
  
  // Warehouse and Location
  warehouseId: string;
  warehouseName?: string;
  locations: Array<{
    warehouseId: string;
    warehouseName: string;
    shelf?: string;
    rack?: string;
    bin?: string;
    quantity: number;
    lastUpdated: string;
    isActive: boolean;
  }>;
  
  // Supplier Information
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
    leadTime: number;
    minimumOrderQuantity: number;
    lastPurchaseDate?: string;
    lastPurchasePrice?: number;
  }>;
  
  // Quality Control
  qualityControl: {
    inspectionRequired: boolean;
    inspectionFrequency: 'every_batch' | 'monthly' | 'quarterly' | 'annually';
    lastInspectionDate?: string;
    nextInspectionDate?: string;
    inspectionResults?: Array<{
      date: string;
      inspector: string;
      result: 'passed' | 'failed' | 'conditional';
      remarks?: string;
      defects?: string[];
    }>;
    qualityStandards?: string[];
    certificates?: Array<{
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate?: string;
      documentUrl?: string;
    }>;
  };
  
  // Batch and Serial Tracking
  batchTracking: {
    enabled: boolean;
    batchNumber?: string;
    expiryDate?: string;
    manufacturingDate?: string;
    serialNumbers?: string[];
  };
  
  // Reorder Management
  reorderPoint: number;
  reorderQuantity: number;
  stockingMethod: 'fifo' | 'lifo' | 'average';
  
  // Status and Flags
  status: 'active' | 'inactive' | 'discontinued' | 'obsolete';
  isCritical: boolean;
  isPerishable: boolean;
  requiresSpecialHandling: boolean;
  
  // Images and Documents
  images?: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  documents?: Array<{
    name: string;
    type: 'manual' | 'certificate' | 'specification' | 'safety' | 'other';
    url: string;
    uploadedAt: string;
  }>;
  
  // Tags and Custom Fields
  tags: string[];
  customFields?: Record<string, any>;
  
  // Audit Fields
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Additional Metadata
  notes?: string;
  internalNotes?: string;
  lastAuditDate?: string;
  nextAuditDate?: string;
}

// Form Data Interface for Create/Update Operations
export interface InventoryItemFormData {
  itemName: string;
  itemDescription?: string;
  category: string;
  productType?: string;
  brand?: string;
  model?: string;
  
  // Stock Information
  unit: string;
  currentStock: number;
  reorderLevel: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderQuantity: number;
  
  // Pricing
  costPrice: number;
  sellingPrice: number;
  currency: string;
  taxRate: number;
  
  // Warehouse
  warehouseId: string;
  
  // Status
  status: string;
  isCritical: boolean;
  isPerishable: boolean;
  
  // Additional
  tags: string[];
  notes?: string;
}

// Inventory Statistics Interface
export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  totalQuantity: number;
  totalCategories: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockedItems: number;
  categories: Record<string, number>;
  stockStatus: Record<string, number>;
  valueByCategory: Record<string, number>;
  averageStockValue: number;
  totalReorderItems: number;
}

// Inventory Alert Interface
export interface InventoryAlert {
  _id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiry_warning' | 'reorder_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentStock?: number;
  reorderLevel?: number;
  expiryDate?: string;
  createdAt: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Inventory Movement Interface
export interface InventoryMovement {
  _id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  unit: string;
  fromLocation?: string;
  toLocation?: string;
  referenceType: 'purchase' | 'sale' | 'production' | 'transfer' | 'adjustment' | 'return';
  referenceId?: string;
  reason?: string;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

// Inventory Report Interface
export interface InventoryReport {
  reportType: 'stock_summary' | 'low_stock' | 'movement_history' | 'valuation' | 'abc_analysis';
  generatedAt: string;
  generatedBy: string;
  dateRange: {
    from: string;
    to: string;
  };
  filters?: {
    category?: string[];
    warehouse?: string[];
    status?: string[];
  };
  data: any;
  summary: {
    totalItems: number;
    totalValue: number;
    totalMovements: number;
  };
}

// Theme-aware Inventory Item Interface
export interface ThemeAwareInventoryItem extends InventoryItem {
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
      showImages: boolean;
      compactView: boolean;
      showBatchInfo: boolean;
      showSupplierInfo: boolean;
      highlightLowStock: boolean;
      highlightOverstock: boolean;
    };
  };
}

// Inventory Item with Theme Support
export interface InventoryItemWithTheme {
  item: InventoryItem;
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

