import { Document, Types } from 'mongoose';

// =============================================
// BASE INTERFACES FOR COMMON FIELDS
// =============================================

export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyDocument extends BaseDocument {
  companyId: Types.ObjectId;
}

export interface AuditableDocument extends CompanyDocument {
  createdBy: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
}

// =============================================
// COMPANY INTERFACES
// =============================================

export interface ICompany extends BaseDocument {
  companyCode: string;
  companyName: string;
  legalName: string;
  
  registrationDetails: {
    gstin: string;
    pan: string;
    cin?: string;
    udyogAadhar?: string;
    iecCode?: string;
    registrationDate?: Date;
  };
  
  addresses: {
    registeredOffice: IAddress;
    factoryAddress: IAddress;
    warehouseAddresses: IWarehouseAddress[];
  };
  
  contactInfo: {
    phones: IContactPhone[];
    emails: IContactEmail[];
    website?: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  
  bankAccounts: IBankAccount[];
  
  businessConfig: {
    currency: string;
    timezone: string;
    fiscalYearStart: string;
    workingDays: string[];
    workingHours: {
      start: string;
      end: string;
      breakStart: string;
      breakEnd: string;
    };
    gstRates: {
      defaultRate: number;
      rawMaterialRate: number;
      finishedGoodsRate: number;
    };
  };
  
  productionCapabilities: {
    productTypes: string[];
    printingMethods: string[];
    monthlyCapacity: {
      sarees?: number;
      fabricMeters?: number;
      customOrders?: number;
    };
    qualityCertifications: string[];
  };
  
  licenses: ILicense[];
  
  // Company Status
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval' | 'under_review';
  
  isActive: boolean;
  createdBy: Types.ObjectId;
}

export interface IAddress {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
}

export interface IWarehouseAddress extends IAddress {
  warehouseName?: string;
}

export interface IContactPhone {
  number: string;
  type: string;
  label?: string;
  isPrimary?: boolean;
}

export interface IContactEmail {
  email: string;
  type: string;
  label?: string;
  isPrimary?: boolean;
}

export interface IBankAccount {
  bankName: string;
  branchName?: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'Current' | 'Savings' | 'CC' | 'OD';
  accountHolderName: string;
  currentBalance: number;
  isActive: boolean;
  isPrimary: boolean;
}

export interface ILicense {
  licenseType: string;
  licenseNumber: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate: Date;
  renewalRequired: boolean;
  documentUrl?: string;
}

// =============================================
// USER INTERFACES
// =============================================

export interface IUser extends BaseDocument {
  username: string;
  email?: string;
  password: string;
  fullName?: string; // Virtual field
  userId?: Types.ObjectId; // From JWT payload
  
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    displayName?: string;
    phone: string;
    alternatePhone?: string;
    dateOfBirth?: Date;
    gender?: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
    profilePhoto?: string;
    signature?: string;
  };
  
  addresses: {
    current: IAddress;
    permanent: IAddress;
  };
  
  companyAccess: ICompanyAccess[];
  
  security: {
    lastLogin?: Date;
    lastLoginIP?: string;
    failedLoginAttempts: number;
    accountLocked: boolean;
    lockoutTime?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    passwordLastChanged?: Date;
    mustChangePassword: boolean;
  };
  
  preferences: {
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      push: boolean;
    };
    dashboard: {
      defaultCompany?: Types.ObjectId;
      widgets: string[];
    };
  };
  
  isActive: boolean;
  createdBy?: Types.ObjectId;
  isSuperAdmin?: boolean;
  primaryCompanyId?: Types.ObjectId;

  // Methods
  comparePassword?(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts?(): Promise<any>;
  resetLoginAttempts?(): Promise<any>;
  
  // Virtual properties for backward compatibility
  role?: string;
  companyId?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  name?: string;
}

export interface ICompanyAccess {
  companyId: Types.ObjectId;
  role: 'super_admin' | 'owner' | 'manager' | 'accountant' | 'production_manager' | 'sales_executive' | 'security_guard' | 'operator' | 'helper';
  department?: 'Management' | 'Production' | 'Sales' | 'Accounts' | 'Security' | 'Quality' | 'Warehouse';
  designation?: string;
  employeeId?: string;
  joiningDate?: Date;
  
  permissions: {
    inventory: IModulePermissions;
    production: IModulePermissions;
    orders: IModulePermissions;
    financial: IModulePermissions;
    security: ISecurityPermissions;
    hr: IHRPermissions;
    admin: IAdminPermissions;
  };
  
  isActive: boolean;
  joinedAt: Date;
  leftAt?: Date;
  remarks?: string;
}

export interface IModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  viewReports: boolean;
}

export interface ISecurityPermissions {
  gateManagement: boolean;
  visitorManagement: boolean;
  vehicleTracking: boolean;
  cctvAccess: boolean;
  emergencyResponse: boolean;
}

export interface IHRPermissions {
  viewEmployees: boolean;
  manageAttendance: boolean;
  manageSalary: boolean;
  viewReports: boolean;
}

export interface IAdminPermissions {
  userManagement: boolean;
  systemSettings: boolean;
  backupRestore: boolean;
  auditLogs: boolean;
}

// =============================================
// SPARES INTERFACES
// =============================================

export interface ISpareCompatibility {
  equipmentType: string;
  equipmentModel: string;
  equipmentBrand: string;
  equipmentId?: Types.ObjectId;
  isUniversal: boolean;
}

export interface ISpareSupplier {
  supplierId: Types.ObjectId;
  supplierName: string;
  supplierCode: string;
  partNumber: string;
  isPrimary: boolean;
  leadTime: number; // in days
  minOrderQuantity: number;
  lastSupplyDate?: Date;
  lastSupplyRate?: number;
  qualityRating: number; // 1-5 scale
  warrantyPeriod?: number; // in months
}

export interface ISpareLocation {
  warehouseId?: Types.ObjectId;
  warehouseName?: string;
  zone?: string;
  rack?: string;
  bin?: string;
  quantity: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface IMaintenanceSchedule {
  scheduleType: 'preventive' | 'predictive' | 'corrective';
  frequency: number; // in days
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  maintenanceNotes?: string;
  isActive: boolean;
}

export interface ISpareUsageHistory {
  usedDate: Date;
  quantity: number;
  equipmentId?: Types.ObjectId;
  equipmentName?: string;
  workOrderId?: Types.ObjectId;
  workOrderNumber?: string;
  usedBy: Types.ObjectId;
  usedByName: string;
  reason: string;
  notes?: string;
}

export interface ISpare extends AuditableDocument {
  // Basic Information
  spareCode: string;
  spareName: string;
  spareDescription?: string;
  category: 'mechanical' | 'electrical' | 'electronic' | 'hydraulic' | 'pneumatic' | 'consumable' | 'tool' | 'safety' | 'other';
  subCategory?: string;
  partNumber: string;
  manufacturerPartNumber?: string;
  alternatePartNumbers?: string[];

  // Manufacturer & Brand
  manufacturer: string;
  brand?: string;
  spareModel?: string;

  // Physical Properties
  specifications: {
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      diameter?: number;
      unit: string;
    };
    weight?: {
      value: number;
      unit: string;
    };
    material?: string;
    color?: string;
    finish?: string;
  };

  // Compatibility
  compatibility: ISpareCompatibility[];

  // Stock Management
  stock: {
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    inTransitStock: number;
    damagedStock: number;
    unit: string;
    alternateUnit?: string;
    conversionFactor?: number;
    reorderLevel: number;
    minStockLevel: number;
    maxStockLevel: number;
    economicOrderQuantity?: number;
    averageCost: number;
    totalValue: number;
  };

  // Location Management
  locations: ISpareLocation[];

  // Pricing
  pricing: {
    costPrice?: number;
    standardCost?: number;
    lastPurchasePrice?: number;
    averagePurchasePrice?: number;
    currency: string;
  };

  // Supplier Information
  suppliers: ISpareSupplier[];

  // Maintenance & Lifecycle
  maintenance: {
    isConsumable: boolean;
    expectedLifespan?: number; // in months
    maintenanceSchedule?: IMaintenanceSchedule;
    criticality: 'low' | 'medium' | 'high' | 'critical';
    failureRate?: number; // percentage
    mtbf?: number; // Mean Time Between Failures in hours
  };

  // Usage & History
  usage: {
    totalUsed: number;
    averageMonthlyUsage: number;
    lastUsedDate?: Date;
    usageHistory: ISpareUsageHistory[];
  };

  // Quality & Compliance
  quality: {
    qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
    qualityCheckRequired: boolean;
    qualityParameters: string[];
    lastQualityCheck?: Date;
    qualityNotes?: string;
    certifications: string[];
    complianceStandards: string[];
  };

  // Storage & Handling
  storage: {
    storageConditions?: string;
    temperatureRange?: {
      min: number;
      max: number;
      unit: string;
    };
    humidityRange?: {
      min: number;
      max: number;
    };
    specialHandling?: string;
    shelfLife?: number; // in months
    expiryDate?: Date;
  };

  // Documentation
  documentation: {
    images?: string[];
    manuals?: string[];
    drawings?: string[];
    certificates?: string[];
    notes?: string;
  };

  // Status & Tracking
  status: {
    isActive: boolean;
    isDiscontinued: boolean;
    isCritical: boolean;
    isObsolete: boolean;
    requiresApproval: boolean;
    isHazardous: boolean;
  };

  // Audit & Tracking
  tracking: {
    lastModifiedBy?: Types.ObjectId;
    lastStockUpdate?: Date;
    lastMovementDate?: Date;
    totalInward: number;
    totalOutward: number;
    totalAdjustments: number;
  };
}

// =============================================
// INVENTORY INTERFACES
// =============================================

export interface IInventoryItem extends AuditableDocument {
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  barcode?: string;
  qrCode?: string;
  companyItemCode: string;
  internalSKU?: string;
  
  category: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  
  productType?: 'saree' | 'african' | 'garment' | 'digital_print' | 'custom' | 'chemical' | 'dye' | 'machinery' | 'yarn' | 'thread';

  // Design Reference - Linked to Design Model
  designId?: Types.ObjectId;

  // Design and Pattern Information (Legacy - kept for backward compatibility)
  designInfo?: {
    designNumber?: string;
    designName?: string;
    designCategory?: string;
    season?: 'spring' | 'summer' | 'monsoon' | 'winter' | 'all_season';
    collection?: string;
    artworkFile?: string;
    colorVariants?: string[];
    sizeVariants?: string[];
  };
  
  specifications: {
    gsm?: number;
    width?: number;
    length?: number;
    weight?: number;
    color?: string;
    colorCode?: string;
    design?: string;
    pattern?: string;
    fabricComposition?: string;
    threadCount?: number;
    weaveType?: 'plain' | 'twill' | 'satin' | 'jacquard' | 'dobby' | 'other';
    finish?: string;
    tensileStrength?: number;
    shrinkage?: number;
    colorFastness?: number;
    pilling?: number;
    concentration?: number;
    purity?: number;
    phLevel?: number;
    batchNumber?: string;
    lotNumber?: string;
    challan?: string;
    manufacturingDate?: Date;
    expiryDate?: Date;
    hsnCode?: string;
    attributeName?: string;
    grossQuantity?: number;
    tareWeight?: number;
    fold?: number;
    date?: Date;
    lrNumber?: string;
    transportNumber?: string;
    customAttributes?: any;
  };
  
  stock: {
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    inTransitStock: number;
    damagedStock: number;
    unit: string;
    alternateUnit?: string;
    conversionFactor?: number;
    netQuantity?: number;
    reorderLevel: number;
    minStockLevel: number;
    maxStockLevel: number;
    economicOrderQuantity?: number;
    valuationMethod: 'FIFO' | 'LIFO' | 'Weighted Average';
    averageCost: number;
    totalValue: number;
  };
  
  locations: IItemLocation[];
  
  pricing: {
    costPrice?: number;
    standardCost?: number;
    lastPurchasePrice?: number;
    averagePurchasePrice?: number;
    sellingPrice?: number;
    mrp?: number;
    marginPercentage?: number;
    pricePerNetQty?: number;
    gst?: number;
    finalPrice?: number;
    currency: string;
  };

  priceHistory?: Array<{
    price: number;
    previousPrice?: number;
    changedBy?: Types.ObjectId;
    changedAt: Date;
    reason?: string;
    notes?: string;
  }>;
  
  suppliers: IItemSupplier[];

  // Ageing and Quality Tracking
  ageing?: {
    ageInDays?: number;
    ageCategory?: 'fresh' | 'good' | 'aging' | 'old' | 'obsolete';
    lastMovementDate?: Date;
    turnoverRate?: number;
    daysInStock?: number;
    slowMovingThreshold?: number;
    obsoleteThreshold?: number;
  };

  // Quality Control
  qualityControl?: {
    qualityGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
    qualityScore?: number;
    defectRate?: number;
    lastQualityCheck?: Date;
    qualityCheckDue?: Date;
    qualityNotes?: Array<{
      date: Date;
      inspector: string;
      grade: string;
      notes: string;
      images: string[];
    }>;
    requiresInspection?: boolean;
  };

  quality: {
    qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
    defectPercentage: number;
    qualityCheckRequired: boolean;
    qualityParameters: string[];
    lastQualityCheck?: Date;
    qualityNotes?: string;
    certifications: string[];
  };
  
  manufacturing?: {
    bomId?: Types.ObjectId;
    manufacturingCost?: number;
    laborCost?: number;
    overheadCost?: number;
    manufacturingTime?: number;
    shelfLife?: number;
    batchSize?: number;
  };
  
  tracking: {
    lastModifiedBy?: Types.ObjectId;
    lastStockUpdate?: Date;
    lastMovementDate?: Date;
    totalInward: number;
    totalOutward: number;
    totalAdjustments: number;
  };
  
  status: {
    isActive: boolean;
    isDiscontinued: boolean;
    isFastMoving: boolean;
    isSlowMoving: boolean;
    isObsolete: boolean;
    requiresApproval: boolean;
  };

  // Production tracking for working inventory and finished goods
  productionInfo?: {
    batchId?: Types.ObjectId;
    batchNumber?: string;
    stageNumber?: number;
    sourceItemId?: Types.ObjectId;
    producedBy?: Types.ObjectId;
    productionDate?: Date;
    transferredBy?: Types.ObjectId;
    transferDate?: Date;
    completedBy?: Types.ObjectId;
    completionDate?: Date;
  };

  // Batch Output Tracking
  batchOutputInfo?: {
    sourceBatchId?: Types.ObjectId;
    sourceBatchNumber?: string;
    outputIndex?: number;
    grnId?: Types.ObjectId;
    grnNumber?: string;
    materialSource?: 'own_material' | 'client_provided' | 'job_work_material';
    clientId?: Types.ObjectId;
    clientName?: string;
    clientOrderId?: Types.ObjectId;
    clientOrderNumber?: string;
    
    // Elongation Information
    elongationInfo?: {
      inputQuantity?: number;
      inputUnit?: string;
      outputQuantity?: number;
      outputUnit?: string;
      elongationPercentage?: number;
      elongationQuantity?: number;
      elongationReason?: string;
      elongationNotes?: string;
      qualityImpact?: string;
      approvedBy?: string;
      approvalDate?: Date;
    };
    
    // Client Output Tracking
    clientOutputInfo?: {
      isClientMaterial?: boolean;
      returnToClient?: boolean;
      returnQuantity?: number;
      keepAsStock?: boolean;
      stockQuantity?: number;
      clientReturnDate?: Date;
      clientInstructions?: string;
    };
  };

  notes?: string;
  tags: string[];
  images: string[];
  documents: string[];
}

export interface IItemLocation {
  warehouseId?: Types.ObjectId;
  warehouseName?: string;
  zone?: string;
  rack?: string;
  bin?: string;
  quantity: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface IItemSupplier {
  supplierId?: Types.ObjectId;
  supplierName?: string;
  supplierCode?: string;
  isPrimary: boolean;
  leadTime?: number;
  minOrderQuantity?: number;
  lastSupplyDate?: Date;
  lastSupplyRate?: number;
  qualityRating?: number;
}

// =============================================
// STOCK MOVEMENT INTERFACES
// =============================================

export interface IStockMovement extends AuditableDocument {
  movementNumber: string;
  movementDate: Date;
  itemId: Types.ObjectId;
  itemCode?: string;
  itemName?: string;
  
  movementType: 'inward' | 'outward' | 'transfer' | 'adjustment' | 'production_consume' | 'production_output' | 'return' | 'damage' | 'theft';
  
  referenceDocument?: {
    documentType?: 'purchase_order' | 'sales_order' | 'production_order' | 'transfer_note' | 'adjustment_note' | 'return_note';
    documentId?: Types.ObjectId;
    documentNumber?: string;
  };
  
