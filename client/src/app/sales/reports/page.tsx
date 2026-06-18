'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveGrid } from '@/components/ui/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  useGetCustomerSalesReportQuery,
  useGetProductSalesPerformanceQuery,
  useGetSalesTeamPerformanceQuery,
  useExportSalesDataMutation
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
  FileText,
  Filter,
  Eye
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export default function SalesReportsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [selectedReport, setSelectedReport] = useState('customer')
  const [showFilters, setShowFilters] = useState(false)

  // RTK Query hooks
  const {
    data: customerReportData,
    isLoading: customerReportLoading
  } = useGetCustomerSalesReportQuery({})

  const {
    data: productPerformanceData,
    isLoading: productPerformanceLoading
  } = useGetProductSalesPerformanceQuery({})

  const {
    data: teamPerformanceData,
    isLoading: teamPerformanceLoading
  } = useGetSalesTeamPerformanceQuery({})

  // Export mutation
  const [exportSalesData] = useExportSalesDataMutation()

  // Extract data
  const customerReport = customerReportData?.data || []
  const productPerformance = productPerformanceData?.data || []
  const teamPerformance = teamPerformanceData?.data || []

  // Handler functions
  const handleRefresh = () => {
    toast.success('Reports refreshed!')
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await exportSalesData({ format, filters: { period: timeRange } }).unwrap()
      toast.success(`${format.toUpperCase()} report exported successfully!`)
    } catch (error) {
      toast.error('Export failed!')
    }
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (customerReportLoading || productPerformanceLoading || teamPerformanceLoading) {
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
        <div className="space-y-6">
          <DashboardHeader
            title="Sales Reports"
            description="Comprehensive sales reports and performance insights"
            icon={<PieChart className="h-6 w-6 text-white" />}
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
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            }
          />

          <div className="space-y-6">
          {/* Report Type Selector */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Button
                  variant={selectedReport === 'customer' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('customer')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Customer Report
                </Button>
                <Button
                  variant={selectedReport === 'product' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('product')}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Product Report
                </Button>
                <Button
                  variant={selectedReport === 'team' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('team')}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Team Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="custom">Custom Range</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="amount">Amount</option>
                      <option value="orders">Orders</option>
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={() => handleExport('excel')} variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer Report */}
          {selectedReport === 'customer' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Customers Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerReport.slice(0, 10).map((customer: any) => (
                      <div key={customer._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{customer.customerName}</p>
                          <p className="text-sm text-gray-500">{customer.customerCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(customer.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ResponsiveGrid cols={{ default: 1, lg: 2 }} gap="lg">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Customer Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={customerReport.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ customerName, percent }) => `${customerName} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalAmount"
                        >
                          {customerReport.slice(0, 5).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Customer Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={customerReport.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="customerName" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="totalAmount" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </ResponsiveGrid>
            </>
          )}

          {/* Product Report */}
          {selectedReport === 'product' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top Products Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productPerformance.slice(0, 10).map((product: any) => (
                      <div key={product._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-500">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{product.totalOrders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ResponsiveGrid cols={{ default: 1, lg: 2 }} gap="lg">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Product Sales Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={productPerformance.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ productName, percent }) => `${productName} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalAmount"
                        >
                          {productPerformance.slice(0, 5).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Product Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productPerformance.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="productName" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="totalAmount" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </ResponsiveGrid>
            </>
          )}

          {/* Team Report */}
          {selectedReport === 'team' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Sales Team Performance Report
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

              <ResponsiveGrid cols={{ default: 1, lg: 2 }} gap="lg">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Team Performance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={teamPerformance}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ salesPersonName, percent }) => `${salesPersonName} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalAmount"
                        >
                          {teamPerformance.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Team Sales Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={teamPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="salesPersonName" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="totalAmount" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </ResponsiveGrid>
            </>
          )}
        </div>
        </div>
      </ResponsiveContainer>
    </AppLayout>
  )
}
