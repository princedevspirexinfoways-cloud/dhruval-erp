import { Schema, model } from 'mongoose';
import { ICustomer } from '@/types/models';

const AddressSchema = new Schema({
  type: { type: String, enum: ['billing', 'shipping', 'office', 'warehouse'], required: true },
  isPrimary: { type: Boolean, default: false },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  landmark: { type: String },
  gpsCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const ContactPersonSchema = new Schema({
  name: { type: String, required: true },
  designation: { type: String },
  department: { type: String },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  email: { type: String },
  whatsapp: { type: String },
  isPrimary: { type: Boolean, default: false },
  canPlaceOrders: { type: Boolean, default: false },
  canMakePayments: { type: Boolean, default: false },
  notes: { type: String },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const CustomerSchema = new Schema<ICustomer>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true
  },

  // Customer Identification
  customerCode: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  customerName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  },
  legalName: { 
    type: String,
    trim: true,
    maxlength: 255
  },
  displayName: { 
    type: String,
    trim: true,
    maxlength: 255
  },

  // Business Information
  businessInfo: {
    businessType: { 
      type: String, 
      enum: ['individual', 'proprietorship', 'partnership', 'private_limited', 'public_limited', 'llp', 'trust', 'society', 'government'], 
      required: true 
    },
    industry: { type: String },
    subIndustry: { type: String },
    businessDescription: { type: String },
    website: { type: String },
    socialMedia: {
      facebook: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      twitter: { type: String }
    },
    establishedYear: { type: Number },
    employeeCount: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
    annualTurnover: { type: String, enum: ['<1L', '1L-10L', '10L-1Cr', '1Cr-10Cr', '10Cr+'] }
  },

  // Registration Details (GSTIN: allow valid format or URD/Unregistered for non-GST customers)
  registrationDetails: {
    gstin: { 
      type: String,
      uppercase: true,
      validate: {
        validator: function(v: string) {
          if (!v || v === '') return true;
          if (['URD', 'UNREGISTERED'].includes(v)) return true;
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'GSTIN must be valid or URD/Unregistered'
      },
      sparse: true
    },
    pan: { 
      type: String,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    },
    cin: { type: String },
    udyogAadhar: { type: String },
    iecCode: { type: String },
    registrationNumber: { type: String },
    vatNumber: { type: String },
    cstNumber: { type: String }
  },

  // Contact Information
  contactInfo: {
    primaryPhone: { type: String, required: true },
    alternatePhone: { type: String },
    primaryEmail: { type: String, required: true },
    alternateEmail: { type: String },
    whatsapp: { type: String },
    fax: { type: String },
    tollFree: { type: String }
  },

  // Addresses
  addresses: [AddressSchema],

  // Contact Persons
  contactPersons: [ContactPersonSchema],

  // Financial Information
  financialInfo: {
    creditLimit: { type: Number, default: 0, min: 0 },
    creditDays: { type: Number, default: 0, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },
    outstandingAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0, min: 0 },
    lastPaymentDate: { type: Date },
    lastPaymentAmount: { type: Number, min: 0 },
    paymentTerms: { type: String },
    preferredPaymentMethod: { 
      type: String, 
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'credit'] 
    },
    currency: { type: String, default: 'INR' },
    priceList: { type: String },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    taxExempt: { type: Boolean, default: false },
    taxExemptionNumber: { type: String }
  },

  // Purchase History & Preferences
  purchaseHistory: {
    firstOrderDate: { type: Date },
    lastOrderDate: { type: Date },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalOrderValue: { type: Number, default: 0, min: 0 },
    averageOrderValue: { type: Number, default: 0, min: 0 },
    preferredProducts: [String],
    seasonalPatterns: [String],
    orderFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'irregular'] }
  },

  // Marketing & Communication
  marketing: {
    source: { 
      type: String, 
      enum: ['direct', 'referral', 'website', 'social_media', 'advertisement', 'exhibition', 'cold_call', 'other'] 
    },
    referredBy: { type: String },
    marketingConsent: { type: Boolean, default: true },
    emailMarketing: { type: Boolean, default: true },
    smsMarketing: { type: Boolean, default: true },
    whatsappMarketing: { type: Boolean, default: false },
    lastCommunication: { type: Date },
    communicationPreference: { 
      type: String, 
      enum: ['email', 'phone', 'whatsapp', 'sms', 'postal'] 
    },
    language: { type: String, default: 'en' }
  },

  // Relationship Management
  relationship: {
    customerType: { 
      type: String, 
      enum: ['prospect', 'new', 'regular', 'vip', 'inactive', 'blocked'], 
      default: 'prospect' 
    },
    customerSegment: { 
      type: String, 
      enum: ['retail', 'wholesale', 'distributor', 'manufacturer', 'exporter', 'government'] 
    },
    relationshipManager: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedSalesPerson: { type: Schema.Types.ObjectId, ref: 'User' },
    customerSince: { type: Date },
    lastInteraction: { type: Date },
    nextFollowUp: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    satisfactionRating: { type: Number, min: 1, max: 5 },
    loyaltyPoints: { type: Number, default: 0, min: 0 }
  },

  // Compliance & Risk
  compliance: {
    kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    kycDocuments: [String], // URLs to uploaded documents
    riskCategory: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    blacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String },
    complianceNotes: { type: String },
    lastKycUpdate: { type: Date }
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to documents, images, etc.

  // Status & Tracking
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'customers'
});