  quantity: number;
  unit: string;
  rate?: number;
  totalValue?: number;
  
  fromLocation?: IMovementLocation;
  toLocation?: IMovementLocation;
  
  batchDetails?: {
    batchNumber?: string;
    lotNumber?: string;
    serialNumbers: string[];
    manufacturingDate?: Date;
    expiryDate?: Date;
    supplierBatch?: string;
  };
  
  qualityCheck?: {
    isRequired: boolean;
    isCompleted: boolean;
    checkedBy?: Types.ObjectId;
    checkedAt?: Date;
    qualityGrade?: string;
    defects: string[];
    rejectedQuantity: number;
    acceptedQuantity?: number;
    qualityNotes?: string;
    qualityImages: string[];
  };
  
  gatePass?: {
    gatePassNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    driverLicense?: string;
    transporterName?: string;
    securityApproval?: {
      approvedBy?: Types.ObjectId;
      approvedAt?: Date;
      remarks?: string;
      documentsVerified: string[];
    };
  };
  
  stockImpact: {
    stockBefore?: number;
    stockAfter?: number;
    reservedBefore?: number;
    reservedAfter?: number;
    availableBefore?: number;
    availableAfter?: number;
  };
  
  costImpact?: {
    costBefore?: number;
    costAfter?: number;
    totalValueBefore?: number;
    totalValueAfter?: number;
    costMethod?: string;
  };
  
  approval?: {
    isRequired: boolean;
    requestedBy?: Types.ObjectId;
    requestedAt?: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    approvalLevel?: number;
    approvalNotes?: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  
  reason?: string;
  notes?: string;
  attachments: string[];
  tags: string[];
}

export interface IMovementLocation {
  warehouseId?: Types.ObjectId;
  warehouseName?: string;
  zone?: string;
  rack?: string;
  bin?: string;
  isExternal: boolean;
  externalLocation?: string;
}

// =============================================
// SCRAP INTERFACES
// =============================================

export interface IScrap extends AuditableDocument {
  scrapNumber: string;
  scrapDate: Date;
  
  // Reference to original inventory item
  inventoryItemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  
  // Scrap details
  quantity: number;
  unit: string;
  scrapReason: 'damaged' | 'defective' | 'expired' | 'obsolete' | 'production_waste' | 'quality_reject' | 'other';
  scrapReasonDetails?: string;
  
  // Location information
  warehouseId?: Types.ObjectId;
  warehouseName?: string;
  zone?: string;
  rack?: string;
  bin?: string;
  
  // Stock impact
  stockImpact: {
    inventoryStockBefore: number;
    inventoryStockAfter: number;
    scrapStockBefore: number;
    scrapStockAfter: number;
  };
  
  // Valuation
  unitCost?: number;
  totalValue?: number;
  
  // Quality details
  qualityGrade?: string;
  defectDetails?: string;
  
  // Batch/Lot information (if applicable)
  batchNumber?: string;
  lotNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  
  // Approval workflow
  approval?: {
    isRequired: boolean;
    requestedBy?: Types.ObjectId;
    requestedAt?: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
    approvalNotes?: string;
  };
  
  // Disposal information
  disposal?: {
    disposed: boolean;
    disposalDate?: Date;
    disposalMethod?: 'sold' | 'donated' | 'recycled' | 'destroyed' | 'other';
    disposalValue?: number;
    disposalNotes?: string;
    disposedBy?: Types.ObjectId;
  };
  
  // Tracking
  status: 'active' | 'disposed' | 'cancelled';
  notes?: string;
  tags: string[];
  attachments: string[];
}

// =============================================
// GOODS RETURN INTERFACES
// =============================================

export interface IGoodsReturn extends AuditableDocument {
  returnNumber: string;
  returnDate: Date;
  
  // Reference to original inventory item
  inventoryItemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  
  // Original challan information
  originalChallanNumber: string;
  originalChallanDate?: Date;
  
  // Return details
  damagedQuantity: number;
  returnedQuantity: number;
  totalQuantity: number; // damagedQuantity + returnedQuantity
  unit: string;
  returnReason: 'damaged' | 'defective' | 'quality_issue' | 'wrong_item' | 'expired' | 'other';
  returnReasonDetails?: string;
  
  // Location information
  warehouseId?: Types.ObjectId;
  warehouseName?: string;
  zone?: string;
  rack?: string;
  bin?: string;
  
  // Stock impact
  stockImpact: {
    inventoryStockBefore: number;
    inventoryStockAfter: number;
    damagedStockBefore: number;
    damagedStockAfter: number;
    returnedStockBefore: number;
    returnedStockAfter: number;
  };
  
  // Valuation
  unitCost?: number;
  damagedValue?: number;
  returnedValue?: number;
  totalValue?: number;
  
  // Quality details
  qualityGrade?: string;
  defectDetails?: string;
  
  // Batch/Lot information (if applicable)
  batchNumber?: string;
  lotNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  
  // Supplier/Party information (if returning to supplier)
  supplierId?: Types.ObjectId;
  supplierName?: string;
  supplierCode?: string;
  
  // Approval workflow
  approval?: {
    isRequired: boolean;
    requestedBy?: Types.ObjectId;
    requestedAt?: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
    approvalNotes?: string;
  };
  
  // Return status
  returnStatus: 'pending' | 'approved' | 'processed' | 'rejected' | 'cancelled';
  
  // Tracking
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  tags: string[];
  attachments: string[];
}

// =============================================
// DESIGN INTERFACES
// =============================================

export interface IDesign extends AuditableDocument {
  designNumber: string;
  designName: string;
  
  designDescription?: string;
  designCategory?: string;
  season?: 'spring' | 'summer' | 'monsoon' | 'winter' | 'all_season';
  designCollection?: string;
  
  // Artwork and Files
  artworkFile?: string;
  designImage?: string;
  designFiles?: string[];
  
  // Variants
  colorVariants?: string[];
  sizeVariants?: string[];
  
  // Design Specifications
  specifications?: {
    pattern?: string;
    technique?: string;
    complexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
    estimatedProductionTime?: number;
    notes?: string;
  };
  
  // Usage Tracking
  usageCount?: number;
  lastUsedDate?: Date;
  
  // Status
  status: 'active' | 'inactive' | 'archived';
  
  notes?: string;
  tags: string[];
}

// =============================================
// PRODUCTION ORDER INTERFACES
// =============================================

export interface IProductionOrder extends AuditableDocument {
  productionOrderNumber: string;
  orderDate: Date;
  customerOrderId?: Types.ObjectId;
  customerOrderNumber?: string;
  customerId?: Types.ObjectId;
  customerName?: string;

  product: {
    productType: 'saree' | 'african_cotton' | 'garment_fabric' | 'digital_print' | 'custom';
    design?: string;
    designCode?: string;
    color?: string;
    colorCode?: string;
    gsm?: number;
    width?: number;
    length?: number;
    pattern?: string;
    finish?: string;
    customSpecifications?: string;
  };

  orderQuantity: number;
  unit: string;
  completedQuantity: number;
  rejectedQuantity: number;
  pendingQuantity: number;

  rawMaterials: IRawMaterial[];
  productionStages: IProductionStage[];

  priority: 'low' | 'medium' | 'high' | 'urgent' | 'rush';
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'partially_completed';

  schedule: {
    plannedStartDate?: Date;
    plannedEndDate?: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    estimatedDuration?: number;
    actualDuration?: number;
    delayReason?: string;
  };

  costSummary: {
    materialCost: number;
    laborCost: number;
    machineCost: number;
    overheadCost: number;
    jobWorkCost: number;
    totalProductionCost: number;
    costPerUnit: number;
  };

  qualitySummary?: {
    totalProduced?: number;
    totalApproved?: number;
    totalRejected?: number;
    totalRework?: number;
    overallQualityGrade?: string;
    defectRate?: number;
    firstPassYield?: number;
  };

  approvals: IApproval[];
  specialInstructions?: string;
  customerRequirements?: string;
  packingInstructions?: string;
  deliveryInstructions?: string;
  notes?: string;
  tags: string[];
  attachments: string[];

  approvedBy?: Types.ObjectId;
}

export interface IRawMaterial {
  itemId: Types.ObjectId;
  itemCode?: string;
  itemName?: string;
  requiredQuantity: number;
  unit?: string;
  allocatedQuantity: number;
  consumedQuantity: number;
  wasteQuantity: number;
  rate?: number;
  totalCost?: number;
  batches: IBatch[];
}

export interface IBatch {
  batchNumber?: string;
  quantity?: number;
  rate?: number;
  consumedDate?: Date;
}

export interface IBOMItem {
  itemId: Types.ObjectId;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  unit?: string;
  rate?: number;
  totalCost?: number;
}

export interface IProductionStage {
  stageId: Types.ObjectId;
  processId?: Types.ObjectId;
  stageNumber: number;
  stageName: string;
  processType?: 'grey_fabric_inward' | 'pre_processing' | 'dyeing' | 'printing' | 'washing' | 'fixing' | 'finishing' | 'quality_control' | 'cutting_packing' | 'dispatch_invoice';
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'rejected' | 'rework';

  assignment: {
    workers: IWorkerAssignment[];
    machines: IMachineAssignment[];
    jobWork?: IJobWork;
  };

  timing: {
    plannedStartTime?: Date;
    actualStartTime?: Date;
    plannedEndTime?: Date;
    actualEndTime?: Date;
    plannedDuration?: number;
    actualDuration?: number;
    breakTime?: number;
    overtimeHours?: number;
  };

  materialConsumption: IMaterialConsumption[];
  qualityControl?: IQualityControl;

  output?: {
    producedQuantity?: number;
    unit?: string;
    outputLocation?: {
      warehouseId?: Types.ObjectId;
      location?: string;
    };
    batchNumber?: string;
    outputImages: string[];
    defectQuantity?: number;
  };

  costs: {
    materialCost: number;
    laborCost: number;
    machineCost: number;
    overheadCost: number;
    jobWorkCost: number;
    totalStageCost: number;
  };

  notes?: string;
  instructions?: string;
  images: string[];
  documents: string[];

  // Progress tracking
  progress?: number;

  // Stage completion tracking
  completedBy?: Types.ObjectId;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkerAssignment {
  workerId?: Types.ObjectId;
  workerName?: string;
  role?: string;
  assignedAt?: Date;
  hoursWorked?: number;
  hourlyRate?: number;
  totalCost?: number;
}

export interface IMachineAssignment {
  machineId?: Types.ObjectId;
  machineName?: string;
  assignedAt?: Date;
  hoursUsed?: number;
  hourlyRate?: number;
  totalCost?: number;
}

export interface IJobWork {
  isJobWork: boolean;
  jobWorkerId?: Types.ObjectId;
  jobWorkerName?: string;
  jobWorkerRate?: number;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  jobWorkCost?: number;
  qualityAgreement?: string;
  jobWorkType: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_check';
  productionOrderId?: Types.ObjectId;
  batchId?: Types.ObjectId;
  quantity: number;
  unit: string;
  // Challan Information
  challanNumber?: string;
  challanDate?: Date;
  categoryId?: Types.ObjectId;
  categoryName?: string;
  subcategoryId?: Types.ObjectId;
  subcategoryName?: string;
  itemName?: string;
  attributeName?: string;
  price?: number;
  lotNumber?: string;
  // Party Details
  partyName?: string;
  partyGstNumber?: string;
  partyAddress?: string;
  // Transport Details
  transportName?: string;
  transportNumber?: string;
  materialProvided?: Array<{
    itemId?: Types.ObjectId;
    itemName?: string;
    quantity?: number;
    unit?: string;
  }>;
  materialReturned?: Array<{
    itemId?: Types.ObjectId;
    itemName?: string;
    quantity?: number;
    unit?: string;
  }>;
  materialUsed?: Array<{
    itemId?: Types.ObjectId;
    itemName?: string;
    quantity?: number;
    unit?: string;
  }>;
  materialWasted?: Array<{
    itemId?: Types.ObjectId;
    itemName?: string;
    quantity?: number;
    unit?: string;
  }>;
  outputQuantity?: number;
  wasteQuantity?: number;
  qualityStatus?: 'pending' | 'approved' | 'rejected' | 'rework';
  qualityNotes?: string;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  paymentAmount?: number;
  paymentDate?: Date;
  remarks?: string;
}

export interface IMaterialConsumption {
  itemId?: Types.ObjectId;
  itemName?: string;
  consumedQuantity?: number;
  unit?: string;
  wasteQuantity?: number;
  wastePercentage?: number;
  batchNumber?: string;
  consumedBy?: Types.ObjectId;
  consumedAt?: Date;
}

export interface IQualityControl {
  isRequired: boolean;
  checkpoints: IQualityCheckpoint[];
  finalQuality?: {
    checkedBy?: Types.ObjectId;
    checkedAt?: Date;
    qualityGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
    defects: string[];
    defectPercentage?: number;
    approvedQuantity?: number;
    rejectedQuantity?: number;
    reworkQuantity?: number;
    qualityNotes?: string;
    qualityImages: string[];
  };
}

export interface IQualityCheckpoint {
  checkpointName?: string;
  parameter?: string;
  expectedValue?: string;
  actualValue?: string;
  status?: 'pass' | 'fail' | 'rework';
  checkedBy?: Types.ObjectId;
  checkedAt?: Date;
  remarks?: string;
}

export interface IApproval {
  level?: number;
  approverRole?: string;
  approverId?: Types.ObjectId;
  approverName?: string;
  status?: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  remarks?: string;
}

// =============================================
// CUSTOMER ORDER INTERFACES
// =============================================

export interface ICustomerOrder extends AuditableDocument {
  orderNumber: string;
  orderDate: Date;
  customerId: Types.ObjectId;
  customerName?: string;
  customerCode?: string;

  orderType: 'local' | 'export' | 'custom' | 'sample' | 'bulk' | 'repeat';
  orderSource: 'direct' | 'meesho' | 'indiamart' | 'website' | 'phone' | 'email' | 'whatsapp' | 'exhibition';

  orderItems: IOrderItem[];

  orderSummary: {
    subtotal?: number;
    totalDiscount: number;
    totalTax?: number;
    shippingCharges: number;
    packingCharges: number;
    otherCharges: number;
    totalAmount?: number;
    roundOffAmount: number;
    finalAmount?: number;
  };

  payment: {
    paymentTerms?: string;
    paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card' | 'credit';
    creditDays: number;
    advancePercentage: number;
    advanceAmount: number;
    advanceReceived: number;
    balanceAmount?: number;
    paymentStatus: 'pending' | 'advance_received' | 'partial' | 'paid' | 'overdue';
    dueDate?: Date;
    paymentHistory: IPaymentHistory[];
  };

  delivery: {
    deliveryType?: 'pickup' | 'delivery' | 'courier';
    deliveryAddress?: IDeliveryAddress;
    expectedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    deliveryInstructions?: string;
    courierPreference?: string;
    shippingDetails?: {
      courierCompany?: string;
      awbNumber?: string;
      trackingUrl?: string;
      shippingCost?: number;
      estimatedDelivery?: Date;
    };
  };

  priority: 'low' | 'medium' | 'high' | 'urgent' | 'rush';
  status: 'draft' | 'confirmed' | 'in_production' | 'ready_to_dispatch' | 'dispatched' | 'delivered' | 'completed' | 'cancelled' | 'returned';

  approvals: IApproval[];
  communications: ICommunication[];

  specialInstructions?: string;
  packingInstructions?: string;
  qualityInstructions?: string;
  deliveryInstructions?: string;

  salesPerson?: {
    salesPersonId?: Types.ObjectId;
    salesPersonName?: string;
    commission?: number;
    commissionPercentage?: number;
  };

  referenceOrders: Types.ObjectId[];
  seasonality?: string;
  marketSegment?: string;

  notes?: string;
  tags: string[];
  attachments: string[];

  approvedBy?: Types.ObjectId;

