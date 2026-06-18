import { baseApi } from './baseApi'

export interface Quotation {
  _id: string
  quotationNumber: string
  customerId: string
  customer?: {
    customerName: string
    customerCode: string
    contactInfo?: {
      email: string
      phone: string
    }
  }
  party?: {
    partyName: string
    partyCode: string
    contactInfo?: {
      email: string
      phone: string
    }
  }
  amounts?: {
    subtotal: number
    totalDiscount: number
    taxableAmount: number
    totalTaxAmount: number
    grandTotal: number
    freightCharges?: number
    packingCharges?: number
    installationCharges?: number
    otherCharges?: number
    roundingAdjustment?: number
  }
  supplierName?: string
  requestedBy?: string
  department?: string
  requestDate?: string
  itemsCount?: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  quotationDate: string
  validUntil: string
  items: Array<{
    itemId: string
    itemName: string
    itemCode: string
    quantity: number
    unitPrice: number
    totalPrice: number
    taxRate?: number
    taxAmount?: number
    description?: string
    specifications?: string
  }>
  subtotal: number
  taxAmount: number
  discountAmount?: number
  totalAmount: number
  terms?: string
  notes?: string
  billingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  shippingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  attachments?: Array<{
    fileName: string
    fileUrl: string
    uploadedAt: string
  }>
  sentAt?: string
  acceptedAt?: string
  rejectedAt?: string
  convertedToOrderId?: string
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface QuotationStats {
  totalQuotations: number
  draftQuotations: number
  sentQuotations: number
  acceptedQuotations: number
  approvedQuotations: number
  rejectedQuotations: number
  expiredQuotations: number
  convertedQuotations: number
  pendingQuotations: number
  totalValue: number
  acceptedValue: number
  conversionRate: number
  newQuotationsThisWeek: number
  valueGrowth: number
  quotationsByStatus: {
    [status: string]: number
  }
  quotationsByCustomer: Array<{
    customerId: string
    customerName: string
    quotationCount: number
    totalValue: number
    acceptedValue: number
  }>
  recentQuotations: Quotation[]
  topCustomers: Array<{
    customerId: string
    customerName: string
    quotationCount: number
    totalValue: number
  }>
}

export interface CreateQuotationRequest {
  customerId: string
  validUntil: string
  items: Array<{
    itemId: string
    quantity: number
    unitPrice: number
    taxRate?: number
    description?: string
    specifications?: string
  }>
  terms?: string
  notes?: string
  billingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  shippingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
}

export const quotationsApi = baseApi.injectEndpoints({
    overrideExisting: true,
  endpoints: (builder) => ({
    // Get all quotations with filtering and pagination
    getQuotations: builder.query<
      {
        success: boolean
        data: Quotation[]
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
        customerId?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/quotations',
        method: 'GET',
        params,
      }),
      providesTags: ['Quotation'],
    }),

    // Get quotation statistics
    getQuotationStats: builder.query<
      { success: boolean; data: QuotationStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/quotations/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Quotation'],
    }),

    // Get quotation by ID
    getQuotationById: builder.query<
      { success: boolean; data: Quotation },
      string
    >({
      query: (quotationId) => ({
        url: `/quotations/${quotationId}`,
        method: 'GET',
      }),
      providesTags: ['Quotation'],
    }),

    // Create new quotation
    createQuotation: builder.mutation<
      { success: boolean; data: Quotation; message: string },
      CreateQuotationRequest
    >({
      query: (quotationData) => ({
        url: '/quotations',
        method: 'POST',
        body: quotationData,
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Update quotation
    updateQuotation: builder.mutation<
      { success: boolean; data: Quotation; message: string },
      { quotationId: string; quotationData: Partial<CreateQuotationRequest> }
    >({
      query: ({ quotationId, quotationData }) => ({
        url: `/quotations/${quotationId}`,
        method: 'PUT',
        body: quotationData,
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Delete quotation
    deleteQuotation: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (quotationId) => ({
        url: `/quotations/${quotationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Send quotation to customer
    sendQuotation: builder.mutation<
      { success: boolean; message: string },
      { quotationId: string; email?: string; message?: string }
    >({
      query: ({ quotationId, email, message }) => ({
        url: `/quotations/${quotationId}/send`,
        method: 'POST',
        body: { email, message },
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Accept quotation
    acceptQuotation: builder.mutation<
      { success: boolean; data: Quotation; message: string },
      { quotationId: string; notes?: string }
    >({
      query: ({ quotationId, notes }) => ({
        url: `/quotations/${quotationId}/accept`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Reject quotation
    rejectQuotation: builder.mutation<
      { success: boolean; data: Quotation; message: string },
      { quotationId: string; reason?: string }
    >({
      query: ({ quotationId, reason }) => ({
        url: `/quotations/${quotationId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Convert quotation to order
    convertToOrder: builder.mutation<
      { success: boolean; data: { quotation: Quotation; order: any }; message: string },
      { quotationId: string; orderData?: any }
    >({
      query: ({ quotationId, orderData }) => ({
        url: `/quotations/${quotationId}/convert`,
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Quotation', 'CustomerOrder'],
    }),

    // Download quotation PDF
    downloadQuotation: builder.mutation<
      { success: boolean; data: { downloadUrl: string }; message: string },
      string
    >({
      query: (quotationId) => ({
        url: `/quotations/${quotationId}/download`,
        method: 'POST',
      }),
    }),

    // Get quotations by customer
    getQuotationsByCustomer: builder.query<
      {
        success: boolean
        data: Quotation[]
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
        status?: string
      }
    >({
      query: ({ customerId, ...params }) => ({
        url: `/quotations/customer/${customerId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['Quotation'],
    }),

    // Duplicate quotation
    duplicateQuotation: builder.mutation<
      { success: boolean; data: Quotation; message: string },
      string
    >({
      query: (quotationId) => ({
        url: `/quotations/${quotationId}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['Quotation'],
    }),
  }),
})

export const {
  useGetQuotationsQuery,
  useGetQuotationStatsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useSendQuotationMutation,
  useAcceptQuotationMutation,
  useRejectQuotationMutation,
  useConvertToOrderMutation,
  useDownloadQuotationMutation,
  useGetQuotationsByCustomerQuery,
  useDuplicateQuotationMutation,
} = quotationsApi
