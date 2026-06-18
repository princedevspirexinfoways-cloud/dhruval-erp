import { baseApi } from '@/lib/api/baseApi'

export interface Customer {
  _id: string
  customerCode: string
  name: string
  email: string
  phone: string
  company?: string
  contactPerson?: string
  isActive: boolean
  customerType: 'individual' | 'business'
  creditLimit?: number
  paymentTerms?: string
  taxId?: string
  website?: string
  address: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  billingAddress?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt?: string
  lastOrderDate?: string
  totalOrders?: number
  totalSpent?: number
  averageOrderValue?: number
  
  // Additional properties for enhanced customer management
  customerName?: string
  displayName?: string
  businessInfo?: {
    businessType: string
    industry?: string
  }
  contactInfo?: {
    primaryEmail?: string
    primaryPhone?: string
    website?: string
  }
  
  // Multiple addresses support
  addresses?: Array<{
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
    addressType?: 'primary' | 'billing' | 'shipping' | 'office'
    isDefault?: boolean
  }>
  
  // Financial information
  financialInfo?: {
    creditLimit?: number
    paymentTerms?: string
  }
  
  // Purchase history
  purchaseHistory?: {
    totalOrders?: number
    totalOrderValue?: number
    averageOrderValue?: number
    lastOrderDate?: string
  }
  relationship?: {
    customerType?: string
    priority?: string
  }
  compliance?: {
    kycStatus?: 'pending' | 'completed' | 'failed'
  }
  companyId?: string
}

export interface CustomersResponse {
  success: boolean
  data: Customer[]
  total: number
  page?: number
  limit?: number
}

export interface CreateCustomerRequest {
  customerName: string
  companyId: string
  businessInfo: {
    businessType: 'private_limited' | 'public_limited' | 'proprietorship' | 'partnership' | 'individual'
    industry: string
  }
  contactInfo: {
    primaryPhone: string
    alternatePhone?: string
    primaryEmail: string
    alternateEmail?: string
  }
  financialInfo?: {
    creditLimit?: number
    creditDays?: number
    securityDeposit?: number
    outstandingAmount?: number
    advanceAmount?: number
    totalPurchases?: number
    currency?: string
    discountPercentage?: number
    taxExempt?: boolean
  }
  marketing?: {
    marketingConsent?: boolean
    emailMarketing?: boolean
    smsMarketing?: boolean
    whatsappMarketing?: boolean
    language?: string
  }
  relationship?: {
    customerType?: 'prospect' | 'regular' | 'vip'
    priority?: 'low' | 'medium' | 'high'
    loyaltyPoints?: number
  }
  compliance?: {
    kycStatus?: 'pending' | 'completed' | 'rejected'
    kycDocuments?: string[]
    riskCategory?: 'low' | 'medium' | 'high'
    blacklisted?: boolean
  }
  tags?: string[]
  addresses?: any[]
  contactPersons?: any[]
  
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
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  billingAddress?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  notes?: string
}

export interface UpdateCustomerRequest {
  customerName?: string
  companyId?: string
  businessInfo?: {
    businessType?: 'private_limited' | 'public_limited' | 'proprietorship' | 'partnership' | 'individual'
    industry?: string
  }
  contactInfo?: {
    primaryPhone?: string
    alternatePhone?: string
    primaryEmail?: string
    alternateEmail?: string
  }
  financialInfo?: {
    creditLimit?: number
    creditDays?: number
    securityDeposit?: number
    outstandingAmount?: number
    advanceAmount?: number
    totalPurchases?: number
    currency?: string
    discountPercentage?: number
    taxExempt?: boolean
  }
  marketing?: {
    marketingConsent?: boolean
    emailMarketing?: boolean
    smsMarketing?: boolean
    whatsappMarketing?: boolean
    language?: string
  }
  relationship?: {
    customerType?: 'prospect' | 'regular' | 'vip'
    priority?: 'low' | 'medium' | 'high'
    loyaltyPoints?: number
  }
  compliance?: {
    kycStatus?: 'pending' | 'completed' | 'rejected'
    kycDocuments?: string[]
    riskCategory?: 'low' | 'medium' | 'high'
    blacklisted?: boolean
  }
  tags?: string[]
  addresses?: any[]
  contactPersons?: any[]
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
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  billingAddress?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  notes?: string
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCustomers: builder.query<CustomersResponse, { 
      page?: number
      limit?: number
      search?: string
      customerType?: string
      status?: string
      companyId?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }>({
      query: (params) => ({
        url: '/customers',
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (customer) => ({
        url: '/customers',
        method: 'POST',
        body: customer,
      }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; customer: UpdateCustomerRequest }>({
      query: ({ id, customer }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        body: customer,
      }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
    toggleCustomerStatus: builder.mutation<Customer, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/customers/${id}/toggle-status`,
        method: 'POST',
        body: { isActive },
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetAllCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useToggleCustomerStatusMutation,
} = customersApi