  // Status Timestamps
  confirmedAt?: Date;
  productionStartedAt?: Date;
  completedAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface IOrderItem {
  itemId: Types.ObjectId;
  productId?: Types.ObjectId;
  itemName: string; // Added itemName field
  productType: 'saree' | 'african_cotton' | 'garment_fabric' | 'digital_print' | 'custom';

  specifications: {
    design?: string;
    designCode?: string;
    color?: string;
    colorCode?: string;
    gsm?: number;
    width?: number;
    length?: number;
    pattern?: string;
    finish?: string;
    customRequirements?: string;
    sampleApproved: boolean;
    sampleImages: string[];
  };

  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  discountAmount: number;
  taxRate: number;
  taxAmount?: number;
  totalAmount?: number;

  productionOrderId?: Types.ObjectId;
  productionStatus: 'pending' | 'in_production' | 'completed' | 'quality_check' | 'ready' | 'dispatched';
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';

  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryPriority?: 'low' | 'medium' | 'high' | 'urgent';

  qualityRequirements?: {
    qualityGrade?: string;
    specialTests: string[];
    packingRequirements?: string;
    labelingRequirements?: string;
  };

  // Material Source Management
  materialSource?: 'own_stock' | 'client_provided' | 'job_work' | 'purchase_required';
  workAmount?: number; // Processing/work charges

  notes?: string;
}

export interface IPaymentHistory {
  paymentDate?: Date;
  amount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
  remarks?: string;
}

export interface IDeliveryAddress {
  contactPerson?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
  landmark?: string;
}

export interface ICommunication {
  communicationType?: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'visit';
  communicationDate?: Date;
  communicatedBy?: Types.ObjectId;
  subject?: string;
  message?: string;
  attachments: string[];
  followUpRequired?: boolean;
  followUpDate?: Date;
}

// =============================================
// CUSTOMER INTERFACES
// =============================================

export interface ICustomer extends AuditableDocument {
  customerCode: string;
  customerName: string;
  legalName?: string;
  displayName?: string;

  businessInfo: {
    businessType: 'individual' | 'proprietorship' | 'partnership' | 'private_limited' | 'public_limited' | 'llp' | 'trust' | 'society' | 'government';
    industry?: string;
    subIndustry?: string;
    businessDescription?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      twitter?: string;
    };
    establishedYear?: number;
    employeeCount?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
    annualTurnover?: '<1L' | '1L-10L' | '10L-1Cr' | '1Cr-10Cr' | '10Cr+';
  };

  registrationDetails: {
    gstin?: string;
    pan?: string;
    cin?: string;
    udyogAadhar?: string;
    iecCode?: string;
    registrationNumber?: string;
    vatNumber?: string;
    cstNumber?: string;
  };

  contactInfo: {
    primaryPhone: string;
    alternatePhone?: string;
    primaryEmail: string;
    alternateEmail?: string;
    whatsapp?: string;
    fax?: string;
    tollFree?: string;
  };

  addresses: ICustomerAddress[];
  contactPersons: IContactPerson[];

  financialInfo: {
    creditLimit: number;
    creditDays: number;
    securityDeposit: number;
    outstandingAmount: number;
    advanceAmount: number;
    totalPurchases: number;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    paymentTerms?: string;
    preferredPaymentMethod?: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'credit';
    currency: string;
    priceList?: string;
    discountPercentage: number;
    taxExempt: boolean;
    taxExemptionNumber?: string;
  };

  purchaseHistory: {
    firstOrderDate?: Date;
    lastOrderDate?: Date;
    totalOrders: number;
    totalOrderValue: number;
    averageOrderValue: number;
    preferredProducts: string[];
    seasonalPatterns: string[];
    orderFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
  };

  marketing: {
    source?: 'direct' | 'referral' | 'website' | 'social_media' | 'advertisement' | 'exhibition' | 'cold_call' | 'other';
    referredBy?: string;
    marketingConsent: boolean;
    emailMarketing: boolean;
    smsMarketing: boolean;
    whatsappMarketing: boolean;
    lastCommunication?: Date;
    communicationPreference?: 'email' | 'phone' | 'whatsapp' | 'sms' | 'postal';
    language: string;
  };

  relationship: {
    customerType: 'prospect' | 'new' | 'regular' | 'vip' | 'inactive' | 'blocked';
    customerSegment?: 'retail' | 'wholesale' | 'distributor' | 'manufacturer' | 'exporter' | 'government';
    relationshipManager?: Types.ObjectId;
    assignedSalesPerson?: Types.ObjectId;
    customerSince?: Date;
    lastInteraction?: Date;
    nextFollowUp?: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    satisfactionRating?: number;
    loyaltyPoints: number;
  };

  compliance: {
    kycStatus: 'pending' | 'verified' | 'rejected';
    kycDocuments: string[];
    riskCategory: 'low' | 'medium' | 'high';
    blacklisted: boolean;
    blacklistReason?: string;
    complianceNotes?: string;
    lastKycUpdate?: Date;
  };

  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;
}

export interface ICustomerAddress {
  type: 'billing' | 'shipping' | 'office' | 'warehouse';
  isPrimary: boolean;
  contactPerson?: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  gpsCoordinates?: {
    latitude?: number;
    longitude?: number;
  };
  isActive: boolean;
}

export interface IContactPerson {
  name: string;
  designation?: string;
  department?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  whatsapp?: string;
  isPrimary: boolean;
  canPlaceOrders: boolean;
  canMakePayments: boolean;
  notes?: string;
  isActive: boolean;
}

// =============================================
// SUPPLIER INTERFACES
// =============================================

export interface ISupplier extends AuditableDocument {
  supplierCode: string;
  supplierName: string;
  legalName?: string;
  displayName?: string;

  businessInfo: {
    businessType: 'individual' | 'proprietorship' | 'partnership' | 'private_limited' | 'public_limited' | 'llp' | 'trust' | 'society' | 'government';
    industry?: string;
    subIndustry?: string;
    businessDescription?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      twitter?: string;
    };
    establishedYear?: number;
    employeeCount?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
    annualTurnover?: '<1L' | '1L-10L' | '10L-1Cr' | '1Cr-10Cr' | '10Cr+';
    manufacturingCapacity?: string;
  };

  registrationDetails: {
    gstin?: string;
    pan?: string;
    cin?: string;
    udyogAadhar?: string;
    iecCode?: string;
    registrationNumber?: string;
    vatNumber?: string;
    cstNumber?: string;
    msmeNumber?: string;
    factoryLicense?: string;
  };

  contactInfo: {
    primaryPhone: string;
    alternatePhone?: string;
    primaryEmail: string;
    alternateEmail?: string;
    whatsapp?: string;
    fax?: string;
    tollFree?: string;
  };

  addresses: ISupplierAddress[];
  contactPersons: ISupplierContact[];
  productCategories: IProductCategory[];

  financialInfo: {
    paymentTerms?: string;
    creditDays: number;
    securityDeposit: number;
    advancePaid: number;
    outstandingPayable: number;
    totalPurchases: number;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    preferredPaymentMethod?: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card';
    currency: string;
    taxDeductionRate: number;
  };

  bankingDetails: {
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    accountType?: 'savings' | 'current' | 'cc' | 'od';
    upiId?: string;
    isVerified: boolean;
  };

  supplyHistory: {
    firstOrderDate?: Date;
    lastOrderDate?: Date;
    totalOrders: number;
    totalOrderValue: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
    qualityRejectionRate: number;
    averageLeadTime: number;
    suppliedProducts: string[];
  };

  performanceMetrics: IPerformanceMetric[];

  quality: {
    qualityRating?: number;
    qualityGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C';
    certifications: string[];
    qualityAgreements: string[];
    lastQualityAudit?: Date;
    nextQualityAudit?: Date;
    qualityNotes?: string;
    defectRate: number;
    returnRate: number;
  };

  relationship: {
    supplierType: 'manufacturer' | 'trader' | 'distributor' | 'agent' | 'service_provider';
    supplierCategory: 'strategic' | 'preferred' | 'approved' | 'conditional' | 'blacklisted';
    relationshipManager?: Types.ObjectId;
    assignedBuyer?: Types.ObjectId;
    supplierSince?: Date;
    lastInteraction?: Date;
    nextReview?: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    exclusiveSupplier: boolean;
    strategicPartner: boolean;
  };

  compliance: {
    vendorApprovalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
    approvalDate?: Date;
    approvedBy?: Types.ObjectId;
    complianceDocuments: string[];
    riskCategory: 'low' | 'medium' | 'high';
    blacklisted: boolean;
    blacklistReason?: string;
    complianceNotes?: string;
    lastComplianceCheck?: Date;
    nextComplianceCheck?: Date;
    environmentalCompliance: boolean;
    laborCompliance: boolean;
    safetyCompliance: boolean;
  };

  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;
}

export interface ISupplierAddress {
  type: 'office' | 'factory' | 'warehouse' | 'billing';
  isPrimary: boolean;
  contactPerson?: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  gpsCoordinates?: {
    latitude?: number;
    longitude?: number;
  };
  isActive: boolean;
}

export interface ISupplierContact {
  name: string;
  designation?: string;
  department?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  whatsapp?: string;
  isPrimary: boolean;
  canReceiveOrders: boolean;
  canQuoteRates: boolean;
  notes?: string;
  isActive: boolean;
}

export interface IProductCategory {
  category: string;
  subCategory?: string;
  products: string[];
  minimumOrderQuantity?: number;
  leadTime?: number;
  qualityGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C';
  certifications: string[];
  isActive: boolean;
}

export interface IPerformanceMetric {
  metric: string;
  value: number;
  unit?: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  lastUpdated: Date;
}

// =============================================
// FINANCIAL TRANSACTION INTERFACES
// =============================================

export interface IFinancialTransaction extends AuditableDocument {
  transactionNumber: string;
  transactionDate: Date;
  financialYear: string;
  transactionType: 'income' | 'expense' | 'transfer' | 'adjustment' | 'opening_balance' | 'closing_balance';
  category: string;
  subCategory?: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  baseAmount?: number;

  taxDetails: {
    isTaxable: boolean;
    taxIncluded: boolean;
    taxableAmount: number;
    totalTaxAmount: number;
    taxBreakup: ITaxBreakup[];
    hsnCode?: string;
    sacCode?: string;
    placeOfSupply?: string;
    reverseCharge: boolean;
  };

  paymentDetails: {
    paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card' | 'dd' | 'online' | 'adjustment';
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    bankDetails?: IBankDetails;
    paymentReference?: string;
    paymentNotes?: string;
  };

  partyDetails?: {
    partyType?: 'customer' | 'supplier' | 'employee' | 'bank' | 'government' | 'other';
    partyId?: Types.ObjectId;
    partyName?: string;
    partyCode?: string;
    partyGSTIN?: string;
    partyPAN?: string;
  };

  accountDetails?: {
    fromAccount?: IAccountInfo;
    toAccount?: IAccountInfo;
  };

  referenceDocuments?: {
    invoiceId?: Types.ObjectId;
    invoiceNumber?: string;
    purchaseOrderId?: Types.ObjectId;
    purchaseOrderNumber?: string;
    salesOrderId?: Types.ObjectId;
    salesOrderNumber?: string;
    billId?: Types.ObjectId;
    billNumber?: string;
    otherReferences?: string[];
  };

  recurringDetails?: IRecurringDetails;

  reconciliation?: {
    isReconciled: boolean;
    reconciledDate?: Date;
    reconciledBy?: Types.ObjectId;
    bankStatementDate?: Date;
    bankStatementAmount?: number;
    reconciliationNotes?: string;
    discrepancyAmount: number;
  };

  approval?: {
    isRequired: boolean;
    requestedBy?: Types.ObjectId;
    requestedAt?: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    approvalLevel: number;
    approvalNotes?: string;
    status: 'pending' | 'approved' | 'rejected';
  };

  description: string;
  internalNotes?: string;
  tags: string[];
  attachments: string[];

  isReversed: boolean;
  reversedBy?: Types.ObjectId;
  reversedAt?: Date;
  reversalReason?: string;
  originalTransactionId?: Types.ObjectId;
}

export interface ITaxBreakup {
  taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS' | 'TDS' | 'TCS';
  rate: number;
  amount: number;
  taxableAmount: number;
}

export interface IBankDetails {
  bankName?: string;
  branchName?: string;
  accountNumber?: string;
  ifscCode?: string;
  transactionId?: string;
  utrNumber?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  clearanceDate?: Date;
  clearanceStatus?: 'pending' | 'cleared' | 'bounced' | 'cancelled';
}

export interface IAccountInfo {
  accountType?: 'bank' | 'cash' | 'petty_cash' | 'credit_card';
  accountId?: Types.ObjectId;
  accountName?: string;
  accountNumber?: string;
}

export interface IRecurringDetails {
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number;
  startDate?: Date;
  endDate?: Date;
  nextDueDate?: Date;
  totalOccurrences?: number;
  completedOccurrences: number;
  isActive: boolean;
}

// =============================================
// AUDIT LOG INTERFACES
// =============================================

export interface IAuditLog extends BaseDocument {
  companyId: Types.ObjectId;
  userId?: Types.ObjectId;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  impersonatedBy?: Types.ObjectId;

  action: string;
  actionCategory: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'approve' | 'reject';

  resource: string;
  resourceId?: string;
  resourceType?: string;
  parentResource?: {
    type?: string;
    id?: string;
  };

  eventTimestamp: Date;
  eventId: string;
  eventSource: 'web_app' | 'mobile_app' | 'api' | 'system' | 'integration' | 'scheduled_job';
  eventSeverity: 'info' | 'warning' | 'error' | 'critical';

  sessionDetails?: ISessionDetails;
  requestDetails?: IRequestDetails;
  dataChanges?: IDataChange[];
  oldData?: any;
  newData?: any;
  securityContext?: ISecurityContext;

  businessContext?: {
    department?: string;
    process?: string;
    workflow?: string;
    businessRule?: string;
    complianceRequirement?: string;
  };

  result?: {
    status: 'success' | 'failure' | 'partial' | 'pending';
    errorCode?: string;
    errorMessage?: string;
    affectedRecords: number;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
  };

  description: string;
  additionalInfo?: any;
  tags: string[];

  retentionPeriod: number;
  complianceFlags: string[];
  isPersonalData: boolean;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';

  systemInfo?: {
    serverName?: string;
    applicationVersion?: string;
    databaseVersion?: string;
    environment?: 'development' | 'staging' | 'production';
  };
}

export interface ISessionDetails {
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  operatingSystem?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface IRequestDetails {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  requestId?: string;
  correlationId?: string;
  requestBody?: any;
  queryParams?: any;
  headers?: any;
  responseStatus?: number;
  responseTime?: number;
  responseSize?: number;
}

export interface IDataChange {
  field: string;
  oldValue?: any;
  newValue?: any;
  dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
}

export interface ISecurityContext {
  authenticationMethod?: 'password' | 'otp' | '2fa' | 'sso' | 'api_key';
  authenticationStatus?: 'success' | 'failed' | 'locked' | 'expired';
  permissionLevel?: string;
  accessAttempts: number;
  riskScore?: number;
  threatIndicators?: string[];
  securityFlags?: string[];
}

// =============================================
// ROLE & PERMISSION INTERFACES
// =============================================

export interface IRole extends AuditableDocument {
  roleName: string;
  roleCode: string;
  displayName?: string;
  description?: string;
  roleType: 'system' | 'custom' | 'department' | 'project' | 'temporary';
  roleLevel: 'super_admin' | 'admin' | 'manager' | 'supervisor' | 'executive' | 'operator' | 'helper';
  department?: string;
  permissions: IPermission;
  dynamicPermissions: IDynamicPermission[];
  parentRole?: Types.ObjectId;
  childRoles: Types.ObjectId[];
  inheritsFrom: Types.ObjectId[];
  canDelegate: boolean;
  delegationLevel: number;
  accessRestrictions: IAccessRestrictions;
  dataAccess: IDataAccess;
  isSystemRole: boolean;
  isActive: boolean;
  isDefault: boolean;
  maxUsers?: number;
  currentUsers: number;
  requiresApproval: boolean;
  approvalWorkflow: IApprovalWorkflow[];
  lastUsed?: Date;
  usageCount: number;
  notes?: string;
  tags: string[];
  customFields?: any;
}

export interface IPermission {
  system: ISystemPermissions;
  users: IUserPermissions;
  company: ICompanyPermissions;
  inventory: IInventoryPermissions;
  production: IProductionPermissions;
  sales: ISalesPermissions;
  purchase: IPurchasePermissions;
  financial: IFinancialPermissions;
  security: ISecurityPermissions;
  hr: IHRPermissions;
  quality: IQualityPermissions;
  maintenance: IMaintenancePermissions;
  reports: IReportsPermissions;
}

export interface IDynamicPermission {
  module: string;
  resource: string;
  actions: IPermissionAction[];
  customPermissions?: any;
  isActive: boolean;
}

export interface IPermissionAction {
  action: string;
  allowed: boolean;
  conditions?: any;
  restrictions?: any;
}

export interface IAccessRestrictions {
  ipWhitelist: string[];
  timeRestrictions: ITimeRestrictions;
  locationRestrictions: string[];
  deviceRestrictions: string[];
}

export interface ITimeRestrictions {
  allowedDays: string[];
  allowedHours: {
    start?: string;
    end?: string;
  };
}

export interface IDataAccess {
  ownDataOnly: boolean;
  departmentDataOnly: boolean;
  branchDataOnly: boolean;
  customDataFilters?: any;
  fieldLevelRestrictions?: any;
}

export interface IApprovalWorkflow {
  level: number;
  approverRole?: Types.ObjectId;
  isRequired: boolean;
}

// Permission Interfaces
export interface ISystemPermissions {
  userManagement: boolean;
  roleManagement: boolean;
  companySettings: boolean;
  systemSettings: boolean;
  backupRestore: boolean;
  auditLogs: boolean;
  systemReports: boolean;
}

export interface IUserPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  activate: boolean;
  deactivate: boolean;
  resetPassword: boolean;
  impersonate: boolean;
  viewSalary: boolean;
  editSalary: boolean;
}

export interface ICompanyPermissions {
  view: boolean;
  edit: boolean;
  settings: boolean;
  branches: boolean;
  departments: boolean;
  hierarchy: boolean;
}

export interface IInventoryPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  stockAdjustment: boolean;
  stockTransfer: boolean;
  viewReports: boolean;
  exportData: boolean;
  importData: boolean;
  viewCosts: boolean;
  editCosts: boolean;
}

export interface IProductionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  startProcess: boolean;
  stopProcess: boolean;
  qualityCheck: boolean;
  viewReports: boolean;
  scheduleOrders: boolean;
  manageBOM: boolean;
  viewCosts: boolean;
}

