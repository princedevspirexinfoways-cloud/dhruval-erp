import mongoose from 'mongoose';

// Performance Metrics Schema
const PerformanceMetricsSchema = new mongoose.Schema({
  onTimeDeliveryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  qualityRejectionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageLeadTime: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Pricing History Schema
const PricingHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  orderNumber: {
    type: String,
    trim: true
  }
}, { _id: false });

// Supplier Schema (embedded in Spare)
export const SpareSupplierSchema = new mongoose.Schema({
  supplierId: {
    type: String,
    required: true,
    trim: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  supplierCode: {
    type: String,
    required: true,
    trim: true
  },
  partNumber: {
    type: String,
    required: true,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  leadTime: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minOrderQuantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  lastSupplyDate: {
    type: Date
  },
  lastSupplyRate: {
    type: Number,
    min: 0
  },
  qualityRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  warrantyPeriod: {
    type: Number,
    min: 0,
    default: 0
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted', 'pending'],
    default: 'active'
  },
  performanceMetrics: {
    type: PerformanceMetricsSchema,
    default: () => ({})
  },
  pricingHistory: {
    type: [PricingHistorySchema],
    default: []
  },
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true,
  _id: false 
});

// Indexes for better query performance
SpareSupplierSchema.index({ supplierId: 1 });
SpareSupplierSchema.index({ supplierName: 1 });
SpareSupplierSchema.index({ supplierCode: 1 });
SpareSupplierSchema.index({ partNumber: 1 });
SpareSupplierSchema.index({ status: 1 });
SpareSupplierSchema.index({ isPrimary: 1 });

// Virtual for supplier performance score
SpareSupplierSchema.virtual('performanceScore').get(function() {
  const metrics = this.performanceMetrics;
  if (!metrics) return 0;
  
  const onTimeScore = metrics.onTimeDeliveryRate || 0;
  const qualityScore = (100 - (metrics.qualityRejectionRate || 0));
  const leadTimeScore = Math.max(0, 100 - (metrics.averageLeadTime || 0));
  
  return Math.round((onTimeScore + qualityScore + leadTimeScore) / 3);
});

// Method to update performance metrics
SpareSupplierSchema.methods.updatePerformanceMetrics = function(newOrder) {
  const metrics = this.performanceMetrics;
  
  // Update total orders and value
  metrics.totalOrders = (metrics.totalOrders || 0) + 1;
  metrics.totalOrderValue = (metrics.totalOrderValue || 0) + (newOrder.value || 0);
  metrics.averageOrderValue = metrics.totalOrderValue / metrics.totalOrders;
  
  // Update lead time if provided
  if (newOrder.leadTime !== undefined) {
    const currentAvg = metrics.averageLeadTime || 0;
    const currentCount = metrics.totalOrders - 1;
    metrics.averageLeadTime = ((currentAvg * currentCount) + newOrder.leadTime) / metrics.totalOrders;
  }
  
  // Update delivery rate if provided
  if (newOrder.onTime !== undefined) {
    const currentRate = metrics.onTimeDeliveryRate || 0;
    const currentCount = metrics.totalOrders - 1;
    const newRate = newOrder.onTime ? 100 : 0;
    metrics.onTimeDeliveryRate = ((currentRate * currentCount) + newRate) / metrics.totalOrders;
  }
  
  // Update quality rejection rate if provided
  if (newOrder.rejected !== undefined) {
    const currentRate = metrics.qualityRejectionRate || 0;
    const currentCount = metrics.totalOrders - 1;
    const newRate = newOrder.rejected ? 100 : 0;
    metrics.qualityRejectionRate = ((currentRate * currentCount) + newRate) / metrics.totalOrders;
  }
  
  return this;
};

// Method to add pricing history
SpareSupplierSchema.methods.addPricingHistory = function(pricingData) {
  const newPricing = {
    date: pricingData.date || new Date(),
    price: pricingData.price,
    currency: pricingData.currency || 'USD',
    quantity: pricingData.quantity,
    orderNumber: pricingData.orderNumber
  };
  
  this.pricingHistory.push(newPricing);
  
  // Keep only last 50 pricing records
  if (this.pricingHistory.length > 50) {
    this.pricingHistory = this.pricingHistory.slice(-50);
  }
  
  return this;
};

// Method to get current price
SpareSupplierSchema.methods.getCurrentPrice = function() {
  if (this.pricingHistory.length === 0) {
    return null;
  }
  
  // Sort by date and get the most recent
  const sortedHistory = [...this.pricingHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedHistory[0];
};

// Method to get price trend
SpareSupplierSchema.methods.getPriceTrend = function() {
  if (this.pricingHistory.length < 2) {
    return 'stable';
  }
  
  const sortedHistory = [...this.pricingHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const recent = sortedHistory[0].price;
  const previous = sortedHistory[1].price;
  
  if (recent > previous) return 'increasing';
  if (recent < previous) return 'decreasing';
  return 'stable';
};

// Static method to find suppliers by status
SpareSupplierSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to find primary suppliers
SpareSupplierSchema.statics.findPrimarySuppliers = function() {
  return this.find({ isPrimary: true });
};

// Static method to find suppliers by quality rating
SpareSupplierSchema.statics.findByQualityRating = function(minRating) {
  return this.find({ qualityRating: { $gte: minRating } });
};

// Pre-save middleware to ensure only one primary supplier per spare
SpareSupplierSchema.pre('save', function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // This will be handled at the Spare level
    // where we ensure only one supplier is primary
  }
  next();
});

// Export the schema
export const SpareSupplier = mongoose.model('SpareSupplier', SpareSupplierSchema);

// Export types for TypeScript
export interface ISpareSupplier extends mongoose.Document {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  partNumber: string;
  isPrimary: boolean;
  leadTime: number;
  minOrderQuantity: number;
  lastSupplyDate?: Date;
  lastSupplyRate?: number;
  qualityRating: number;
  warrantyPeriod?: number;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  status: 'active' | 'inactive' | 'blacklisted' | 'pending';
  performanceMetrics: {
    onTimeDeliveryRate: number;
    qualityRejectionRate: number;
    averageLeadTime: number;
    totalOrders: number;
    totalOrderValue: number;
    averageOrderValue: number;
  };
  pricingHistory: Array<{
    date: Date;
    price: number;
    currency: string;
    quantity: number;
    orderNumber?: string;
  }>;
  notes?: string;
  performanceScore: number;
  updatePerformanceMetrics: (newOrder: any) => ISpareSupplier;
  addPricingHistory: (pricingData: any) => ISpareSupplier;
  getCurrentPrice: () => any;
  getPriceTrend: () => string;
}

// Standalone Supplier Model
const SupplierSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  supplierCode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  legalName: {
    type: String,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  businessInfo: {
    businessType: {
      type: String,
      enum: ['individual', 'proprietorship', 'partnership', 'private_limited', 'public_limited', 'llp', 'trust', 'society', 'government'],
      default: 'proprietorship'
    },
    industry: String,
    subIndustry: String,
    businessDescription: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      linkedin: String,
      twitter: String
    },
    establishedYear: Number,
    employeeCount: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+']
    },
    annualTurnover: {
      type: String,
      enum: ['<1L', '1L-10L', '10L-1Cr', '1Cr-10Cr', '10Cr+']
    },
    manufacturingCapacity: String
  },
  registrationDetails: {
    gstin: String,
    pan: String,
    cin: String,
    udyogAadhar: String,
    iecCode: String,
    registrationNumber: String,
    vatNumber: String,
    cstNumber: String,
    msmeNumber: String,
    factoryLicense: String
  },
  contactInfo: {
    primaryPhone: {
      type: String,
      required: true,
      trim: true
    },
    alternatePhone: String,
    primaryEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    alternateEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    whatsapp: String,
    fax: String,
    tollFree: String
  },
  addresses: [{
    type: {
      type: String,
      enum: ['office', 'factory', 'warehouse', 'billing'],
      default: 'office'
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: String,
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  contactPersons: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    designation: String,
    phone: String,
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  productCategories: [{
    category: {
      type: String,
      required: true,
      trim: true
    },
    subCategory: String,
    description: String
  }],
  financialInfo: {
    paymentTerms: String,
    creditDays: {
      type: Number,
      default: 0,
      min: 0
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: 0
    },
    advancePaid: {
      type: Number,
      default: 0,
      min: 0
    },
    outstandingPayable: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPaymentDate: Date,
    lastPaymentAmount: {
      type: Number,
      min: 0
    },
    preferredPaymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    taxDeductionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  bankingDetails: {
    bankName: String,
    branchName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    accountType: {
      type: String,
      enum: ['savings', 'current', 'cc', 'od']
    },
    upiId: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  supplyHistory: {
    firstOrderDate: Date,
    lastOrderDate: Date,
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    qualityRejectionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageLeadTime: {
      type: Number,
      default: 0,
      min: 0
    },
    suppliedProducts: [String]
  },
  performanceMetrics: [{
    metric: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    unit: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  quality: {
    qualityRating: {
      type: Number,
      min: 1,
      max: 5
    },
    qualityGrade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C']
    },
    certifications: [String],
    qualityAgreements: [String],
    lastQualityAudit: Date,
    nextQualityAudit: Date,
    qualityNotes: String,
    defectRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    returnRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  relationship: {
    supplierType: {
      type: String,
      enum: ['manufacturer', 'trader', 'distributor', 'agent', 'service_provider'],
      default: 'manufacturer'
    },
    supplierCategory: {
      type: String,
      enum: ['strategic', 'preferred', 'approved', 'conditional', 'blacklisted'],
      default: 'approved'
    },
    relationshipManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedBuyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    supplierSince: Date,
    lastInteraction: Date,
    nextReview: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    exclusiveSupplier: {
      type: Boolean,
      default: false
    },
    strategicPartner: {
      type: Boolean,
      default: false
    }
  },
  compliance: {
    vendorApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    approvalDate: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    complianceDocuments: [String],
    riskCategory: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    blacklisted: {
      type: Boolean,
      default: false
    },
    blacklistReason: String,
    complianceNotes: String,
    lastComplianceCheck: Date,
    nextComplianceCheck: Date,
    environmentalCompliance: {
      type: Boolean,
      default: false
    },
    laborCompliance: {
      type: Boolean,
      default: false
    },
    safetyCompliance: {
      type: Boolean,
      default: false
    }
  },
  notes: String,
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  attachments: [String],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
SupplierSchema.index({ companyId: 1, supplierCode: 1 }, { unique: true });
SupplierSchema.index({ companyId: 1, isActive: 1 });
SupplierSchema.index({ companyId: 1, 'relationship.supplierCategory': 1 });
SupplierSchema.index({ companyId: 1, 'quality.qualityRating': -1 });

// Export the standalone Supplier model
export const Supplier = mongoose.model('Supplier', SupplierSchema);

// Export types for TypeScript
export interface ISupplier extends mongoose.Document {
  companyId: mongoose.Schema.Types.ObjectId;
  supplierCode: string;
  supplierName: string;
  legalName?: string;
  displayName?: string;
  businessInfo: {
    businessType: string;
    industry: string;
    subIndustry: string;
    businessDescription: string;
    website: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      linkedin: string;
      twitter: string;
    };
    establishedYear: number;
    employeeCount: string;
    annualTurnover: string;
    manufacturingCapacity: string;
  };
  registrationDetails: {
    gstin: string;
    pan: string;
    cin: string;
    udyogAadhar: string;
    iecCode: string;
    registrationNumber: string;
    vatNumber: string;
    cstNumber: string;
    msmeNumber: string;
    factoryLicense: string;
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
  addresses: Array<{
    type: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
  }>;
  contactPersons: Array<{
    name: string;
    designation?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
  }>;
  productCategories: Array<{
    category: string;
    subCategory?: string;
    description?: string;
  }>;
  financialInfo: {
    paymentTerms: string;
    creditDays: number;
    securityDeposit: number;
    advancePaid: number;
    outstandingPayable: number;
    totalPurchases: number;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    preferredPaymentMethod?: string;
    currency: string;
    taxDeductionRate: number;
  };
  bankingDetails: {
    bankName: string;
    branchName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    accountType: string;
    upiId?: string;
    isVerified: boolean;
  };
  supplyHistory: {
    firstOrderDate: Date;
    lastOrderDate: Date;
    totalOrders: number;
    totalOrderValue: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
    qualityRejectionRate: number;
    averageLeadTime: number;
    suppliedProducts: string[];
  };
  performanceMetrics: Array<{
    metric: string;
    value: number;
    unit?: string;
    date: Date;
  }>;
  quality: {
    qualityRating: number;
    qualityGrade: string;
    certifications: string[];
    qualityAgreements: string[];
    lastQualityAudit?: Date;
    nextQualityAudit?: Date;
    qualityNotes?: string;
    defectRate: number;
    returnRate: number;
  };
  relationship: {
    supplierType: string;
    supplierCategory: string;
    relationshipManager?: mongoose.Schema.Types.ObjectId;
    assignedBuyer?: mongoose.Schema.Types.ObjectId;
    supplierSince: Date;
    lastInteraction: Date;
    nextReview: Date;
    priority: string;
    exclusiveSupplier: boolean;
    strategicPartner: boolean;
  };
  compliance: {
    vendorApprovalStatus: string;
    approvalDate?: Date;
    approvedBy?: mongoose.Schema.Types.ObjectId;
    complianceDocuments: string[];
    riskCategory: string;
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
  tags?: string[];
  customFields?: mongoose.Schema.Types.Mixed;
  attachments?: string[];
  isActive: boolean;
}
