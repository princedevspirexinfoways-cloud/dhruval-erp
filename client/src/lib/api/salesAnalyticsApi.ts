import { baseApi } from './baseApi'

export interface CustomerSalesAnalytics {
  summary: {
    totalRevenue: number
    revenueGrowth: number
    totalOrders: number
    ordersGrowth: number
    activeCustomers: number
    customersGrowth: number
    averageOrderValue: number
    aovGrowth: number
  }
  salesData: Array<{
    period: string
    revenue: number
    orders: number
    customers: number
  }>
  customerData: Array<{
    customerId: string
    customerName: string
    customerEmail: string
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    lastOrderDate: string
    status: 'active' | 'inactive'
  }>
  productData: Array<{
    productId: string
    productName: string
    category: string
    totalOrders: number
    totalRevenue: number
    totalQuantity: number
  }>
  revenueTrends: Array<{
    period: string
    revenue: number
    orders: number
  }>
  topCustomers: Array<{
    customerId: string
    customerName: string
    revenue: number
    orders: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    revenue: number
    orders: number
  }>
}

export interface CustomerSalesReport {
  data: Array<{
    customerId: string
    customerName: string
    customerEmail: string
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    lastOrderDate: string
    status: string
    orderDetails?: Array<{
      orderId: string
      orderNumber: string
      orderDate: string
      totalAmount: number
      status: string
      products: Array<{
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        totalPrice: number
      }>
    }>
  }>
  pagination: {
    currentPage: number
    totalPages: number
    totalResults: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: {
    timeRange: string
    startDate?: string
    endDate?: string
    customerId?: string
    productId?: string
    status?: string
    groupBy: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}

export const salesAnalyticsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get customer sales analytics dashboard
    getCustomerSalesAnalytics: builder.query<
      { success: boolean; data: CustomerSalesAnalytics },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        customerId?: string
        productId?: string
        status?: string
        groupBy?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
      }
    >({
      query: (params = {}) => ({
        url: '/sales/analytics',
        method: 'GET',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),

    // Get detailed customer sales report
    getCustomerSalesReport: builder.query<
      { success: boolean; data: CustomerSalesReport },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        customerId?: string
        productId?: string
        status?: string
        groupBy?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        includeDetails?: boolean
        page?: number
        limit?: number
      }
    >({
      query: (params = {}) => ({
        url: '/sales/reports/customer',
        method: 'GET',
        params,
      }),
      providesTags: ['SalesReports'],
    }),

    // Export customer sales report
    exportCustomerSalesReport: builder.mutation<
      { success: boolean; data: { downloadUrl: string }; message: string },
      {
        format: 'pdf' | 'excel' | 'csv'
        timeRange?: string
        startDate?: string
        endDate?: string
        companyId?: string
        customerId?: string
        productId?: string
        status?: string
        groupBy?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        includeDetails?: boolean
      }
    >({
      query: (params) => ({
        url: '/sales/export/customer',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['SalesReports'],
    }),

    // Get sales performance by product
    getProductSalesPerformance: builder.query<
      { success: boolean; data: any },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        category?: string
        groupBy?: string
      }
    >({
      query: (params = {}) => ({
        url: '/sales/analytics/products',
        method: 'GET',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),

    // Get sales performance by category
    getCategorySalesPerformance: builder.query<
      { success: boolean; data: any },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        groupBy?: string
      }
    >({
      query: (params = {}) => ({
        url: '/sales/analytics/categories',
        method: 'GET',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),

    // Get sales trends and forecasting
    getSalesTrends: builder.query<
      { success: boolean; data: any },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        granularity?: 'daily' | 'weekly' | 'monthly'
        includeForecast?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/sales/analytics/trends',
        method: 'GET',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),

    // Get customer segmentation analysis
    getCustomerSegmentation: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        timeRange?: string
        segmentationType?: 'revenue' | 'frequency' | 'recency' | 'value'
      }
    >({
      query: (params = {}) => ({
        url: '/sales/analytics/segmentation',
        method: 'GET',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),

    // Get sales team performance
    getSalesTeamPerformance: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        timeRange?: string
        startDate?: string
        endDate?: string
        teamMemberId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/sales/analytics/team',
        method: 'GET',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),
  }),
})

export const {
  useGetCustomerSalesAnalyticsQuery,
  useGetCustomerSalesReportQuery,
  useExportCustomerSalesReportMutation,
  useGetProductSalesPerformanceQuery,
  useGetCategorySalesPerformanceQuery,
  useGetSalesTrendsQuery,
  useGetCustomerSegmentationQuery,
  useGetSalesTeamPerformanceQuery,
} = salesAnalyticsApi