export interface ISalesPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  dispatch: boolean;
  viewReports: boolean;
  manageCustomers: boolean;
  viewPricing: boolean;
  editPricing: boolean;
  discounts: boolean;
  creditManagement: boolean;
}

export interface IPurchasePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  receive: boolean;
  viewReports: boolean;
  manageSuppliers: boolean;
  negotiateRates: boolean;
  paymentApproval: boolean;
}

export interface IFinancialPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  bankTransactions: boolean;
  viewReports: boolean;
  reconciliation: boolean;
  taxManagement: boolean;
  budgetManagement: boolean;
  expenseApproval: boolean;
  viewProfitLoss: boolean;
}

export interface ISecurityPermissions {
  gateManagement: boolean;
  visitorManagement: boolean;
  vehicleTracking: boolean;
  cctvAccess: boolean;
  emergencyResponse: boolean;
  securityReports: boolean;
  incidentManagement: boolean;
  accessControl: boolean;
  patrolManagement: boolean;
}

export interface IHRPermissions {
  viewEmployees: boolean;
  manageEmployees: boolean;
  manageAttendance: boolean;
  manageSalary: boolean;
  manageLeaves: boolean;
  viewReports: boolean;
  recruitment: boolean;
  performance: boolean;
  training: boolean;
  disciplinary: boolean;
}

export interface IQualityPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  approve: boolean;
  inspections: boolean;
  certifications: boolean;
  nonConformance: boolean;
  corrective: boolean;
  preventive: boolean;
  viewReports: boolean;
}

export interface IMaintenancePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  approve: boolean;
  schedule: boolean;
  workOrders: boolean;
  preventive: boolean;
  breakdown: boolean;
  spareparts: boolean;
  viewReports: boolean;
}

export interface IReportsPermissions {
  inventory: boolean;
  production: boolean;
  sales: boolean;
  purchase: boolean;
  financial: boolean;
  hr: boolean;
  quality: boolean;
  security: boolean;
  custom: boolean;
  export: boolean;
  schedule: boolean;
}

// =============================================
// VISITOR MANAGEMENT INTERFACES
// =============================================

export interface IVisitor extends AuditableDocument {
  visitorId: string;
  visitorNumber: string;
  personalInfo: IVisitorPersonalInfo;
  contactInfo: IVisitorContactInfo;
  address: IVisitorAddress;
  organizationInfo: IVisitorOrganizationInfo;
  visitInfo: IVisitInfo;
  hostInfo: IHostInfo;
  documents: IVisitorDocument[];
  approvals: IVisitorApproval[];
  overallApprovalStatus: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  entries: IVisitorEntry[];
  exits: IVisitorExit[];
  currentStatus: 'scheduled' | 'approved' | 'checked_in' | 'inside' | 'checked_out' | 'completed' | 'no_show' | 'cancelled';
  securityInfo: IVisitorSecurityInfo;
  vehicleInfo: IVisitorVehicleInfo;
  healthInfo: IVisitorHealthInfo;
  feedback: IVisitorFeedback;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;

  // Methods
  isCurrentlyInside?(): boolean;
  getLastEntry?(): IVisitorEntry | null;
  getLastExit?(): IVisitorExit | null;
  getCurrentDuration?(): number;
  isOverstaying?(): boolean;
}

export interface IVisitorPersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: Date;
  nationality?: string;
  profilePhoto?: string;
  signature?: string;
}

export interface IVisitorContactInfo {
  primaryPhone: string;
  alternatePhone?: string;
  email?: string;
  whatsapp?: string;
}

export interface IVisitorAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
}

export interface IVisitorOrganizationInfo {
  companyName?: string;
  designation?: string;
  department?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  businessCard?: string;
  isEmployee: boolean;
  employeeId?: string;
}

export interface IVisitInfo {
  visitType: 'business' | 'interview' | 'meeting' | 'delivery' | 'maintenance' | 'audit' | 'training' | 'personal' | 'official' | 'other';
  visitPurpose: string;
  visitCategory: 'vip' | 'regular' | 'contractor' | 'vendor' | 'government' | 'media' | 'student' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedDuration?: number;
  scheduledDateTime?: Date;
  scheduledEndDateTime?: Date;
  isRecurringVisit: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  visitNotes?: string;
}

export interface IHostInfo {
  hostId: Types.ObjectId;
  hostName: string;
  hostDepartment: string;
  hostDesignation?: string;
  hostPhone?: string;
  hostEmail?: string;
  alternateHostId?: Types.ObjectId;
  alternateHostName?: string;
  meetingLocation: string;
  meetingRoom?: string;
  specialInstructions?: string;
}

