import React from 'react'
import {
  Eye,
  Edit,
  Copy,
  Trash2,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Order } from '@/lib/features/orders/ordersApi'
import clsx from 'clsx'

interface OrderListProps {
  orders: Order[]
  isLoading: boolean
  onView: (order: Order) => void
  onEdit: (order: Order) => void
  onDuplicate: (order: Order) => void
  onDelete: (order: Order) => void
}

export default function OrderList({
  orders,
  isLoading,
  onView,
  onEdit,
  onDuplicate,
  onDelete
}: OrderListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'returned':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusColor = (paymentStatus: Order['paymentStatus']) => {
    switch (paymentStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'partial':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'draft':
        return Package
      case 'pending':
        return Clock
      case 'confirmed':
        return CheckCircle
      case 'processing':
        return Package
      case 'shipped':
        return Truck
      case 'delivered':
        return CheckCircle
      case 'cancelled':
        return XCircle
      case 'returned':
        return AlertTriangle
      default:
        return Package
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
        <p className="text-gray-600">No orders match your current filters. Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const StatusIcon = getStatusIcon(order.status)
        
        return (
          <div
            key={order._id}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Order Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center border-2 border-blue-200">
                      <StatusIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-black truncate">
                        {order.orderNumber}
                      </h3>
                      
                      {/* Status Badge */}
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        getStatusColor(order.status)
                      )}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>

                      {/* Priority Badge */}
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        getPriorityColor(order.priority)
                      )}>
                        {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                      </span>

                      {/* Payment Status Badge */}
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        getPaymentStatusColor(order.paymentStatus)
                      )}>
                        <CreditCard className="w-3 h-3 mr-1" />
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="truncate max-w-xs">{order.customerName}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate max-w-xs">{order.customerEmail}</span>
                      </div>
                      
                      {order.customerPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{order.customerPhone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.orderDate)}</span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Package className="w-4 h-4" />
                        <span className="font-semibold text-black">{order.items.length}</span>
                        <span className="text-gray-600">items</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-black">{formatCurrency(order.totalAmount)}</span>
                        <span className="text-gray-600">total</span>
                      </div>
                      
                      {order.expectedDeliveryDate && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Truck className="w-4 h-4" />
                          <span className="text-gray-600">Expected:</span>
                          <span className="font-semibold text-black">{formatDate(order.expectedDeliveryDate)}</span>
                        </div>
                      )}

                      {order.trackingNumber && (
                        <div className="flex items-center gap-1 text-indigo-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-gray-600">Tracking:</span>
                          <span className="font-semibold text-black">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Button
                    onClick={() => onView(order)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={() => onEdit(order)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors"
                    title="Edit Order"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={() => onDuplicate(order)}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                    title="Duplicate Order"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={() => onDelete(order)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    title="Delete Order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
