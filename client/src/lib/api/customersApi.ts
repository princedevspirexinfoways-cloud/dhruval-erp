import { baseApi } from './baseApi'

export interface Customer {
  _id: string
  companyId: string
  customerCode: string
  customerName: string
  businessInfo: {
    businessType: string
    industry: string
  }
  contactInfo: {
    primaryPhone?: string
    alternatePhone?: string
    primaryEmail?: string
    alternateEmail?: string
  }
  financialInfo: {
    creditLimit: number
    creditDays: number
    securityDeposit: number
    outstandingAmount: number
    advanceAmount: number
    totalPurchases: number
    currency: string
    discountPercentage: number
    taxExempt: boolean
  }
  purchaseHistory: {
    totalOrders: number
    totalOrderValue: number
    averageOrderValue: number
    preferredProducts: any[]
    seasonalPatterns: any[]
  }
  marketing: {
    marketingConsent: boolean
    emailMarketing: boolean
    smsMarketing: boolean
    whatsappMarketing: boolean
    language: string
  }
  relationship: {
    customerType: string
    priority: string
    loyaltyPoints: number
  }
  compliance: {
    kycStatus: string
    kycDocuments: any[]
    riskCategory: string
    blacklisted: boolean
  }
  tags: any[]
  attachments: any[]
  isActive: boolean
  createdBy: string
  addresses: any[]
  contactPersons: any[]
  createdAt: string
  updatedAt: string
  displayName: string
  __v: number
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  corporateCustomers: number
  individualCustomers: number
  governmentCustomers: number
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  newCustomersThisMonth: number
  topCustomers: Array<{
    _id: string
    name: string
    totalRevenue: number
    totalOrders: number
  }>
}

export interface CreateCustomerRequest {
  name?: string
  companyName?: string
  type: 'corporate' | 'individual' | 'government'
  email?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
  contactPerson?: {
    name: string
    designation?: string
    email?: string
    phone?: string
  }
  businessDetails?: {
    gstin?: string
    pan?: string
    industry?: string
    website?: string
  }
  creditLimit?: number
  paymentTerms?: string
}

export const customersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all customers with filtering and pagination
    getCustomers: builder.query<
      {
        success: boolean
        data: Customer[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        page?: number
        limit?: number
        search?: string
        status?: string
        type?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/customers',
        method: 'GET',
        params,
      }),
      providesTags: ['Customer'],
    }),

    // Get customer statistics
    getCustomerStats: builder.query<
      { success: boolean; data: CustomerStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/customers/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Customer'],
    }),

    // Get customer by ID
    getCustomerById: builder.query<
      { success: boolean; data: Customer },
      string
    >({
      query: (customerId) => ({
        url: `/customers/${customerId}`,
        method: 'GET',
      }),
      providesTags: ['Customer'],
    }),

    // Create new customer
    createCustomer: builder.mutation<
      { success: boolean; data: Customer; message: string },
      CreateCustomerRequest
    >({
      query: (customerData) => ({
        url: '/customers',
        method: 'POST',
        body: customerData,
      }),
      invalidatesTags: ['Customer'],
    }),

    // Find or create customer for Sales (spec: auto-save on first entry when typing new customer)
    findOrCreateCustomer: builder.mutation<
      { success: boolean; data: Customer; message: string; created?: boolean },
      {
        customerName: string
        contactPerson?: string
        mobile?: string
        whatsapp?: string
        email?: string
        gstin?: string
        address?: string
        state?: string
        paymentTerms?: string
        notes?: string
      }
    >({
      query: (payload) => ({
        url: '/customers/find-or-create',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Customer'],
    }),

    // Update customer
    updateCustomer: builder.mutation<
      { success: boolean; data: Customer; message: string },
      { customerId: string; customerData: Partial<CreateCustomerRequest> }
    >({
      query: ({ customerId, customerData }) => ({
        url: `/customers/${customerId}`,
        method: 'PUT',
        body: customerData,
      }),
      invalidatesTags: ['Customer'],
    }),

    // Delete customer
    deleteCustomer: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (customerId) => ({
        url: `/customers/${customerId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),

    // Get customer orders
    getCustomerOrders: builder.query<
      {
        success: boolean
        data: any[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        customerId: string
        page?: number
        limit?: number
      }
    >({
      query: ({ customerId, ...params }) => ({
        url: `/customers/${customerId}/orders`,
        method: 'GET',
        params,
      }),
      providesTags: ['Customer', 'Order'],
    }),

    // Update customer status
    updateCustomerStatus: builder.mutation<
      { success: boolean; data: Customer; message: string },
      { customerId: string; status: 'active' | 'inactive' | 'pending' }
    >({
      query: ({ customerId, status }) => ({
        url: `/customers/${customerId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerStatsQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useFindOrCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerOrdersQuery,
  useUpdateCustomerStatusMutation,
} = customersApi
