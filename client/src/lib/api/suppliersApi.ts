import { baseApi } from './baseApi'

// Types
export interface Supplier {
  _id?: string
  supplierId: string
  supplierName: string
  legalName?: string
  displayName?: string
  supplierCode: string
  partNumber: string
  isPrimary: boolean
  leadTime: number
  minOrderQuantity: number
  lastSupplyDate?: string
  lastSupplyRate?: number
  qualityRating: number
  warrantyPeriod?: number
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  isActive?: boolean
  status: 'active' | 'inactive' | 'blacklisted' | 'pending'
  companyId?: string | { _id: string; companyName: string; companyCode: string }
  tags?: string[]
  
  // Contact Information
  contactInfo?: {
    primaryEmail?: string
    alternateEmail?: string
    primaryPhone?: string
    alternatePhone?: string
    whatsapp?: string
    fax?: string
    tollFree?: string
  }
  
  // Address Information
  addresses?: Array<{
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }>
  
  // Contact Persons
  contactPersons?: Array<{
    name: string
    designation?: string
    phone?: string
    email?: string
    isPrimary?: boolean
  }>
  
  // Business Information
  businessInfo?: {
    industry?: string
    businessType?: string
    subIndustry?: string
    businessDescription?: string
    website?: string
    establishedYear?: number
    employeeCount?: string
    annualTurnover?: string
    manufacturingCapacity?: string
  }
  
  // Registration Details
  registrationDetails?: {
    pan?: string
    gstin?: string
    cin?: string
    udyogAadhar?: string
    iecCode?: string
    registrationNumber?: string
    vatNumber?: string
    cstNumber?: string
    msmeNumber?: string
    factoryLicense?: string
  }
  
  // Financial Information
  financialInfo?: {
    paymentTerms?: string
    creditDays?: number
    totalPurchases?: number
    outstandingPayable?: number
    currency?: string
    securityDeposit?: number
    advancePaid?: number
    preferredPaymentMethod?: string
    taxDeductionRate?: number
  }
  
  // Banking Details
  bankingDetails?: {
    bankName?: string
    branchName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolderName?: string
    accountType?: string
  }
  
  // Relationship Information
  relationship?: {
    supplierCategory?: string
    supplierType?: string
    supplierSince?: string
    priority?: 'low' | 'medium' | 'high'
    strategicPartner?: boolean
    exclusiveSupplier?: boolean
  }
  
  // Supply History
  supplyHistory?: {
    totalOrders?: number
    totalOrderValue?: number
    averageOrderValue?: number
    onTimeDeliveryRate?: number
    averageLeadTime?: number
    qualityRejectionRate?: number
    firstOrderDate?: string
    lastOrderDate?: string
  }
  
  // Quality Information
  quality?: {
    defectRate?: number
    returnRate?: number
    qualityRating?: number
  }
  
  // Compliance Information
  compliance?: {
    vendorApprovalStatus?: 'approved' | 'pending' | 'rejected'
    riskCategory?: string
    blacklisted?: boolean
    blacklistReason?: string
    complianceNotes?: string
    environmentalCompliance?: boolean
    laborCompliance?: boolean
    safetyCompliance?: boolean
  }
  
  // Performance Metrics (legacy)
  performanceMetrics: {
    onTimeDeliveryRate: number
    qualityRejectionRate: number
    averageLeadTime: number
    totalOrders: number
    totalOrderValue: number
    averageOrderValue: number
  }
  
  // Legacy fields for backward compatibility
  totalOrders?: number
  totalSpend?: number
  
