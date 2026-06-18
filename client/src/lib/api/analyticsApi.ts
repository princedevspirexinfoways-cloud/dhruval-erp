import { baseApi } from './baseApi'

export interface KPIData {
  totalRevenue: number
  revenueGrowth: number
  totalOrders: number
  ordersGrowth: number
  inventoryValue: number
  inventoryGrowth: number
  operationalEfficiency: number
  efficiencyGrowth: number
  energyConsumption: number
  energyGrowth: number
  safetyIncidents: number
  safetyGrowth: number
  visitorCount: number
  visitorGrowth: number
  maintenanceCompliance: number
  complianceGrowth: number
}

export interface RevenueData {
  month: string
  revenue: number
  orders: number
  efficiency: number
}

export interface DepartmentData {
  department: string
  efficiency: number
  cost: number
  revenue: number
}

export interface ResourceData {
  resource: string
  utilization: number
  cost: number
  target: number
}

export interface InventoryDistribution {
  category: string
  value: number
  percentage: number
}

export interface AnalyticsData {
  kpiData: KPIData
  revenueData: RevenueData[]
  departmentData: DepartmentData[]
  resourceData: ResourceData[]
  inventoryDistribution: InventoryDistribution[]
}

export const analyticsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get analytics dashboard data
    getAnalyticsDashboard: builder.query<
      { success: boolean; data: AnalyticsData },
      { 
        timeRange?: string
        companyId?: string
        departments?: string[]
        metrics?: string[]
        startDate?: string
        endDate?: string
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/dashboard',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get KPI data
    getKPIData: builder.query<
      { success: boolean; data: KPIData },
      { timeRange?: string; companyId?: string; comparisonPeriod?: string }
    >({
      query: (params = {}) => ({
        url: '/analytics/kpi',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get revenue trends
    getRevenueTrends: builder.query<
      { success: boolean; data: RevenueData[] },
      { timeRange?: string; companyId?: string; granularity?: 'daily' | 'weekly' | 'monthly' }
    >({
      query: (params = {}) => ({
        url: '/analytics/revenue-trends',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get department performance
    getDepartmentPerformance: builder.query<
      { success: boolean; data: DepartmentData[] },
      { timeRange?: string; companyId?: string; departments?: string[] }
    >({
      query: (params = {}) => ({
        url: '/analytics/department-performance',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get resource utilization
    getResourceUtilization: builder.query<
      { success: boolean; data: ResourceData[] },
      { timeRange?: string; companyId?: string; resources?: string[] }
    >({
      query: (params = {}) => ({
        url: '/analytics/resource-utilization',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get inventory distribution
    getInventoryDistribution: builder.query<
      { success: boolean; data: InventoryDistribution[] },
      { companyId?: string; categories?: string[] }
    >({
      query: (params = {}) => ({
        url: '/analytics/inventory-distribution',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get operational metrics
    getOperationalMetrics: builder.query<
      {
        success: boolean
        data: {
          productivity: {
            current: number
            target: number
            trend: number
          }
          quality: {
            defectRate: number
            customerSatisfaction: number
            returnRate: number
          }
          efficiency: {
            overallEquipmentEffectiveness: number
            energyEfficiency: number
            laborEfficiency: number
          }
          safety: {
            incidentRate: number
            nearMissReports: number
            complianceScore: number
          }
        }
      },
      { timeRange?: string; companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/analytics/operational-metrics',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get financial analysis
    getFinancialAnalysis: builder.query<
      {
        success: boolean
        data: {
          profitability: {
            grossMargin: number
            netMargin: number
            roi: number
          }
          cashFlow: {
            operating: number
            investing: number
            financing: number
          }
          costs: {
            totalCosts: number
            costBreakdown: Array<{
              category: string
              amount: number
              percentage: number
            }>
          }
        }
      },
      { timeRange?: string; companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/analytics/financial-analysis',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get daily reports
    getDailyReports: builder.query<
      { success: boolean; data: any },
      { 
        date?: string
        companyId?: string
        departments?: string[]
        metrics?: string[]
        includeDetails?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/reports/daily',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get weekly reports
    getWeeklyReports: builder.query<
      { success: boolean; data: any },
      { 
        weekStart?: string
        weekEnd?: string
        companyId?: string
        departments?: string[]
        metrics?: string[]
        includeDetails?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/reports/weekly',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get monthly reports
    getMonthlyReports: builder.query<
      { success: boolean; data: any },
      { 
        year?: number
        month?: number
        companyId?: string
        departments?: string[]
        metrics?: string[]
        includeDetails?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/reports/monthly',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get custom filtered reports
    getCustomReports: builder.query<
      { success: boolean; data: any },
      { 
        startDate: string
        endDate: string
        companyId?: string
        departments?: string[]
        products?: string[]
        statuses?: string[]
        metrics?: string[]
        groupBy?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        page?: number
        limit?: number
      }
    >({
      query: (params) => ({
        url: '/analytics/reports/custom',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get filter options
    getFilterOptions: builder.query<
      { success: boolean; data: any },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/analytics/filters',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get report templates
    getReportTemplates: builder.query<
      { success: boolean; data: any },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/analytics/templates',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Save report template
    saveReportTemplate: builder.mutation<
      { success: boolean; data: any },
      {
        name: string
        description?: string
        filters: any
        metrics: string[]
        groupBy?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        companyId?: string
      }
    >({
      query: (params) => ({
        url: '/analytics/templates',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Get real-time analytics
    getRealTimeAnalytics: builder.query<
      { success: boolean; data: any },
      { 
        companyId?: string
        metrics?: string[]
        refreshInterval?: number
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/realtime',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get dispatched reports
    getDispatchedReports: builder.query<
      { success: boolean; data: any },
      { 
        startDate?: string
        endDate?: string
        companyId?: string
        includeDetails?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/reports/dispatched',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get return reports
    getReturnReports: builder.query<
      { success: boolean; data: any },
      { 
        startDate?: string
        endDate?: string
        companyId?: string
        includeDetails?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/reports/return',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get completed reports
    getCompletedReports: builder.query<
      { success: boolean; data: any },
      { 
        startDate?: string
        endDate?: string
        companyId?: string
        includeDetails?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/analytics/reports/completed',
        method: 'GET',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Export analytics report
    exportAnalyticsReport: builder.mutation<
      { success: boolean; data: { downloadUrl: string }; message: string },
      {
        reportType: 'dashboard' | 'kpi' | 'financial' | 'operational' | 'custom'
        format: 'pdf' | 'excel' | 'csv'
        timeRange?: string
        startDate?: string
        endDate?: string
        companyId?: string
        departments?: string[]
        products?: string[]
        statuses?: string[]
        includeCharts?: boolean
        includeDetails?: boolean
      }
    >({
      query: (params) => ({
        url: '/analytics/export',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Analytics'],
    }),
  }),
})

export const {
  useGetAnalyticsDashboardQuery,
  useGetKPIDataQuery,
  useGetRevenueTrendsQuery,
  useGetDepartmentPerformanceQuery,
  useGetResourceUtilizationQuery,
  useGetInventoryDistributionQuery,
  useGetOperationalMetricsQuery,
  useGetFinancialAnalysisQuery,
  useGetDailyReportsQuery,
  useGetWeeklyReportsQuery,
  useGetMonthlyReportsQuery,
  useGetCustomReportsQuery,
  useGetFilterOptionsQuery,
  useGetReportTemplatesQuery,
  useSaveReportTemplateMutation,
  useGetRealTimeAnalyticsQuery,
  useGetDispatchedReportsQuery,
  useGetReturnReportsQuery,
  useGetCompletedReportsQuery,
  useExportAnalyticsReportMutation,
} = analyticsApi
