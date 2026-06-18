'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Filter, 
  Download,
  Calendar,
  DollarSign,
  Users,
  Package,
  Activity,
  Zap,
  Flame,
  Shield,
  ShoppingCart,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetAnalyticsDashboardQuery,
  useGetKPIDataQuery,
  useExportAnalyticsReportMutation
} from '@/lib/api/analyticsApi'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts'
import clsx from 'clsx'

export default function OperationsAnalyticsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [comparisonPeriod, setComparisonPeriod] = useState('previous')

  // Fetch analytics data from API
  const { data: analyticsData, isLoading, error } = useGetAnalyticsDashboardQuery({
    timeRange,
    companyId: user?.companyId,
  })

  // Fetch KPI data
  const { data: kpiResponse } = useGetKPIDataQuery({
    timeRange,
    companyId: user?.companyId,
    comparisonPeriod,
  })

  // Export mutation
  const [exportReport] = useExportAnalyticsReportMutation()

  const kpiData = kpiResponse?.data || {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    inventoryValue: 0,
    inventoryGrowth: 0,
    operationalEfficiency: 0,
    efficiencyGrowth: 0,
    energyConsumption: 0,
    energyGrowth: 0,
    safetyIncidents: 0,
    safetyGrowth: 0,
    visitorCount: 0,
    visitorGrowth: 0,
    maintenanceCompliance: 0,
    complianceGrowth: 0
  }

  const revenueData = analyticsData?.data?.revenueData || []
  const departmentData = analyticsData?.data?.departmentData || []
  const resourceData = analyticsData?.data?.resourceData || []
  const inventoryDistribution = analyticsData?.data?.inventoryDistribution || []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />
    if (growth < 0) return <TrendingDown className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const handleExportReport = async () => {
    try {
      const result = await exportReport({
        reportType: 'dashboard',
        format: 'pdf',
        timeRange,
        companyId: user?.companyId,
        includeCharts: true,
      }).unwrap()

      // Open download URL
      window.open(result.data.downloadUrl, '_blank')
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50 min-h-screen">
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-purple-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-purple-200 rounded w-3/4"></div>
                    <div className="h-3 bg-purple-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50 min-h-screen">
          <div className="bg-white rounded-xl border border-red-500 shadow-lg p-6 text-center">
            <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Analytics</h3>
            <p className="text-red-600">Failed to load analytics data. Please try again.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-purple-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Operations Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive business intelligence and performance insights
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={handleExportReport}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(kpiData.totalRevenue)}</p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(kpiData.revenueGrowth))}>
                  {getGrowthIcon(kpiData.revenueGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.revenueGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(kpiData.totalOrders)}</p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(kpiData.ordersGrowth))}>
                  {getGrowthIcon(kpiData.ordersGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.ordersGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(kpiData.inventoryValue)}</p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(kpiData.inventoryGrowth))}>
                  {getGrowthIcon(kpiData.inventoryGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.inventoryGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-3xl font-bold text-orange-600">{kpiData.operationalEfficiency}%</p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(kpiData.efficiencyGrowth))}>
                  {getGrowthIcon(kpiData.efficiencyGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.efficiencyGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Energy Usage</p>
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(kpiData.energyConsumption)} kWh</p>
                <div className={clsx("flex items-center text-xs mt-1", getGrowthColor(kpiData.energyGrowth))}>
                  {getGrowthIcon(kpiData.energyGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.energyGrowth)}%</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Safety Incidents</p>
                <p className="text-2xl font-bold text-red-600">{kpiData.safetyIncidents}</p>
                <div className={clsx("flex items-center text-xs mt-1", getGrowthColor(kpiData.safetyGrowth))}>
                  {getGrowthIcon(kpiData.safetyGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.safetyGrowth)}%</span>
                </div>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visitors</p>
                <p className="text-2xl font-bold text-indigo-600">{formatNumber(kpiData.visitorCount)}</p>
                <div className={clsx("flex items-center text-xs mt-1", getGrowthColor(kpiData.visitorGrowth))}>
                  {getGrowthIcon(kpiData.visitorGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.visitorGrowth)}%</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance</p>
                <p className="text-2xl font-bold text-green-600">{kpiData.maintenanceCompliance}%</p>
                <div className={clsx("flex items-center text-xs mt-1", getGrowthColor(kpiData.complianceGrowth))}>
                  {getGrowthIcon(kpiData.complianceGrowth)}
                  <span className="ml-1">{Math.abs(kpiData.complianceGrowth)}%</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Orders Trend */}
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Orders Trend</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Orders</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="revenue" orientation="left" />
                  <YAxis yAxisId="orders" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" fill="#10b981" fillOpacity={0.3} stroke="#10b981" />
                  <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory Distribution */}
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Distribution</h3>
              <div className="text-sm text-gray-600">
                Total: {formatCurrency(inventoryDistribution.reduce((sum, item) => sum + item.value, 0))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Efficiency %</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Revenue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Cost</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis yAxisId="efficiency" orientation="left" />
                <YAxis yAxisId="amount" orientation="right" />
                <Tooltip />
                <Bar yAxisId="amount" dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar yAxisId="amount" dataKey="cost" fill="#ef4444" name="Cost" />
                <Line yAxisId="efficiency" type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} name="Efficiency %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Utilization */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Resource Utilization vs Target</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Actual</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Target</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="resource" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="utilization" fill="#3b82f6" name="Actual %" />
                <Bar dataKey="target" fill="#f59e0b" name="Target %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
