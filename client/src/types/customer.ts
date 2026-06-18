/**
 * Comprehensive Customer Model with TypeScript Interfaces
 * This file contains all customer-related types and interfaces for the ERP system
 */

// Base Address Interface
export interface Address {
  street?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  addressType?: 'primary' | 'billing' | 'shipping' | 'office'
  isDefault?: boolean
}

// Contact Information Interface
export interface ContactInfo {
  primaryPhone?: string
  alternatePhone?: string
  primaryEmail?: string
  alternateEmail?: string
  fax?: string
  website?: string
  socialMedia?: {
    linkedin?: string
    facebook?: string
    twitter?: string
    instagram?: string
  }
}

// Business Information Interface
export interface BusinessInfo {
  businessType: 'private_limited' | 'public_limited' | 'proprietorship' | 'partnership' | 'individual' | 'llp' | 'trust' | 'society' | 'government'
  industry?: string
  registrationNumber?: string
  panNumber?: string
  gstNumber?: string
  cinNumber?: string
  establishedYear?: number
  employeeCount?: number
  annualTurnover?: number
  businessDescription?: string
}

// Financial Information Interface
export interface FinancialInfo {
  creditLimit?: number
  creditDays?: number
  securityDeposit?: number
  outstandingAmount?: number
  advanceAmount?: number
  totalPurchases?: number
  currency?: string
  discountPercentage?: number
  taxExempt?: boolean
  paymentTerms?: string
  bankDetails?: {
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    branchName?: string
  }
}

// Marketing Preferences Interface
export interface MarketingPreferences {
  marketingConsent?: boolean
  emailMarketing?: boolean
  smsMarketing?: boolean
  whatsappMarketing?: boolean
  language?: string
  preferredContactTime?: string
  communicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
}

// Customer Relationship Interface
export interface CustomerRelationship {
  customerType?: 'prospect' | 'regular' | 'vip' | 'wholesale' | 'retail'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  loyaltyPoints?: number
  customerTier?: 'bronze' | 'silver' | 'gold' | 'platinum'
  assignedSalesRep?: string
  lastContactDate?: string
  nextFollowUpDate?: string
  notes?: string
}

// Compliance and KYC Interface
export interface ComplianceInfo {
  kycStatus?: 'pending' | 'completed' | 'rejected' | 'expired'
  kycDocuments?: string[]
  riskCategory?: 'low' | 'medium' | 'high'
  blacklisted?: boolean
  blacklistReason?: string
  blacklistDate?: string
  verificationStatus?: 'verified' | 'unverified' | 'pending'
  verificationDocuments?: {
    idProof?: string
    addressProof?: string
    businessProof?: string
    taxProof?: string
  }
}

// Purchase History Interface
export interface PurchaseHistory {
  totalOrders?: number
  totalOrderValue?: number
  averageOrderValue?: number
  lastOrderDate?: string
  firstOrderDate?: string
  orderFrequency?: number // orders per month
  preferredProducts?: string[]
  seasonalPatterns?: {
    peakMonths?: number[]
    lowMonths?: number[]
  }
}

// Customer Preferences Interface
export interface CustomerPreferences {
  preferredDeliveryTime?: string
  preferredPaymentMethod?: 'cash' | 'credit' | 'upi' | 'card' | 'bank_transfer'
  deliveryInstructions?: string
  packagingPreferences?: string
  communicationPreferences?: {
    email?: boolean
    sms?: boolean
    phone?: boolean
    whatsapp?: boolean
  }
}

// Main Customer Interface
export interface Customer {
  _id: string
  customerCode: string
  customerName: string
  displayName?: string
  
  // Basic Information
  contactInfo: ContactInfo
  businessInfo: BusinessInfo
  
  // Addresses
  addresses?: Address[]
  primaryAddress?: Address
  billingAddress?: Address
  shippingAddress?: Address
  
  // Financial Information
  financialInfo?: FinancialInfo
  
  // Marketing and Communication
  marketing?: MarketingPreferences
  
  // Relationship Management
  relationship?: CustomerRelationship
  
  // Compliance
  compliance?: ComplianceInfo
  
  // Purchase History
  purchaseHistory?: PurchaseHistory
  
  // Preferences
  preferences?: CustomerPreferences
  
  // System Fields
  companyId: string
  company?: string
  isActive: boolean
  tags?: string[]
  notes?: string
  
  // Audit Fields
  createdAt: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  
  // Legacy Fields (for backward compatibility)
  name?: string
  email?: string
  phone?: string
  contactPerson?: string
  customerType?: 'individual' | 'business'
  creditLimit?: number
  paymentTerms?: string
  taxId?: string
  website?: string
  address?: Address
}

// Customer Creation Request Interface
export interface CreateCustomerRequest {
  customerName: string
  companyId: string
  businessInfo: BusinessInfo
  contactInfo: ContactInfo
  addresses?: Address[]
  financialInfo?: FinancialInfo
  marketing?: MarketingPreferences
  relationship?: CustomerRelationship
  compliance?: ComplianceInfo
  preferences?: CustomerPreferences
  tags?: string[]
  notes?: string
  
  // Legacy fields for backward compatibility
  name?: string
  email?: string
  phone?: string
  company?: string
  contactPerson?: string
  customerType?: 'individual' | 'business'
  creditLimit?: number
  paymentTerms?: string
  taxId?: string
  website?: string
  address?: Address
  billingAddress?: Address
}

