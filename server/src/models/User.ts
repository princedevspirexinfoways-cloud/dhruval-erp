import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, ICompanyAccess, IRole, IPermission, IDynamicPermission } from '@/types/models';
import config from '@/config/environment';

const AddressSchema = new Schema({
  street: { type: String },
  area: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' }
}, { _id: false });

const ModulePermissionsSchema = new Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  approve: { type: Boolean, default: false },
  viewReports: { type: Boolean, default: false }
}, { _id: false });

const SecurityPermissionsSchema = new Schema({
  gateManagement: { type: Boolean, default: false },
  visitorManagement: { type: Boolean, default: false },
  vehicleTracking: { type: Boolean, default: false },
  cctvAccess: { type: Boolean, default: false },
  emergencyResponse: { type: Boolean, default: false }
}, { _id: false });

const HRPermissionsSchema = new Schema({
  viewEmployees: { type: Boolean, default: false },
  manageAttendance: { type: Boolean, default: false },
  manageSalary: { type: Boolean, default: false },
  viewReports: { type: Boolean, default: false }
}, { _id: false });

const AdminPermissionsSchema = new Schema({
  userManagement: { type: Boolean, default: false },
  systemSettings: { type: Boolean, default: false },
  backupRestore: { type: Boolean, default: false },
  auditLogs: { type: Boolean, default: false }
}, { _id: false });

const CompanyAccessSchema = new Schema<ICompanyAccess>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['super_admin', 'owner', 'manager', 'accountant', 'production_manager', 'sales_executive', 'security_guard', 'operator', 'helper'], 
    required: true 
  },
  department: { 
    type: String, 
    enum: ['Management', 'Production', 'Sales', 'Accounts', 'Security', 'Quality', 'Warehouse'] 
  },
  designation: { type: String },
  employeeId: { type: String },
  joiningDate: { type: Date },

  // Detailed Permissions
  permissions: {
    // Inventory Permissions
    inventory: ModulePermissionsSchema,
    
    // Production Permissions
    production: {
      ...ModulePermissionsSchema.obj,
      startProcess: { type: Boolean, default: false },
      qualityCheck: { type: Boolean, default: false }
    },
    
    // Order Management Permissions
    orders: {
      ...ModulePermissionsSchema.obj,
      dispatch: { type: Boolean, default: false }
    },

    // Sales Permissions
    sales: ModulePermissionsSchema,

    // Customers Permissions
    customers: ModulePermissionsSchema,

    // Suppliers Permissions
    suppliers: ModulePermissionsSchema,

    // Purchase (PO) Permissions
    purchase: ModulePermissionsSchema,

    // Gate Pass Permissions
    gatePass: ModulePermissionsSchema,

    // Batches Permissions
    batches: ModulePermissionsSchema,

    // Grey Fabric Inward Permissions
    greyFabricInward: ModulePermissionsSchema,
    
    // Financial Permissions
    financial: {
      ...ModulePermissionsSchema.obj,
      bankTransactions: { type: Boolean, default: false }
    },
    
    // Security Permissions
    security: SecurityPermissionsSchema,
    
    // HR Permissions
    hr: HRPermissionsSchema,
    
    // System Administration
    admin: AdminPermissionsSchema
  },

  isActive: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  remarks: { type: String }
});

const UserSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: { 
    type: String, 
    required: false, 
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8
  },

  // Personal Information
  personalInfo: {
    firstName: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    lastName: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    middleName: { 
      type: String,
      trim: true,
      maxlength: 100
    },
    displayName: { 
      type: String,
      trim: true,
      maxlength: 255
    },
    phone: { 
      type: String, 
      required: true,
      unique: true,
      trim: true,
      match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/
    },
    alternatePhone: { 
      type: String,
      match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/
    },
    dateOfBirth: { type: Date },
    gender: { 
      type: String, 
      enum: ['Male', 'Female', 'Other'] 
    },
    bloodGroup: { 
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    profilePhoto: { type: String },
    signature: { type: String }
  },

  // Address Information
  addresses: {
    current: AddressSchema,
    permanent: AddressSchema
  },

  // Company Access - Multi-company Support
  companyAccess: [CompanyAccessSchema],

  // Role & Permissions are handled through companyAccess

  // Dynamic Permissions are handled through companyAccess

  // Super Admin Flag (Optional for super admin across all companies)
  isSuperAdmin: {
    type: Boolean,
    default: false
  },

  // Primary Company (for default context)
  primaryCompanyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },

  // Security Settings
  security: {
    lastLogin: { type: Date },
    lastLoginIP: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLocked: { type: Boolean, default: false },
    lockoutTime: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    passwordLastChanged: { type: Date },
    mustChangePassword: { type: Boolean, default: false }
  },

  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    dashboard: {
      defaultCompany: { type: Schema.Types.ObjectId, ref: 'Company' },
      widgets: [String]
    }
  },

  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance (username and email already have unique indexes)
// Note: Most indexes are now managed centrally in database-indexes.ts
// Only keeping unique indexes that are not in the central configuration
UserSchema.index({ 'personalInfo.phone': 1 }, { unique: true });
UserSchema.index({ 'companyAccess.role': 1 });
UserSchema.index({ createdAt: -1 });

// Compound indexes (keeping only those not in central config)
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function(this: any) {
  const { firstName, middleName, lastName } = this.personalInfo;
  return [firstName, middleName, lastName].filter(Boolean).join(' ');
});

// Pre-save middleware for password hashing
// This hook only runs during document.save() operations, NOT during findByIdAndUpdate()
// This prevents double hashing during updates while ensuring passwords are hashed during creation
UserSchema.pre('save', async function(this: any, next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();

  try {
    // Safety check: Don't hash if password is already hashed
    // bcrypt hashes start with '$2a$', '$2b$', or '$2y$'
    if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$'))) {
      // Password is already hashed, skip hashing
      return next();
    }

    // Hash password
    const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);

    // Update password change timestamp
    this.security.passwordLastChanged = new Date();

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware for display name
UserSchema.pre('save', function(this: any, next) {
  if (!this.personalInfo.displayName) {
    this.personalInfo.displayName = this.fullName;
  }
  // Normalize phone number: keep leading + and digits only
  if (this.personalInfo?.phone) {
    const raw: string = this.personalInfo.phone.toString();
    const normalized = raw
      .replace(/\s+/g, '')
      .replace(/(?!^)[^\d]/g, '') // remove non-digits except possibly leading +
      .replace(/^\+?(.*)$/,(m, g1)=> (raw.startsWith('+') ? '+' : '') + g1);
    this.personalInfo.phone = normalized;
  }
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockoutTime && this.security.lockoutTime < new Date()) {
    return this.updateOne({
      $unset: { 'security.lockoutTime': 1 },
      $set: { 'security.failedLoginAttempts': 1 }
    });
  }
  
  const updates: any = { $inc: { 'security.failedLoginAttempts': 1 } };
  
  // If we have hit max attempts and it's not locked already, lock the account
  if (this.security.failedLoginAttempts + 1 >= config.MAX_LOGIN_ATTEMPTS && !this.security.accountLocked) {
    updates.$set = {
      'security.accountLocked': true,
      'security.lockoutTime': new Date(Date.now() + config.LOCKOUT_TIME)
    };
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'security.failedLoginAttempts': 1,
      'security.lockoutTime': 1
    },
    $set: {
      'security.accountLocked': false,
      'security.lastLogin': new Date()
    }
  });
};

UserSchema.methods.getCompanyAccess = function(companyId: string) {
  return this.companyAccess.find(
    (access: ICompanyAccess) => 
      access.companyId.toString() === companyId && access.isActive
  );
};

