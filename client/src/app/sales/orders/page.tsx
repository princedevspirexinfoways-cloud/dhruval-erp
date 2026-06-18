'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveGrid } from '@/components/ui/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  useGetSalesOrdersQuery,
  useUpdatePaymentStatusMutation,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation
} from '@/lib/api/salesApi'
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Users,
  User,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
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
  Truck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  CheckCircle,
  AlertTriangle,
  Clock3,
  CheckSquare,
  XCircle,
  SortAsc,
  SortDesc
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import SalesOrderModal from '@/components/modals/SalesOrderModal'
import { DispatchCreateModal } from '@/components/dispatch/DispatchCreateModal'
import { useRouter } from 'next/navigation'

export default function SalesOrdersPage() {
  const user = useSelector(selectCurrentUser)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<any>(null)
  
  // Enhanced filtering and sorting
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    dateRange: 'all',
    amountRange: 'all',
    customer: ''
  })
  const [searchField, setSearchField] = useState('all') // all, orderNumber, customerName, customerCode

  // RTK Query hooks
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useGetSalesOrdersQuery({
    search: searchTerm,
    status: selectedFilter === 'all' ? undefined : selectedFilter,
    page: currentPage,
    limit: 10
  })

  // Mutations
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation()
  const [createSalesOrder] = useCreateSalesOrderMutation()
  const [updateSalesOrder] = useUpdateSalesOrderMutation()
  const [deleteSalesOrder] = useDeleteSalesOrderMutation()

  // Extract data
  const orders = ordersData?.data?.orders || []
  const pagination = ordersData?.data?.pagination

  // Calculate stats
  const calculateStats = () => {
    const totalOrders = orders.length
    const totalAmount = orders.reduce((sum: number, order: any) => sum + (order.orderSummary?.finalAmount || 0), 0)
    const pendingOrders = orders.filter((order: any) => order.status === 'pending').length
    const confirmedOrders = orders.filter((order: any) => order.status === 'confirmed').length
    const dispatchedOrders = orders.filter((order: any) => order.status === 'dispatched').length
    const completedOrders = orders.filter((order: any) => order.status === 'completed').length
    const cancelledOrders = orders.filter((order: any) => order.status === 'cancelled').length
    
    const paidOrders = orders.filter((order: any) => order.payment?.paymentStatus === 'paid').length
    const pendingPayment = orders.filter((order: any) => order.payment?.paymentStatus === 'pending').length
    const overdueOrders = orders.filter((order: any) => order.payment?.paymentStatus === 'overdue').length
    
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0
    
    return {
      totalOrders,
      totalAmount,
      pendingOrders,
      confirmedOrders,
      dispatchedOrders,
      completedOrders,
      cancelledOrders,
      paidOrders,
      pendingPayment,
      overdueOrders,
      averageOrderValue
    }
  }

  const stats = calculateStats()

  // Enhanced filtering and sorting functions
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      paymentStatus: 'all',
      dateRange: 'all',
      amountRange: 'all',
      customer: ''
    })
    setSearchTerm('')
    setSearchField('all')
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Handler functions
  const handleQuickStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateSalesOrder({ id: orderId, data: { status: newStatus } }).unwrap()
      toast.success(`Order status updated to ${newStatus}!`)
      refetchOrders()
    } catch (error) {
      toast.error('Failed to update order status!')
    }
  }

  const handlePaymentStatusUpdate = async (orderId: string, paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial') => {
    try {
      await updatePaymentStatus({ id: orderId, paymentStatus }).unwrap()
      toast.success('Payment status updated!')
      refetchOrders()
    } catch (error) {
      toast.error('Failed to update payment status!')
    }
  }

  const handleCreateOrder = async (orderData: any) => {
    try {
      const orderWithCompany = {
        ...orderData,
        companyId: user?.companyId || user?.companyAccess?.[0]?.companyId
      }
      await createSalesOrder(orderWithCompany).unwrap()
      toast.success('Sales order created successfully!')
      setShowCreateModal(false)
      refetchOrders()
    } catch (error) {
      toast.error('Failed to create sales order!')
    }
  }

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleUpdateOrder = async (orderData: any) => {
    try {
      const orderWithCompany = {
        ...orderData,
        companyId: user?.companyId || user?.companyAccess?.[0]?.companyId
      }
      await updateSalesOrder({ id: selectedOrder._id, data: orderWithCompany }).unwrap()
      toast.success('Sales order updated successfully!')
      setShowEditModal(false)
      setSelectedOrder(null)
      refetchOrders()
    } catch (error) {
      toast.error('Failed to update sales order!')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteSalesOrder(orderId).unwrap()
        toast.success('Sales order deleted successfully!')
        refetchOrders()
      } catch (error) {
        toast.error('Failed to delete sales order!')
      }
    }
  }

  const handleCreateDispatch = (order: any) => {
    // Set the selected order for dispatch and open modal
    setSelectedOrderForDispatch(order)
    setShowDispatchModal(true)
  }

  const handleRefresh = () => {
    refetchOrders()
    toast.success('Orders refreshed!')
  }

  const handleDispatchSuccess = (dispatch: any) => {
    setShowDispatchModal(false)
    setSelectedOrderForDispatch(null)
    refetchOrders() // Refresh orders to update status
    toast.success(`Dispatch ${dispatch.dispatchNumber} created and sales order updated successfully!`)
  }

  const handleDispatchClose = () => {
    setShowDispatchModal(false)
    setSelectedOrderForDispatch(null)
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
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'partial':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (ordersLoading) {
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
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Ultra Slick Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 sm:p-10 transition-all duration-500 group">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-lg animate-pulse delay-500"></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Section - Title & Description */}
              <div className="flex items-center gap-6">
                {/* Animated Icon Container */}
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover/icon:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  <div className="relative p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl group-hover/icon:scale-110 transition-transform duration-300">
                    <FileText className="h-10 w-10 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl opacity-0 group-hover/icon:opacity-20 transition-opacity duration-300"></div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105 transform">
                    Sales Orders
                  </h1>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">
                    Manage and track all sales orders with comprehensive tools
                  </p>
                  {/* <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Dashboard</span>
                  </div> */}
                </div>
              </div>
              
              {/* Right Section - Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Primary Action - New Order */}
                <Button 
                  onClick={() => setShowCreateModal(true)} 
                  className="relative group/btn overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 px-6 py-3 text-base font-bold rounded-xl transform hover:scale-105 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Order</span>
                  </div>
              </Button>
                
                {/* Secondary Action - Quick Dispatch */}
              <Button 
                onClick={() => {
                  const firstPendingOrder = orders.find((o: any) => o.status === 'pending' || o.status === 'confirmed');
                  if (firstPendingOrder) {
                    handleCreateDispatch(firstPendingOrder);
                  } else {
                    toast.error('No pending orders found to create dispatch');
                  }
                }} 
                variant="outline" 
                  className="relative group/btn overflow-hidden border-2 border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span className="hidden sm:inline">Dispatch</span>
                  </div>
              </Button>
                
                {/* Tertiary Action - Refresh */}
                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  className="relative group/btn overflow-hidden border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-gray-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                    <span className="hidden sm:inline">Refresh</span>
                  </div>
              </Button>
            </div>
            </div>
          </div>

        <div className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Orders</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">{stats.totalOrders}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time orders</p>
                  </div>
                <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
            </div>

            {/* Total Amount */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-200 dark:border-green-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Total Amount</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">₹{formatNumber(stats.totalAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Revenue generated</p>
                  </div>
                <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Avg Order Value</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">₹{formatNumber(stats.averageOrderValue)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per order average</p>
                  </div>
                <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-yellow-200 dark:border-yellow-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Pending Orders</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">{stats.pendingOrders}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting processing</p>
                  </div>
                <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
            </div>
          </div>

          {/* Enhanced Detailed Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Order Status Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completedOrders}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Completed</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmedOrders}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Confirmed</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.dispatchedOrders}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Dispatched</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelledOrders}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Cancelled</p>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.paidOrders}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Paid</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueOrders}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Overdue</p>
              </div>
            </div>
          </div>

          {/* Enhanced Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 transition-all duration-300">
            <div className="space-y-4 sm:space-y-6">
                {/* Search Section */}
              <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <div className="relative flex-1 sm:flex-none min-w-0">
                  <select
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                      className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 sm:px-4 py-3 sm:py-4 pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 text-gray-900 dark:text-white font-medium text-sm sm:text-base"
                    >
                      <option value="all">All Fields</option>
                      <option value="orderNumber">Order Number</option>
                      <option value="customerName">Customer Name</option>
                      <option value="customerCode">Customer Code</option>
                    </select>
                    <Filter className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                    <Button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      variant="outline"
                    className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-sm sm:text-base"
                    >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Advanced Filters</span>
                    <span className="sm:hidden">Filters</span>
                    </Button>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                    className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-sm sm:text-base"
                    >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Clear</span>
                    </Button>
                  </div>
                </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Advanced Filters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Order Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white font-medium text-sm sm:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="dispatched">Dispatched</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                      {/* Payment Status Filter */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Payment Status</label>
                        <select
                          value={filters.paymentStatus}
                          onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white font-medium text-sm sm:text-base"
                        >
                          <option value="all">All Payment</option>
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="overdue">Overdue</option>
                          <option value="partial">Partial</option>
                        </select>
                      </div>

                      {/* Date Range Filter */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Date Range</label>
                        <select
                          value={filters.dateRange}
                          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white font-medium text-sm sm:text-base"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="quarter">This Quarter</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>

                      {/* Amount Range Filter */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Amount Range</label>
                        <select
                          value={filters.amountRange}
                          onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white font-medium text-sm sm:text-base"
                        >
                          <option value="all">All Amounts</option>
                          <option value="0-1000">₹0 - ₹1,000</option>
                          <option value="1000-5000">₹1,000 - ₹5,000</option>
                          <option value="5000-10000">₹5,000 - ₹10,000</option>
                          <option value="10000-50000">₹10,000 - ₹50,000</option>
                          <option value="50000+">₹50,000+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Enhanced Orders Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Sales Orders</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Manage and track all orders</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th 
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('orderNumber')}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="hidden sm:inline">Order ID</span>
                        <span className="sm:hidden">Order</span>
                        {getSortIcon('orderNumber')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('customerName')}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        Customer
                        {getSortIcon('customerName')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('paymentStatus')}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="hidden sm:inline">Payment</span>
                        <span className="sm:hidden">Pay</span>
                        {getSortIcon('paymentStatus')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        Amount
                        {getSortIcon('amount')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        Date
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span className="hidden sm:inline">Quick Actions</span>
                      <span className="sm:hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors duration-200">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => router.push(`/sales/orders/${order._id}`)}
                              className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors duration-200 truncate"
                            >
                              #{order.orderNumber}
                            </button>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">{order._id}</div>
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 sm:px-2 py-1 rounded-full mt-1 sm:mt-2 border border-blue-200 dark:border-blue-700">
                                <Truck className="h-2 w-2 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">Dispatch Ready</span>
                                <span className="sm:hidden">Ready</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{order.customerName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{order.customerCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            <span className="text-xs">{order.status}</span>
                          </Badge>
                          <select
                            value={order.status}
                            onChange={(e) => handleQuickStatusUpdate(order._id, e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all duration-200"
                            disabled={order.status === 'completed' || order.status === 'cancelled'}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <Badge className={getPaymentStatusColor(order.payment.paymentStatus)}>
                            <span className="text-xs">{order.payment.paymentStatus}</span>
                          </Badge>
                          <select
                            value={order.payment.paymentStatus}
                            onChange={(e) => handlePaymentStatusUpdate(order._id, e.target.value as any)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all duration-200"
                          >
                            <option value="pending">Pending</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.orderSummary.finalAmount)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{order.orderItems?.length || 0} items</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{new Date(order.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {/* Quick Status Update */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleQuickStatusUpdate(order._id, 'processing')}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
                            title="Mark as Processing"
                            disabled={order.status === 'completed' || order.status === 'cancelled'}
                          >
                            <RefreshCw className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          
                          {/* Quick Payment Update */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePaymentStatusUpdate(order._id, 'paid')}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
                            title="Mark as Paid"
                            disabled={order.payment.paymentStatus === 'paid'}
                          >
                            <CreditCard className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          
                          {/* Create Dispatch */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCreateDispatch(order)}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                            title="Create Dispatch"
                            disabled={order.status === 'completed' || order.status === 'cancelled'}
                          >
                            <Truck className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          
                          {/* View Details */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/sales/orders/${order._id}`)}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          
                          {/* Edit Order */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditOrder(order)} 
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                            title="Edit Order"
                          >
                            <Edit className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          
                          {/* Delete Order */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteOrder(order._id)} 
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
                            title="Delete Order"
                          >
                            <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Enhanced Pagination */}
          {pagination && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium text-center sm:text-left">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setCurrentPage(pagination.page - 1)}
                    className="px-4 sm:px-6 py-2 rounded-xl font-medium border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
                  >
                    Previous
                  </Button>
                  <div className="px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-semibold text-sm sm:text-base">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <Button
                    variant="outline"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setCurrentPage(pagination.page + 1)}
                    className="px-4 sm:px-6 py-2 rounded-xl font-medium border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Filter Summary */}
          {(searchTerm || filters.status !== 'all' || filters.paymentStatus !== 'all' || filters.dateRange !== 'all' || filters.amountRange !== 'all') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700 p-4 sm:p-6 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200">Active Filters:</span>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                      {searchTerm && (
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs sm:text-sm rounded-full border border-blue-200 dark:border-blue-700">
                          <span className="hidden sm:inline">Search: "{searchTerm}"</span>
                          <span className="sm:hidden">"{searchTerm}"</span>
                          <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          </button>
                        </span>
                      )}
                      {filters.status !== 'all' && (
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs sm:text-sm rounded-full border border-blue-200 dark:border-blue-700">
                          <span className="hidden sm:inline">Status: {filters.status}</span>
                          <span className="sm:hidden">{filters.status}</span>
                          <button onClick={() => handleFilterChange('status', 'all')} className="ml-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          </button>
                        </span>
                      )}
                      {filters.paymentStatus !== 'all' && (
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs sm:text-sm rounded-full border border-blue-200 dark:border-blue-700">
                          <span className="hidden sm:inline">Payment: {filters.paymentStatus}</span>
                          <span className="sm:hidden">{filters.paymentStatus}</span>
                          <button onClick={() => handleFilterChange('paymentStatus', 'all')} className="ml-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          </button>
                        </span>
                      )}
                      {filters.dateRange !== 'all' && (
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs sm:text-sm rounded-full border border-blue-200 dark:border-blue-700">
                          <span className="hidden sm:inline">Date: {filters.dateRange}</span>
                          <span className="sm:hidden">{filters.dateRange}</span>
                          <button onClick={() => handleFilterChange('dateRange', 'all')} className="ml-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          </button>
                        </span>
                      )}
                      {filters.amountRange !== 'all' && (
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs sm:text-sm rounded-full border border-blue-200 dark:border-blue-700">
                          <span className="hidden sm:inline">Amount: {filters.amountRange}</span>
                          <span className="sm:hidden">{filters.amountRange}</span>
                          <button onClick={() => handleFilterChange('amountRange', 'all')} className="ml-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={clearFilters} 
                  variant="outline" 
                  className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Modals */}
        <SalesOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
          onSuccess={handleCreateOrder}
        />
        
        <SalesOrderModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOrder(null)
          }}
          order={selectedOrder}
          mode="edit"
          onSuccess={handleUpdateOrder}
        />

        {/* Dispatch Create Modal */}
        <DispatchCreateModal
          isOpen={showDispatchModal}
          onClose={handleDispatchClose}
          onSuccess={handleDispatchSuccess}
          userCompanyId={user?.companyAccess?.[0]?.companyId}
          user={user}
          prefilledData={selectedOrderForDispatch ? {
            customerOrderId: selectedOrderForDispatch._id,
            companyId: selectedOrderForDispatch.companyId || user?.companyAccess?.[0]?.companyId,
            customerId: selectedOrderForDispatch.customerId,
            customerName: selectedOrderForDispatch.customerName,
            customerCode: selectedOrderForDispatch.customerCode,
            orderNumber: selectedOrderForDispatch.orderNumber,
            orderAmount: selectedOrderForDispatch.orderSummary?.finalAmount || 0,
            // Pre-fill additional fields that might be useful
            dispatchDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            priority: 'normal',
            dispatchType: 'delivery'
          } : undefined}
        />
    </AppLayout>
  )
}
