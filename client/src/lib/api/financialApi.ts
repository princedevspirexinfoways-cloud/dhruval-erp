import { baseApi } from './baseApi'

export interface FinancialTransaction {
  _id: string
  reference?: string
  type: 'income' | 'expense' | 'transfer'
  category: string
  subcategory?: string
  amount: number
  currency: string
  description?: string
  transactionDate: string
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  paymentMethod?: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'cheque' | 'online'
  account?: {
    accountId: string
    accountName: string
    accountNumber: string
  }
  relatedEntity?: {
    entityType: 'customer' | 'supplier' | 'employee'
    entityId: string
    entityName: string
  }
  relatedDocument?: {
    documentType: 'invoice' | 'purchase_order' | 'receipt' | 'voucher'
    documentId: string
    documentNumber: string
  }
  taxInfo?: {
    taxRate: number
    taxAmount: number
    taxType: string
  }
  attachments?: Array<{
    fileName: string
    fileUrl: string
    uploadedAt: string
  }>
  notes?: string
  tags?: string[]
  companyId: string
  createdBy: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface FinancialStats {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  thisMonthIncome: number
  thisMonthExpenses: number
  thisMonthTotal: number
  lastMonthIncome: number
  lastMonthExpenses: number
  incomeGrowth: number
  expenseGrowth: number
  profitMargin: number
  transactionsByType: {
    [type: string]: number
  }
  transactionsByCategory: Array<{
    category: string
    amount: number
    count: number
    percentage: number
  }>
  transactionsByStatus: {
    [status: string]: number
  }
  monthlyTrend: Array<{
    month: string
    income: number
    expenses: number
    profit: number
  }>
  topExpenseCategories: Array<{
    category: string
    amount: number
    count: number
  }>
  topIncomeCategories: Array<{
    category: string
    amount: number
    count: number
  }>
  cashFlow: Array<{
    date: string
    inflow: number
    outflow: number
    balance: number
  }>
}

export interface CreateTransactionRequest {
  type: 'income' | 'expense' | 'transfer'
  category: string
  subcategory?: string
  amount: number
  currency?: string
  description?: string
  transactionDate: string
  paymentMethod?: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'cheque' | 'online'
  accountId?: string
  relatedEntity?: {
    entityType: 'customer' | 'supplier' | 'employee'
    entityId: string
  }
  relatedDocument?: {
    documentType: 'invoice' | 'purchase_order' | 'receipt' | 'voucher'
    documentId: string
  }
  taxInfo?: {
    taxRate: number
    taxType: string
  }
  notes?: string
  tags?: string[]
}

export const financialApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all financial transactions with filtering and pagination
    getFinancialTransactions: builder.query<
      {
        success: boolean
        data: FinancialTransaction[]
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
        type?: string
        category?: string
        status?: string
        startDate?: string
        endDate?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/financial-transactions',
        method: 'GET',
        params,
      }),
      providesTags: ['FinancialTransaction'],
    }),

    // Get financial statistics
    getFinancialStats: builder.query<
      { success: boolean; data: FinancialStats },
      { companyId?: string; startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({
        url: '/financial-transactions/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['FinancialTransaction'],
    }),

    // Get financial transaction by ID
    getFinancialTransactionById: builder.query<
      { success: boolean; data: FinancialTransaction },
      string
    >({
      query: (transactionId) => ({
        url: `/financial-transactions/${transactionId}`,
        method: 'GET',
      }),
      providesTags: ['FinancialTransaction'],
    }),

    // Create new financial transaction
    createFinancialTransaction: builder.mutation<
      { success: boolean; data: FinancialTransaction; message: string },
      CreateTransactionRequest
    >({
      query: (transactionData) => ({
        url: '/financial-transactions',
        method: 'POST',
        body: transactionData,
      }),
      invalidatesTags: ['FinancialTransaction'],
    }),

    // Update financial transaction
    updateFinancialTransaction: builder.mutation<
      { success: boolean; data: FinancialTransaction; message: string },
      { transactionId: string; transactionData: Partial<CreateTransactionRequest> }
    >({
      query: ({ transactionId, transactionData }) => ({
        url: `/financial-transactions/${transactionId}`,
        method: 'PUT',
        body: transactionData,
      }),
      invalidatesTags: ['FinancialTransaction'],
    }),

    // Delete financial transaction
    deleteFinancialTransaction: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (transactionId) => ({
        url: `/financial-transactions/${transactionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinancialTransaction'],
    }),

    // Approve financial transaction
    approveFinancialTransaction: builder.mutation<
      { success: boolean; data: FinancialTransaction; message: string },
      { transactionId: string; notes?: string }
    >({
      query: ({ transactionId, notes }) => ({
        url: `/financial-transactions/${transactionId}/approve`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['FinancialTransaction'],
    }),

    // Get transactions by category
    getTransactionsByCategory: builder.query<
      {
        success: boolean
        data: FinancialTransaction[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        category: string
        page?: number
        limit?: number
        startDate?: string
        endDate?: string
      }
    >({
      query: ({ category, ...params }) => ({
        url: `/financial-transactions/category/${category}`,
        method: 'GET',
        params,
      }),
      providesTags: ['FinancialTransaction'],
    }),

    // Get cash flow report
    getCashFlowReport: builder.query<
      {
        success: boolean
        data: {
          summary: {
            openingBalance: number
            totalInflow: number
            totalOutflow: number
            closingBalance: number
          }
          transactions: Array<{
            date: string
            inflow: number
            outflow: number
            balance: number
          }>
        }
      },
      { startDate: string; endDate: string; companyId?: string }
    >({
      query: (params) => ({
        url: '/financial-transactions/cash-flow',
        method: 'GET',
        params,
      }),
      providesTags: ['FinancialTransaction'],
    }),

    // Get profit & loss report
    getProfitLossReport: builder.query<
      {
        success: boolean
        data: {
          revenue: {
            total: number
            categories: Array<{ category: string; amount: number }>
          }
          expenses: {
            total: number
            categories: Array<{ category: string; amount: number }>
          }
          grossProfit: number
          netProfit: number
          profitMargin: number
        }
      },
      { startDate: string; endDate: string; companyId?: string }
    >({
      query: (params) => ({
        url: '/financial-transactions/profit-loss',
        method: 'GET',
        params,
      }),
      providesTags: ['FinancialTransaction'],
    }),

    // Bulk import transactions
    bulkImportTransactions: builder.mutation<
      { success: boolean; data: { imported: number; failed: number }; message: string },
      { file: File; mappings: { [key: string]: string } }
    >({
      query: ({ file, mappings }) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('mappings', JSON.stringify(mappings))
        
        return {
          url: '/financial-transactions/bulk-import',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['FinancialTransaction'],
    }),
  }),
})

export const {
  useGetFinancialTransactionsQuery,
  useGetFinancialStatsQuery,
  useGetFinancialTransactionByIdQuery,
  useCreateFinancialTransactionMutation,
  useUpdateFinancialTransactionMutation,
  useDeleteFinancialTransactionMutation,
  useApproveFinancialTransactionMutation,
  useGetTransactionsByCategoryQuery,
  useGetCashFlowReportQuery,
  useGetProfitLossReportQuery,
  useBulkImportTransactionsMutation,
} = financialApi