export interface IVisitorDocument {
  documentType: 'aadhar' | 'pan' | 'driving_license' | 'passport' | 'voter_id' | 'company_id' | 'other';
  documentNumber: string;
  documentUrl?: string;
  isVerified: boolean;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface IVisitorApproval {
  approvalLevel: number;
  approverType: 'employee' | 'security' | 'manager' | 'admin';
  approverId: Types.ObjectId;
  approverName: string;
  approverDepartment?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  approvalNotes?: string;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
}

export interface IVisitorEntry {
  entryDateTime: Date;
  entryGate: string;
  securityGuardId: Types.ObjectId;
  securityGuardName: string;
  entryMethod: 'manual' | 'qr_code' | 'rfid' | 'biometric' | 'face_recognition';
  entryPhoto?: string;
  temperatureCheck?: number;
  healthDeclaration: boolean;
  belongingsChecked: boolean;
  belongingsList: string[];
  escortRequired: boolean;
  escortId?: Types.ObjectId;
  escortName?: string;
  entryNotes?: string;
  deviceId?: string;
  ipAddress?: string;
  gpsLocation?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface IVisitorExit {
  exitDateTime: Date;
  exitGate: string;
  securityGuardId: Types.ObjectId;
  securityGuardName: string;
  exitMethod: 'manual' | 'qr_code' | 'rfid' | 'biometric' | 'face_recognition';
  exitPhoto?: string;
  belongingsReturned: boolean;
  belongingsNotes?: string;
  feedbackRating?: number;
  feedbackComments?: string;
  exitNotes?: string;
  deviceId?: string;
  ipAddress?: string;
  gpsLocation?: {
    latitude?: number;
    longitude?: number;
  };
  totalDuration?: number;
  overstayReason?: string;
}

export interface IVisitorSecurityInfo {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  blacklisted: boolean;
  blacklistReason?: string;
  blacklistedBy?: Types.ObjectId;
  blacklistedAt?: Date;
  securityNotes?: string;
  specialRequirements: string[];
  accessAreas: string[];
  restrictedAreas: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface IVisitorVehicleInfo {
  hasVehicle: boolean;
  vehicleId?: Types.ObjectId;
  vehicleNumber?: string;
  vehicleType?: 'car' | 'bike' | 'truck' | 'bus' | 'auto' | 'cycle' | 'other';
  driverName?: string;
  driverPhone?: string;
  parkingLocation?: string;
  parkingSlot?: string;
}

export interface IVisitorHealthInfo {
  vaccinationStatus?: 'not_vaccinated' | 'partially_vaccinated' | 'fully_vaccinated' | 'booster_taken';
  vaccinationCertificate?: string;
  lastCovidTest?: Date;
  covidTestResult?: 'positive' | 'negative' | 'pending';
  healthDeclaration: boolean;
  temperatureRecords: ITemperatureRecord[];
  maskRequired: boolean;
  sanitizationDone: boolean;
}

export interface ITemperatureRecord {
  temperature?: number;
  recordedAt: Date;
  recordedBy?: Types.ObjectId;
}

export interface IVisitorFeedback {
  overallRating?: number;
  securityRating?: number;
  hospitalityRating?: number;
  facilityRating?: number;
  comments?: string;
  suggestions?: string;
  wouldRecommend?: boolean;
  feedbackDate?: Date;
}

// =============================================
// VEHICLE MANAGEMENT INTERFACES
// =============================================

export interface IVehicle extends AuditableDocument {
  vehicleId: string;
  vehicleNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  vehicleInfo: IVehicleInfo;
  vehicleType: 'car' | 'bike' | 'truck' | 'bus' | 'auto' | 'tempo' | 'trailer' | 'crane' | 'jcb' | 'tractor' | 'cycle' | 'other';
  vehicleCategory: 'company_owned' | 'employee_owned' | 'visitor' | 'contractor' | 'vendor' | 'government' | 'emergency' | 'other';
  vehicleSubType?: string;
  ownerInfo: IVehicleOwnerInfo;
  driverInfo: IVehicleDriverInfo;
  documents: IVehicleDocument[];
  currentStatus: 'outside' | 'at_gate' | 'inside' | 'parked' | 'in_transit' | 'maintenance' | 'blocked' | 'unknown';
  currentLocation: IVehicleLocation;
  entries: IVehicleEntry[];
  exits: IVehicleExit[];
  totalVisits: number;
  lastVisitDate?: Date;
  securityInfo: IVehicleSecurityInfo;
  maintenanceInfo: IVehicleMaintenanceInfo;
  analytics: IVehicleAnalytics;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;
}

export interface IVehicleInfo {
  make: string;
  model: string;
  variant?: string;
  year: number;
  color: string;
  fuelType: 'petrol' | 'diesel' | 'cng' | 'lpg' | 'electric' | 'hybrid';
  transmission?: 'manual' | 'automatic' | 'cvt' | 'amt';
  seatingCapacity?: number;
  loadCapacity?: number;
  mileage?: number;
  engineCapacity?: number;
}

export interface IVehicleOwnerInfo {
  ownerType: 'company' | 'employee' | 'visitor' | 'contractor' | 'vendor' | 'other';
  ownerId?: Types.ObjectId;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerAddress?: string;
  relationship?: string;
  isAuthorized: boolean;
  authorizedBy?: Types.ObjectId;
  authorizedAt?: Date;
}

export interface IVehicleDriverInfo {
  driverName: string;
  driverPhone: string;
  driverLicense?: string;
  licenseExpiry?: Date;
  driverPhoto?: string;
  isRegularDriver: boolean;
  driverRating?: number;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface IVehicleDocument {
  documentType: 'rc' | 'insurance' | 'puc' | 'permit' | 'fitness' | 'tax_receipt' | 'other';
  documentNumber: string;
  documentUrl?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  isVerified: boolean;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  notes?: string;
}

export interface IVehicleLocation {
  area?: string;
  zone?: string;
  parkingSlot?: string;
  building?: string;
  floor?: string;
  gpsCoordinates?: {
    latitude?: number;
    longitude?: number;
  };
  lastUpdated: Date;
}

export interface IVehicleEntry {
  entryDateTime: Date;
  entryGate: string;
  securityGuardId: Types.ObjectId;
  securityGuardName: string;
  entryMethod: 'manual' | 'rfid' | 'qr_code' | 'anpr' | 'barcode';
  entryPhoto?: string;
  odometerReading?: number;
  fuelLevel?: 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';
  vehicleCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  damageNotes?: string;
  damagePhotos: string[];
  parkingLocation?: string;
  parkingSlot?: string;
  weighbridgeWeight?: number;
  sealNumbers: string[];
  gatePass?: IGatePass;
  entryNotes?: string;
  deviceId?: string;
  ipAddress?: string;
  gpsLocation?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface IVehicleExit {
  exitDateTime: Date;
  exitGate: string;
  securityGuardId: Types.ObjectId;
  securityGuardName: string;
  exitMethod: 'manual' | 'rfid' | 'qr_code' | 'anpr' | 'barcode';
  exitPhoto?: string;
  odometerReading?: number;
  fuelLevel?: 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';
  vehicleCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  damageNotes?: string;
  damagePhotos: string[];
  weighbridgeWeight?: number;
  sealNumbers: string[];
  sealVerification: boolean;
  gatePassVerified: boolean;
  exitNotes?: string;
  deviceId?: string;
  ipAddress?: string;
  gpsLocation?: {
    latitude?: number;
    longitude?: number;
  };
  totalDuration?: number;
  totalDistance?: number;
}

export interface IGatePass {
  gatePassNumber: string;
  gatePassType: 'inward' | 'outward' | 'temporary' | 'permanent' | 'returnable' | 'non_returnable';
  issuedBy: Types.ObjectId;
  issuedAt: Date;
  validFrom: Date;
  validUntil: Date;
  purpose: string;
  authorizedBy?: Types.ObjectId;
  authorizedAt?: Date;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  items: IGatePassItem[];
  specialInstructions?: string;
  qrCode?: string;
  usedAt?: Date;
  usedBy?: Types.ObjectId;
  notes?: string;
}

export interface IGatePassItem {
  itemName: string;
  quantity: number;
  unit?: string;
  description?: string;
  value?: number;
}

export interface IVehicleSecurityInfo {
  accessLevel: 'restricted' | 'limited' | 'general' | 'vip';
  allowedAreas: string[];
  restrictedAreas: string[];
  requiresEscort: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  blacklisted: boolean;
  blacklistReason?: string;
  blacklistedBy?: Types.ObjectId;
  blacklistedAt?: Date;
  securityNotes?: string;
  specialInstructions?: string;
}

export interface IVehicleMaintenanceInfo {
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  serviceProvider?: string;
  maintenanceNotes?: string;
  warrantyExpiry?: Date;
  isUnderWarranty: boolean;
}

export interface IVehicleAnalytics {
  totalEntries: number;
  totalExits: number;
  averageStayDuration: number;
  longestStayDuration: number;
  shortestStayDuration: number;
  totalDistanceTraveled: number;
  frequencyScore: number;
  lastAnalyticsUpdate: Date;
}

// =============================================
// SECURITY LOG INTERFACES
// =============================================

export interface ISecurityLog extends AuditableDocument {
  logId: string;
  logNumber: string;
  eventDateTime: Date;
  eventType: 'incident' | 'patrol' | 'cctv_event' | 'access_event' | 'alarm' | 'maintenance' | 'training' | 'drill' | 'visitor_management' | 'vehicle_management' | 'other';
  eventCategory: 'security' | 'safety' | 'operational' | 'maintenance' | 'compliance' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  location: ISecurityLocation;
  personnel: ISecurityPersonnel;
  incident?: IIncident;
  patrol?: IPatrol;
  cctvEvent?: ICCTVEvent;
  accessEvent?: IAccessEvent;
  description: string;
  detailedDescription?: string;
  immediateAction?: string;
  followUpAction?: string;
  preventiveMeasures?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated' | 'cancelled';
  resolution?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  closedBy?: Types.ObjectId;
  closedAt?: Date;
  evidence: ISecurityEvidence;
  impact: ISecurityImpact;
  externalInvolvement: IExternalInvolvement;
  compliance: ISecurityCompliance;
  notifications: ISecurityNotifications;
  weatherConditions?: string;
  lightingConditions?: 'daylight' | 'artificial' | 'dim' | 'dark';
  crowdLevel?: 'empty' | 'light' | 'moderate' | 'heavy' | 'overcrowded';
  specialCircumstances?: string;
  lessonsLearned?: string;
  recommendations?: string;
  tags: string[];
  customFields?: any;
  relatedLogIds: Types.ObjectId[];
  parentLogId?: Types.ObjectId;
  childLogIds: Types.ObjectId[];
  isActive: boolean;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
}

export interface ISecurityLocation {
  area: string;
  zone?: string;
  building?: string;
  floor?: string;
  room?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  landmark?: string;
}

export interface ISecurityPersonnel {
  reportedBy: Types.ObjectId;
  reporterName: string;
  reporterRole?: string;
  reporterDepartment?: string;
  assignedTo?: Types.ObjectId;
  assigneeName?: string;
  supervisorId?: Types.ObjectId;
  supervisorName?: string;
  witnessIds: Types.ObjectId[];
  witnessNames: string[];
}

export interface IIncident {
  incidentType: 'theft' | 'vandalism' | 'trespassing' | 'fire' | 'medical' | 'accident' | 'suspicious_activity' | 'violence' | 'harassment' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  reportedBy: Types.ObjectId;
  reportedAt: Date;
  witnessIds: Types.ObjectId[];
  witnessNames: string[];
  evidenceUrls: string[];
  actionTaken?: string;
  actionTakenBy?: Types.ObjectId;
  actionTakenAt?: Date;
  status: 'reported' | 'investigating' | 'resolved' | 'closed' | 'escalated';
  resolution?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
  policeInvolved: boolean;
  firNumber?: string;
  insuranceClaim: boolean;
  claimNumber?: string;
  estimatedLoss?: number;
  actualLoss?: number;
}

export interface IPatrol {
  patrolType: 'routine' | 'random' | 'incident_response' | 'special' | 'emergency';
  patrolRoute: string;
  patrolAreas: string[];
  startTime: Date;
  endTime?: Date;
  patrolOfficerId: Types.ObjectId;
  patrolOfficerName: string;
  backupOfficerId?: Types.ObjectId;
  backupOfficerName?: string;
  checkpoints: IPatrolCheckpoint[];
  observations?: string;
  issuesFound: string[];
  actionsTaken: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'interrupted' | 'cancelled';
  duration?: number;
  distanceCovered?: number;
  weatherConditions?: string;
  equipmentUsed: string[];
  reportSubmitted: boolean;
  reportUrl?: string;
}

export interface IPatrolCheckpoint {
  checkpointId: string;
  checkpointName: string;
  expectedTime?: Date;
  actualTime?: Date;
  status: 'completed' | 'missed' | 'delayed';
  observations?: string;
  photos: string[];
  issues: string[];
}

export interface ICCTVEvent {
  cameraId: string;
  cameraName: string;
  cameraLocation: string;
  eventType: 'motion_detected' | 'person_detected' | 'vehicle_detected' | 'intrusion' | 'loitering' | 'crowd_detected' | 'object_left' | 'object_removed' | 'line_crossing' | 'area_entered' | 'area_exited' | 'face_recognized' | 'license_plate_read' | 'alarm_triggered';
  detectionTime: Date;
  confidence?: number;
  boundingBox?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  snapshotUrl?: string;
  videoClipUrl?: string;
  metadata?: any;
  isProcessed: boolean;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  actionRequired: boolean;
  actionTaken?: string;
  falseAlarm: boolean;
  relatedIncidentId?: Types.ObjectId;
}

export interface IAccessEvent {
  accessType: 'door' | 'gate' | 'turnstile' | 'barrier' | 'elevator' | 'parking';
  accessPointId: string;
  accessPointName: string;
  location: string;
  eventType: 'access_granted' | 'access_denied' | 'door_opened' | 'door_closed' | 'door_forced' | 'door_held_open' | 'tailgating_detected' | 'card_read' | 'biometric_scan' | 'manual_override';
  eventTime: Date;
  userId?: Types.ObjectId;
  userName?: string;
  visitorId?: Types.ObjectId;
  visitorName?: string;
  credentialType?: 'card' | 'biometric' | 'pin' | 'mobile' | 'qr_code' | 'manual';
  credentialId?: string;
  accessResult: 'success' | 'denied' | 'error' | 'timeout';
  denialReason?: string;
  deviceId?: string;
  ipAddress?: string;
  photo?: string;
  isAuthorized: boolean;
  overrideBy?: Types.ObjectId;
  overrideReason?: string;
}

export interface ISecurityEvidence {
  photos: string[];
  videos: string[];
  documents: string[];
  audioRecordings: string[];
  cctvFootage: string[];
  screenshots: string[];
  otherFiles: string[];
}

export interface ISecurityImpact {
  peopleAffected: number;
  propertyDamage: boolean;
  estimatedLoss: number;
  actualLoss: number;
  businessImpact?: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  reputationImpact?: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  operationalImpact?: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
}

export interface IExternalInvolvement {
  policeInformed: boolean;
  policeStationName?: string;
  firNumber?: string;
  firDate?: Date;
  fireServiceCalled: boolean;
  ambulanceCalled: boolean;
  insuranceInformed: boolean;
  claimNumber?: string;
  mediaInvolved: boolean;
  legalActionRequired: boolean;
  regulatoryReporting: boolean;
}

export interface ISecurityCompliance {
  complianceIssue: boolean;
  regulationViolated: string[];
  auditRequired: boolean;
  auditDate?: Date;
  auditBy?: string;
  auditFindings?: string;
  correctiveActions: string[];
  preventiveActions: string[];
}

export interface ISecurityNotifications {
  managementNotified: boolean;
  managementNotifiedAt?: Date;
  clientNotified: boolean;
  clientNotifiedAt?: Date;
  authoritiesNotified: boolean;
  authoritiesNotifiedAt?: Date;
  mediaStatement?: string;
  internalCommunication?: string;
}

// =============================================
// WAREHOUSE MANAGEMENT INTERFACES
// =============================================

export interface IWarehouse extends AuditableDocument {
  warehouseCode: string;
  warehouseName: string;
  displayName?: string;
  description?: string;
  address: IWarehouseAddress;
  contactInfo: IWarehouseContactInfo;
  warehouseType: 'distribution' | 'manufacturing' | 'retail' | 'cold_storage' | 'hazardous' | 'bonded' | 'transit' | 'cross_dock';
  ownershipType: 'owned' | 'leased' | 'rented' | 'shared';
  operationType: 'automated' | 'semi_automated' | 'manual';
  specifications: IWarehouseSpecifications;
  capacity: IWarehouseCapacity;
  currentUtilization: IWarehouseUtilization;
  zones: IWarehouseZone[];
  totalZones: number;
  totalLocations: number;
  management: IWarehouseManagement;
  operatingHours: IOperatingHours;
  equipment: IWarehouseEquipment;
  systems: IWarehouseSystems;
  compliance: IWarehouseCompliance;
  financials: IWarehouseFinancials;
  metrics: IWarehouseMetrics;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;
}

export interface IWarehouseAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  gpsCoordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface IWarehouseContactInfo {
  primaryPhone: string;
  alternatePhone?: string;
  email?: string;
  fax?: string;
}

export interface IWarehouseSpecifications {
  totalArea: number;
  storageArea: number;
  officeArea: number;
  yardArea: number;
  height: number;
  dockDoors: number;
  floors: number;
  constructionType?: string;
  roofType?: string;
  floorType?: string;
}

export interface IWarehouseCapacity {
  maxWeight: number;
  maxVolume: number;
  maxPallets: number;
  maxSKUs: number;
}

export interface IWarehouseUtilization {
  currentWeight: number;
  currentVolume: number;
  currentPallets: number;
  currentSKUs: number;
  utilizationPercentage: number;
  lastUpdated: Date;
}

export interface IWarehouseZone {
  zoneCode: string;
  zoneName: string;
  zoneType: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'staging' | 'quarantine' | 'returns';
  description?: string;
  area: number;
  managerId?: Types.ObjectId;
  managerName?: string;
  locations: IWarehouseLocation[];
  totalLocations: number;
  occupiedLocations: number;
  utilizationPercentage: number;
  accessRestrictions: IAccessRestrictions;
  safetyRequirements: ISafetyRequirements;
  isActive: boolean;
  notes?: string;
}

export interface IWarehouseLocation {
  locationCode: string;
  locationName: string;
  locationType: 'rack' | 'bin' | 'shelf' | 'floor' | 'yard' | 'dock' | 'staging';
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  capacity: {
    maxWeight: number;
    maxVolume: number;
    maxItems: number;
  };
  currentUtilization: {
    currentWeight: number;
    currentVolume: number;
    currentItems: number;
  };
  restrictions: ILocationRestrictions;
  equipment: string[];
  barcode?: string;
  qrCode?: string;
  isActive: boolean;
  notes?: string;
}

export interface ILocationRestrictions {
  itemTypes: string[];
  hazardousAllowed: boolean;
  temperatureControlled: boolean;
  temperatureRange?: {
    min?: number;
    max?: number;
  };
  humidityControlled: boolean;
  humidityRange?: {
    min?: number;
    max?: number;
  };
}

export interface ISafetyRequirements {
  ppe: string[];
  safetyTraining: string[];
  hazardLevel: 'low' | 'medium' | 'high';
}

export interface IWarehouseManagement {
  warehouseManagerId?: Types.ObjectId;
  warehouseManagerName?: string;
  assistantManagerId?: Types.ObjectId;
  assistantManagerName?: string;
  supervisorIds: Types.ObjectId[];
  totalStaff: number;
  workingShifts: {
    shift1: IWorkingShift;
    shift2: IWorkingShift;
    shift3: IWorkingShift;
  };
}

export interface IWorkingShift {
  name: string;
  startTime: string;
  endTime: string;
  staffCount: number;
}

export interface IOperatingHours {
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
}

export interface IDaySchedule {
  start?: string;
  end?: string;
  isOpen: boolean;
}

export interface IWarehouseEquipment {
  forklifts: number;
  cranes: number;
  conveyors: number;
  scanners: number;
  computers: number;
  printers: number;
  scales: number;
  other: string[];
}

export interface IWarehouseSystems {
  wms: boolean;
  wcs: boolean;
  rfid: boolean;
  barcode: boolean;
  voicePicking: boolean;
  automation: boolean;
  edi: boolean;
  erp: boolean;
}

export interface IWarehouseCompliance {
  iso9001: boolean;
  iso14001: boolean;
  ohsas18001: boolean;
  fssai: boolean;
  gmp: boolean;
  haccp: boolean;
  customsClearance: boolean;
  fireNoC: boolean;
  pollutionClearance: boolean;
  licenses: string[];
  certifications: string[];
  lastAuditDate?: Date;
  nextAuditDate?: Date;
}

export interface IWarehouseFinancials {
  monthlyRent: number;
  maintenanceCost: number;
  utilityCost: number;
  staffCost: number;
  operatingCost: number;
  costPerSqFt: number;
  revenuePerSqFt: number;
}

export interface IWarehouseMetrics {
  inventoryTurnover: number;
  orderFulfillmentRate: number;
  accuracyRate: number;
  onTimeDelivery: number;
  costPerOrder: number;
  productivityPerEmployee: number;
  damageRate: number;
  lastCalculated: Date;
}

// =============================================
// INVOICE INTERFACES
// =============================================

export interface IInvoice extends AuditableDocument {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  financialYear: string;
  invoiceType: 'sales' | 'service' | 'proforma' | 'credit_note' | 'debit_note' | 'advance' | 'final';
  invoiceCategory: 'b2b' | 'b2c' | 'export' | 'import' | 'sez' | 'deemed_export';
  isReverseCharge: boolean;
  placeOfSupply: string;
  customer: IInvoiceCustomer;
  references: IInvoiceReferences;
  items: IInvoiceItem[];
  amounts: IInvoiceAmounts;
  taxDetails: IInvoiceTaxDetails;
  paymentTerms: IPaymentTerm;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'credit' | 'mixed';
  bankDetails: IBankDetails;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  sentAt?: Date;
  sentBy?: Types.ObjectId;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'refunded';
  paidAmount: number;
  outstandingAmount: number;
  lastPaymentDate?: Date;
  paymentHistory: IInvoicePaymentHistory[];
  eInvoice: IEInvoiceDetails;
  eWayBill: IEWayBillDetails;
  terms?: string;
  notes?: string;
  internalNotes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  salesPersonId?: Types.ObjectId;
  salesPersonName?: string;
  isActive: boolean;
}

export interface IInvoiceCustomer {
  customerId: Types.ObjectId;
  customerCode: string;
  customerName: string;
  gstin?: string;
  pan?: string;
  billingAddress: IInvoiceAddress;
  shippingAddress: IInvoiceAddress;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface IInvoiceAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IInvoiceReferences {
  salesOrderId?: Types.ObjectId;
  salesOrderNumber?: string;
  quotationId?: Types.ObjectId;
  quotationNumber?: string;
  deliveryNoteNumber?: string;
  purchaseOrderNumber?: string;
  purchaseOrderDate?: Date;
  dispatchDocumentNumber?: string;
  dispatchedThrough?: string;
  destination?: string;
  vehicleNumber?: string;
  lrNumber?: string;
  lrDate?: Date;
}

export interface IInvoiceItem {
  itemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  description?: string;
  hsnCode?: string;
  sacCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: {
    type: 'percentage' | 'amount';
    value: number;
  };
  discountAmount: number;
  taxableAmount: number;
  taxBreakup: ITaxBreakup[];
  totalTaxAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface IInvoiceAmounts {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalTaxAmount: number;
  transportCharges?: number;
  packingCharges?: number;
  otherCharges?: number;
  roundingAdjustment: number;
  grandTotal: number;
  advanceReceived: number;
  balanceAmount: number;
}

export interface IInvoiceTaxDetails {
  taxBreakup: ITaxBreakup[];
  totalTaxAmount: number;
  tdsAmount: number;
  tcsAmount: number;
}

export interface IPaymentTerm {
  termType: 'immediate' | 'net' | 'eom' | 'custom';
  days: number;
  description?: string;
  dueDate?: Date;
  earlyPaymentDiscount?: {
    percentage: number;
    days: number;
  };
}

export interface IInvoicePaymentHistory {
  paymentId?: Types.ObjectId;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface IEInvoiceDetails {
  isEInvoiceApplicable: boolean;
  irn?: string;
  ackNumber?: string;
  ackDate?: Date;
  qrCode?: string;
  signedInvoice?: string;
  signedQrCode?: string;
  status: 'pending' | 'generated' | 'cancelled';
  errorMessage?: string;
}

export interface IEWayBillDetails {
  isEWayBillRequired: boolean;
  eWayBillNumber?: string;
  generatedDate?: Date;
  validUntil?: Date;
  vehicleNumber?: string;
  transporterId?: string;
  transporterName?: string;
  distance?: number;
  status: 'pending' | 'generated' | 'cancelled';
}

// =============================================
// PURCHASE ORDER INTERFACES
// =============================================

export interface IPurchaseOrder extends AuditableDocument {
  poNumber: string;
  poDate: Date;
  expectedDeliveryDate: Date;
  financialYear: string;
  poType: 'standard' | 'blanket' | 'contract' | 'planned' | 'emergency' | 'service' | 'capital';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'raw_material' | 'finished_goods' | 'consumables' | 'services' | 'capital_goods' | 'maintenance';
  supplier?: IPOSupplier; // Optional - can have either supplier OR agent
  agent?: IPOAgent;
  deliveryInfo: IPODeliveryInfo;
  references: IPOReferences;
  items: IPurchaseOrderItem[];
  amounts: IPOAmounts;
  taxDetails: IPOTaxDetails;
  paymentTerms: IPOPaymentTerms;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  deliverySchedules: IDeliverySchedule[];
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled' | 'pending_approval' | 'sent' | 'acknowledged' | 'in_progress' | 'partially_received' | 'completed' | 'closed';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalWorkflow: IPOApprovalWorkflow[];
  sentAt?: Date;
  sentBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  orderedAt?: Date;
  orderedBy?: Types.ObjectId;
  receivedAt?: Date;
  receivedBy?: Types.ObjectId;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  receivingStatus: 'pending' | 'partial' | 'completed' | 'over_received';
  totalReceived: number;
  totalPending: number;
  lastReceivedDate?: Date;
  qualityRequirements: IQualityRequirements;
  performance: IPOPerformance;
  terms?: string;
  notes?: string;
  paymentNotes?: string;
  internalNotes?: string;
  specialInstructions?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  buyerId?: Types.ObjectId;
  buyerName?: string;
  departmentId?: Types.ObjectId;
  departmentName?: string;
  isActive: boolean;
  
