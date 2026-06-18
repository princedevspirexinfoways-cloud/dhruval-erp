import { baseApi } from './baseApi'

export interface DashboardStats {
  totalOrders?: number
  totalRevenue?: number
  totalCustomers?: number
  totalProducts?: number
  totalProduction?: number
  totalInventory?: number
  totalEmployees?: number
  totalSuppliers?: number
  pendingOrders?: number
  completedOrders?: number
  lowStockItems?: number
  activeProduction?: number
  totalCompanies?: number
  totalUsers?: number
  systemHealth?: number
  systemUptime?: string
  totalQuotations?: number
  totalInvoices?: number
  monthlyRevenue?: number
  outstandingPayments?: number
  profitMargin?: number
  todayAttendance?: number
  todayVisitors?: number
}

export interface RecentActivity {
  id: string
  type: 'order' | 'production' | 'inventory' | 'finance' | 'user' | 'quality' | 'system'
  title: string
  description: string
  timestamp: string
  user: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export interface ChartData {
  revenue: Array<{ date: string; value: number }>
  orders: Array<{ date: string; count: number }>
  production: Array<{ date: string; units: number }>
  inventory: Array<{ date: string; items: number }>
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  status: string
  orderDate: string
  expectedDeliveryDate?: string
}

export interface LowStockItem {
  id: string
  itemCode: string
  itemName: string
  currentStock: number
  reorderLevel: number
  unit: string
  category: string
}

export interface DashboardData {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  chartData: ChartData
  recentOrders: RecentOrder[]
  lowStockItems: LowStockItem[]
  permissions: {
    canViewFinancials: boolean
    canViewProduction: boolean
    canViewInventory: boolean
    canViewOrders: boolean
    canViewUsers: boolean
    canViewReports: boolean
  }
}

export interface DashboardOverview {
  totalCompanies?: number
  totalUsers?: number
  activeCompanies?: number
  systemHealth?: number
  systemUptime?: string
  totalEmployees?: number
  totalOrders?: number
  totalRevenue?: number
  totalCustomers?: number
  totalProducts?: number
  totalInventory?: number
  totalProduction?: number
  activeProduction?: number
  pendingOrders?: number
  completedOrders?: number
  lowStockItems?: number
  totalQuotations?: number
  totalInvoices?: number
  totalSuppliers?: number
  todayAttendance?: number
  todayVisitors?: number
}

export interface PerformanceMetrics {
  orderCompletion: number
  customerSatisfaction: number
  inventoryTurnover: number
  productionEfficiency: number
  attendanceRate?: number
  cpuUsage?: number
  memoryUsage?: number
  diskUsage?: number
  networkLatency?: number
}

export interface DashboardResponse {
  success: boolean
  data: {
    overview: DashboardOverview
    recentActivity: RecentActivity[]
    systemAlerts?: any[]
    alerts?: any[]
    performanceMetrics: PerformanceMetrics
  }
}

export const dashboardApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getDashboardData: builder.query<DashboardResponse, void>({
      query: () => ({
        url: '/dashboard',
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
      transformResponse: (response: DashboardResponse) => {
        // Ensure consistent data structure
        if (response?.data?.overview) {
          return {
            ...response,
            data: {
              ...response.data,
              overview: {
                totalCompanies: response.data.overview.totalCompanies || 0,
                totalUsers: response.data.overview.totalUsers || 0,
                activeCompanies: response.data.overview.activeCompanies || 0,
                systemHealth: response.data.overview.systemHealth || 0,
                systemUptime: response.data.overview.systemUptime || '0%',
                totalEmployees: response.data.overview.totalEmployees || 0,
                totalOrders: response.data.overview.totalOrders || 0,
                totalRevenue: response.data.overview.totalRevenue || 0,
                totalCustomers: response.data.overview.totalCustomers || 0,
                totalProducts: response.data.overview.totalProducts || 0,
                totalInventory: response.data.overview.totalInventory || 0,
                totalProduction: response.data.overview.totalProduction || 0,
                activeProduction: response.data.overview.activeProduction || 0,
                pendingOrders: response.data.overview.pendingOrders || 0,
                completedOrders: response.data.overview.completedOrders || 0,
                lowStockItems: response.data.overview.lowStockItems || 0,
                totalQuotations: response.data.overview.totalQuotations || 0,
                totalInvoices: response.data.overview.totalInvoices || 0,
                totalSuppliers: response.data.overview.totalSuppliers || 0,
                todayAttendance: response.data.overview.todayAttendance || 0,
                todayVisitors: response.data.overview.todayVisitors || 0,
              }
            }
          }
        }
        return response
      }
    }),
    
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => ({
        url: '/dashboard/stats',
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
      transformResponse: (response: { success: boolean; data: DashboardStats }) => {
        return response?.data || {}
      }
    }),
    
    getRecentActivities: builder.query<RecentActivity[], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: `/dashboard/activities?limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
      transformResponse: (response: { success: boolean; data: RecentActivity[] }) => {
        return response?.data || []
      }
    }),
    
    getChartData: builder.query<ChartData, { period?: string }>({
      query: ({ period = '6months' }) => ({
        url: `/dashboard/charts?period=${period}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
      transformResponse: (response: { success: boolean; data: ChartData }) => {
        return response?.data || { revenue: [], orders: [], production: [], inventory: [] }
      }
    }),
    
    getRecentOrders: builder.query<RecentOrder[], { limit?: number }>({
      query: ({ limit = 5 }) => ({
        url: `/dashboard/orders/recent?limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard', 'CustomerOrder'],
      transformResponse: (response: { success: boolean; data: RecentOrder[] }) => {
        return response?.data || []
      }
    }),
    
    getLowStockItems: builder.query<LowStockItem[], { limit?: number }>({
      query: ({ limit = 5 }) => ({
        url: `/dashboard/inventory/low-stock?limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Dashboard', 'InventoryItem'],
      transformResponse: (response: { success: boolean; data: LowStockItem[] }) => {
        return response?.data || []
      }
    }),
  }),
})

export const {
  useGetDashboardDataQuery,
  useGetDashboardStatsQuery,
  useGetRecentActivitiesQuery,
  useGetChartDataQuery,
  useGetRecentOrdersQuery,
  useGetLowStockItemsQuery,
} = dashboardApi