// Compound Indexes
CustomerSchema.index({ companyId: 1, customerCode: 1 }, { unique: true });
CustomerSchema.index({ companyId: 1, 'contactInfo.primaryEmail': 1 });
CustomerSchema.index({ companyId: 1, 'contactInfo.primaryPhone': 1 });
CustomerSchema.index({ companyId: 1, 'registrationDetails.gstin': 1 });
CustomerSchema.index({ companyId: 1, 'relationship.customerType': 1 });
CustomerSchema.index({ companyId: 1, 'relationship.customerSegment': 1 });
CustomerSchema.index({ companyId: 1, isActive: 1 });

// Text search index
CustomerSchema.index({ 
  customerName: 'text', 
  customerCode: 'text',
  legalName: 'text',
  'contactInfo.primaryEmail': 'text',
  'contactInfo.primaryPhone': 'text'
});

// Pre-save middleware
CustomerSchema.pre('save', function(next) {
  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = this.customerName;
  }
  
  // Ensure at least one address is primary
  if (this.addresses && this.addresses.length > 0) {
    const primaryAddresses = this.addresses.filter(addr => addr.isPrimary);
    if (primaryAddresses.length === 0) {
      this.addresses[0].isPrimary = true;
    } else if (primaryAddresses.length > 1) {
      this.addresses.forEach((addr, index) => {
        addr.isPrimary = index === 0;
      });
    }
  }
  
  // Ensure at least one contact person is primary
  if (this.contactPersons && this.contactPersons.length > 0) {
    const primaryContacts = this.contactPersons.filter(contact => contact.isPrimary);
    if (primaryContacts.length === 0) {
      this.contactPersons[0].isPrimary = true;
    } else if (primaryContacts.length > 1) {
      this.contactPersons.forEach((contact, index) => {
        contact.isPrimary = index === 0;
      });
    }
  }
  
  // Calculate average order value
  if (this.purchaseHistory.totalOrders > 0) {
    this.purchaseHistory.averageOrderValue = 
      this.purchaseHistory.totalOrderValue / this.purchaseHistory.totalOrders;
  }
  
  // Auto-generate customer code if not provided
  if (!this.customerCode && this.customerName) {
    this.customerCode = this.customerName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8) + '-' + Date.now().toString().slice(-4);
  }

  // Update lastUpdated timestamp
  (this as any).lastUpdated = new Date();
  
  next();
});

// Instance methods
CustomerSchema.methods.getPrimaryAddress = function(type?: string) {
  if (type) {
    return this.addresses.find(addr => addr.type === type && addr.isPrimary && addr.isActive);
  }
  return this.addresses.find(addr => addr.isPrimary && addr.isActive);
};