  // Instance methods
  isOverdue(): boolean;
  getDaysOverdue(): number;
  calculateTotals(): IPurchaseOrder;
  addReceiving(itemId: string, receivedQuantity: number, rejectedQuantity?: number): Promise<IPurchaseOrder>;
}

export interface IPOSupplier {
  supplierId?: Types.ObjectId;
  supplierCode?: string;
  supplierName?: string;
  gstin?: string;
  pan?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: IInvoiceAddress;
}

export interface IPOAgent {
  agentId?: Types.ObjectId;
  agentCode?: string;
  agentName?: string;
  agentContactNumber?: string;
}

export interface IPODeliveryInfo {
  deliveryAddress: IInvoiceAddress;
  warehouseId?: Types.ObjectId;
  warehouseName?: string;
  contactPerson: string;
  contactPhone: string;
  deliveryInstructions?: string;
  workingHours?: string;
  deliveryType: 'standard' | 'express' | 'scheduled';
}

export interface IPOReferences {
  requisitionId?: Types.ObjectId;
  requisitionNumber?: string;
  quotationId?: Types.ObjectId;
  quotationNumber?: string;
  contractId?: Types.ObjectId;
  contractNumber?: string;
  budgetCode?: string;
  projectCode?: string;
  costCenter?: string;
}

export interface IPurchaseOrderItem {
  itemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  description?: string;
  specifications?: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: {
    type: 'percentage' | 'amount';
    value: number;
  };
  discountAmount: number;
  taxableAmount: number;
  taxBreakup: ITaxBreakup[];
  totalTaxAmount: number;
  lineTotal: number;
  receivedQuantity: number;
  pendingQuantity: number;
  rejectedQuantity: number;
  deliveryDate?: Date;
  notes?: string;
}

export interface IPOAmounts {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalTaxAmount: number;
  freightCharges: number;
  packingCharges: number;
  otherCharges: number;
  roundingAdjustment: number;
  grandTotal: number;
}

export interface IPOTaxDetails {
  placeOfSupply: string;
  isReverseCharge: boolean;
  taxBreakup: ITaxBreakup[];
  totalTaxAmount: number;
}

export interface IPOPaymentTerms {
  termType: 'advance' | 'net' | 'cod' | 'credit' | 'milestone';
  days: number;
  advancePercentage: number;
  description?: string;
  milestones: IPOMilestone[];
}

export interface IPOMilestone {
  milestone: string;
  percentage: number;
  amount: number;
  dueDate: Date;
}

export interface IDeliverySchedule {
  scheduleNumber: string;
  deliveryDate: Date;
  items: IDeliveryScheduleItem[];
  deliveryAddress: IInvoiceAddress;
  contactPerson?: string;
  contactPhone?: string;
  specialInstructions?: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  actualDeliveryDate?: Date;
  deliveryNoteNumber?: string;
  transportDetails: ITransportDetails;
  notes?: string;
}

export interface IDeliveryScheduleItem {
  itemId: Types.ObjectId;
  quantity: number;
  deliveredQuantity: number;
  status: 'pending' | 'partial' | 'delivered' | 'delayed';
}

export interface ITransportDetails {
  transporterName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  lrNumber?: string;
  trackingNumber?: string;
}

export interface IPOApprovalWorkflow {
  level: number;
  approverRole: string;
  approverId?: Types.ObjectId;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  comments?: string;
}

export interface IQualityRequirements {
  inspectionRequired: boolean;
  qualityParameters: string[];
  acceptanceCriteria?: string;
  inspectionLocation?: 'supplier' | 'incoming' | 'third_party';
  qualityCertificates: string[];
  testReports: string[];
}

export interface IPOPerformance {
  onTimeDelivery?: boolean;
  qualityRating?: number;
  supplierRating?: number;
  deliveryRating?: number;
  overallRating?: number;
  feedback?: string;
  issues: string[];
  improvements: string[];
}

// =============================================
// QUOTATION INTERFACES
// =============================================

export interface IQuotation extends AuditableDocument {
  quotationNumber: string;
  quotationDate: Date;
  validUntil: Date;
  revision: number;
  parentQuotationId?: Types.ObjectId;
  quotationType: 'sales' | 'purchase' | 'service' | 'rental' | 'maintenance' | 'project';
  category: 'product' | 'service' | 'mixed' | 'project' | 'amc' | 'rental';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  party: IQuotationParty;
  references: IQuotationReferences;
  items: IQuotationItem[];
  amounts: IQuotationAmounts;
  taxDetails: IQuotationTaxDetails;
  terms: IQuotationTerm[];
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  validityPeriod?: string;
  deliveryInfo: IQuotationDeliveryInfo;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'acknowledged' | 'negotiation' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'converted';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  sentAt?: Date;
  sentBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  responseDate?: Date;
  conversion: IQuotationConversion;
  competition: IQuotationCompetition;
  followUp: IQuotationFollowUp;
  metrics: IQuotationMetrics;
  notes?: string;
  internalNotes?: string;
  specialInstructions?: string;
  assumptions?: string;
  exclusions?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  salesPersonId?: Types.ObjectId;
  salesPersonName?: string;
  teamId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  isActive: boolean;
}

export interface IQuotationParty {
  partyType: 'customer' | 'supplier';
  partyId: Types.ObjectId;
  partyCode: string;
  partyName: string;
  gstin?: string;
  pan?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address: IInvoiceAddress;
}

export interface IQuotationReferences {
  inquiryId?: Types.ObjectId;
  inquiryNumber?: string;
  rfqId?: Types.ObjectId;
  rfqNumber?: string;
  tenderNumber?: string;
  projectCode?: string;
  opportunityId?: Types.ObjectId;
  leadId?: Types.ObjectId;
}

export interface IQuotationItem {
  itemId?: Types.ObjectId;
  itemCode: string;
  itemName: string;
  description?: string;
  specifications?: string;
  hsnCode?: string;
  sacCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: {
    type: 'percentage' | 'amount';
    value: number;
  };
  discountAmount: number;
  taxableAmount: number;
  taxBreakup: ITaxBreakup[];
  totalTaxAmount: number;
  lineTotal: number;
  deliveryDays: number;
  warrantyPeriod?: string;
  notes?: string;
}

export interface IQuotationAmounts {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalTaxAmount: number;
  freightCharges: number;
  packingCharges: number;
  installationCharges: number;
  otherCharges: number;
  roundingAdjustment: number;
  grandTotal: number;
}

export interface IQuotationTaxDetails {
  placeOfSupply: string;
  isReverseCharge: boolean;
  taxBreakup: ITaxBreakup[];
  totalTaxAmount: number;
}

export interface IQuotationTerm {
  termType: 'payment' | 'delivery' | 'warranty' | 'validity' | 'penalty' | 'other';
  title: string;
  description: string;
  isStandard: boolean;
  isMandatory: boolean;
  order: number;
}

export interface IQuotationDeliveryInfo {
  deliveryDays: number;
  deliveryLocation?: string;
  shippingMethod?: 'courier' | 'transport' | 'self_pickup' | 'installation';
  packingType?: string;
  freightTerms?: 'fob' | 'cif' | 'ex_works' | 'delivered';
  installationRequired: boolean;
  installationDays: number;
  commissioningDays: number;
}

export interface IQuotationConversion {
  isConverted: boolean;
  convertedTo?: 'sales_order' | 'purchase_order' | 'contract';
  convertedId?: Types.ObjectId;
  convertedNumber?: string;
  convertedAt?: Date;
  convertedBy?: Types.ObjectId;
  conversionRate?: number;
  conversionValue?: number;
}

export interface IQuotationCompetition {
  hasCompetition: boolean;
  competitors: string[];
  competitiveAdvantage?: string;
  priceComparison?: 'lower' | 'same' | 'higher' | 'unknown';
  winProbability?: number;
  lossReason?: string;
  competitorNotes?: string;
}

export interface IQuotationFollowUp {
  nextFollowUpDate?: Date;
  followUpBy?: Types.ObjectId;
  followUpNotes?: string;
  communicationHistory: IQuotationCommunication[];
}

export interface IQuotationCommunication {
  date: Date;
  type: 'call' | 'email' | 'meeting' | 'presentation';
  summary: string;
  outcome?: string;
  nextAction?: string;
  communicatedBy?: Types.ObjectId;
}

export interface IQuotationMetrics {
  responseTime?: number;
  preparationTime?: number;
  negotiationRounds: number;
  revisionCount: number;
  customerRating?: number;
  internalRating?: number;
  profitMargin?: number;
  costPrice?: number;
}

// =============================================
// BUSINESS ANALYTICS INTERFACES
// =============================================

export interface IBusinessAnalytics extends AuditableDocument {
  analyticsId: string;
  analyticsName: string;
  description?: string;
  kpiMetrics: IKPIMetric[];
  totalMetrics: number;
  activeMetrics: number;
  dataSources: IDataSource[];
  reports: IAnalyticsReport[];
  dashboards: IAnalyticsDashboard[];
  performance: IAnalyticsPerformance;
  alerts: IAnalyticsAlert[];
  dataRetention: IDataRetention;
  integrations: IAnalyticsIntegration[];
  userAnalytics: IUserAnalytics;
  configuration: IAnalyticsConfiguration;
  notes?: string;
  tags: string[];
  customFields?: any;
  isActive: boolean;
  lastCalculated: Date;
}

export interface IKPIMetric {
  metricName: string;
  metricCode: string;
  category: 'financial' | 'operational' | 'sales' | 'production' | 'inventory' | 'hr' | 'quality' | 'security';
  dataType: 'number' | 'percentage' | 'currency' | 'count' | 'ratio' | 'time';
  unit?: string;
  currentValue: number;
  previousValue: number;
  targetValue?: number;
  minValue?: number;
  maxValue?: number;
  trend: 'up' | 'down' | 'stable' | 'volatile';
  changePercentage: number;
  status: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  calculationFormula?: string;
  dataSource: string;
  lastCalculated: Date;
  calculationFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
}

export interface IDataSource {
  sourceName: string;
  sourceType: 'database' | 'api' | 'file' | 'manual' | 'calculated';
  connectionString?: string;
  query?: string;
  refreshInterval: number;
  lastRefresh?: Date;
  isActive: boolean;
  errorMessage?: string;
}

export interface IAnalyticsReport {
  reportName: string;
  reportType: 'dashboard' | 'detailed' | 'summary' | 'trend' | 'comparison';
  category: string;
  description?: string;
  metrics: string[];
  filters?: any;
  dateRange: IAnalyticsDateRange;
  visualization: IAnalyticsVisualization;
  schedule: IAnalyticsReportSchedule;
  lastGenerated?: Date;
  isActive: boolean;
}

export interface IAnalyticsDashboard {
  dashboardName: string;
  dashboardType: 'executive' | 'operational' | 'departmental' | 'custom';
  layout: 'grid' | 'flex' | 'tabs';
  widgets: IWidget[];
  accessRoles: string[];
  isDefault: boolean;
  isActive: boolean;
}

export interface IWidget {
  widgetId: string;
  widgetType: 'kpi' | 'chart' | 'table' | 'gauge' | 'counter';
  title: string;
  metricCode?: string;
  position: IWidgetPosition;
  configuration?: any;
  isVisible: boolean;
}

export interface IWidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IAnalyticsPerformance {
  totalQueries: number;
  avgQueryTime: number;
  lastOptimized?: Date;
  cacheHitRate: number;
  errorRate: number;
  dataFreshness: number;
  systemLoad: number;
}

export interface IAnalyticsAlert {
  alertName: string;
  metricCode: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between' | 'outside_range';
  threshold: number;
  secondaryThreshold?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface IDataRetention {
  rawDataDays: number;
  aggregatedDataDays: number;
  reportDataDays: number;
  autoCleanup: boolean;
  lastCleanup?: Date;
}

export interface IAnalyticsIntegration {
  integrationType: 'api' | 'webhook' | 'file_sync' | 'database';
  integrationName: string;
  endpoint?: string;
  credentials?: any;
  syncFrequency: number;
  lastSync?: Date;
  isActive: boolean;
  errorMessage?: string;
}

export interface IUserAnalytics {
  totalUsers: number;
  activeUsers: number;
  avgSessionDuration: number;
  mostViewedReports: string[];
  mostUsedMetrics: string[];
  userEngagement: number;
}

export interface IAnalyticsConfiguration {
  timezone: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  refreshInterval: number;
  cacheEnabled: boolean;
  realTimeEnabled: boolean;
  exportFormats: string[];
}

export interface IAnalyticsDateRange {
  startDate?: Date;
  endDate?: Date;
  period?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';
}

export interface IAnalyticsVisualization {
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'gauge' | 'table';
  layout?: 'single' | 'grid' | 'tabs' | 'accordion';
  colors?: string[];
  showLegend: boolean;
  showDataLabels: boolean;
}

export interface IAnalyticsReportSchedule {
  isScheduled: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  time?: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

// =============================================
// BOILER MONITORING INTERFACES
// =============================================

export interface IBoilerMonitoring extends AuditableDocument {
  boilerId: string;
  boilerName: string;
  boilerNumber: string;
  location: string;
  specifications: IBoilerSpecifications;
  operatingParameters: IBoilerOperatingParameters;
  currentStatus: IBoilerCurrentStatus;
  readings: IBoilerReading[];
  alerts: IBoilerAlert[];
  maintenanceRecords: IMaintenanceRecord[];
  performance: IBoilerPerformance;
  safety: IBoilerSafety;
  environmental: IBoilerEnvironmental;
  automation: IBoilerAutomation;
  schedule: IBoilerSchedule;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;
  operatorInCharge?: Types.ObjectId;
  supervisorId?: Types.ObjectId;
}

export interface IBoilerSpecifications {
  capacity: number;
  workingPressure: number;
  maxTemperature: number;
  fuelType: 'coal' | 'oil' | 'gas' | 'biomass' | 'electric';
  manufacturer: string;
  model: string;
  yearOfManufacture: number;
  serialNumber: string;
  boilerType: 'fire_tube' | 'water_tube' | 'electric' | 'waste_heat';
  heating_surface?: number;
  grate_area?: number;
  furnace_volume?: number;
}

export interface IBoilerOperatingParameters {
  normalTemperature: { min: number; max: number };
  normalPressure: { min: number; max: number };
  normalWaterLevel: { min: number; max: number };
  maxFuelConsumption?: number;
  minEfficiency?: number;
  maxEmission?: {
    co2?: number;
    co?: number;
    nox?: number;
    so2?: number;
  };
}

export interface IBoilerCurrentStatus {
  isOperational: boolean;
  operatingMode: 'automatic' | 'manual' | 'maintenance' | 'shutdown';
  currentLoad: number;
  lastReading?: IBoilerReading;
  uptime: number;
  totalOperatingHours: number;
  lastStartTime?: Date;
  lastShutdownTime?: Date;
  shutdownReason?: string;
}

export interface IBoilerReading {
  readingTime: Date;
  temperature: number;
  pressure: number;
  waterLevel: number;
  fuelConsumption: number;
  steamProduction: number;
  efficiency: number;
  oxygenLevel?: number;
  co2Level?: number;
  coLevel?: number;
  flueGasTemperature?: number;
  feedWaterTemperature?: number;
  blowdownRate?: number;
  tds?: number;
  ph?: number;
  conductivity?: number;
  operatorId?: Types.ObjectId;
  operatorName?: string;
  shift: 'morning' | 'afternoon' | 'night';
  notes?: string;
  isAutomatic: boolean;
  sensorId?: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface IBoilerAlert {
  alertTime: Date;
  alertType: 'temperature_high' | 'temperature_low' | 'pressure_high' | 'pressure_low' | 'water_level_low' | 'water_level_high' | 'efficiency_low' | 'fuel_consumption_high' | 'emission_high' | 'maintenance_due' | 'safety_violation' | 'equipment_failure';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  parameter: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  description: string;
  recommendedAction?: string;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm';
  escalationLevel: number;
  notificationsSent: number;
}

export interface IMaintenanceRecord {
  maintenanceDate: Date;
  maintenanceType: 'preventive' | 'corrective' | 'emergency' | 'overhaul' | 'inspection' | 'cleaning' | 'calibration';
  component: string;
  description: string;
  technician: string;
  technicianId?: Types.ObjectId;
  duration: number;
  cost: number;
  partsReplaced: string[];
  workPerformed?: string;
  nextMaintenanceDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  downtime: number;
  efficiency_before?: number;
  efficiency_after?: number;
  attachments: string[];
  notes?: string;
}

export interface IBoilerPerformance {
  avgEfficiency: number;
  avgFuelConsumption: number;
  avgSteamProduction: number;
  totalFuelConsumed: number;
  totalSteamProduced: number;
  availabilityPercentage: number;
  mtbf: number;
  mttr: number;
  lastCalculated: Date;
}

export interface IBoilerSafety {
  lastSafetyInspection?: Date;
  nextSafetyInspection?: Date;
  safetyOfficer?: string;
  safetyRating?: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'critical';
  safetyIncidents: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending';
  certificates: string[];
  permits: string[];
}

export interface IBoilerEnvironmental {
  emissionLimits: {
    co2?: number;
    co?: number;
    nox?: number;
    so2?: number;
    particulates?: number;
  };
  currentEmissions: {
    co2: number;
    co: number;
    nox: number;
    so2: number;
    particulates: number;
  };
  waterTreatment: {
    chemicalUsage: number;
    wasteWaterGenerated: number;
    treatmentEfficiency: number;
  };
  noiseLevel: number;
  lastEnvironmentalAudit?: Date;
  nextEnvironmentalAudit?: Date;
}

export interface IBoilerAutomation {
  isAutomated: boolean;
  controlSystem?: string;
  sensors: IBoilerSensor[];
  alarmSystem: IAlarmSystem;
}

export interface IBoilerSensor {
  sensorId: string;
  sensorType: string;
  location: string;
  calibrationDate?: Date;
  nextCalibration?: Date;
  status: 'active' | 'inactive' | 'faulty';
}

export interface IAlarmSystem {
  isActive: boolean;
  audioAlarm: boolean;
  visualAlarm: boolean;
  smsAlert: boolean;
  emailAlert: boolean;
}

export interface IBoilerSchedule {
  operatingHours: IOperatingHours;
  maintenanceSchedule: IEquipmentMaintenanceSchedule[];
}

export interface IEquipmentMaintenanceSchedule {
  maintenanceType: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastPerformed?: Date;
  nextDue: Date;
  assignedTo?: Types.ObjectId;
  estimatedDuration?: number;
}

// =============================================
// ELECTRICITY MONITORING INTERFACES
// =============================================

export interface IElectricityMonitoring extends AuditableDocument {
  monitoringId: string;
  monitoringName: string;
  location: string;
  description?: string;
  systemDetails: IElectricalSystemDetails;
  meteringEquipment: IMeteringEquipment;
  operatingLimits: IElectricalOperatingLimits;
  currentStatus: IElectricalCurrentStatus;
  readings: IElectricityReading[];
  powerQuality: IPowerQuality[];
  energyConsumption: IEnergyConsumption[];
  performance: IElectricalPerformance;
  tariffStructure: ITariffStructure;
  alerts: IElectricalAlert[];
  maintenance: IElectricalMaintenance;
  loadManagement: ILoadManagement;
  environmental: IElectricalEnvironmental;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;
  electricianInCharge?: Types.ObjectId;
  supervisorId?: Types.ObjectId;
}

export interface IElectricalSystemDetails {
  connectionType: '3_phase_4_wire' | '3_phase_3_wire' | '1_phase_2_wire';
  ratedVoltage: number;
  ratedCurrent: number;
  ratedPower: number;
  frequency: number;
  transformerRating?: number;
  panelType: 'main' | 'sub' | 'distribution' | 'control';
  feedFrom?: string;
  suppliesTo: string[];
}

export interface IMeteringEquipment {
  meterType: 'analog' | 'digital' | 'smart' | 'ct_pt';
  meterMake: string;
  meterModel: string;
  meterSerialNumber: string;
  installationDate: Date;
  lastCalibration?: Date;
  nextCalibration?: Date;
  ctRatio?: string;
  ptRatio?: string;
  accuracy?: number;
  communicationProtocol?: 'modbus' | 'profibus' | 'ethernet' | 'rs485' | 'wireless';
}

export interface IElectricalOperatingLimits {
  voltage: { min: number; max: number };
  current: { min: number; max: number };
  power: { min: number; max: number };
  powerFactor: { min: number; max: number };
  frequency: { min: number; max: number };
  temperature: { min: number; max: number };
}

export interface IElectricalCurrentStatus {
  isOnline: boolean;
  operatingMode: 'normal' | 'maintenance' | 'fault' | 'offline';
  lastReading?: IElectricityReading;
  currentLoad: number;
  powerStatus: 'on' | 'off' | 'tripped' | 'fault';
  alarmStatus: 'normal' | 'warning' | 'alarm' | 'critical';
  lastCommunication: Date;
}

export interface IElectricityReading {
  readingTime: Date;
  voltage: {
    r: number;
    y: number;
    b: number;
    avg: number;
  };
  current: {
    r: number;
    y: number;
    b: number;
    neutral?: number;
  };
  power: {
    activePower: number;
    reactivePower?: number;
    apparentPower: number;
    powerFactor: number;
  };
  energy: {
    activeEnergy: number;
    reactiveEnergy?: number;
    apparentEnergy?: number;
  };
  frequency: number;
  temperature?: number;
  humidity?: number;
  meterReading?: number;
  operatorId?: Types.ObjectId;
  operatorName?: string;
  shift: 'morning' | 'afternoon' | 'night';
  notes?: string;
  isAutomatic: boolean;
  meterId?: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface IPowerQuality {
  measurementTime: Date;
  voltageUnbalance?: number;
  currentUnbalance?: number;
  totalHarmonicDistortion?: {
    voltage?: number;
    current?: number;
  };
  flickerSeverity?: {
    shortTerm?: number;
    longTerm?: number;
  };
  voltageVariation?: {
    sag: number;
    swell: number;
    interruption: number;
  };
  powerQualityIndex?: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'marginal';
}

export interface IEnergyConsumption {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startTime: Date;
  endTime: Date;
  consumption: {
    activeEnergy: number;
    reactiveEnergy?: number;
    maxDemand: number;
    avgDemand: number;
    loadFactor?: number;
  };
  cost: {
    energyCharges?: number;
    demandCharges?: number;
    powerFactorPenalty?: number;
    totalCost: number;
  };
  tariffRate?: number;
  peakHours?: number;
  offPeakHours?: number;
}

export interface IElectricalPerformance {
  avgPowerFactor: number;
  avgLoad: number;
  peakDemand: number;
  energyEfficiency: number;
  uptime: number;
  totalEnergyConsumed: number;
  totalEnergyCost: number;
  co2Emissions: number;
  lastCalculated: Date;
}

export interface ITariffStructure {
  tariffType: 'flat' | 'tod' | 'seasonal' | 'demand';
  energyRate: number;
  demandRate?: number;
  fixedCharges?: number;
  powerFactorIncentive?: number;
  powerFactorPenalty?: number;
  peakHours: ITimeSlot[];
  offPeakHours: ITimeSlot[];
  seasonalRates: ISeasonalRate[];
}

export interface ITimeSlot {
  start: string;
  end: string;
}

export interface ISeasonalRate {
  season: 'summer' | 'winter' | 'monsoon';
  startMonth: number;
  endMonth: number;
  rate: number;
}

export interface IElectricalAlert {
  alertTime: Date;
  alertType: 'voltage_high' | 'voltage_low' | 'current_high' | 'overload' | 'power_factor_low' | 'frequency_deviation' | 'phase_failure' | 'earth_fault' | 'communication_loss' | 'meter_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameter: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  description: string;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface IElectricalMaintenance {
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  maintenanceInterval: number;
  maintenanceRecords: IElectricalMaintenanceRecord[];
}

export interface IElectricalMaintenanceRecord {
  date: Date;
  type: 'preventive' | 'corrective' | 'calibration';
  description: string;
  technician: string;
  cost?: number;
  downtime?: number;
  notes?: string;
}

export interface ILoadManagement {
  loadShedding: ILoadShedding;
  demandControl: IDemandControl;
}

export interface ILoadShedding {
  isEnabled: boolean;
  priority?: number;
  sheddingThreshold?: number;
  restoreThreshold?: number;
  sheddingDelay?: number;
  restoreDelay?: number;
}

export interface IDemandControl {
  isEnabled: boolean;
  targetDemand?: number;
  controlMethod?: 'load_shedding' | 'generator_start' | 'capacitor_switching';
}

export interface IElectricalEnvironmental {
  carbonFootprint: number;
  renewableEnergyPercentage: number;
  energyIntensity: number;
  greenCertificates: number;
}

// =============================================
// HOSPITALITY INTERFACES
// =============================================

export interface IHospitality extends AuditableDocument {
  facilityId: string;
  facilityName: string;
  facilityType: 'hotel' | 'guest_house' | 'resort' | 'lodge' | 'hostel' | 'service_apartment';
  description?: string;
  address: IWarehouseAddress;
  contactInfo: IWarehouseContactInfo;
  facilityDetails: IFacilityDetails;
  rooms: IRoom[];
  roomTypes: IRoomType[];
  occupancy: IOccupancy;
  bookings: IBooking[];
  totalBookings: number;
  activeBookings: number;
  guests: IGuest[];
  totalGuests: number;
  vipGuests: number;
  repeatGuests: number;
  services: IService[];
  amenities: IAmenities;
  staff: IStaff;
  financials: IHospitalityFinancials;
  performance: IHospitalityPerformance;
  operatingHours: IHospitalityOperatingHours;
  policies: IPolicies;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  isActive: boolean;
  managerId?: Types.ObjectId;
  managerName?: string;
}

export interface IFacilityDetails {
  totalRooms: number;
  totalFloors: number;
  totalBuildings: number;
  maxCapacity: number;
  starRating?: number;
  establishedYear?: number;
  renovatedYear?: number;
  totalArea?: number;
  parkingSpaces: number;
}

export interface IRoom {
  roomNumber: string;
  roomType: 'single' | 'double' | 'suite' | 'deluxe' | 'presidential';
  floor: number;
  building?: string;
  capacity: number;
  bedConfiguration: IBedConfiguration;
  amenities: string[];
  facilities: string[];
  area?: number;
  baseRate: number;
  seasonalRates: ISeasonalRate[];
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
  lastCleaned?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  housekeepingNotes?: string;
  maintenanceNotes?: string;
  photos: string[];
  isActive: boolean;
}

export interface IBedConfiguration {
  singleBeds: number;
  doubleBeds: number;
  queenBeds: number;
  kingBeds: number;
}

export interface IRoomType {
  type: string;
  count: number;
  baseRate: number;
  maxOccupancy: number;
}

export interface IOccupancy {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  occupancyPercentage: number;
  currentGuests: number;
  expectedArrivals: number;
  expectedDepartures: number;
  lastUpdated: Date;
}

export interface IGuest {
  guestId: string;
  personalInfo: IGuestPersonalInfo;
  contactInfo: IVisitorContactInfo;
  address: IVisitorAddress;
  identification: IGuestIdentification;
  companyInfo: IGuestCompanyInfo;
  preferences: IGuestPreferences;
  loyaltyInfo: ILoyaltyInfo;
  isVIP: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  notes?: string;
}

export interface IGuestPersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: Date;
  nationality?: string;
  profilePhoto?: string;
}

export interface IGuestIdentification {
  idType: 'aadhar' | 'pan' | 'passport' | 'driving_license' | 'voter_id';
  idNumber: string;
  idCopy?: string;
}

export interface IGuestCompanyInfo {
  companyName?: string;
  designation?: string;
  department?: string;
  companyAddress?: string;
  businessCard?: string;
}

export interface IGuestPreferences {
  roomType?: 'single' | 'double' | 'suite' | 'deluxe';
  bedType?: 'single' | 'double' | 'queen' | 'king';
  smokingPreference: 'smoking' | 'non_smoking';
  floorPreference: 'ground' | 'high' | 'any';
  dietaryRestrictions: string[];
  specialRequests: string[];
}

export interface ILoyaltyInfo {
  membershipNumber?: string;
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  totalStays: number;
  totalSpent: number;
}

export interface IBooking {
  bookingNumber: string;
  bookingDate: Date;
  bookingSource: 'direct' | 'phone' | 'email' | 'website' | 'agent' | 'walk_in';
  guestInfo: IGuest;
  stayDetails: IStayDetails;
  roomDetails: IRoomDetails;
  rateDetails: IRateDetails;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequests: string[];
  cancellationPolicy?: string;
  cancellationReason?: string;
  cancellationDate?: Date;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  earlyCheckIn: boolean;
  lateCheckOut: boolean;
  extendedStay: boolean;
  noShow: boolean;
  notes?: string;
}

export interface IStayDetails {
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
  adults: number;
  children: number;
  infants: number;
}

export interface IRoomDetails {
  roomNumbers: string[];
  roomType: string;
  totalRooms: number;
}

export interface IRateDetails {
  baseRate: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
}

export interface IService {
  serviceDate: Date;
  serviceType: 'room_service' | 'laundry' | 'spa' | 'restaurant' | 'bar' | 'transport' | 'conference' | 'other';
  serviceName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceTime?: string;
  serviceLocation?: string;
  serviceProvider?: string;
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  requestedBy?: string;
  completedBy?: string;
  completedAt?: Date;
  rating?: number;
  feedback?: string;
  notes?: string;
}

export interface IAmenities {
  roomAmenities: string[];
  hotelAmenities: string[];
  businessServices: string[];
  recreationalServices: string[];
  diningOptions: string[];
  transportServices: string[];
}

export interface IStaff {
  totalStaff: number;
  frontDesk: number;
  housekeeping: number;
  maintenance: number;
  foodService: number;
  security: number;
  management: number;
  shifts: IStaffShift[];
}

export interface IStaffShift {
  shiftName: string;
  startTime: string;
  endTime: string;
  staffCount: number;
}

export interface IHospitalityFinancials {
  averageRoomRate: number;
  revenuePerAvailableRoom: number;
  totalRevenue: number;
  roomRevenue: number;
  serviceRevenue: number;
  operatingCosts: number;
  profitMargin: number;
  lastCalculated: Date;
}

export interface IHospitalityPerformance {
  occupancyRate: number;
  averageDailyRate: number;
  revenuePerAvailableRoom: number;
  guestSatisfactionScore: number;
  repeatGuestPercentage: number;
  averageLengthOfStay: number;
  noShowRate: number;
  cancellationRate: number;
  lastCalculated: Date;
}

export interface IHospitalityOperatingHours {
  checkInTime: string;
  checkOutTime: string;
  frontDeskHours: string;
  restaurantHours?: string;
  barHours?: string;
  spaHours?: string;
  gymHours?: string;
}

export interface IPolicies {
  cancellationPolicy?: string;
  childPolicy?: string;
  petPolicy?: string;
  smokingPolicy?: string;
  extraBedPolicy?: string;
  paymentPolicy?: string;
  refundPolicy?: string;
}

// =============================================
// DISPATCH INTERFACES
// =============================================

export interface IDispatch extends AuditableDocument {
  dispatchNumber: string;
  dispatchDate: Date;
  dispatchType: 'sales' | 'transfer' | 'return' | 'sample' | 'replacement' | 'warranty' | 'loan';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: IDispatchSource;
  destination: IDispatchDestination;
  references: IDispatchReferences;
  items: IDispatchItem[];
  totalItems: number;
  totalQuantity: number;
  totalWeight: number;
  totalVolume: number;
  totalValue: number;
  packingDetails: IPackingDetails;
  transport: IDispatchTransportDetails;
  status: 'draft' | 'ready_to_dispatch' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'partially_delivered' | 'failed_delivery' | 'returned' | 'cancelled';
  dispatchedAt?: Date;
  dispatchedBy?: Types.ObjectId;
  deliveredAt?: Date;
  deliveredBy?: string;
  receivedBy?: string;
  receivedAt?: Date;
  tracking: IDeliveryTracking[];
  currentLocation?: string;
  estimatedDelivery?: Date;
  deliveryAttempts: number;
  lastDeliveryAttempt?: Date;
  deliveryFailureReason?: string;
  qualityCheck: IQualityCheck;
  documents: IDispatchDocuments;
  financials: IDispatchFinancials;
  customerFeedback: ICustomerFeedback;
  performance: IDispatchPerformance;
  rtoDetails: IRTODetails;
  specialInstructions?: string;
  internalNotes?: string;
  customerNotes?: string;
  tags: string[];
  customFields?: any;
  isActive: boolean;
  dispatchManagerId?: Types.ObjectId;
  dispatchManagerName?: string;
}

export interface IDispatchSource {
  warehouseId: Types.ObjectId;
  warehouseName: string;
  address: IInvoiceAddress;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
}

export interface IDispatchDestination {
  destinationType: 'customer' | 'warehouse' | 'branch' | 'vendor' | 'other';
  destinationId?: Types.ObjectId;
  destinationName: string;
  address: IInvoiceAddress;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  deliveryInstructions?: string;
  workingHours?: string;
  accessInstructions?: string;
}

export interface IDispatchReferences {
  salesOrderId?: Types.ObjectId;
  salesOrderNumber?: string;
  invoiceId?: Types.ObjectId;
  invoiceNumber?: string;
  transferOrderId?: Types.ObjectId;
  transferOrderNumber?: string;
  returnOrderId?: Types.ObjectId;
  returnOrderNumber?: string;
  gatePassNumber?: string;
  customsDeclaration?: string;
}

export interface IDispatchItem {
  itemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  description?: string;
  batchNumber?: string;
  serialNumbers: string[];
  quantity: number;
  unit: string;
  weight?: number;
  volume?: number;
  dimensions?: IDimensions;
  packingType: 'box' | 'carton' | 'pallet' | 'bag' | 'drum' | 'loose';
  packingDetails: IItemPackingDetails;
  handlingInstructions: string[];
  specialRequirements: string[];
  isHazardous: boolean;
  hazardClass?: string;
  storageConditions?: string;
  expiryDate?: Date;
  manufacturingDate?: Date;
  qualityStatus: 'approved' | 'pending' | 'rejected';
  inspectionNotes?: string;
  unitPrice?: number;
  totalValue?: number;
  notes?: string;
}

export interface IDimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface IItemPackingDetails {
  packagesCount: number;
  packageType?: string;
  packageWeight?: number;
  packageDimensions?: IDimensions;
}

export interface IPackingDetails {
  totalPackages: number;
  packingList: string[];
  packingMethod?: 'standard' | 'export' | 'fragile' | 'hazardous';
  packingMaterial: string[];
  packingCost: number;
  packedBy?: string;
  packedAt?: Date;
  packingNotes?: string;
  specialHandling: string[];
}

export interface IDispatchTransportDetails {
  transportMode: 'road' | 'rail' | 'air' | 'sea' | 'courier' | 'self_pickup';
  transporterName: string;
  transporterId?: Types.ObjectId;
  vehicleType?: 'truck' | 'van' | 'car' | 'bike' | 'train' | 'ship' | 'plane';
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  driverLicense?: string;
  routeDetails: IRouteDetails;
  freightCharges: IFreightCharges;
  insuranceDetails: IInsuranceDetails;
  trackingNumber?: string;
  awbNumber?: string;
  lrNumber?: string;
  podRequired: boolean;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
}

export interface IRouteDetails {
  origin: string;
  destination: string;
  waypoints: string[];
  estimatedDistance?: number;
  estimatedDuration?: number;
  routeType?: 'direct' | 'multi_stop' | 'return';
}

export interface IFreightCharges {
  baseRate: number;
  fuelSurcharge: number;
  tollCharges: number;
  loadingCharges: number;
  unloadingCharges: number;
  insuranceCharges: number;
  otherCharges: number;
  totalCharges: number;
}

export interface IInsuranceDetails {
  isInsured: boolean;
  insuranceProvider?: string;
  policyNumber?: string;
  coverageAmount?: number;
  premium?: number;
}

export interface IDeliveryTracking {
  trackingDateTime: Date;
  status: 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned';
  location: string;
  description: string;
  updatedBy?: string;
  contactPerson?: string;
  contactPhone?: string;
  gpsCoordinates?: {
    latitude?: number;
    longitude?: number;
  };
  photos: string[];
  signature?: string;
  remarks?: string;
  nextExpectedUpdate?: Date;
  isCustomerNotified: boolean;
  notificationMethod?: 'sms' | 'email' | 'call' | 'whatsapp';
}

export interface IQualityCheck {
  isRequired: boolean;
  checkedBy?: string;
  checkedAt?: Date;
  qualityStatus: 'passed' | 'failed' | 'conditional';
  defects: string[];
  qualityNotes?: string;
  qualityCertificate?: string;
}

export interface IDispatchDocuments {
  packingList?: string;
  invoiceCopy?: string;
  deliveryNote?: string;
  transportDocument?: string;
  insuranceCertificate?: string;
  customsDocuments: string[];
  qualityCertificates: string[];
  photos: string[];
  proofOfDelivery?: string;
  customerSignature?: string;
}

export interface IDispatchFinancials {
  goodsValue: number;
  freightCharges: number;
  packingCharges: number;
  insuranceCharges: number;
  handlingCharges: number;
  otherCharges: number;
  totalCharges: number;
  paymentTerms?: string;
  paymentStatus: 'pending' | 'paid' | 'cod';
}

export interface ICustomerFeedback {
  deliveryRating?: number;
  packagingRating?: number;
  timelinessRating?: number;
  overallRating?: number;
  comments?: string;
  complaints: string[];
  suggestions: string[];
  feedbackDate?: Date;
  wouldRecommend?: boolean;
}

export interface IDispatchPerformance {
  plannedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryDelay: number;
  onTimeDelivery?: boolean;
  deliveryAccuracy?: number;
  damageRate?: number;
  customerSatisfaction?: number;
  costPerKg?: number;
  costPerKm?: number;
}

export interface IRTODetails {
  isRTO: boolean;
  rtoReason?: 'wrong_address' | 'customer_unavailable' | 'customer_rejected' | 'damaged_goods' | 'wrong_items' | 'delivery_delay' | 'other';
  rtoDate?: Date;
  rtoLocation?: string;
  rtoNotes?: string;
  returnTrackingNumber?: string;
  returnCourierName?: string;
  returnCharges: number;
  returnStatus: 'pending' | 'in_transit' | 'returned' | 'disposed' | 'resold';
  returnReceivedAt?: Date;
  returnReceivedBy?: string;
  returnCondition?: 'good' | 'damaged' | 'partial' | 'unusable';
  returnAction?: 'resell' | 'repair' | 'dispose' | 'refund' | 'exchange';
  returnNotes?: string;
}

// =============================================
// REPORT INTERFACES
// =============================================

export interface IReport extends AuditableDocument {
  reportId: string;
  reportName: string;
  reportCode: string;
  displayName?: string;
  description?: string;
  version: string;
  category: 'financial' | 'operational' | 'sales' | 'purchase' | 'inventory' | 'production' | 'hr' | 'quality' | 'security' | 'analytics' | 'compliance' | 'custom';
  subCategory?: string;
  reportType: 'tabular' | 'summary' | 'detailed' | 'dashboard' | 'chart' | 'pivot' | 'matrix' | 'subreport';
  complexity: 'simple' | 'medium' | 'complex' | 'advanced';
  dataSource: IReportDataSource;
  parameters: IReportParameter[];
  hasParameters: boolean;
  layout: IReportLayout;
  structure: IReportStructure;
  styling: IReportStyling;
  accessControl: IReportAccessControl;
  supportedFormats: string[];
  defaultFormat: 'pdf' | 'excel' | 'csv' | 'json';
  schedules: IReportSchedule[];
  isSchedulable: boolean;
  executions: IReportExecution[];
  totalExecutions: number;
  lastExecuted?: Date;
  lastExecutedBy?: Types.ObjectId;
  performance: IReportPerformance;
  metadata: IReportMetadata;
  status: 'draft' | 'testing' | 'approved' | 'published' | 'deprecated' | 'archived';
  isActive: boolean;
  isTemplate: boolean;
  templateId?: Types.ObjectId;
  publishedAt?: Date;
  deprecatedAt?: Date;
  archivedAt?: Date;
  tags: string[];
  customFields?: any;
  attachments: string[];
  helpText?: string;
  troubleshootingGuide?: string;
  ownerId?: Types.ObjectId;
  ownerName?: string;
}

export interface IReportDataSource {
  sourceType: 'database' | 'api' | 'file' | 'multiple';
  primarySource: string;
  secondarySources: string[];
  connectionString?: string;
  query: string;
  queryType: 'sql' | 'mongodb' | 'api' | 'custom';
  refreshInterval: number;
  cacheEnabled: boolean;
  cacheDuration: number;
}

export interface IReportParameter {
  parameterName: string;
  parameterType: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'daterange';
  displayName: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: any;
  validationRules: IValidationRules;
  dataSource: IParameterDataSource;
  displayOrder: number;
  isVisible: boolean;
}

export interface IValidationRules {
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedValues: string[];
}

export interface IParameterDataSource {
  sourceType?: 'static' | 'query' | 'api';
  sourceQuery?: string;
  sourceApi?: string;
}

export interface IReportLayout {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  margins: IMargins;
  headerHeight: number;
  footerHeight: number;
}

export interface IMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface IReportStructure {
  header: IReportHeader;
  body: IReportBody;
  footer: IReportFooter;
}

export interface IReportHeader {
  showCompanyLogo: boolean;
  showCompanyName: boolean;
  showReportTitle: boolean;
  showGenerationDate: boolean;
  showParameters: boolean;
  customHeader?: string;
}

export interface IReportBody {
  showColumnHeaders: boolean;
  showRowNumbers: boolean;
  alternateRowColors: boolean;
  groupBy: string[];
  sortBy: string[];
  aggregations: IAggregation[];
}

export interface IAggregation {
  column: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  displayName?: string;
}

export interface IReportFooter {
  showPageNumbers: boolean;
  showGeneratedBy: boolean;
  showTotalRecords: boolean;
  customFooter?: string;
}

export interface IReportStyling {
  theme: 'default' | 'modern' | 'classic' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  headerFontSize: number;
  titleFontSize: number;
}

export interface IReportAccessControl {
  isPublic: boolean;
  allowedRoles: string[];
  allowedUsers: Types.ObjectId[];
  allowedDepartments: string[];
  restrictByCompany: boolean;
  restrictByBranch: boolean;
  dataFilters?: any;
}

export interface IReportSchedule {
  scheduleName: string;
  isActive: boolean;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  scheduleTime?: string;
  scheduleDate?: Date;
  dayOfWeek?: number;
  dayOfMonth?: number;
  monthOfYear?: number;
  timezone: string;
  parameters?: any;
  outputFormat: 'pdf' | 'excel' | 'csv' | 'json';
  recipients: IRecipient[];
  deliveryMethod: 'email' | 'download' | 'ftp' | 'api';
  emailSubject?: string;
  emailBody?: string;
  lastExecution?: Date;
  nextExecution?: Date;
  executionCount: number;
  failureCount: number;
  lastError?: string;
}

export interface IRecipient {
  recipientType: 'email' | 'user' | 'role';
  recipientId: string;
  recipientName: string;
}

export interface IReportExecution {
  executionId: string;
  executionDate: Date;
  executedBy: Types.ObjectId;
  executorName: string;
  executionType: 'manual' | 'scheduled' | 'api';
  parameters?: any;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  executionTime?: number;
  recordCount: number;
  outputFormat: 'pdf' | 'excel' | 'csv' | 'json';
  outputSize?: number;
  outputUrl?: string;
  downloadCount: number;
  errorMessage?: string;
  errorDetails?: string;
  performanceMetrics: IExecutionPerformanceMetrics;
  scheduleName?: string;
  isArchived: boolean;
  expiresAt?: Date;
}

export interface IExecutionPerformanceMetrics {
  queryTime?: number;
  renderTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface IReportPerformance {
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  averageRecordCount: number;
  maxRecordCount: number;
  successRate: number;
  popularityScore: number;
  lastOptimized?: Date;
}

export interface IReportMetadata {
  author?: string;
  authorId?: Types.ObjectId;
  reviewer?: string;
  reviewerId?: Types.ObjectId;
  approver?: string;
  approverId?: Types.ObjectId;
  keywords: string[];
  businessRules?: string;
  dataDefinitions?: string;
  changeLog: IChangeLog[];
}

export interface IChangeLog {
  version: string;
  changeDate: Date;
  changedBy: string;
  changeDescription: string;
}

// =============================================
// EMPLOYEE MANAGEMENT INTERFACES
// =============================================

export interface IEmployee extends AuditableDocument {
  employeeCode: string;
  employeeId: string;
  personalInfo: IEmployeePersonalInfo;
  contactInfo: IEmployeeContactInfo;
  addresses: IEmployeeAddresses;
  identityDocuments: IEmployeeIdentityDocuments;
  employmentInfo: IEmployeeEmploymentInfo;
  salaryInfo: IEmployeeSalary[];
  skills: IEmployeeSkill[];
  certifications: IEmployeeCertification[];
  shifts: IEmployeeShift[];
  performanceRecords: IEmployeePerformance[];
  bankInfo: IEmployeeBankInfo;
  governmentRegistrations: IEmployeeGovernmentRegistrations;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'resigned' | 'retired';

