'use client'

import { useState, useEffect } from 'react'
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
  CheckCircle,
  Clock,
  CalendarDays,
  CalendarRange,
  Settings,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetAnalyticsDashboardQuery,
  useGetKPIDataQuery,
  useGetDailyReportsQuery,
  useGetWeeklyReportsQuery,
  useGetMonthlyReportsQuery,
  useGetCustomReportsQuery,
  useGetFilterOptionsQuery,
  useGetReportTemplatesQuery,
  useSaveReportTemplateMutation,
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

export default function ComprehensiveAnalyticsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  
  // State management
  const [activeTab, setActiveTab] = useState('dashboard')
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [comparisonPeriod, setComparisonPeriod] = useState('previous')
  const [customFilters, setCustomFilters] = useState({
    startDate: '',
    endDate: '',
    departments: [] as string[],
    products: [] as string[],
    statuses: [] as string[],
    metrics: ['all'] as string[],
    groupBy: 'date',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    includeDetails: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

  // Helper function to clean parameters
  const cleanParams = (params: any) => {
    const cleaned: any = {}
    Object.keys(params).forEach(key => {
      const value = params[key]
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          cleaned[key] = value
        } else if (!Array.isArray(value)) {
          cleaned[key] = value
        }
      }
    })
    return cleaned
  }

  // API queries
  const { data: analyticsData, isLoading: dashboardLoading, error: dashboardError } = useGetAnalyticsDashboardQuery(
    cleanParams({
      timeRange,
      companyId: user?.companyId,
      startDate: customFilters.startDate,
      endDate: customFilters.endDate,
      departments: customFilters.departments,
      metrics: customFilters.metrics,
    })
  )

  const { data: kpiResponse, isLoading: kpiLoading } = useGetKPIDataQuery({
    timeRange,
    companyId: user?.companyId,
    comparisonPeriod,
  })

  const { data: dailyReports, isLoading: dailyLoading } = useGetDailyReportsQuery({
    date: customFilters.startDate || undefined,
    companyId: user?.companyId,
    departments: customFilters.departments.length > 0 ? customFilters.departments : undefined,
    metrics: customFilters.metrics.length > 0 ? customFilters.metrics : undefined,
    includeDetails: customFilters.includeDetails,
  })

  const { data: weeklyReports, isLoading: weeklyLoading } = useGetWeeklyReportsQuery({
    weekStart: customFilters.startDate || undefined,
    weekEnd: customFilters.endDate || undefined,
    companyId: user?.companyId,
    departments: customFilters.departments.length > 0 ? customFilters.departments : undefined,
    metrics: customFilters.metrics.length > 0 ? customFilters.metrics : undefined,
    includeDetails: customFilters.includeDetails,
  })

  const { data: monthlyReports, isLoading: monthlyLoading } = useGetMonthlyReportsQuery({
    year: customFilters.startDate ? new Date(customFilters.startDate).getFullYear() : undefined,
    month: customFilters.startDate ? new Date(customFilters.startDate).getMonth() + 1 : undefined,
    companyId: user?.companyId,
    departments: customFilters.departments.length > 0 ? customFilters.departments : undefined,
    metrics: customFilters.metrics.length > 0 ? customFilters.metrics : undefined,
    includeDetails: customFilters.includeDetails,
  })

  const { data: customReports, isLoading: customLoading } = useGetCustomReportsQuery({
    startDate: customFilters.startDate,
    endDate: customFilters.endDate,
    companyId: user?.companyId,
    departments: customFilters.departments.length > 0 ? customFilters.departments : undefined,
    products: customFilters.products.length > 0 ? customFilters.products : undefined,
    statuses: customFilters.statuses.length > 0 ? customFilters.statuses : undefined,
    metrics: customFilters.metrics.length > 0 ? customFilters.metrics : undefined,
    groupBy: customFilters.groupBy,
    sortBy: customFilters.sortBy,
    sortOrder: customFilters.sortOrder,
    page: 1,
    limit: 50,
  }, {
    skip: !customFilters.startDate || !customFilters.endDate
  })

  const { data: filterOptions, isLoading: filtersLoading } = useGetFilterOptionsQuery({
    companyId: user?.companyId,
  })

  const { data: reportTemplates, isLoading: templatesLoading } = useGetReportTemplatesQuery({
    companyId: user?.companyId,
  })

  // Mutations
  const [saveTemplate] = useSaveReportTemplateMutation()
  const [exportReport] = useExportAnalyticsReportMutation()

  // Data processing
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

  // Utility functions
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

  const handleExportReport = async (reportType: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const result = await exportReport({
        reportType: reportType as any,
        format,
        timeRange,
        startDate: customFilters.startDate || undefined,
        endDate: customFilters.endDate || undefined,
        companyId: user?.companyId,
        departments: customFilters.departments.length > 0 ? customFilters.departments : undefined,
        products: customFilters.products.length > 0 ? customFilters.products : undefined,
        statuses: customFilters.statuses.length > 0 ? customFilters.statuses : undefined,
        includeCharts: true,
        includeDetails: customFilters.includeDetails,
      }).unwrap()

      // Open download URL
      window.open(result.data.downloadUrl, '_blank')
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      await saveTemplate({
        name: templateName,
        description: templateDescription,
        filters: customFilters,
        metrics: customFilters.metrics,
        groupBy: customFilters.groupBy,
        sortBy: customFilters.sortBy,
        sortOrder: customFilters.sortOrder,
        companyId: user?.companyId,
      }).unwrap()

      setTemplateName('')
      setTemplateDescription('')
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = reportTemplates?.data?.find((t: any) => t.id === templateId)
    if (template) {
      setCustomFilters(prev => ({
        ...prev,
        ...template.filters
      }))
      setSelectedTemplate(templateId)
    }
  }

  const isLoading = dashboardLoading || kpiLoading || dailyLoading || weeklyLoading || monthlyLoading || customLoading || filtersLoading || templatesLoading
  const hasError = dashboardError

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

  if (hasError) {
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
                  Comprehensive Analytics & Reports
                </h1>
                <p className="text-gray-600 mt-1">
                  Daily, weekly, monthly reports with custom filters and export functionality
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
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
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customFilters.startDate}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customFilters.endDate}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                <select
                  multiple
                  value={customFilters.departments}
                                    onChange={(e) => setCustomFilters(prev => ({
                    ...prev,
                    departments: Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {filterOptions?.data?.departments?.map((dept: any) => (
                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                <select
                  value={customFilters.groupBy}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, groupBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {filterOptions?.data?.groupByOptions?.map((option: any) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customFilters.includeDetails}
                    onChange={(e) => setCustomFilters(prev => ({ ...prev, includeDetails: e.target.checked }))}
                    className="mr-2"
                  />
                  Include Details
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </button>
                <input
                  type="text"
                  placeholder="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'daily', label: 'Daily Reports', icon: CalendarDays },
                { id: 'weekly', label: 'Weekly Reports', icon: CalendarRange },
                { id: 'monthly', label: 'Monthly Reports', icon: Calendar },
                { id: 'custom', label: 'Custom Reports', icon: Filter },
                { id: 'templates', label: 'Templates', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
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

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Orders Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis yAxisId="revenue" orientation="left" />
                          <YAxis yAxisId="orders" orientation="right" />
                          <Tooltip />
                          <Area yAxisId="revenue" type="monotone" dataKey="revenue" fill="#10b981" fillOpacity={0.3} stroke="#10b981" />
                          <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="department" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Reports Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Daily Reports</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleExportReport('daily', 'pdf')}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExportReport('daily', 'excel')}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                  </div>
                </div>
                
                {dailyReports?.data ? (
                  <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{dailyReports.data.summary.totalOrders}</p>
                        <p className="text-sm text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(dailyReports.data.summary.totalRevenue)}</p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{dailyReports.data.summary.productionOrders}</p>
                        <p className="text-sm text-gray-600">Production Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{dailyReports.data.summary.qualityChecks}</p>
                        <p className="text-sm text-gray-600">Quality Checks</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">No daily reports available</div>
                )}
              </div>
            )}

            {/* Weekly Reports Tab */}
            {activeTab === 'weekly' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Reports</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleExportReport('weekly', 'pdf')}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExportReport('weekly', 'excel')}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                  </div>
                </div>
                
                {weeklyReports?.data ? (
                  <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{weeklyReports.data.summary.totalOrders}</p>
                        <p className="text-sm text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(weeklyReports.data.summary.totalRevenue)}</p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{weeklyReports.data.summary.productionOrders}</p>
                        <p className="text-sm text-gray-600">Production Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{weeklyReports.data.summary.qualityChecks}</p>
                        <p className="text-sm text-gray-600">Quality Checks</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">No weekly reports available</div>
                )}
              </div>
            )}

            {/* Monthly Reports Tab */}
            {activeTab === 'monthly' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Reports</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleExportReport('monthly', 'pdf')}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExportReport('monthly', 'excel')}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                  </div>
                </div>
                
                {monthlyReports?.data ? (
                  <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{monthlyReports.data.summary.totalOrders}</p>
                        <p className="text-sm text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyReports.data.summary.totalRevenue)}</p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{monthlyReports.data.summary.productionOrders}</p>
                        <p className="text-sm text-gray-600">Production Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{monthlyReports.data.summary.qualityChecks}</p>
                        <p className="text-sm text-gray-600">Quality Checks</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">No monthly reports available</div>
                )}
              </div>
            )}

            {/* Custom Reports Tab */}
            {activeTab === 'custom' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Custom Reports</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleExportReport('custom', 'pdf')}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExportReport('custom', 'excel')}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                  </div>
                </div>
                
                {customReports?.data ? (
                  <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {customFilters.groupBy === 'date' ? 'Date' : 
                               customFilters.groupBy === 'department' ? 'Department' : 
                               customFilters.groupBy === 'product' ? 'Product' : 'Group'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Average Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {customReports.data.data.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item._id || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(item.totalAmount || 0)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(item.avgAmount || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    {customFilters.startDate && customFilters.endDate ? 'No custom reports available for selected filters' : 'Please select start and end dates to generate custom reports'}
                  </div>
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Report Templates</h3>
                </div>
                
                {reportTemplates?.data ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportTemplates.data.map((template: any) => (
                      <div key={template.id} className="bg-white rounded-xl border border-purple-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                          <button
                            onClick={() => handleTemplateSelect(template.id)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="text-gray-600 mb-4">{template.description}</p>
                        <div className="text-sm text-gray-500">
                          <p>Type: {template.type}</p>
                          <p>Created by: {template.createdBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">No report templates available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
