import { Schema, model } from 'mongoose';
import { IRole, IPermission, IDynamicPermission } from '@/types/models';

// Dynamic Permission Schema for flexible permission system
const DynamicPermissionSchema = new Schema<IDynamicPermission>({
  module: { type: String, required: true },
  resource: { type: String, required: true },
  actions: [{
    action: { type: String, required: true },
    allowed: { type: Boolean, default: false },
    conditions: { type: Schema.Types.Mixed }, // For conditional permissions
    restrictions: { type: Schema.Types.Mixed } // For field-level restrictions
  }],
  customPermissions: { type: Schema.Types.Mixed }, // For module-specific permissions
  isActive: { type: Boolean, default: true }
}, { _id: false });

// Standard Permission Schema
const PermissionSchema = new Schema<IPermission>({
  // Core System Permissions
  system: {
    userManagement: { type: Boolean, default: false },
    roleManagement: { type: Boolean, default: false },
    companySettings: { type: Boolean, default: false },
    systemSettings: { type: Boolean, default: false },
    backupRestore: { type: Boolean, default: false },
    auditLogs: { type: Boolean, default: false },
    systemReports: { type: Boolean, default: false }
  },

  // User & Access Management
  users: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    activate: { type: Boolean, default: false },
    deactivate: { type: Boolean, default: false },
    resetPassword: { type: Boolean, default: false },
    impersonate: { type: Boolean, default: false },
    viewSalary: { type: Boolean, default: false },
    editSalary: { type: Boolean, default: false }
  },

  // Company Management
  company: {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
    branches: { type: Boolean, default: false },
    departments: { type: Boolean, default: false },
    hierarchy: { type: Boolean, default: false }
  },

  // Inventory Management
  inventory: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    stockAdjustment: { type: Boolean, default: false },
    stockTransfer: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    exportData: { type: Boolean, default: false },
    importData: { type: Boolean, default: false },
    viewCosts: { type: Boolean, default: false },
    editCosts: { type: Boolean, default: false }
  },

  // Production Management
  production: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    startProcess: { type: Boolean, default: false },
    stopProcess: { type: Boolean, default: false },
    qualityCheck: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    scheduleOrders: { type: Boolean, default: false },
    manageBOM: { type: Boolean, default: false },
    viewCosts: { type: Boolean, default: false }
  },

  // Sales & Customer Management
  sales: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    dispatch: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    manageCustomers: { type: Boolean, default: false },
    viewPricing: { type: Boolean, default: false },
    editPricing: { type: Boolean, default: false },
    discounts: { type: Boolean, default: false },
    creditManagement: { type: Boolean, default: false }
  },

  // Purchase & Supplier Management
  purchase: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    receive: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    manageSuppliers: { type: Boolean, default: false },
    negotiateRates: { type: Boolean, default: false },
    paymentApproval: { type: Boolean, default: false }
  },

  // Financial Management
  financial: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    bankTransactions: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    reconciliation: { type: Boolean, default: false },
    taxManagement: { type: Boolean, default: false },
    budgetManagement: { type: Boolean, default: false },
    expenseApproval: { type: Boolean, default: false },
    viewProfitLoss: { type: Boolean, default: false }
  },

  // Security & Gate Management
  security: {
    gateManagement: { type: Boolean, default: false },
    visitorManagement: { type: Boolean, default: false },
    vehicleTracking: { type: Boolean, default: false },
    cctvAccess: { type: Boolean, default: false },
    emergencyResponse: { type: Boolean, default: false },
    securityReports: { type: Boolean, default: false },
    incidentManagement: { type: Boolean, default: false },
    accessControl: { type: Boolean, default: false },
    patrolManagement: { type: Boolean, default: false }
  },

  // HR Management
  hr: {
    viewEmployees: { type: Boolean, default: false },
    manageEmployees: { type: Boolean, default: false },
    manageAttendance: { type: Boolean, default: false },
    manageSalary: { type: Boolean, default: false },
    manageLeaves: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    recruitment: { type: Boolean, default: false },
    performance: { type: Boolean, default: false },
    training: { type: Boolean, default: false },
    disciplinary: { type: Boolean, default: false }
  },

  // Quality Management
  quality: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    inspections: { type: Boolean, default: false },
    certifications: { type: Boolean, default: false },
    nonConformance: { type: Boolean, default: false },
    corrective: { type: Boolean, default: false },
    preventive: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false }
  },

  // Maintenance Management
  maintenance: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    schedule: { type: Boolean, default: false },
    workOrders: { type: Boolean, default: false },
    preventive: { type: Boolean, default: false },
    breakdown: { type: Boolean, default: false },
    spareparts: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false }
  },

  // Reports & Analytics
  reports: {
    inventory: { type: Boolean, default: false },
    production: { type: Boolean, default: false },
    sales: { type: Boolean, default: false },
    purchase: { type: Boolean, default: false },
    financial: { type: Boolean, default: false },
    hr: { type: Boolean, default: false },
    quality: { type: Boolean, default: false },
    security: { type: Boolean, default: false },
    custom: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    schedule: { type: Boolean, default: false }
  }
}, { _id: false });