  pricingHistory: Array<{
    date: string
    price: number
    currency: string
    quantity: number
    orderNumber?: string
  }>
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface SupplierAnalytics {
  totalSuppliers: number
  activeSuppliers: number
  primarySupplier?: string
  averageLeadTime: number
  averageQualityRating: number
  totalOrderValue: number
  performanceComparison: Array<{
    name: string
    onTimeDelivery: number
    qualityRating: number
    averageLeadTime: number
  }>
  priceTrends: Array<{
    name: string
    trend: 'increasing' | 'decreasing' | 'stable'
    currentPrice: number
    priceChange?: number
  }>
}

export interface SupplierFilters {
  spareId?: string
  status?: string
  isPrimary?: boolean
  qualityRating?: number
  leadTime?: number
  page?: number
  limit?: number
}

export const suppliersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get suppliers for a spare
    getSuppliersForSpare: builder.query<
      { success: boolean; data: Supplier[] },
      string
    >({
      query: (spareId) => ({
        url: `/suppliers-management/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Supplier', id: `SPARE_${spareId}` },
      ],
    }),

    // Get all suppliers with filters
    getSuppliers: builder.query<
      { success: boolean; data: { data: Supplier[]; pagination: any }; message: string; timestamp: string },
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        category?: string;
      }
    >({
      query: (params) => ({
        url: '/suppliers',
        method: 'GET',
        params,
      }),
      providesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),

    // Add supplier to a spare
    addSupplier: builder.mutation<
      { success: boolean; data: Supplier; message: string },
      { spareId: string; supplierData: Supplier }
    >({
      query: ({ spareId, supplierData }) => ({
        url: `/suppliers-management/${spareId}`,
        method: 'POST',
        body: supplierData,
      }),
      invalidatesTags: (result, error, { spareId }) => [
        { type: 'Supplier', id: `SPARE_${spareId}` },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),

    // Create general supplier (not tied to a specific spare)
    createSupplier: builder.mutation<
      { success: boolean; data: Supplier; message: string },
      Supplier
    >({
      query: (supplierData) => ({
        url: '/suppliers',
        method: 'POST',
        body: supplierData,
      }),
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),

    // Update general supplier
    updateGeneralSupplier: builder.mutation<
      { success: boolean; data: Supplier; message: string },
      { id: string; data: Partial<Supplier> }
    >({
      query: ({ id, data }) => ({
        url: `/suppliers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),

    // Update supplier
    updateSupplier: builder.mutation<
      { success: boolean; data: Supplier; message: string },
      { spareId: string; supplierIndex: number; data: Partial<Supplier> }
    >({
      query: ({ spareId, supplierIndex, data }) => ({
        url: `/suppliers-management/${spareId}/${supplierIndex}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { spareId }) => [
        { type: 'Supplier', id: `SPARE_${spareId}` },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),

    // Delete supplier
    deleteSupplier: builder.mutation<
      { success: boolean; message: string },
      { spareId: string; supplierIndex: number }
    >({
      query: ({ spareId, supplierIndex }) => ({
        url: `/suppliers-management/${spareId}/${supplierIndex}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { spareId }) => [
        { type: 'Supplier', id: `SPARE_${spareId}` },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),

    // Add pricing history to supplier
    addPricingHistory: builder.mutation<
      { success: boolean; data: any; message: string },
      { spareId: string; supplierIndex: number; pricingData: any }
    >({
      query: ({ spareId, supplierIndex, pricingData }) => ({
        url: `/suppliers-management/${spareId}/${supplierIndex}/pricing`,
        method: 'POST',
        body: pricingData,
      }),
      invalidatesTags: (result, error, { spareId }) => [
        { type: 'Supplier', id: `SPARE_${spareId}` },
      ],
    }),

    // Get supplier analytics for a spare
    getSupplierAnalytics: builder.query<
      { success: boolean; data: SupplierAnalytics },
      string
    >({
      query: (spareId) => ({
        url: `/suppliers-management/${spareId}/analytics`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Supplier', id: `ANALYTICS_${spareId}` },
      ],
    }),

    // Get suppliers by status
    getSuppliersByStatus: builder.query<
      { success: boolean; data: Supplier[] },
      string
    >({
      query: (status) => ({
        url: `/suppliers-management/status/${status}`,
        method: 'GET',
      }),
      providesTags: (result, error, status) => [
        { type: 'Supplier', id: `STATUS_${status}` },
      ],
    }),

    // Get primary suppliers
    getPrimarySuppliers: builder.query<
      { success: boolean; data: Supplier[] },
      void
    >({
      query: () => ({
        url: '/suppliers-management/primary/all',
        method: 'GET',
      }),
      providesTags: [{ type: 'Supplier', id: 'PRIMARY' }],
    }),

    // Search suppliers
    searchSuppliers: builder.query<
      { success: boolean; data: Supplier[] },
      string
    >({
      query: (query) => ({
        url: `/suppliers-management/search/${query}`,
        method: 'GET',
      }),
      providesTags: (result, error, query) => [
        { type: 'Supplier', id: `SEARCH_${query}` },
      ],
    }),

    // Get supplier statistics overview
    getSupplierStats: builder.query<
      { success: boolean; data: SupplierAnalytics },
      void
    >({
      query: () => ({
        url: '/suppliers-management/stats/overview',
        method: 'GET',
      }),
      providesTags: [{ type: 'Supplier', id: 'OVERALL_ANALYTICS' }],
    }),

    // Bulk supplier operations
    bulkSupplierOperations: builder.mutation<
      { success: boolean; data: Supplier[]; message: string },
      { spareId: string; suppliers: Supplier[] }
    >({
      query: ({ spareId, suppliers }) => ({
        url: `/suppliers-management/bulk/${spareId}`,
        method: 'POST',
        body: { suppliers },
      }),
      invalidatesTags: (result, error, { spareId }) => [
        { type: 'Supplier', id: `SPARE_${spareId}` },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),

    // Get supplier by ID
    getSupplierById: builder.query<
      { success: boolean; data: Supplier },
      string
    >({
      query: (supplierId) => ({
        url: `/suppliers-management/supplier/${supplierId}`,
        method: 'GET',
      }),
      providesTags: (result, error, supplierId) => [
        { type: 'Supplier', id: supplierId },
      ],
    }),

    // Get supplier orders
    getSupplierOrders: builder.query<
      { success: boolean; data: any[] },
      string
    >({
      query: (supplierId) => ({
        url: `/suppliers-management/supplier/${supplierId}/orders`,
        method: 'GET',
      }),
      providesTags: (result, error, supplierId) => [
        { type: 'Supplier', id: `ORDERS_${supplierId}` },
      ],
    }),
  }),
})

export const {
  useGetSuppliersQuery,
  useGetSuppliersForSpareQuery,
  useAddSupplierMutation,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useUpdateGeneralSupplierMutation,
  useDeleteSupplierMutation,
  useAddPricingHistoryMutation,
  useGetSupplierAnalyticsQuery,
  useGetSuppliersByStatusQuery,
  useGetPrimarySuppliersQuery,
  useSearchSuppliersQuery,
  useGetSupplierStatsQuery,
  useBulkSupplierOperationsMutation,
  useGetSupplierByIdQuery,
  useGetSupplierOrdersQuery,
} = suppliersApi