UserSchema.methods.hasPermission = function(companyId: string, module: string, action: string): boolean {
  const access = this.getCompanyAccess(companyId);
  if (!access) return false;

  // Super admin has all permissions
  if (access.role === 'super_admin') return true;

  return access.permissions?.[module]?.[action] || false;
};

// Enhanced Role & Permission Methods
UserSchema.methods.hasRole = function(roleId: string, companyId?: string): boolean {
  return this.roles.some((role: any) =>
    role.roleId.toString() === roleId &&
    role.isActive &&
    (!role.expiresAt || role.expiresAt > new Date()) &&
    (!companyId || role.companyId.toString() === companyId)
  );
};

UserSchema.methods.getRolesForCompany = function(companyId: string) {
  return this.roles.filter((role: any) =>
    role.companyId.toString() === companyId &&
    role.isActive &&
    (!role.expiresAt || role.expiresAt > new Date())
  );
};

UserSchema.methods.hasRolePermission = function(module: string, action: string, companyId?: string): boolean {
  // Super admin has all permissions
  if (this.isSuperAdmin) return true;

  // Check custom permissions first
  if (this.customPermissions &&
      this.customPermissions[module] &&
      this.customPermissions[module][action]) {
    return true;
  }

  // Check role-based permissions (would need populated role data)
  const relevantRoles = companyId ?
    this.getRolesForCompany(companyId) :
    this.roles.filter((role: any) => role.isActive);

  // This would need to be populated with actual role data
  return false; // Placeholder - implement based on populated role data
};

UserSchema.methods.assignRole = function(roleId: string, companyId: string, assignedBy?: string, expiresAt?: Date) {
  // Remove existing role for the same company if exists
  this.roles = this.roles.filter((role: any) =>
    !(role.roleId.toString() === roleId && role.companyId.toString() === companyId)
  );

  // Add new role
  this.roles.push({
    roleId,
    companyId,
    assignedBy,
    assignedAt: new Date(),
    isActive: true,
    expiresAt
  });

  return this.save();
};

UserSchema.methods.removeRole = function(roleId: string, companyId: string) {
  this.roles = this.roles.filter((role: any) =>
    !(role.roleId.toString() === roleId && role.companyId.toString() === companyId)
  );

  return this.save();
};

UserSchema.methods.canAccessCompany = function(companyId: string): boolean {
  // Super admin can access all companies
  if (this.isSuperAdmin) return true;

  // Check if user has any active role in the company
  return this.roles.some((role: any) =>
    role.companyId.toString() === companyId &&
    role.isActive &&
    (!role.expiresAt || role.expiresAt > new Date())
  );
};

UserSchema.methods.getAccessibleCompanies = function(): string[] {
  if (this.isSuperAdmin) {
    return []; // Super admin can access all companies
  }

  return [...new Set(
    this.companyAccess
      .filter((access: any) => access.isActive)
      .map((access: any) => access.companyId.toString())
  )] as string[];
};

// Static methods
UserSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ 
    username: username.toLowerCase(), 
    isActive: true 
  });
};

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 
    email: email.toLowerCase(), 
    isActive: true 
  });
};

UserSchema.statics.findByCompany = function(companyId: string) {
  return this.find({
    'companyAccess.companyId': companyId,
    'companyAccess.isActive': true,
    isActive: true
  });
};

// Add virtual properties for backward compatibility
UserSchema.virtual('role').get(function(this: any) {
  if (this.isSuperAdmin) return 'super_admin';
  const primaryAccess = this.companyAccess?.find((access: any) => access.isActive);
  return primaryAccess?.role || 'user';
});

UserSchema.virtual('companyId').get(function(this: any) {
  if (this.isSuperAdmin) return null;
  const primaryAccess = this.companyAccess?.find((access: any) => access.isActive);
  return primaryAccess?.companyId || null;
});

UserSchema.virtual('employeeId').get(function(this: any) {
  return this._id;
});

UserSchema.virtual('name').get(function(this: any) {
  return this.fullName;
});

export default model<IUser>('User', UserSchema);
