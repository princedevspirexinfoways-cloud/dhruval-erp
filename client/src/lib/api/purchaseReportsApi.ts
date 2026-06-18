import { baseApi } from './baseApi'

// Report Types
export interface ReportFilters {
  companyId?: string
  vendorId?: string
  itemId?: string
  category?: string
  dateFrom?: string
  dateTo?: string
}

export interface VendorWisePurchaseSummary {
  vendorId: string
  vendorName: string
  contactPerson?: string
  contactNumber?: string
  email?: string
  gstin?: string
  totalPurchases: number
  totalOrders: number
  totalQuantity: number
  averageOrderValue: number
  items: Array<{
    itemId: string
    itemName: string
    itemCode: string
    category?: string
    totalQuantity: number
    totalAmount: number
    averageRate: number
    orderDates: string[]
  }>
}

export interface ItemWisePurchaseReport {
  itemId: string
  itemName: string
  itemCode: string
  category?: string
  subcategory?: string
  totalQuantity: number
  totalAmount: number
  averageRate: number
  minRate: number
  maxRate: number
  purchaseCount: number
  purchases: Array<{
    poNumber: string
    poDate: string
    vendorName: string
    vendorId: string
    quantity: number
    rate: number
    amount: number
    unit: string
  }>
}

export interface CategoryWisePurchaseReport {
  category: string
  totalPurchases: number
  totalQuantity: number
  totalOrders: number
  averageOrderValue: number
  items: Array<{
    itemId: string
    itemName: string
    itemCode: string
    totalQuantity: number
    totalAmount: number
    averageRate: number
  }>
  vendors: Array<{
    vendorId: string
    vendorName: string
    totalPurchases: number
    totalOrders: number
  }>
}

export interface DateRangeReport {
  dateFrom: string
  dateTo: string
  totalAmount: number
  totalQuantity: number
  totalOrders: number
  averageOrderValue: number
  vendorDetails: Array<{
    vendorId: string
    vendorName: string
    totalPurchases: number
    totalOrders: number
  }>
  itemDetails: Array<{
    itemId: string
    itemName: string
    itemCode: string
    totalQuantity: number
    totalAmount: number
  }>
  poEntries: Array<{
    poNumber: string
    poDate: string
    vendorName: string
    vendorId: string
    totalAmount: number
    totalQuantity: number
    itemCount: number
    status: string
    paymentStatus?: string
  }>
}

export interface ExportReportRequest {
  reportType: 'vendor-wise' | 'item-wise' | 'category-wise' | 'date-range'
  format: 'xlsx' | 'pdf' | 'csv'
  filters: ReportFilters
}

export interface ExportReportResponse {
  success: boolean
  data: {
    downloadUrl: string
    fileName: string
    format: string
    reportType: string
    recordCount: number
  }
}

// API Endpoints
export const purchaseReportsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    // Get Vendor-wise Purchase Summary
    getVendorWiseSummary: builder.query<
      { success: boolean; data: VendorWisePurchaseSummary[] },
      ReportFilters
    >({
      query: (filters) => ({
        url: '/purchase/reports/vendor-wise',
        params: filters,
      }),
      providesTags: ['PurchaseReports'],
    }),

    // Get Item-wise Purchase Report
    getItemWiseReport: builder.query<
      { success: boolean; data: ItemWisePurchaseReport[] },
      ReportFilters
    >({
      query: (filters) => ({
        url: '/purchase/reports/item-wise',
        params: filters,
      }),
      providesTags: ['PurchaseReports'],
    }),

    // Get Category-wise Purchase Report
    getCategoryWiseReport: builder.query<
      { success: boolean; data: CategoryWisePurchaseReport[] },
      ReportFilters
    >({
      query: (filters) => ({
        url: '/purchase/reports/category-wise',
        params: filters,
      }),
      providesTags: ['PurchaseReports'],
    }),

    // Get Date Range Report
    getDateRangeReport: builder.query<
      { success: boolean; data: DateRangeReport },
      ReportFilters
    >({
      query: (filters) => ({
        url: '/purchase/reports/date-range',
        params: filters,
      }),
      providesTags: ['PurchaseReports'],
    }),

    // Export Report (Excel, PDF, or CSV)
    exportReport: builder.mutation<Blob, ExportReportRequest>({
      query: ({ reportType, format, filters }) => ({
        url: `/purchase/reports/export/${reportType}/${format}`,
        method: 'POST',
        body: filters,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),
  }),
})

export const {
  useGetVendorWiseSummaryQuery,
  useGetItemWiseReportQuery,
  useGetCategoryWiseReportQuery,
  useGetDateRangeReportQuery,
  useExportReportMutation,
} = purchaseReportsApi
