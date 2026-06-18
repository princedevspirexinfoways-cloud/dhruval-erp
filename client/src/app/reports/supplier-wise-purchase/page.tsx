'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { AppLayout } from '@/components/layout/AppLayout'
import { 
  useGetVendorWiseSummaryQuery,
  useExportReportMutation 
} from '@/lib/api/purchaseReportsApi'
import { useGetSuppliersQuery } from '@/lib/api/suppliersApi'
import { Pagination } from '@/components/ui/Pagination'
import { 
  Building2, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp,
  Package,
  DollarSign,
  FileText,
  Search,
  X,
  ChevronDown,
  BarChart3,
  Eye,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

interface ReportFilters {
  startDate: string
  endDate: string
  supplierId?: string
  status?: string
  category?: string
  page: number
  limit: number
}

export default function SupplierWisePurchaseReportPage() {
  const user = useSelector(selectCurrentUser)
  
  // State management
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    page: 1,
    limit: 10
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [showSupplierDetails, setShowSupplierDetails] = useState(false)

  // API queries
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    error: reportError,
    refetch: refetchReport 
  } = useGetVendorWiseSummaryQuery(filters)

  const { data: suppliersData } = useGetSuppliersQuery({ 
    page: 1, 
    limit: 100 
  })

  const [exportReport, { isLoading: exportLoading }] = useExportReportMutation()

  // Handle filter changes
  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when other filters change
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      page: 1,
      limit: 10
    })
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const exportFormat = format === 'excel' ? 'xlsx' : format
      const result = await exportReport({
        reportType: 'vendor-wise',
        format: exportFormat as 'pdf' | 'xlsx',
        filters: {
          companyId: user?.companyId || user?.companyAccess?.[0]?.companyId,
          dateFrom: filters.startDate,
          dateTo: filters.endDate,
          vendorId: filters.supplierId
        }
      }).unwrap()
      
      // Handle blob response - create download link
      const url = window.URL.createObjectURL(result)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0]
      const extension = exportFormat === 'xlsx' ? 'xlsx' : exportFormat === 'csv' ? 'csv' : 'pdf'
      const fileName = `supplier-wise-purchase-report-${date}.${extension}`
      
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success(`Report exported as ${exportFormat.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to export report')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending_approval': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'sent': 'bg-purple-100 text-purple-800',
      'acknowledged': 'bg-indigo-100 text-indigo-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'partially_received': 'bg-amber-100 text-amber-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'closed': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'raw_material': 'bg-blue-100 text-blue-800',
      'finished_goods': 'bg-green-100 text-green-800',
      'consumables': 'bg-yellow-100 text-yellow-800',
      'services': 'bg-purple-100 text-purple-800',
      'capital_goods': 'bg-red-100 text-red-800',
      'maintenance': 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // The API returns an array of VendorWisePurchaseSummary directly
  const supplierWiseData = reportData?.data || []
  
  // Calculate summary from the data
  const summary = supplierWiseData.length > 0 ? {
    totalPurchaseOrders: supplierWiseData.reduce((sum, s) => sum + (s.totalOrders || 0), 0),
    totalPurchaseAmount: supplierWiseData.reduce((sum, s) => sum + (s.totalPurchases || 0), 0),
    uniqueSuppliersCount: supplierWiseData.length,
    avgOrderValue: supplierWiseData.reduce((sum, s) => sum + (s.averageOrderValue || 0), 0) / supplierWiseData.length
  } : null
  const pagination = undefined // Vendor-wise report doesn't have pagination in the current API

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  Supplier-wise Purchase Report
                </h1>
                <p className="text-blue-100 mt-1">
                  Comprehensive analysis of purchases by supplier
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/20 hover:bg-white/30 text-white border-white border px-4 py-2 rounded-xl transition-all"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Button
                onClick={() => refetchReport()}
                disabled={reportLoading}
                className="bg-white/20 hover:bg-white/30 text-white border-white border px-4 py-2 rounded-xl transition-all"
              >
                <RefreshCw className={clsx("h-4 w-4 mr-2", reportLoading && "animate-spin")} />
                Refresh
              </Button>
              
              <div className="relative">
                <select
                  onChange={(e) => e.target.value && handleExport(e.target.value as any)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white border px-4 py-2 rounded-xl appearance-none pr-8 cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Export</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
                <Download className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
              <Button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-transparent border-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  value={filters.supplierId || ''}
                  onChange={(e) => handleFilterChange('supplierId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Suppliers</option>
                  {suppliersData?.data?.data?.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.supplierName} ({supplier.supplierCode})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="sent">Sent</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="partially_received">Partially Received</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={handleClearFilters}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchase Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalPurchaseOrders?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchase Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.totalPurchaseAmount || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Suppliers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.uniqueSuppliersCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.avgOrderValue || 0)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {reportLoading && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Generating report...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {reportError && (
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6">
            <div className="flex items-center gap-3 text-red-600">
              <X className="h-5 w-5" />
              <p>Failed to load report. Please try again.</p>
            </div>
          </div>
        )}

        {/* Supplier-wise Data Table */}
        {!reportLoading && !reportError && supplierWiseData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Supplier-wise Purchase Details</h3>
              <p className="text-sm text-gray-600 mt-1">
                Detailed breakdown of purchases by each supplier
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Orders
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Order Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierWiseData.map((supplier: any, index: number) => (
                    <tr key={supplier._id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {supplier.supplierName?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.supplierName || 'Unknown Supplier'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier.supplierCode || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.totalOrders || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(supplier.totalAmount || 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Tax: {formatCurrency(supplier.totalTaxAmount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(supplier.avgOrderValue || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-gray-900">
                            On-time: {supplier.performance?.onTimeDeliveryRate || 0}%
                          </div>
                          <div className="text-sm text-gray-500">
                            Rating: {supplier.performance?.avgRating || 0}/5
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => {
                            setSelectedSupplier(supplier)
                            setShowSupplierDetails(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 bg-transparent border-0 p-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Not available in current API implementation */}
            {/* Uncomment when pagination is implemented in the backend */}
            {/* {pagination && pagination.pages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleItemsPerPageChange}
                />
              </div>
            )} */}
          </div>
        )}

        {/* No Data State */}
        {!reportLoading && !reportError && supplierWiseData.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
              <p className="text-gray-600 text-center">
                No purchase orders found for the selected criteria. Try adjusting your filters.
              </p>
            </div>
          </div>
        )}

        {/* Supplier Details Modal */}
        {showSupplierDetails && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedSupplier.supplierName}
                      </h3>
                      <p className="text-blue-100">
                        Code: {selectedSupplier.supplierCode}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowSupplierDetails(false)}
                    className="p-2 text-white hover:bg-white/20 rounded-xl bg-transparent border-0"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedSupplier.totalOrders}
                    </div>
                    <div className="text-sm text-blue-600">Total Orders</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedSupplier.totalAmount)}
                    </div>
                    <div className="text-sm text-green-600">Total Amount</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(selectedSupplier.avgOrderValue)}
                    </div>
                    <div className="text-sm text-purple-600">Avg Order Value</div>
                  </div>
                </div>

                {/* Orders List */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Purchase Orders</h4>
                  <div className="space-y-3">
                    {selectedSupplier.orders?.map((order: any, index: number) => (
                      <div key={order.poNumber || index} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-900">
                                {order.poNumber}
                              </span>
                              <span className={clsx(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                getStatusColor(order.status)
                              )}>
                                {order.status?.replace('_', ' ').toUpperCase()}
                              </span>
                              {order.category && (
                                <span className={clsx(
                                  'px-2 py-1 rounded-full text-xs font-medium',
                                  getCategoryColor(order.category)
                                )}>
                                  {order.category?.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Date:</span> {formatDate(order.poDate)}
                              </div>
                              <div>
                                <span className="font-medium">Amount:</span> {formatCurrency(order.grandTotal)}
                              </div>
                              <div>
                                <span className="font-medium">Items:</span> {order.itemCount}
                              </div>
                              <div>
                                <span className="font-medium">Delivery:</span> {formatDate(order.expectedDeliveryDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}