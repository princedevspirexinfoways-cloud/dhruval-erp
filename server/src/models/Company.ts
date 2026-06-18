import { Schema, model } from 'mongoose';
import { ICompany } from '@/types/models';

const AddressSchema = new Schema({
  street: { type: String },
  area: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' }
}, { _id: false });

const WarehouseAddressSchema = new Schema({
  warehouseName: { type: String },
  street: { type: String },
  area: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String }
}, { _id: false });

const ContactPhoneSchema = new Schema({
  type: { type: String, required: false },
  label: { type: String }
}, { _id: false });

const ContactEmailSchema = new Schema({
  type: { type: String, required: false },
  label: { type: String }
}, { _id: false });

const BankAccountSchema = new Schema({
  bankName: { type: String, required: true },
  branchName: { type: String },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  accountType: { 
    type: String, 
    enum: ['Current', 'Savings', 'CC', 'OD'], 
    required: true 
  },
  accountHolderName: { type: String, required: true },
  currentBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const LicenseSchema = new Schema({
  licenseType: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  issuedBy: { type: String, required: true },
  issuedDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  renewalRequired: { type: Boolean, default: false },
  documentUrl: { type: String }
}, { _id: false });

const CompanySchema = new Schema<ICompany>({
  companyCode: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20,
    minlength: 3,
    match: /^[A-Z0-9]{3,20}$/
  },
  companyName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  },
  legalName: { 
    type: String, 
    required: false,
    trim: true,
    maxlength: 255
  },

  // Registration Details
  registrationDetails: {
    gstin: { 
      type: String, 
      required: false, 
      unique: true,
      sparse: true,
      uppercase: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      default: undefined
    },
    pan: { 
      type: String, 
      required: false,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    },
    cin: { 
      type: String,
      uppercase: true,
      match: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/
    },
    udyogAadhar: { type: String },
    iecCode: { 
      type: String,
      uppercase: true,
      match: /^[0-9]{10}$/
    },
    registrationDate: { type: Date }
  },

  // Complete Address Information
  addresses: {
    registeredOffice: {
      type: AddressSchema,
      required: false
    },
    factoryAddress: {
      type: AddressSchema,
      required: false
    },
    warehouseAddresses: [WarehouseAddressSchema]
  },

  // Contact Information
  contactInfo: {
    phones: [ContactPhoneSchema],
    emails: [ContactEmailSchema],
    website: { 
      type: String,
      match: /^https?:\/\/.+/
    },
    socialMedia: {
      facebook: { type: String },
      instagram: { type: String },
      linkedin: { type: String }
    }
  },

  // Banking Details - Multiple Banks
  bankAccounts: [BankAccountSchema],

  // Business Configuration
  businessConfig: {
    currency: { type: String },
    timezone: { type: String },
    fiscalYearStart: { type: String },
    workingDays: [{ 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
    }],
    workingHours: {
      start: { type: String },
      end: { type: String },
      breakStart: { type: String },
      breakEnd: { type: String }
    },
    gstRates: {
      defaultRate: { type: Number },
      rawMaterialRate: { type: Number },
      finishedGoodsRate: { type: Number }
    }
  },

  // Production Capabilities
  productionCapabilities: {
    productTypes: [{ 
      type: String, 
      enum: ['saree', 'african_cotton', 'garment_fabric', 'digital_print', 'custom'] 
    }],
    printingMethods: [{ 
      type: String, 
      enum: ['table_printing', 'machine_printing', 'digital_printing'] 
    }],
    monthlyCapacity: {
      sarees: { type: Number },
      fabricMeters: { type: Number },
      customOrders: { type: Number }
    },
    qualityCertifications: [String]
  },

  // Compliance & Licenses
  licenses: [LicenseSchema],

  // Company Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'pending_approval', 'under_review'],
    default: 'active'
  },

  isActive: { type: Boolean, default: true },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true,
  collection: 'companies'
});

// Indexes for performance (companyCode and gstin already have unique indexes)
// Note: Most indexes are now managed centrally in database-indexes.ts
// Only keeping unique indexes that are not in the central configuration
CompanySchema.index({ 'registrationDetails.pan': 1 });
CompanySchema.index({ createdAt: -1 });

// Virtual for display name
CompanySchema.virtual('displayName').get(function() {
  return this.companyName || this.legalName;
});

// Pre-save middleware
CompanySchema.pre('save', function(next) {
  // Handle empty strings for unique fields - convert to undefined to avoid duplicate key errors
  if (this.registrationDetails) {
    if (this.registrationDetails.gstin === '' || this.registrationDetails.gstin === null) {
      this.registrationDetails.gstin = undefined;
    }
  }
  
  // Ensure at least one bank account is primary
  if (this.bankAccounts && this.bankAccounts.length > 0) {
    const primaryAccounts = this.bankAccounts.filter(account => account.isPrimary);
    if (primaryAccounts.length === 0) {
      this.bankAccounts[0].isPrimary = true;
    } else if (primaryAccounts.length > 1) {
      // Only keep the first one as primary
      this.bankAccounts.forEach((account, index) => {
        account.isPrimary = index === 0;
      });
    }
  }
  
  next();
});

// Instance methods
CompanySchema.methods.getPrimaryBankAccount = function() {
  return this.bankAccounts?.find(account => account.isPrimary && account.isActive);
};

CompanySchema.methods.getActiveLicenses = function() {
  const now = new Date();
  return this.licenses?.filter(license => 
    license.expiryDate > now && !license.renewalRequired
  );
};

CompanySchema.methods.getExpiringLicenses = function(daysAhead: number = 30) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return this.licenses?.filter(license => 
    license.expiryDate > now && 
    license.expiryDate <= futureDate
  );
};

// Static methods
CompanySchema.statics.findByCode = function(companyCode: string) {
  return this.findOne({ 
    companyCode: companyCode.toUpperCase(), 
    isActive: true 
  });
};

CompanySchema.statics.findByGSTIN = function(gstin: string) {
  return this.findOne({ 
    'registrationDetails.gstin': gstin.toUpperCase(), 
    isActive: true 
  });
};

export default model<ICompany>('Company', CompanySchema);
