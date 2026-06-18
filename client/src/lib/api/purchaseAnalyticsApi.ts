import { baseApi } from './baseApi'

export interface SupplierPurchaseAnalytics {
  summary: {
    totalPurchase: number
    purchaseGrowth: number
    totalOrders: number
    ordersGrowth: number
    activeSuppliers: number
    suppliersGrowth: number
    averageOrderValue: number
    aovGrowth: number
    totalChemicals: number
    totalFabrics: number
    totalPacking: number
  }
  purchaseData: Array<{
    period: string
    purchase: number
    orders: number
    suppliers: number
  }>
  supplierData: Array<{
    supplierId: string
    supplierName: string
    supplierEmail: string
    totalOrders: number
    totalPurchase: number
    averageOrderValue: number
    lastOrderDate: string
    status: 'active' | 'inactive'
    category: string
  }>
  categoryData: Array<{
    categoryId: string
    categoryName: string
    totalOrders: number
    totalPurchase: number
    totalQuantity: number
    items: Array<{
      itemId: string
      itemName: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }>
  }>
  purchaseTrends: Array<{
    period: string
    purchase: number
    orders: number
  }>
  topSuppliers: Array<{
    supplierId: string
    supplierName: string
    purchase: number
    orders: number
  }>
  topCategories: Array<{
    categoryId: string
    categoryName: string
    purchase: number
    orders: number
  }>
}

export interface SupplierPurchaseReport {
  data: Array<{
    supplierId: string
    supplierName: string
    supplierEmail: string
    totalOrders: number
    totalPurchase: number
    averageOrderValue: number
    lastOrderDate: string
    status: string
    category: string
    orderDetails?: Array<{
      orderId: string
      orderNumber: string
      orderDate: string
      totalAmount: number
      status: string
      category: string
      items: Array<{
        itemId: string
        itemName: string
        quantity: number
        unitPrice: number
        totalPrice: number
        specifications?: string
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
    supplierId?: string
    category?: string
    status?: string
    groupBy: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}

export const purchaseAnalyticsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get supplier purchase analytics dashboard
    getSupplierPurchaseAnalytics: builder.query<
      { success: boolean; data: SupplierPurchaseAnalytics },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        supplierId?: string
        category?: string
        status?: string
        groupBy?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
      }
    >({
      query: (params = {}) => ({
        url: '/purchase/analytics',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),

    // Get detailed supplier purchase report
    getSupplierPurchaseReport: builder.query<
      { success: boolean; data: SupplierPurchaseReport },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        supplierId?: string
        category?: string
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
        url: '/purchase/reports/supplier',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseReports'],
    }),

    // Export supplier purchase report
    exportSupplierPurchaseReport: builder.mutation<
      { success: boolean; data: { downloadUrl: string }; message: string },
      {
        format: 'pdf' | 'excel' | 'csv'
        timeRange?: string
        startDate?: string
        endDate?: string
        companyId?: string
        supplierId?: string
        category?: string
        status?: string
        groupBy?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        includeDetails?: boolean
      }
    >({
      query: (params) => ({
        url: '/purchase/export/supplier',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['PurchaseReports'],
    }),

    // Get purchase performance by category
    getCategoryPurchasePerformance: builder.query<
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
        url: '/purchase/analytics/categories',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),

    // Get chemicals purchase tracking
    getChemicalsPurchaseTracking: builder.query<
      { success: boolean; data: any },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        chemicalType?: string
        supplierId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/purchase/analytics/chemicals',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),

    // Get grey fabric purchase tracking
    getGreyFabricPurchaseTracking: builder.query<
      { success: boolean; data: any },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        fabricType?: string
        supplierId?: string
        gsm?: string
      }
    >({
      query: (params = {}) => ({
        url: '/purchase/analytics/fabrics',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),

    // Get packing material purchase tracking
    getPackingMaterialPurchaseTracking: builder.query<
      { success: boolean; data: any },
      {
        timeRange?: string
        companyId?: string
        startDate?: string
        endDate?: string
        materialType?: string
        supplierId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/purchase/analytics/packing',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),

    // Get purchase trends and forecasting
    getPurchaseTrends: builder.query<
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
        url: '/purchase/analytics/trends',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),

    // Get supplier performance analysis
    getSupplierPerformanceAnalysis: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        timeRange?: string
        startDate?: string
        endDate?: string
        analysisType?: 'quality' | 'delivery' | 'pricing' | 'overall'
      }
    >({
      query: (params = {}) => ({
        url: '/purchase/analytics/supplier-performance',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),

    // Get purchase cost analysis
    getPurchaseCostAnalysis: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        timeRange?: string
        startDate?: string
        endDate?: string
        category?: string
        groupBy?: 'month' | 'quarter' | 'year' | 'supplier'
      }
    >({
      query: (params = {}) => ({
        url: '/purchase/analytics/cost-analysis',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseAnalytics'],
    }),
  }),
})

export const {
  useGetSupplierPurchaseAnalyticsQuery,
  useGetSupplierPurchaseReportQuery,
  useExportSupplierPurchaseReportMutation,
  useGetCategoryPurchasePerformanceQuery,
  useGetChemicalsPurchaseTrackingQuery,
  useGetGreyFabricPurchaseTrackingQuery,
  useGetPackingMaterialPurchaseTrackingQuery,
  useGetPurchaseTrendsQuery,
  useGetSupplierPerformanceAnalysisQuery,
  useGetPurchaseCostAnalysisQuery,
} = purchaseAnalyticsApi