const RoleSchema = new Schema<IRole>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Role Identification
  roleName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  roleCode: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 50
  },
  displayName: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String,
    maxlength: 500
  },

  // Role Classification
  roleType: {
    type: String,
    enum: ['system', 'custom', 'department', 'project', 'temporary'],
    default: 'custom',
    index: true
  },
  roleLevel: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'supervisor', 'executive', 'operator', 'helper'],
    required: true,
    index: true
  },
  department: {
    type: String,
    enum: ['Management', 'Production', 'Sales', 'Purchase', 'Accounts', 'HR', 'Quality', 'Maintenance', 'Security', 'IT'],
    index: true
  },

  // Permissions
  permissions: PermissionSchema,
  dynamicPermissions: [DynamicPermissionSchema],

  // Role Hierarchy & Inheritance
  parentRole: { type: Schema.Types.ObjectId, ref: 'Role' },
  childRoles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  inheritsFrom: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  canDelegate: { type: Boolean, default: false },
  delegationLevel: { type: Number, default: 0, min: 0, max: 5 },

  // Access Control
  accessRestrictions: {
    ipWhitelist: [String],
    timeRestrictions: {
      allowedDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
      allowedHours: {
        start: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        end: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
      }
    },
    locationRestrictions: [String],
    deviceRestrictions: [String]
  },

  // Data Access Control
  dataAccess: {
    ownDataOnly: { type: Boolean, default: false },
    departmentDataOnly: { type: Boolean, default: false },
    branchDataOnly: { type: Boolean, default: false },
    customDataFilters: { type: Schema.Types.Mixed },
    fieldLevelRestrictions: { type: Schema.Types.Mixed }
  },

  // Role Metadata
  isSystemRole: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  maxUsers: { type: Number, min: 0 }, // Maximum users that can have this role
  currentUsers: { type: Number, default: 0, min: 0 },

  // Approval & Workflow
  requiresApproval: { type: Boolean, default: false },
  approvalWorkflow: [{
    level: { type: Number, required: true },
    approverRole: { type: Schema.Types.ObjectId, ref: 'Role' },
    isRequired: { type: Boolean, default: true }
  }],

  // Audit & Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastUsed: { type: Date },
  usageCount: { type: Number, default: 0, min: 0 },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'roles'
});

// Compound Indexes
// Note: Most indexes are now managed centrally in database-indexes.ts
// Only keeping unique indexes that are not in the central configuration
RoleSchema.index({ companyId: 1, roleCode: 1 }, { unique: true });
RoleSchema.index({ companyId: 1, roleName: 1 });

// Text search index
RoleSchema.index({ 
  roleName: 'text', 
  roleCode: 'text',
  description: 'text'
});

// Pre-save middleware
RoleSchema.pre('save', function(next) {
  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = this.roleName;
  }
  
  // Validate max users limit
  if (this.maxUsers && this.currentUsers > this.maxUsers) {
    return next(new Error('Current users exceed maximum allowed users for this role'));
  }
  
  next();
});

// Instance methods
RoleSchema.methods.hasPermission = function(module: string, action: string): boolean {
  // Check standard permissions
  if (this.permissions && this.permissions[module] && this.permissions[module][action]) {
    return true;
  }
  
  // Check dynamic permissions
  if (this.dynamicPermissions) {
    const modulePermission = this.dynamicPermissions.find(
      (perm: IDynamicPermission) => perm.module === module && perm.isActive
    );
    
    if (modulePermission) {
      const actionPermission = modulePermission.actions.find(
        (act: any) => act.action === action
      );
      return actionPermission ? actionPermission.allowed : false;
    }
  }
  
  return false;
};

RoleSchema.methods.canAssignToUser = function(): boolean {
  return this.isActive && (!this.maxUsers || this.currentUsers < this.maxUsers);
};

RoleSchema.methods.incrementUserCount = function() {
  this.currentUsers += 1;
  this.lastUsed = new Date();
  this.usageCount += 1;
  return this.save();
};

RoleSchema.methods.decrementUserCount = function() {
  this.currentUsers = Math.max(0, this.currentUsers - 1);
  return this.save();
};

// Static methods
RoleSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

RoleSchema.statics.findByDepartment = function(companyId: string, department: string) {
  return this.find({ companyId, department, isActive: true });
};

RoleSchema.statics.findByLevel = function(companyId: string, roleLevel: string) {
  return this.find({ companyId, roleLevel, isActive: true });
};

RoleSchema.statics.getSystemRoles = function(companyId: string) {
  return this.find({ companyId, isSystemRole: true, isActive: true });
};

export default model<IRole>('Role', RoleSchema);
