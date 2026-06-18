'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PurchaseHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetPurchaseOrdersQuery, useGetPurchaseOrderStatsQuery, useDeletePurchaseOrderMutation } from '@/lib/api/purchaseOrdersApi'
import { PurchaseOrderViewModal } from '@/components/purchase/PurchaseOrderViewModal'
import { PurchaseOrderEditModal } from '@/components/purchase/PurchaseOrderEditModal'
import { QuickStatusUpdate } from '@/components/purchase/QuickStatusUpdate'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const theme = useSelector(selectTheme)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Fetch purchase orders data
  const { data: ordersData, isLoading, error, refetch } = useGetPurchaseOrdersQuery({
    page,
    limit: 10,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    supplierId: supplierFilter !== 'all' ? supplierFilter : undefined
  })

  // Fetch purchase order statistics
  const { data: orderStats } = useGetPurchaseOrderStatsQuery({})

  // Delete mutation
  const [deletePurchaseOrder, { isLoading: isDeleting }] = useDeletePurchaseOrderMutation()

  // Extract orders and pagination from API response
  // API returns: { success, message, data: [...orders...] }
  // Check if data is an array (direct response) or has nested data.data structure
  const orders = Array.isArray(ordersData?.data)
    ? ordersData.data
    : ordersData?.data?.data || []
  const pagination = ordersData?.data?.pagination

  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && ordersData) {
    console.log('Purchase Orders API Response:', {
      ordersData,
      dataType: typeof ordersData?.data,
      isArray: Array.isArray(ordersData?.data),
      hasNestedData: !!ordersData?.data?.data,
      ordersLength: orders.length,
      pagination
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400`
      case 'approved':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400`
      case 'ordered':
        return `${baseClasses} bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400`
      case 'received':
        return `${baseClasses} bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400`
      case 'cancelled':
        return `${baseClasses} bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400`
      case 'partial':
        return `${baseClasses} bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400`
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'ordered':
        return <ShoppingCart className="h-4 w-4" />
      case 'received':
        return <Package className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'partial':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Handler functions for modals
  const handleViewOrder = (order: any) => {
    // Navigate to details page instead of opening modal
    router.push(`/purchase-orders/${order._id}`)
  }

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleDeleteOrder = async (order: any) => {
    if (!confirm(`Are you sure you want to delete purchase order ${order.poNumber || order.orderNumber || order._id}? This action cannot be undone.`)) {
      return
    }

    try {
      await deletePurchaseOrder(order._id).unwrap()
      toast.success('Purchase order deleted successfully')
      // Refetch the list to update the UI
      refetch()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error?.data?.message || 'Failed to delete purchase order')
    }
  }

  const handleQuickStatusUpdate = async (orderId: string, newStatus: string) => {
    // This function is now handled by the QuickStatusUpdate component
    // The API call is made directly in the component
    console.log('Status update completed for order:', orderId, 'to status:', newStatus)
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* New Header */}
        <PurchaseHeader
          title="Purchase Orders"
          description={`Manage purchase orders and supplier transactions (${orders.length} orders)`}
          icon={<ShoppingCart className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={() => window.location.reload()}
        >
          <Button
            onClick={() => router.push('/purchase/create')}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 border-white/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase
          </Button>
        </PurchaseHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{orderStats?.data?.totalOrders || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-sky-500 dark:text-sky-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{orderStats?.data?.pendingOrders || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Total Value</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(orderStats?.data?.totalValue || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">This Month</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orderStats?.data?.thisMonthOrders || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-500 dark:text-sky-400" />
                <input
                  type="text"
                  placeholder="Search purchase orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-sky-200 dark:border-sky-600 rounded-lg focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 dark:border-sky-600 rounded-lg focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="partial">Partial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Supplier Filter */}
            <div>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 dark:border-sky-600 rounded-lg focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Suppliers</option>
                {/* Supplier options will be populated from API */}
              </select>
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-6 shadow-sm">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-4 bg-sky-200 dark:bg-sky-800 rounded w-1/4"></div>
                  <div className="h-4 bg-sky-200 dark:bg-sky-800 rounded w-1/4"></div>
                  <div className="h-4 bg-sky-200 dark:bg-sky-800 rounded w-1/4"></div>
                  <div className="h-4 bg-sky-200 dark:bg-sky-800 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-500 dark:border-red-400 p-6 text-center shadow-sm">
            <ShoppingCart className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Purchase Orders</h3>
            <p className="text-red-600 dark:text-red-400">Failed to load purchase orders. Please try again.</p>
          </div>
        ) : !Array.isArray(orders) ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-500 dark:border-red-400 p-6 text-center shadow-sm">
            <ShoppingCart className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Invalid Data Format</h3>
            <p className="text-red-600 dark:text-red-400">
              The API returned invalid data format. Expected an array of orders.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Data type: {typeof ordersData?.data}, Is Array: {Array.isArray(ordersData?.data) ? 'Yes' : 'No'}
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-6 text-center shadow-sm">
            <ShoppingCart className="h-12 w-12 text-sky-500 dark:text-sky-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Purchase Orders Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || supplierFilter !== 'all'
                ? 'No purchase orders match your search criteria.'
                : 'No purchase orders have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sky-200 dark:divide-sky-700">
                <thead className="bg-sky-50 dark:bg-sky-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-sky-200 dark:divide-sky-700">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-sky-50 dark:hover:bg-sky-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => router.push(`/purchase-orders/${order._id}`)}
                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer text-left"
                          >
                            {order.poNumber || order.orderNumber || 'N/A'}
                          </button>
                          <div className="text-sm text-sky-600 dark:text-sky-400">
                            {order.items?.length || 0} items
                          </div>
                          {(order.poDate || order.orderDate) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(order.poDate || order.orderDate || '')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.supplier?.supplierName || order.agent?.agentName || 'N/A'}
                        </div>
                        <div className="text-sm text-sky-600 dark:text-sky-400">
                          {order.supplier?.supplierCode || (order.agent ? 'Agent' : 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <QuickStatusUpdate
                          order={order}
                          onStatusUpdate={handleQuickStatusUpdate}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.amounts?.grandTotal || order.totalAmount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-sky-500 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 p-1 rounded hover:bg-sky-50 dark:hover:bg-sky-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-sky-500 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 p-1 rounded hover:bg-sky-50 dark:hover:bg-sky-800"
                            title="Edit Order"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            disabled={isDeleting}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-900 dark:text-white">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-sky-300 dark:border-sky-600 rounded hover:bg-sky-50 dark:hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-900 dark:text-white">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-sky-300 dark:border-sky-600 rounded hover:bg-sky-50 dark:hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PurchaseOrderViewModal
        order={selectedOrder}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedOrder(null)
        }}
      />

      <PurchaseOrderEditModal
        order={selectedOrder}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedOrder(null)
        }}
        onSave={(updatedOrder) => {
          // Handle save logic here - the API call will automatically refresh the data
          console.log('Updated order:', updatedOrder)
          // No need to reload the page as RTK Query will automatically invalidate and refetch
        }}
      />
    </AppLayout>
  )
}
