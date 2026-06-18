import { baseApi } from './baseApi'

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  userTrends?: Array<{
    month: string
    users: number
  }>
  usersByCompany?: Array<{
    _id: string
    userCount: number
    roles: string[]
  }>
  roleDistribution?: Record<string, number>
  activityTrends?: Array<{
    date: string
    activeUsers: number
  }>
}

export interface CompanyPerformance {
  companyPerformance: Array<{
    _id: string
    companyName: string
    companyCode: string
    industry: string
    status: string
    createdAt: string
    userCount: number
    activeUsers: number
    inactiveUsers: number
  }>
  growthTrends: Array<{
    month: string
    newCompanies: number
  }>
  totalCompanies: number
  totalUsers: number
  averageUsersPerCompany: number
}

export interface SystemHealth {
  database: {
    status: string
    collections: number
    dataSize: number
    storageSize: number
    indexes: number
  }
  users: {
    total: number
    activeToday: number
    newToday: number
  }
  system: {
    uptime: number
    memoryUsage: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
      arrayBuffers: number
    }
    nodeVersion: string
    timestamp: string
  }
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  companyId?: string
  role?: string
  status?: string
}

export const reportsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getUserAnalytics: builder.query<{ success: boolean; data: UserAnalytics }, ReportFilters | void>({
      query: (filters = {}) => ({
        url: '/reports/user-analytics',
        method: 'GET',
        params: filters,
      }),
      providesTags: ['Report', 'User'],
    }),
    
    getCompanyPerformance: builder.query<{ success: boolean; data: CompanyPerformance }, ReportFilters | void>({
      query: (filters = {}) => ({
        url: '/reports/company-performance',
        method: 'GET',
        params: filters,
      }),
      providesTags: ['Report', 'Company'],
    }),
    
    getSystemHealth: builder.query<{ success: boolean; data: SystemHealth }, void>({
      query: () => ({
        url: '/reports/system-health',
        method: 'GET',
      }),
      providesTags: ['Report', 'Dashboard'],
    }),
    
    // Future report endpoints can be added here:
    // - Financial reports
    // - Production reports
    // - Inventory reports
    // - Quality reports
    // - Custom reports
  }),
})

export const {
  useGetUserAnalyticsQuery,
  useGetCompanyPerformanceQuery,
  useGetSystemHealthQuery,
} = reportsApi
