'use client'

import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { X, Package, Truck, Calendar, DollarSign, User, MapPin, Phone, Mail, FileText } from 'lucide-react'

interface PurchaseOrderViewModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
}

export function PurchaseOrderViewModal({ order, isOpen, onClose }: PurchaseOrderViewModalProps) {
  const theme = useSelector(selectTheme)

  if (!isOpen || !order) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-sky-500 dark:text-sky-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Purchase Order Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.orderNumber}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <FileText className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Number</label>
                  <p className="text-gray-900 dark:text-white font-medium">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</label>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Delivery</label>
                  <p className="text-gray-900 dark:text-white">
                    {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          {order.supplier && (
            <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Truck className="h-5 w-5" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{order.supplier.supplierName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier Code</label>
                    <p className="text-gray-900 dark:text-white">{order.supplier.supplierCode}</p>
                  </div>
                  {order.supplier.contactPerson && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Person</label>
                      <p className="text-gray-900 dark:text-white">{order.supplier.contactPerson}</p>
                    </div>
                  )}
                  {order.supplier.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{order.supplier.phone}</p>
                    </div>
                  )}
                  {order.supplier.email && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{order.supplier.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Package className="h-5 w-5" />
                  Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2 text-gray-900 dark:text-white font-medium">Item</th>
                        <th className="text-left py-2 text-gray-900 dark:text-white font-medium">Quantity</th>
                        <th className="text-left py-2 text-gray-900 dark:text-white font-medium">Rate</th>
                        <th className="text-left py-2 text-gray-900 dark:text-white font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3">
                            <div>
                              <p className="text-gray-900 dark:text-white font-medium">{item.itemName || 'N/A'}</p>
                              {item.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-gray-900 dark:text-white">
                            {item.quantity || 0} {item.unit || 'pcs'}
                          </td>
                          <td className="py-3 text-gray-900 dark:text-white">
                            {formatCurrency(item.rate || 0)}
                          </td>
                          <td className="py-3 text-gray-900 dark:text-white font-medium">
                            {formatCurrency((item.quantity || 0) * (item.rate || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dates */}
            <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Calendar className="h-5 w-5" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Date</label>
                  <p className="text-gray-900 dark:text-white">
                    {order.orderDate ? formatDate(order.orderDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Delivery</label>
                  <p className="text-gray-900 dark:text-white">
                    {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                  <p className="text-gray-900 dark:text-white">
                    {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(order.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                  <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(order.totalAmount || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
