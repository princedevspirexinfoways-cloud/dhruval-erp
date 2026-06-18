import { baseApi } from './baseApi'

export interface Invoice {
  _id: string
  invoiceNumber: string
  customerId: string
  customer?: {
    customerName: string
    customerCode: string
    contactInfo?: {
      email: string
      phone: string
    }
  }
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  invoiceDate: string
  dueDate: string
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
  }>
  subtotal: number
  taxAmount: number
  discountAmount?: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentTerms?: string
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
  payments?: Array<{
    paymentId: string
    amount: number
    paymentDate: string
    paymentMethod: string
    reference?: string
  }>
  attachments?: Array<{
    fileName: string
    fileUrl: string
    uploadedAt: string
  }>
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceStats {
  totalInvoices: number
  draftInvoices: number
  sentInvoices: number
  paidInvoices: number
  overdueInvoices: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  paidThisMonth: number
  overdueAmount: number
  invoicesByStatus: {
    [status: string]: number
  }
  invoicesByCustomer: Array<{
    customerId: string
    customerName: string
    invoiceCount: number
    totalAmount: number
    paidAmount: number
  }>
  recentInvoices: Invoice[]
  topCustomers: Array<{
    customerId: string
    customerName: string
    invoiceCount: number
    totalAmount: number
  }>
}

export interface CreateInvoiceRequest {
  customerId: string
  dueDate: string
  items: Array<{
    itemId: string
    quantity: number
    unitPrice: number
    taxRate?: number
    description?: string
  }>
  paymentTerms?: string
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

export const invoicesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all invoices with filtering and pagination
    getInvoices: builder.query<
      {
        success: boolean
        data: Invoice[]
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
        url: '/invoices',
        method: 'GET',
        params,
      }),
      providesTags: ['Invoice'],
    }),

    // Get invoice statistics
    getInvoiceStats: builder.query<
      { success: boolean; data: InvoiceStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/invoices/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Invoice'],
    }),

    // Get invoice by ID
    getInvoiceById: builder.query<
      { success: boolean; data: Invoice },
      string
    >({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}`,
        method: 'GET',
      }),
      providesTags: ['Invoice'],
    }),

    // Create new invoice
    createInvoice: builder.mutation<
      { success: boolean; data: Invoice; message: string },
      CreateInvoiceRequest
    >({
      query: (invoiceData) => ({
        url: '/invoices',
        method: 'POST',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Update invoice
    updateInvoice: builder.mutation<
      { success: boolean; data: Invoice; message: string },
      { invoiceId: string; invoiceData: Partial<CreateInvoiceRequest> }
    >({
      query: ({ invoiceId, invoiceData }) => ({
        url: `/invoices/${invoiceId}`,
        method: 'PUT',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Delete invoice
    deleteInvoice: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Send invoice to customer
    sendInvoice: builder.mutation<
      { success: boolean; message: string },
      { invoiceId: string; email?: string; message?: string }
    >({
      query: ({ invoiceId, email, message }) => ({
        url: `/invoices/${invoiceId}/send`,
        method: 'POST',
        body: { email, message },
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Record payment for invoice
    recordPayment: builder.mutation<
      { success: boolean; data: Invoice; message: string },
      {
        invoiceId: string
        amount: number
        paymentDate: string
        paymentMethod: string
        reference?: string
        notes?: string
      }
    >({
      query: ({ invoiceId, ...paymentData }) => ({
        url: `/invoices/${invoiceId}/payment`,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Invoice', 'FinancialTransaction'],
    }),

    // Cancel invoice
    cancelInvoice: builder.mutation<
      { success: boolean; data: Invoice; message: string },
      { invoiceId: string; reason?: string }
    >({
      query: ({ invoiceId, reason }) => ({
        url: `/invoices/${invoiceId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Download invoice PDF
    downloadInvoice: builder.mutation<
      { success: boolean; data: { downloadUrl: string }; message: string },
      string
    >({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/download`,
        method: 'POST',
      }),
    }),

    // Get invoices by customer
    getInvoicesByCustomer: builder.query<
      {
        success: boolean
        data: Invoice[]
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
        url: `/invoices/customer/${customerId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['Invoice'],
    }),

    // Get overdue invoices
    getOverdueInvoices: builder.query<
      {
        success: boolean
        data: Invoice[]
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
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/invoices/overdue',
        method: 'GET',
        params,
      }),
      providesTags: ['Invoice'],
    }),
  }),
})

export const {
  useGetInvoicesQuery,
  useGetInvoiceStatsQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useSendInvoiceMutation,
  useRecordPaymentMutation,
  useCancelInvoiceMutation,
  useDownloadInvoiceMutation,
  useGetInvoicesByCustomerQuery,
  useGetOverdueInvoicesQuery,
} = invoicesApi