  // Methods
  isCurrentlyEmployed?(): boolean;
  getCurrentSalary?(): IEmployeeSalary | null;
  getCurrentShift?(): IEmployeeShift | null;
  getYearsOfService?(): number;
  isOnProbation?(): boolean;
}

export interface IEmployeePersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  fatherName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  bloodGroup?: string;
  profilePhoto?: string;
  signature?: string;
}

export interface IEmployeeContactInfo {
  primaryPhone: string;
  alternatePhone?: string;
  email?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string;
}

export interface IEmployeeAddresses {
  permanentAddress: IEmployeeAddress;
  currentAddress: IEmployeeAddress;
}

export interface IEmployeeAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IEmployeeIdentityDocuments {
  aadharNumber: string;
  panNumber: string;
  passportNumber?: string;
  passportExpiryDate?: Date;
  drivingLicenseNumber?: string;
  drivingLicenseExpiryDate?: Date;
}

export interface IEmployeeEmploymentInfo {
  designation: string;
  department: string;
  reportingManagerId?: Types.ObjectId;
  reportingManagerName?: string;
  employmentType: 'permanent' | 'contract' | 'temporary' | 'intern';
  salaryType: 'monthly' | 'daily' | 'hourly' | 'piece_rate';
  joiningDate: Date;
  confirmationDate?: Date;
  resignationDate?: Date;
  lastWorkingDate?: Date;
  noticePeriod: number;
  probationPeriod: number;
}

export interface IEmployeeSalary {
  basicSalary: number;
  hra: number;
  da: number;
  otherAllowances: number;
  pfDeduction: number;
  esiDeduction: number;
  otherDeductions: number;
  effectiveDate: Date;
  isActive: boolean;
}

export interface IEmployeeSkill {
  skillName: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  certification?: string;
  certificationDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
}

export interface IEmployeeCertification {
  certificationName: string;
  issuingAuthority: string;
  certificationNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  documentUrl?: string;
  notes?: string;
}

export interface IEmployeeShift {
  shiftId: Types.ObjectId;
  shiftName: string;
  startTime: string;
  endTime: string;
  isNightShift: boolean;
  effectiveDate: Date;
  isActive: boolean;
}

export interface IEmployeePerformance {
  reviewPeriod: string;
  reviewDate: Date;
  performanceRating: number;
  strengths: string[];
  areasOfImprovement: string[];
  goals: string[];
  achievements: string[];
  reviewerId: Types.ObjectId;
  reviewerName: string;
  reviewNotes?: string;
  nextReviewDate?: Date;
  isActive: boolean;
}

export interface IEmployeeBankInfo {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  accountType: 'savings' | 'current';
}

export interface IEmployeeGovernmentRegistrations {
  pfNumber?: string;
  esiNumber?: string;
  uanNumber?: string;
  esicNumber?: string;
}

// =============================================
// SHIFT MANAGEMENT INTERFACES
// =============================================

export interface IShift extends AuditableDocument {
  shiftCode: string;
  shiftName: string;
  shiftType: 'day' | 'night' | 'general' | 'rotating' | 'flexible' | 'split';
  shiftCategory: 'production' | 'office' | 'security' | 'maintenance' | 'other';
  startTime: string;
  endTime: string;
  totalHours: number;
  breaks: IShiftBreak[];
  totalBreakTime: number;
  netWorkingHours: number;
  rules: IShiftRule[];
  overtimeThreshold: number;
  overtimeRate: number;
  flexibleStartTime: number;
  flexibleEndTime: number;
  weeklySchedule: IShiftSchedule[];
  rotationPattern: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  rotationDays: number;
  applicableDepartments: string[];
  applicableDesignations: string[];
  minimumEmployees: number;
  maximumEmployees: number;
  isNightShift: boolean;
  nightShiftAllowance: number;
  weeklyOffDays: number;
  statutoryHolidays: number;
  hourlyCost: number;
  additionalCosts: number;
  costCenter?: string;
  isDefault: boolean;
  priority: number;
  description?: string;
  notes?: string;
  tags: string[];
  customFields?: any;

  // Methods
  isCurrentlyActive?(): boolean;
  getWorkingDays?(): string[];
  getNonWorkingDays?(): string[];
  calculateOvertime?(actualHours: number): number;
  getShiftCost?(hours: number): number;
  timeToMinutes?(timeString: string): number;
}

export interface IShiftBreak {
  breakName: string;
  startTime: string;
  endTime: string;
  duration: number;
  isPaid: boolean;
  isMandatory: boolean;
}

export interface IShiftRule {
  ruleName: string;
  ruleType: 'overtime' | 'late_arrival' | 'early_departure' | 'break' | 'other';
  value: number;
  unit: 'minutes' | 'hours' | 'percentage';
  description?: string;
  isActive: boolean;
}

export interface IShiftSchedule {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  totalHours: number;
  breaks: IShiftBreak[];
  isActive: boolean;
}
