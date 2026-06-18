'use client'

import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  useGetAllOrdersQuery,
  useGetOrderStatsQuery,
  Order
} from '@/lib/features/orders/ordersApi'
import {
  Shield,
  AlertCircle,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Import components directly
import OrderStats from '@/components/orders/OrderStats'
import OrderFilters from '@/components/orders/OrderFilters'
import OrderList from '@/components/orders/OrderList'

interface OrderFiltersType {
  search: string
  status: string
  priority: string
  paymentStatus: string
  assignedTo: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  dateFrom: string
  dateTo: string
}

export default function OrdersPage() {
  const isSuperAdmin = useSelector(selectIsSuperAdmin)

  // State management
  const [filters, setFilters] = useState<OrderFiltersType>({
    search: '',
    status: 'all',
    priority: 'all',
    paymentStatus: 'all',
    assignedTo: 'all',
    sortBy: 'orderDate',
    sortOrder: 'desc',
    dateFrom: '',
    dateTo: ''
  })

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // API queries with proper parameters
  const {
    data: ordersResponse,
    isLoading,
    error,
    refetch,
    isFetching
  } = useGetAllOrdersQuery({
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    priority: filters.priority !== 'all' ? filters.priority : undefined,
    paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
    assignedTo: filters.assignedTo !== 'all' ? filters.assignedTo : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: 1,
    limit: 50
  })

  const {
    data: orderStats,
    isLoading: isStatsLoading
  } = useGetOrderStatsQuery({
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined
  })

  const orders = ordersResponse?.data || []
  const totalOrders = ordersResponse?.total || 0

  // Event handlers
  const handleView = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleEdit = (order: Order) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleDuplicate = (order: Order) => {
    // TODO: Implement duplicate functionality
    toast.success('Order duplicated successfully!')
  }

  const handleDelete = (order: Order) => {
    setSelectedOrder(order)
    setShowDeleteModal(true)
  }

  const handleFilterChange = (newFilters: Partial<OrderFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleReset = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      paymentStatus: 'all',
      assignedTo: 'all',
      sortBy: 'orderDate',
      sortOrder: 'desc',
      dateFrom: '',
      dateTo: ''
    })
  }

  const handleCreateNew = () => {
    setShowCreateModal(true)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success('Export started! You will receive an email when ready.')
  }

  // Access control
  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You need Super Admin privileges to access this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error handling
  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
            <p className="text-gray-600 mb-4">
              {error && 'data' in error
                ? (error.data as any)?.message || 'Failed to load orders'
                : 'An unexpected error occurred'
              }
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-black">Order Management</h1>
                <p className="text-gray-600 mt-1">Track and manage customer orders</p>
              </div>
              <Button
                onClick={handleCreateNew}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Order
              </Button>
            </div>
          </div>

          {/* Stats */}
          <OrderStats stats={orderStats} isLoading={isStatsLoading} />

          {/* Filters */}
          <OrderFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onCreateNew={handleCreateNew}
            onExport={handleExport}
            isLoading={isLoading}
          />

          {/* Order List */}
          <OrderList
            orders={orders}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />

          {/* TODO: Add modals for create, edit, view, delete */}
        </div>
      </div>
    </AppLayout>
  )
}