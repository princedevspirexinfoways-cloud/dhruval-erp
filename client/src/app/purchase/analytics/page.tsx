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
  ShoppingCart,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Building2,
  Truck,
  Wrench
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetSupplierPurchaseAnalyticsQuery,
  useGetSupplierPurchaseReportQuery,
  useExportSupplierPurchaseReportMutation
} from '@/lib/api/purchaseAnalyticsApi'
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

export default function SupplierPurchaseAnalyticsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  
  // State management
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [groupBy, setGroupBy] = useState('supplier')
  const [sortBy, setSortBy] = useState('purchase')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [includeDetails, setIncludeDetails] = useState(false)

  // API queries
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useGetSupplierPurchaseAnalyticsQuery({
    timeRange,
    companyId: user?.companyId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    supplierId: selectedSupplier !== 'all' ? selectedSupplier : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    groupBy,
    sortBy,
    sortOrder,
  })

  const { data: detailedReport, isLoading: reportLoading, error: reportError, refetch: refetchReport } = useGetSupplierPurchaseReportQuery({
    timeRange,
    companyId: user?.companyId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    supplierId: selectedSupplier !== 'all' ? selectedSupplier : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    groupBy,
    sortBy,
    sortOrder,
    includeDetails,
  })

  // Export mutation
  const [exportReport, { isLoading: exportLoading }] = useExportSupplierPurchaseReportMutation()

  // Data processing
  const purchaseData = analyticsData?.data?.purchaseData || []
  const supplierData = analyticsData?.data?.supplierData || []
  const categoryData = analyticsData?.data?.categoryData || []
  const purchaseTrends = analyticsData?.data?.purchaseTrends || []
  const topSuppliers = analyticsData?.data?.topSuppliers || []
  const topCategories = analyticsData?.data?.topCategories || []

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

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const result = await exportReport({
        format,
        timeRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        companyId: user?.companyId,
        supplierId: selectedSupplier !== 'all' ? selectedSupplier : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        groupBy,
        sortBy,
        sortOrder,
        includeDetails,
      }).unwrap()

      // Open download URL
      window.open(result.data.downloadUrl, '_blank')
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleRefresh = () => {
    refetchAnalytics()
    refetchReport()
  }

  const isLoading = analyticsLoading || reportLoading
  const hasError = analyticsError || reportError

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                    <div className="h-3 bg-blue-200 rounded w-1/2"></div>
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
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
          <div className="bg-white rounded-xl border border-red-500 shadow-lg p-6 text-center">
            <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Purchase Analytics</h3>
            <p className="text-red-600">Failed to load purchase data. Please try again.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Supplier Purchase Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive supplier-wise purchase analysis and reporting
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
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
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
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
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="supplier">Supplier</option>
                  <option value="category">Category</option>
                  <option value="date">Date</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="purchase">Purchase Amount</option>
                  <option value="orders">Orders</option>
                  <option value="quantity">Quantity</option>
                  <option value="date">Date</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeDetails}
                    onChange={(e) => setIncludeDetails(e.target.checked)}
                    className="mr-2"
                  />
                  Include Detailed Data
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'} Sort Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchase</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(analyticsData?.data?.summary?.totalPurchase || 0)}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(analyticsData?.data?.summary?.purchaseGrowth || 0))}>
                  {getGrowthIcon(analyticsData?.data?.summary?.purchaseGrowth || 0)}
                  <span className="ml-1">{Math.abs(analyticsData?.data?.summary?.purchaseGrowth || 0)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatNumber(analyticsData?.data?.summary?.totalOrders || 0)}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(analyticsData?.data?.summary?.ordersGrowth || 0))}>
                  {getGrowthIcon(analyticsData?.data?.summary?.ordersGrowth || 0)}
                  <span className="ml-1">{Math.abs(analyticsData?.data?.summary?.ordersGrowth || 0)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatNumber(analyticsData?.data?.summary?.activeSuppliers || 0)}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(analyticsData?.data?.summary?.suppliersGrowth || 0))}>
                  {getGrowthIcon(analyticsData?.data?.summary?.suppliersGrowth || 0)}
                  <span className="ml-1">{Math.abs(analyticsData?.data?.summary?.suppliersGrowth || 0)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(analyticsData?.data?.summary?.averageOrderValue || 0)}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", getGrowthColor(analyticsData?.data?.summary?.aovGrowth || 0))}>
                  {getGrowthIcon(analyticsData?.data?.summary?.aovGrowth || 0)}
                  <span className="ml-1">{Math.abs(analyticsData?.data?.summary?.aovGrowth || 0)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchase Trends */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Trends</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Purchase</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Orders</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={purchaseTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="purchase" orientation="left" />
                  <YAxis yAxisId="orders" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="purchase" type="monotone" dataKey="purchase" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" />
                  <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Suppliers</h3>
              <div className="text-sm text-gray-600">
                Total: {formatCurrency(topSuppliers.reduce((sum, supplier) => sum + supplier.purchase, 0))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSuppliers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplierName" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="purchase" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Supplier Performance Table */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Supplier Performance Analysis</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExportReport('pdf')}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </button>
              <button
                onClick={() => handleExportReport('excel')}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </button>
              <button
                onClick={() => handleExportReport('csv')}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          
          {supplierData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Order Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierData.map((supplier, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{supplier.supplierName}</div>
                            <div className="text-sm text-gray-500">{supplier.supplierEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(supplier.totalOrders)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(supplier.totalPurchase)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(supplier.averageOrderValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {supplier.lastOrderDate ? new Date(supplier.lastOrderDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                          supplier.status === 'active' ? "bg-green-100 text-green-800" :
                          supplier.status === 'inactive' ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {supplier.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No supplier data available for selected filters</div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
          </div>
          
          {categoryData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryData.map((category, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{category.categoryName}</h4>
                    <span className="text-sm text-gray-500">{category.categoryId}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Orders:</span>
                      <span className="font-medium">{formatNumber(category.totalOrders)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Purchase:</span>
                      <span className="font-medium text-green-600">{formatCurrency(category.totalPurchase)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{formatNumber(category.totalQuantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No category data available for selected filters</div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
