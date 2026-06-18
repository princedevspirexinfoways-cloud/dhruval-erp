'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Factory, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Edit,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  BarChart3,
  FileText,
  Hash,
  Globe,
  Home,
  Building
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetOrdersByCustomerQuery } from '@/lib/api/enhancedOrdersApi'
import clsx from 'clsx'

interface CustomerOrderTrackingProps {
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: string
}

export function CustomerOrderTracking({
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress
}: CustomerOrderTrackingProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  // Fetch customer orders
  const { data: ordersResponse, isLoading, error, refetch } = useGetOrdersByCustomerQuery({
    customerId,
    page: 1,
    limit: 100
  })

  const orders = ordersResponse?.data || []

  // Calculate customer statistics
  const customerStats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
    ordersByStatus: {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      in_production: orders.filter(o => o.status === 'in_production').length,
      quality_check: orders.filter(o => o.status === 'quality_check').length,
      packed: orders.filter(o => o.status === 'packed').length,
      dispatched: orders.filter(o => o.status === 'dispatched').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      returned: orders.filter(o => o.status === 'returned').length
    },
    ordersByType: {
      export: orders.filter(o => o.orderType === 'export').length,
      local: orders.filter(o => o.orderType === 'local').length,
      domestic: orders.filter(o => o.orderType === 'domestic').length
    },
    productionEfficiency: orders.filter(o => o.productionStatus === 'completed').length / Math.max(orders.filter(o => o.productionStatus).length, 1) * 100,
    deliveryOnTime: orders.filter(o => o.status === 'delivered' && o.actualDeliveryDate && o.expectedDeliveryDate && new Date(o.actualDeliveryDate) <= new Date(o.expectedDeliveryDate)).length
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

  const getProductionProgress = (order: any) => {
    if (order.productionStatus === 'completed') return 100
    if (order.productionStatus === 'not_started') return 0
    if (order.productionStatus === 'in_progress') return order.productionProgress || 50
    if (order.productionStatus === 'on_hold') return order.productionProgress || 0
    return 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading customer orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Failed to load customer orders</p>
        <Button onClick={() => refetch()} className="mt-2">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <Card className="border-2 border-sky-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-6 w-6 text-sky-600" />
            <span>Customer Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{customerName}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{customerEmail}</span>
                </div>
                {customerPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{customerPhone}</span>
                  </div>
                )}
                {customerAddress && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{customerAddress}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-sky-600">
                {customerStats.totalOrders}
              </div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <div className="text-2xl font-semibold text-green-600 mt-2">
                {formatCurrency(customerStats.totalRevenue)}
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-orange-600">
                  {customerStats.ordersByStatus.in_production + customerStats.ordersByStatus.quality_check + customerStats.ordersByStatus.packed}
                </p>
              </div>
              <Factory className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{customerStats.ordersByStatus.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Production Efficiency</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(customerStats.productionEfficiency)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                <p className="text-2xl font-bold text-emerald-600">{customerStats.deliveryOnTime}</p>
              </div>
              <Clock className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>All Orders ({orders.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getOrderTypeIcon(order.orderType)}
                        <div>
                          <h4 className="font-medium">{order.orderNumber}</h4>
                          <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(order.status)}
                        {getPriorityBadge(order.priority)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Expected Delivery</p>
                        <p className="font-medium">{order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Production Status</p>
                        <p className="font-medium capitalize">{order.productionStatus?.replace('_', ' ') || 'Not started'}</p>
                      </div>
                    </div>

                    {/* Production Progress */}
                    {order.productionStatus && order.productionStatus !== 'not_started' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Production Progress</span>
                          <span>{getProductionProgress(order)}%</span>
                        </div>
                        <Progress value={getProductionProgress(order)} className="h-2" />
                      </div>
                    )}

                    {/* Dispatch Details */}
                    {order.dispatchDetails && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Dispatch Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Courier:</span> {order.dispatchDetails.courierName}
                          </div>
                          {order.dispatchDetails.courierTrackingNumber && (
                            <div>
                              <span className="text-gray-600">Tracking:</span> {order.dispatchDetails.courierTrackingNumber}
                            </div>
                          )}
                          {order.dispatchDetails.awbNumber && (
                            <div>
                              <span className="text-gray-600">AWB:</span> {order.dispatchDetails.awbNumber}
                            </div>
                          )}
                          {order.dispatchDetails.lrNumber && (
                            <div>
                              <span className="text-gray-600">LR:</span> {order.dispatchDetails.lrNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Last updated: {formatDate(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* In Production Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Factory className="h-5 w-5" />
                  <span>In Production</span>
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
                          <span>{getProductionProgress(order)}%</span>
                        </div>
                        <Progress value={getProductionProgress(order)} />
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        <p>Started: {order.productionStartDate ? formatDate(order.productionStartDate) : 'Not set'}</p>
                        <p>Expected: {order.productionEndDate ? formatDate(order.productionEndDate) : 'Not set'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Check Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
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
                      <div className="mt-3 text-sm text-gray-500">
                        <p>Production completed: {order.productionEndDate ? formatDate(order.productionEndDate) : 'Not set'}</p>
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
                  <Package className="h-5 w-5" />
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
                      <div className="mt-3 text-sm text-gray-500">
                        <p>Packed on: {order.packingDetails?.packingDate ? formatDate(order.packingDetails.packingDate) : 'Not set'}</p>
                        <p>Package count: {order.packingDetails?.packageCount || 'Not set'}</p>
                      </div>
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
                          <p>ETA: {order.dispatchDetails.estimatedDeliveryDate ? formatDate(order.dispatchDetails.estimatedDeliveryDate) : 'Not set'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(customerStats.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{count}</span>
                        <span className="text-xs text-gray-500">
                          ({Math.round((count / customerStats.totalOrders) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(customerStats.ordersByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{count}</span>
                        <span className="text-xs text-gray-500">
                          ({Math.round((count / customerStats.totalOrders) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-sky-400 mx-auto mb-4" />
                <p className="text-gray-600">Revenue trend chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Modal would go here */}
      {/* This would show comprehensive order details including all items, production progress, dispatch details, etc. */}
    </div>
  )
}

