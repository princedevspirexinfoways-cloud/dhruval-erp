'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Box,
  Truck,
  Globe,
  Home,
  Building,
  Factory,
  CheckSquare,
  PackageCheck,
  Send,
  XCircle,
  RotateCcw,
  Download,
  Upload,
  RefreshCw,
  Settings,
  User,
  Calendar,
  DollarSign,
  Tag,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetEnhancedOrdersQuery,
  useGetEnhancedOrderStatsQuery,
  useCreateEnhancedOrderMutation,
  useUpdateEnhancedOrderMutation,
  useDeleteEnhancedOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateProductionStatusMutation,
  useAddDispatchDetailsMutation,
  useAddRTODetailsMutation,
  useAddPackingDetailsMutation,
  useExportEnhancedOrdersMutation,
  type EnhancedOrder,
  type EnhancedOrderItem
} from '@/lib/api/enhancedOrdersApi'
import { DataTable } from '@/components/ui/DataTable'
import { StatsCards } from '@/components/ui/StatsCards'
import { DetailViewModal } from '@/components/modals/DetailViewModal'
import { CreateEditModal } from '@/components/modals/CreateEditModal'
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import clsx from 'clsx'

export default function EnhancedOrdersPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [productionPriorityFilter, setProductionPriorityFilter] = useState('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [productionStatusFilter, setProductionStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<EnhancedOrder | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [showRTOModal, setShowRTOModal] = useState(false)
  const [showPackingModal, setShowPackingModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // API queries
  const { data: ordersData, isLoading, error, refetch } = useGetEnhancedOrdersQuery({
    page,
    limit: 20,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    productionPriority: productionPriorityFilter !== 'all' ? productionPriorityFilter : undefined,
    orderType: orderTypeFilter !== 'all' ? orderTypeFilter : undefined,
    customerId: customerFilter !== 'all' ? customerFilter : undefined,
    productionStatus: productionStatusFilter !== 'all' ? productionStatusFilter : undefined,
    companyId: user?.companyId
  })

  const { data: orderStats } = useGetEnhancedOrderStatsQuery({
    companyId: user?.companyId
  })

  // Mutations
  const [createOrder] = useCreateEnhancedOrderMutation()
  const [updateOrder] = useUpdateEnhancedOrderMutation()
  const [deleteOrder] = useDeleteEnhancedOrderMutation()
  const [updateStatus] = useUpdateOrderStatusMutation()
  const [updateProductionStatus] = useUpdateProductionStatusMutation()
  const [addDispatchDetails] = useAddDispatchDetailsMutation()
  const [addRTODetails] = useAddRTODetailsMutation()
  const [addPackingDetails] = useAddPackingDetailsMutation()
  const [exportOrders] = useExportEnhancedOrdersMutation()

  const orders = ordersData?.data || []
  const pagination = ordersData?.pagination
  const stats = orderStats?.data

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'blue' as const,
      change: {
        value: 12,
        type: 'increase' as const,
        label: '+12%'
      }
    },
    {
      title: 'In Production',
      value: stats?.inProductionOrders || 0,
      icon: Factory,
      color: 'yellow' as const,
      change: {
        value: 8,
        type: 'increase' as const,
        label: '+8%'
      }
    },
    {
      title: 'Ready for Dispatch',
      value: stats?.packedOrders || 0,
      icon: PackageCheck,
      color: 'green' as const,
      change: {
        value: 15,
        type: 'increase' as const,
        label: '+15%'
      }
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'purple' as const,
      change: {
        value: 22,
        type: 'increase' as const,
        label: '+22%'
      }
    }
  ]

  // Form fields for create/edit
  const orderFields = [
    { name: 'orderNumber', label: 'Order Number', type: 'text' as const, required: true },
    { name: 'customerName', label: 'Customer Name', type: 'text' as const, required: true },
    { name: 'customerEmail', label: 'Customer Email', type: 'email' as const, required: true },
    { name: 'customerPhone', label: 'Customer Phone', type: 'tel' as const },
    { name: 'customerAddress', label: 'Customer Address', type: 'textarea' as const },
    {
      name: 'orderType',
      label: 'Order Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'export', label: 'Export' },
        { value: 'local', label: 'Local' },
        { value: 'domestic', label: 'Domestic' }
      ]
    },
    {
      name: 'priority',
      label: 'Order Priority',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    },
    {
      name: 'productionPriority',
      label: 'Production Priority',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    },
    { name: 'orderDate', label: 'Order Date', type: 'date' as const, required: true },
    { name: 'expectedDeliveryDate', label: 'Expected Delivery', type: 'date' as const, required: true },
    { name: 'totalAmount', label: 'Total Amount', type: 'number' as const, required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' as const }
  ]

  // CRUD Handlers
  const handleView = (order: EnhancedOrder) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleEdit = (order: EnhancedOrder) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleDelete = async (order: EnhancedOrder) => {
    if (window.confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
      try {
        await deleteOrder(order._id).unwrap()
        // toast.success('Order deleted successfully')
      } catch (error) {
        console.error('Failed to delete order:', error)
        // toast.error('Failed to delete order')
      }
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await createOrder({
        ...data,
        companyId: user?.companyId,
        createdBy: user?._id || '',
        items: [], // Will be added in item management
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        shippingAmount: 0,
        totalAmount: data.totalAmount || 0
      }).unwrap()
      setShowCreateModal(false)
      // toast.success('Order created successfully')
    } catch (error) {
      console.error('Failed to create order:', error)
      // toast.error('Failed to create order')
      throw error
    }
  }

  const handleUpdate = async (data: any) => {
    if (!selectedOrder) return
    try {
      await updateOrder({
        orderId: selectedOrder._id,
        orderData: data
      }).unwrap()
      setShowEditModal(false)
      // toast.success('Order updated successfully')
    } catch (error) {
      console.error('Failed to update order:', error)
      // toast.error('Failed to update order')
      throw error
    }
  }

  const handleStatusUpdate = async (orderId: string, status: "pending" | "draft" | "delivered" | "cancelled" | "confirmed" | "in_production" | "quality_check" | "packed" | "dispatched" | "returned") => {
    try {
      await updateStatus({ orderId, status }).unwrap()
      // toast.success('Order status updated successfully')
    } catch (error) {
      console.error('Failed to update order status:', error)
      // toast.error('Failed to update order status')
    }
  }

  const handleProductionStatusUpdate = async (orderId: string, productionStatus: "pending" | "in_production" | "quality_check" | "completed" | "on_hold", progress?: number) => {
    try {
      await updateProductionStatus({ orderId, productionStatus, progress }).unwrap()
      // toast.success('Production status updated successfully')
    } catch (error) {
      console.error('Failed to update production status:', error)
      // toast.error('Failed to update production status')
    }
  }

  const handleDispatchDetails = async (orderId: string, dispatchData: any) => {
    try {
      await addDispatchDetails({ orderId, dispatchDetails: dispatchData }).unwrap()
      setShowDispatchModal(false)
      // toast.success('Dispatch details added successfully')
    } catch (error) {
      console.error('Failed to add dispatch details:', error)
      // toast.error('Failed to add dispatch details')
    }
  }

  const handleRTODetails = async (orderId: string, rtoData: any) => {
    try {
      await addRTODetails({ orderId, rtoDetails: rtoData }).unwrap()
      setShowRTOModal(false)
      // toast.success('RTO details added successfully')
    } catch (error) {
      console.error('Failed to add RTO details:', error)
      // toast.error('Failed to add RTO details')
    }
  }

  const handlePackingDetails = async (orderId: string, packingData: any) => {
    try {
      await addPackingDetails({ orderId, packingDetails: packingData }).unwrap()
      setShowPackingModal(false)
      // toast.success('Packing details added successfully')
    } catch (error) {
      console.error('Failed to add packing details:', error)
      // toast.error('Failed to add packing details')
    }
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const result = await exportOrders({
        format,
        filters: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          orderType: orderTypeFilter !== 'all' ? orderTypeFilter : undefined,
          dateFrom: '',
          dateTo: ''
        }
      }).unwrap()
      
      if (result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank')
      }
      // toast.success(`Orders exported to ${format.toUpperCase()} successfully`)
    } catch (error) {
      console.error('Failed to export orders:', error)
      // toast.error('Failed to export orders')
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full flex items-center"
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'confirmed':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'in_production':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'quality_check':
        return `${baseClasses} bg-purple-100 text-purple-800`
      case 'packed':
        return `${baseClasses} bg-indigo-100 text-indigo-800`
      case 'dispatched':
        return `${baseClasses} bg-cyan-100 text-cyan-800`
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'returned':
        return `${baseClasses} bg-pink-100 text-pink-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (priority) {
      case 'low':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'urgent':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'export':
        return <Globe className="h-4 w-4 text-blue-600" />
      case 'local':
        return <Home className="h-4 w-4 text-green-600" />
      case 'domestic':
        return <Building className="h-4 w-4 text-purple-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getProductionStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Clock className="h-4 w-4 text-gray-600" />
      case 'in_progress':
        return <Factory className="h-4 w-4 text-orange-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'on_hold':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
          <LoadingSpinner size="lg" text="Loading enhanced orders..." />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
          <ErrorState
            title="Error Loading Orders"
            message="Failed to load enhanced orders. Please try again."
            icon={<Package className="h-12 w-12 text-red-500" />}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Enhanced Order Management"
          description={`Comprehensive order tracking with production integration (${orders.length} orders)`}
          icon={<Package className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={() => refetch()}
        >
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => handleExport('excel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-emerald-600 hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <StatsCards cards={statsCards} />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
            <TabsTrigger value="rto">RTO & Returns</TabsTrigger>
            <TabsTrigger value="packing">Packing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_production">In Production</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="packed">Packed</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <select
                    value={orderTypeFilter}
                    onChange={(e) => setOrderTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Types</option>
                    <option value="export">Export</option>
                    <option value="local">Local</option>
                    <option value="domestic">Domestic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Production Status</label>
                  <select
                    value={productionStatusFilter}
                    onChange={(e) => setProductionStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Status</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Production Priority</label>
                  <select
                    value={productionPriorityFilter}
                    onChange={(e) => setProductionPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border-2 border-sky-500 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Production</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-800 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getOrderTypeIcon(order.orderType)}
                            <span className="text-sm text-gray-900 capitalize">{order.orderType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getProductionStatusIcon(order.productionStatus)}
                            <span className="text-sm text-gray-900 capitalize">{order.productionStatus?.replace('_', ' ')}</span>
                          </div>
                          {order.productionProgress !== undefined && (
                            <Progress value={order.productionProgress} className="mt-1" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div>{getPriorityBadge(order.priority)}</div>
                            <div>{getPriorityBadge(order.productionPriority)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(order)}
                              className="text-sky-600 hover:text-sky-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(order)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(order)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Production Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Factory className="h-5 w-5" />
                    <span>Production Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(o => o.productionStatus === 'in_progress').map((order) => (
                      <div key={order._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.orderNumber}</h4>
                          {getPriorityBadge(order.productionPriority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{order.productionProgress || 0}%</span>
                          </div>
                          <Progress value={order.productionProgress || 0} />
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleProductionStatusUpdate(order._id, 'completed', 100)}
                          >
                            Mark Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductionStatusUpdate(order._id, 'on_hold')}
                          >
                            Hold
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckSquare className="h-5 w-5" />
                    <span>Quality Check</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(o => o.status === 'quality_check').map((order) => (
                      <div key={order._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.orderNumber}</h4>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                        <div className="mt-3 flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order._id, 'packed')}
                          >
                            Pass QC
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(order._id, 'in_production')}
                          >
                            Rework
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dispatch Tab */}
          <TabsContent value="dispatch" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ready for Dispatch */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PackageCheck className="h-5 w-5" />
                    <span>Ready for Dispatch</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(o => o.status === 'packed').map((order) => (
                      <div key={order._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.orderNumber}</h4>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowDispatchModal(true)
                          }}
                        >
                          Add Dispatch Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* In Transit */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>In Transit</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(o => o.dispatchDetails?.deliveryStatus === 'in_transit').map((order) => (
                      <div key={order._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.orderNumber}</h4>
                          <span className="text-sm text-blue-600">In Transit</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                        {order.dispatchDetails && (
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>Courier: {order.dispatchDetails.courierName}</p>
                            <p>Tracking: {order.dispatchDetails.courierTrackingNumber}</p>
                            <p>ETA: {order.dispatchDetails.estimatedDeliveryDate}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* RTO & Returns Tab */}
          <TabsContent value="rto" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RotateCcw className="h-5 w-5" />
                  <span>RTO & Returns Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.filter(o => o.rtoDetails?.isRTO || o.status === 'returned').map((order) => (
                    <div key={order._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{order.orderNumber}</h4>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                      {order.rtoDetails && (
                        <div className="text-sm text-gray-500 space-y-1 mb-3">
                          <p>RTO Date: {order.rtoDetails.rtoDate}</p>
                          <p>Reason: {order.rtoDetails.rtoReason}</p>
                          <p>Status: {order.rtoDetails.rtoStatus}</p>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowRTOModal(true)
                          }}
                        >
                          Update RTO
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packing Tab */}
          <TabsContent value="packing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Box className="h-5 w-5" />
                  <span>Packing Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.filter(o => o.status === 'quality_check' && !o.packingDetails).map((order) => (
                    <div key={order._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{order.orderNumber}</h4>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowPackingModal(true)
                        }}
                      >
                        Add Packing Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Export Orders</span>
                      <span className="font-medium">{stats?.ordersByType?.export || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Local Orders</span>
                      <span className="font-medium">{stats?.ordersByType?.local || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Domestic Orders</span>
                      <span className="font-medium">{stats?.ordersByType?.domestic || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Production Efficiency */}
              <Card>
                <CardHeader>
                  <CardTitle>Production Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.productionEfficiency || 0}%
                    </div>
                    <p className="text-sm text-gray-600">Overall Production Efficiency</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showCreateModal && (
          <CreateEditModal
            isOpen={showCreateModal}
            title="Create New Order"
            fields={orderFields}
            onSubmit={handleCreate}
            onClose={() => setShowCreateModal(false)}
            isLoading={false}
          />
        )}

        {showEditModal && selectedOrder && (
          <CreateEditModal
            isOpen={showEditModal}
            title="Edit Order"
            fields={orderFields}
            initialData={selectedOrder}
            onSubmit={handleUpdate}
            onClose={() => setShowEditModal(false)}
            isLoading={false}
          />
        )}

        {showDetailModal && selectedOrder && (
          <DetailViewModal
            isOpen={showDetailModal}
            title={`Order Details - ${selectedOrder.orderNumber}`}
            sections={[
              {
                title: 'Order Information',
                fields: [
                  { label: 'Order Number', value: selectedOrder.orderNumber },
                  { label: 'Customer Name', value: selectedOrder.customerName },
                  { label: 'Order Date', value: selectedOrder.orderDate, type: 'date' },
                  { label: 'Expected Delivery', value: selectedOrder.expectedDeliveryDate, type: 'date' },
                  { label: 'Total Amount', value: selectedOrder.totalAmount, type: 'currency' },
                  { label: 'Status', value: selectedOrder.status, type: 'badge' }
                ]
              }
            ]}
            onClose={() => setShowDetailModal(false)}
            actions={{
              onEdit: () => {
                setShowDetailModal(false)
                setShowEditModal(true)
              }
            }}
          />
        )}

        {/* Dispatch Modal */}
        {showDispatchModal && selectedOrder && (
          <CreateEditModal
            isOpen={showDispatchModal}
            title="Add Dispatch Details"
            fields={[
              { name: 'dispatchDate', label: 'Dispatch Date', type: 'datetime-local' as const, required: true },
              { name: 'courierName', label: 'Courier Name', type: 'text' as const, required: true },
              { name: 'courierTrackingNumber', label: 'Tracking Number', type: 'text' as const },
              { name: 'awbNumber', label: 'AWB Number', type: 'text' as const },
              { name: 'lrNumber', label: 'LR Number', type: 'text' as const },
              { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text' as const },
              { name: 'driverName', label: 'Driver Name', type: 'text' as const },
              { name: 'driverPhone', label: 'Driver Phone', type: 'tel' as const },
              { name: 'estimatedDeliveryDate', label: 'Estimated Delivery', type: 'datetime-local' as const, required: true },
              { name: 'deliveryNotes', label: 'Delivery Notes', type: 'textarea' as const }
            ]}
            onSubmit={(data) => handleDispatchDetails(selectedOrder._id, data)}
            onClose={() => setShowDispatchModal(false)}
            isLoading={false}
          />
        )}

        {/* RTO Modal */}
        {showRTOModal && selectedOrder && (
          <CreateEditModal
            isOpen={showRTOModal}
            title="Add RTO Details"
            fields={[
              { name: 'rtoDate', label: 'RTO Date', type: 'date' as const, required: true },
              { name: 'rtoReason', label: 'RTO Reason', type: 'textarea' as const, required: true },
              { name: 'rtoAmount', label: 'RTO Amount', type: 'number' as const },
              { name: 'returnTrackingNumber', label: 'Return Tracking Number', type: 'text' as const },
              { name: 'returnNotes', label: 'Return Notes', type: 'textarea' as const }
            ]}
            onSubmit={(data) => handleRTODetails(selectedOrder._id, data)}
            onClose={() => setShowRTOModal(false)}
            isLoading={false}
          />
        )}

        {/* Packing Modal */}
        {showPackingModal && selectedOrder && (
          <CreateEditModal
            isOpen={showPackingModal}
            title="Add Packing Details"
            fields={[
              { name: 'billNumber', label: 'Bill Number', type: 'text' as const, required: true },
              { name: 'lrNumber', label: 'LR Number', type: 'text' as const, required: true },
              { name: 'packageCount', label: 'Package Count', type: 'number' as const, required: true },
              { name: 'packageWeight', label: 'Package Weight (kg)', type: 'number' as const, required: true },
              { name: 'packageLength', label: 'Length (cm)', type: 'number' as const },
              { name: 'packageWidth', label: 'Width (cm)', type: 'number' as const },
              { name: 'packageHeight', label: 'Height (cm)', type: 'number' as const },
              { name: 'packingMaterial', label: 'Packing Material', type: 'text' as const },
              { name: 'specialInstructions', label: 'Special Instructions', type: 'textarea' as const },
              { name: 'packingDate', label: 'Packing Date', type: 'date' as const, required: true },
              { name: 'packedBy', label: 'Packed By', type: 'text' as const, required: true }
            ]}
            onSubmit={(data) => handlePackingDetails(selectedOrder._id, data)}
            onClose={() => setShowPackingModal(false)}
            isLoading={false}
          />
        )}
      </div>
    </AppLayout>
  )
}