CustomerSchema.methods.getPrimaryContact = function() {
  return this.contactPersons.find(contact => contact.isPrimary && contact.isActive);
};

CustomerSchema.methods.getCreditBalance = function() {
  return this.financialInfo.creditLimit - this.financialInfo.outstandingAmount;
};

CustomerSchema.methods.checkOverdue = function() {
  if (!this.financialInfo.lastPaymentDate || this.financialInfo.outstandingAmount <= 0) {
    return false;
  }

  const dueDate = new Date(this.financialInfo.lastPaymentDate);
  dueDate.setDate(dueDate.getDate() + this.financialInfo.creditDays);

  return new Date() > dueDate;
};

CustomerSchema.methods.canPlaceOrder = function(orderValue: number) {
  if (this.compliance.blacklisted) return false;
  if (!this.isActive) return false;
  
  const availableCredit = this.getCreditBalance();
  return availableCredit >= orderValue;
};

// Static methods
CustomerSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

CustomerSchema.statics.findByType = function(companyId: string, customerType: string) {
  return this.find({ 
    companyId, 
    'relationship.customerType': customerType, 
    isActive: true 
  });
};

CustomerSchema.statics.findOverdue = function(companyId: string) {
  const today = new Date();
  return this.find({
    companyId,
    isActive: true,
    'financialInfo.outstandingAmount': { $gt: 0 },
    $expr: {
      $lt: [
        { $add: ['$financialInfo.lastPaymentDate', { $multiply: ['$financialInfo.creditDays', 24 * 60 * 60 * 1000] }] },
        today
      ]
    }
  });
};

// Performance Optimization: Add additional indexes (non-duplicate)
// Note: companyId + isActive index already defined above at line 237
CustomerSchema.index({ companyId: 1, 'contactInfo.email': 1 });
CustomerSchema.index({ companyId: 1, 'contactInfo.phone': 1 });
CustomerSchema.index({ companyId: 1, 'financialInfo.creditLimit': -1 });
CustomerSchema.index({ companyId: 1, 'financialInfo.outstandingAmount': -1 });
CustomerSchema.index({ companyId: 1, 'financialInfo.lastPaymentDate': -1 });
CustomerSchema.index({ customerName: 'text', 'contactInfo.email': 'text' }, { name: 'customer_text_search' });

// Performance Optimization: Add virtuals
CustomerSchema.virtual('creditUtilization').get(function() {
  const creditLimit = this.financialInfo?.creditLimit || 0;
  const outstanding = this.financialInfo?.outstandingAmount || 0;
  return creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0;
});

CustomerSchema.virtual('isOverdue').get(function() {
  if (!this.financialInfo?.lastPaymentDate || !this.financialInfo?.creditDays) return false;
  const dueDate = new Date(this.financialInfo.lastPaymentDate);
  dueDate.setDate(dueDate.getDate() + this.financialInfo.creditDays);
  return new Date() > dueDate && (this.financialInfo?.outstandingAmount || 0) > 0;
});

CustomerSchema.virtual('primaryAddress').get(function() {
  return this.addresses?.find(addr => addr.isPrimary && addr.isActive);
});

CustomerSchema.virtual('primaryContact').get(function() {
  return this.contactPersons?.find(contact => contact.isPrimary && contact.isActive);
});

// Performance Optimization: Add query helpers
(CustomerSchema.query as any).byCompany = function(companyId: string) {
  return this.where({ companyId });
};

(CustomerSchema.query as any).active = function() {
  return this.where({ isActive: true });
};

(CustomerSchema.query as any).withOutstanding = function() {
  return this.where({ 'financialInfo.outstandingAmount': { $gt: 0 } });
};

(CustomerSchema.query as any).overCreditLimit = function() {
  return this.where({
    $expr: {
      $gt: ['$financialInfo.outstandingAmount', '$financialInfo.creditLimit']
    }
  });
};

// Note: Pre-save middleware is already defined above at line 249

export default model<ICustomer>('Customer', CustomerSchema);