// Customer Update Request Interface
export interface UpdateCustomerRequest {
  customerName?: string
  companyId?: string
  businessInfo?: Partial<BusinessInfo>
  contactInfo?: Partial<ContactInfo>
  addresses?: Address[]
  financialInfo?: Partial<FinancialInfo>
  marketing?: Partial<MarketingPreferences>
  relationship?: Partial<CustomerRelationship>
  compliance?: Partial<ComplianceInfo>
  preferences?: Partial<CustomerPreferences>
  tags?: string[]
  notes?: string
  isActive?: boolean
  
  // Legacy fields for backward compatibility
  name?: string
  email?: string
  phone?: string
  company?: string
  contactPerson?: string
  customerType?: 'individual' | 'business'
  creditLimit?: number
  paymentTerms?: string
  taxId?: string
  website?: string
  address?: Address
  billingAddress?: Address
}

// Customer Query Parameters Interface
export interface CustomerQueryParams {
  page?: number
  limit?: number
  search?: string
  customerType?: string
  status?: string
  companyId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  businessType?: string
  industry?: string
  priority?: string
  kycStatus?: string
  tags?: string[]
  createdFrom?: string
  createdTo?: string
}

// Customer Response Interface
export interface CustomersResponse {
  success: boolean
  data: Customer[]
  total: number
  page?: number
  limit?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

// Customer Statistics Interface
export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  newCustomersThisMonth: number
  customersByType: Record<string, number>
  customersByIndustry: Record<string, number>
  customersByPriority: Record<string, number>
  kycStatusBreakdown: Record<string, number>
  averageOrderValue: number
  totalOrderValue: number
  topCustomers: Customer[]
  recentCustomers: Customer[]
}

// Customer Filter Options Interface
export interface CustomerFilterOptions {
  businessTypes: Array<{ value: string; label: string }>
  industries: Array<{ value: string; label: string }>
  priorities: Array<{ value: string; label: string }>
  kycStatuses: Array<{ value: string; label: string }>
  customerTypes: Array<{ value: string; label: string }>
  companies: Array<{ _id: string; companyName: string; companyCode: string }>
}

// Customer Import/Export Interface
export interface CustomerImportData {
  customerName: string
  email: string
  phone: string
  businessType: string
  industry?: string
  address?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  contactPerson?: string
  website?: string
  notes?: string
  tags?: string
}

export interface CustomerExportData extends Customer {
  // Additional fields for export
  exportDate: string
  exportedBy: string
}

// Customer Validation Rules Interface
export interface CustomerValidationRules {
  required: string[]
  email: boolean
  phone: boolean
  businessType: boolean
  industry: boolean
  customRules?: Record<string, any>
}

// Customer Search Result Interface
export interface CustomerSearchResult {
  customer: Customer
  score: number
  matchedFields: string[]
}

// Customer Bulk Operations Interface
export interface CustomerBulkOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'update' | 'export' | 'import'
  customerIds: string[]
  data?: Partial<UpdateCustomerRequest>
  options?: Record<string, any>
}

// Customer Activity Log Interface
export interface CustomerActivityLog {
  _id: string
  customerId: string
  action: string
  description: string
  performedBy: string
  timestamp: string
  metadata?: Record<string, any>
}

// Customer Communication Log Interface
export interface CustomerCommunicationLog {
  _id: string
  customerId: string
  type: 'email' | 'sms' | 'phone' | 'whatsapp' | 'meeting'
  subject?: string
  message: string
  sentBy: string
  sentAt: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  response?: string
  metadata?: Record<string, any>
}

// Customer Document Interface
export interface CustomerDocument {
  _id: string
  customerId: string
  name: string
  type: 'kyc' | 'contract' | 'invoice' | 'other'
  fileUrl: string
  uploadedBy: string
  uploadedAt: string
  isVerified: boolean
  verifiedBy?: string
  verifiedAt?: string
  metadata?: Record<string, any>
}

// Customer Notes Interface
export interface CustomerNote {
  _id: string
  customerId: string
  title: string
  content: string
  type: 'general' | 'sales' | 'support' | 'complaint' | 'feedback'
  createdBy: string
  createdAt: string
  updatedAt?: string
  isPrivate: boolean
  tags?: string[]
}

// Customer Follow-up Interface
export interface CustomerFollowUp {
  _id: string
  customerId: string
  type: 'call' | 'email' | 'meeting' | 'visit' | 'other'
  scheduledDate: string
  completedDate?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  description: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high'
  outcome?: string
  nextFollowUpDate?: string
  createdAt: string
  updatedAt?: string
}

// Customer Segmentation Interface
export interface CustomerSegment {
  _id: string
  name: string
  description: string
  criteria: Record<string, any>
  customerIds: string[]
  createdAt: string
  updatedAt?: string
  createdBy: string
  isActive: boolean
}

// Customer Dashboard Data Interface
export interface CustomerDashboardData {
  stats: CustomerStats
  recentActivities: CustomerActivityLog[]
  upcomingFollowUps: CustomerFollowUp[]
  topCustomers: Customer[]
  alerts: Array<{
    type: 'kyc_expiry' | 'credit_limit' | 'follow_up' | 'payment_overdue'
    message: string
    customerId: string
    priority: 'low' | 'medium' | 'high'
  }>
  charts: {
    customerGrowth: Array<{ month: string; count: number }>
    customerByType: Array<{ type: string; count: number }>
    revenueByCustomer: Array<{ customerId: string; revenue: number }>
  }
}

