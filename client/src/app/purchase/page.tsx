'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer'
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import {
  useGetPurchaseStatsQuery,
  useGetPurchaseOrdersQuery,
  useGetSupplierPurchaseReportQuery,
  useGetCategoryWiseSpendQuery,
  useGetPurchaseAnalyticsQuery,
  useUpdatePurchasePaymentStatusMutation,
  useExportPurchaseDataMutation,
  useCreatePurchaseOrderMutation
} from '@/lib/api/purchaseApi'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  ShoppingCart,
  TrendingDown,
  Package,
  Truck,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  AlertTriangle,
  RefreshCw,
  Edit,
  CreditCard,
  Droplets,
  Palette,
  Box,
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Component that uses useSearchParams
function PurchasePageContent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')

  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const theme = useSelector(selectTheme)

  // Get user's company ID
  const userCompanyId = user?.companyAccess?.[0]?.companyId

  // Determine which company ID to use
  const targetCompanyId = isSuperAdmin && selectedCompanyId && selectedCompanyId !== 'all' ? selectedCompanyId : userCompanyId

  // RTK Query hooks
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useGetPurchaseStatsQuery({ companyId: targetCompanyId })

  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useGetPurchaseOrdersQuery({
    search: searchTerm,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    limit: 10,
    companyId: targetCompanyId
  })

  const {
    data: supplierReportData,
    isLoading: supplierReportLoading
  } = useGetSupplierPurchaseReportQuery({ companyId: targetCompanyId })

  const {
    data: categorySpendData,
    isLoading: categorySpendLoading
  } = useGetCategoryWiseSpendQuery({ companyId: targetCompanyId })

  const {
    data: analyticsData,
    isLoading: analyticsLoading
  } = useGetPurchaseAnalyticsQuery({ 
    period: selectedPeriod, 
    companyId: targetCompanyId 
  })

  const [updatePaymentStatus] = useUpdatePurchasePaymentStatusMutation()
  const [exportPurchaseData] = useExportPurchaseDataMutation()
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation()

  // Handle URL parameters
  useEffect(() => {
    const action = searchParams.get('action')
    const tab = searchParams.get('tab')
    
    if (action === 'create') {
      // Redirect to the create page instead of opening modal
      window.location.href = '/purchase/create'
      return
    }
    
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Handler functions
  const handlePaymentStatusUpdate = async (orderId: string, paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial') => {
    try {
      await updatePaymentStatus({ id: orderId, paymentStatus }).unwrap()
      toast.success('Payment status updated successfully')
      refetchOrders()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update payment status')
    }
  }

  const handleReceiveOrder = async (order: any) => {
    try {
      // For now, we'll show a success message
      // In a real implementation, this would open a modal to confirm received quantities
      toast.success(`Purchase order ${order.poNumber} received successfully!`)
      refetchOrders()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to receive order')
    }
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const result = await exportPurchaseData({
        format,
        filters: {
          companyId: targetCompanyId,
          search: searchTerm,
          category: selectedCategory === 'all' ? undefined : selectedCategory
        }
      }).unwrap()
      toast.success('Data exported successfully')
      // Handle download
      window.open(result.data.downloadUrl, '_blank')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to export data')
    }
  }

  const handleRefresh = () => {
    refetchStats()
    refetchOrders()
  }

  // Data extraction
  const stats = statsData?.data
  const orders = ordersData?.data?.data || []
  const supplierReport = supplierReportData?.data || []
  const categorySpend = categorySpendData?.data || []
  const analytics = analyticsData?.data

  // Category icon mapping
  const getCategoryIcon = (category: string | null | undefined) => {
    if (!category) return <Package className="h-4 w-4 text-gray-600" />
    
    switch (category) {
      case 'chemicals':
        return <Droplets className="h-4 w-4 text-blue-600" />
      case 'grey_fabric':
        return <Package className="h-4 w-4 text-gray-600" />
      case 'colors':
        return <Palette className="h-4 w-4 text-purple-600" />
      case 'packing_material':
        return <Box className="h-4 w-4 text-orange-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  // Status badge mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>
      case 'shipped':
        return <Badge variant="outline">Shipped</Badge>
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'paid':
        return <Badge variant="success">Paid</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      case 'partial':
        return <Badge variant="outline">Partial</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <AppLayout>
      <ResponsiveContainer className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Purchase Management"
          description="Track purchases, supplier payments, and material procurement with analytics"
          icon={<ShoppingCart className="h-6 w-6 text-white" />}
          actions={
            <div className="flex gap-2">
              {isSuperAdmin && (
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg z-50">
                    <SelectItem value="all" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">All Companies</SelectItem>
                    {/* Add company options here */}
                  </SelectContent>
                </Select>
              )}
              <Button 
                onClick={() => window.location.href = '/purchase/create'} 
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm`}>
            <TabsTrigger 
              value="overview" 
              className={`data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200`}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className={`data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200`}
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className={`data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200`}
            >
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats ? formatCurrency(stats.totalPurchases) : '₹0'}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Spend</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats ? formatCurrency(stats.monthlySpend) : '₹0'}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Suppliers</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats ? stats.totalSuppliers : 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats ? stats.pendingOrders : 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </ResponsiveGrid>

            {/* Charts Grid */}
            <ResponsiveGrid cols={{ default: 1, lg: 2 }} gap="lg">
              {/* Category-wise Spend */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Category-wise Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categorySpendLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : categorySpend.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No category data found</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {categorySpend.map((category) => (
                            <div key={category.category} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  {getCategoryIcon(category.category)}
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{category.category?.replace('_', ' ') || 'Unknown Category'}</span>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${category.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6">
                          <RechartsContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={categorySpend}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ category, percentage }) => `${category?.replace('_', ' ') || 'Unknown'} ${percentage.toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
                              >
                                {categorySpend.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            </PieChart>
                          </RechartsContainer>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Suppliers */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Top Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supplierReportLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : supplierReport.length === 0 ? (
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No supplier data found</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {supplierReport.slice(0, 5).map((supplier) => (
                            <div key={supplier.supplierId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">{supplier.supplierName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{supplier.category}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{formatCurrency(supplier.totalPurchases)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{supplier.totalOrders} orders</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6">
                          <RechartsContainer width="100%" height={200}>
                            <BarChart data={supplierReport.slice(0, 5)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="supplierName" />
                              <YAxis />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Bar dataKey="totalPurchases" fill="#0ea5e9" />
                            </BarChart>
                          </RechartsContainer>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Controls */}
            <div className="flex gap-4 items-center">
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg z-50">
                  <SelectItem value="week" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Week</SelectItem>
                  <SelectItem value="month" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Month</SelectItem>
                  <SelectItem value="quarter" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Quarter</SelectItem>
                  <SelectItem value="year" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Analytics Charts */}
            <ResponsiveGrid cols={{ default: 1, lg: 2 }} gap="lg">
              {/* Purchase Trends */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Purchase Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : analytics?.dailyPurchases?.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
                    </div>
                  ) : (
                    <RechartsContainer width="100%" height={300}>
                      <LineChart data={analytics?.dailyPurchases || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={2} />
                      </LineChart>
                    </RechartsContainer>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Comparison */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Monthly Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : analytics?.monthlyPurchases?.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No monthly data available</p>
                    </div>
                  ) : (
                    <RechartsContainer width="100%" height={300}>
                      <BarChart data={analytics?.monthlyPurchases || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="amount" fill="#10b981" />
                      </BarChart>
                    </RechartsContainer>
                  )}
                </CardContent>
              </Card>
            </ResponsiveGrid>

            {/* Purchase Trends Table */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Purchase Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : analytics?.purchaseTrends?.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left p-2 text-gray-900 dark:text-white">Period</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Amount</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics?.purchaseTrends?.map((trend, index) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-2 text-gray-900 dark:text-white">{trend.period}</td>
                            <td className="p-2 text-gray-900 dark:text-white">{formatCurrency(trend.amount)}</td>
                            <td className="p-2">
                              <span className={`font-medium ${trend.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {trend.growth >= 0 ? '+' : ''}{trend.growth.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg z-50">
                  <SelectItem value="all" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">All Categories</SelectItem>
                  <SelectItem value="chemicals" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Chemicals</SelectItem>
                  <SelectItem value="grey_fabric" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Grey Fabric</SelectItem>
                  <SelectItem value="colors" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Colors</SelectItem>
                  <SelectItem value="packing_material" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Packing Material</SelectItem>
                  <SelectItem value="other" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => handleExport('csv')} 
                variant="outline" 
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                onClick={() => handleExport('excel')} 
                variant="outline" 
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>

            {/* Orders Table */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No purchase orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left p-2 text-gray-900 dark:text-white">Order ID</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Supplier</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Amount</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Status</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Payment</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Date</th>
                          <th className="text-left p-2 text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any) => (
                          <tr key={order._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-2 font-medium text-gray-900 dark:text-white">{order.poNumber}</td>
                            <td className="p-2 text-gray-900 dark:text-white">{order.supplier?.supplierName || 'N/A'}</td>
                            <td className="p-2 text-gray-900 dark:text-white">{formatCurrency(order.amounts?.grandTotal || 0)}</td>
                            <td className="p-2">{getStatusBadge(order.status)}</td>
                            <td className="p-2">{getPaymentStatusBadge(order.paymentTerms?.termType || 'pending')}</td>
                            <td className="p-2 text-gray-900 dark:text-white">{new Date(order.poDate).toLocaleDateString()}</td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handlePaymentStatusUpdate(order._id, 'paid')}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Mark Paid
                                </Button>
                                {order.status === 'confirmed' && (
                                  <Button
                                    onClick={() => handleReceiveOrder(order)}
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 border-green-300 dark:border-green-600"
                                  >
                                    <Package className="h-3 w-3 mr-1" />
                                    Receive
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {ordersData?.data?.pagination && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, ordersData.data.pagination.total)} of {ordersData.data.pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= ordersData.data.pagination.pages}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ResponsiveContainer>
    </AppLayout>
  )
}

// Loading fallback component
function PurchasePageLoading() {
  return (
    <AppLayout>
      <ResponsiveContainer className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </ResponsiveContainer>
    </AppLayout>
  )
}

// Main component with Suspense boundary
export default function PurchasePage() {
  return (
    <Suspense fallback={<PurchasePageLoading />}>
      <PurchasePageContent />
    </Suspense>
  )
}
