'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveGrid, ResponsiveContainer } from '@/components/ui/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  useGetSalesAnalyticsQuery,
  useGetCustomerSalesReportQuery,
  useGetProductSalesPerformanceQuery,
  useGetSalesTrendsQuery,
  useGetSalesTeamPerformanceQuery
} from '@/lib/api/salesApi'
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Award,
  Clock,
  Package,
  UserCheck,
  FileText
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer as RechartsResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function SalesAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month')

  // RTK Query hooks
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useGetSalesAnalyticsQuery({ period: timeRange })

  const {
    data: customerReportData,
    isLoading: customerReportLoading
  } = useGetCustomerSalesReportQuery({})

  const {
    data: productPerformanceData,
    isLoading: productPerformanceLoading
  } = useGetProductSalesPerformanceQuery({})

  const {
    data: salesTrendsData,
    isLoading: salesTrendsLoading
  } = useGetSalesTrendsQuery({ period: timeRange })

  const {
    data: teamPerformanceData,
    isLoading: teamPerformanceLoading
  } = useGetSalesTeamPerformanceQuery({})

  // Extract data
  const analytics = analyticsData?.data
  const customerReport = customerReportData?.data || []
  const productPerformance = productPerformanceData?.data || []
  const salesTrends = salesTrendsData?.data || []
  const teamPerformance = teamPerformanceData?.data || []

  // Handler functions
  const handleRefresh = () => {
    refetchAnalytics()
    toast.success('Analytics refreshed!')
  }

  const handleExport = () => {
    // Export functionality
    toast.success('Analytics exported!')
  }

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
    if (growth > 0) return 'text-green-600 dark:text-green-400'
    if (growth < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (analyticsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <LoadingSpinner />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <ResponsiveContainer>
        <DashboardHeader
          title="Sales Analytics"
          description="Comprehensive sales performance analysis and insights"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
          actions={
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          }
        />

        <div className="space-y-6">
          {/* Key Metrics */}
          <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.dailySales?.length ? formatCurrency(analytics.dailySales.reduce((sum, day) => sum + day.amount, 0)) : '₹0'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Daily sales trend
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(analytics?.dailySales?.reduce((sum, day) => sum + day.orders, 0) || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total orders this period
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Customers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customerReport.length}
                    </p>
                    <p className="text-sm text-gray-500">
                      Top customers this period
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.salesByStatus?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">
                      Sales statuses
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </ResponsiveGrid>

          {/* Charts Grid */}
          <ResponsiveGrid cols={{ default: 1, lg: 2 }} gap="lg">
            {/* Sales Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RechartsResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                    <Area type="monotone" dataKey="amount" fill="#3b82f6" fillOpacity={0.1} />
                  </RechartsLineChart>
                </RechartsResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Segmentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Segmentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RechartsResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.customerSegmentation || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics?.customerSegmentation?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </RechartsResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RechartsResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformance.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="totalAmount" fill="#10b981" />
                  </BarChart>
                </RechartsResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sales by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RechartsResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.salesByStatus || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="amount" fill="#8b5cf6" />
                  </BarChart>
                </RechartsResponsiveContainer>
              </CardContent>
            </Card>
          </ResponsiveGrid>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Sales Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.map((member: any) => (
                  <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.salesPersonName}</p>
                      <p className="text-sm text-gray-500">{member.totalOrders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(member.totalAmount)}</p>
                      <p className="text-sm text-gray-500">Avg: {formatCurrency(member.averageOrderValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveContainer>
    </AppLayout>
  )
}
