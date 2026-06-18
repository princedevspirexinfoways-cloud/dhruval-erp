'use client'

import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Dispatch } from '@/lib/api/enhancedDispatchApi'
import { 
  X, 
  Truck, 
  Calendar, 
  Building, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  PlayCircle,
  Image as ImageIcon,
  Download,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'

interface DispatchViewModalProps {
  isOpen: boolean
  onClose: () => void
  dispatch: Dispatch | null
}

export const DispatchViewModal = ({ isOpen, onClose, dispatch }: DispatchViewModalProps) => {
  if (!dispatch) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in-progress':
        return <PlayCircle className="h-5 w-5 text-blue-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getDispatchTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return '📦'
      case 'delivery':
        return '🚚'
      case 'transfer':
        return '🔄'
      case 'return':
        return '↩️'
      default:
        return '📋'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{getDispatchTypeIcon(dispatch.dispatchType)}</span>
              <div>
                <h2 className="text-2xl font-bold">{dispatch.dispatchNumber}</h2>
                <p className="text-blue-100">Dispatch Details</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Basic Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Dispatch Number:</span>
                  <span className="font-semibold text-gray-900">{dispatch.dispatchNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Dispatch Type:</span>
                  <span className="font-semibold text-gray-900 capitalize">{dispatch.dispatchType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Dispatch Date:</span>
                  <span className="font-semibold text-gray-900">
                    {format(new Date(dispatch.dispatchDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Company:</span>
                  <span className="font-semibold text-gray-900">{dispatch.companyId?.companyName}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Status & Priority
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(dispatch.status)}
                  <Badge className={`${getStatusColor(dispatch.status)} text-sm font-medium px-3 py-1`}>
                    {dispatch.status}
                  </Badge>
                </div>
                <Badge className={`${getPriorityColor(dispatch.priority)} text-sm font-medium px-3 py-1`}>
                  {dispatch.priority} Priority
                </Badge>
                <div className="text-sm text-gray-600">
                  Created: {format(new Date(dispatch.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
                {dispatch.updatedAt && (
                  <div className="text-sm text-gray-600">
                    Updated: {format(new Date(dispatch.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Source Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Source Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600 font-medium">Warehouse:</span>
                </div>
                <p className="font-semibold text-gray-900 ml-6">{dispatch.sourceWarehouseId?.warehouseName}</p>
                <p className="text-sm text-gray-500 ml-6">Code: {dispatch.sourceWarehouseId?.warehouseCode}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600 font-medium">Created By:</span>
                </div>
                <p className="font-semibold text-gray-900 ml-6">{dispatch.createdBy?.name || dispatch.createdBy?.email}</p>
                <p className="text-sm text-gray-500 ml-6">{dispatch.createdBy?.email}</p>
              </div>
            </div>
          </div>

          {/* Customer Order Information */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Customer Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600 font-medium">Order Number:</span>
                </div>
                <p className="font-semibold text-gray-900 ml-6">{dispatch.customerOrderId?.orderNumber}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600 font-medium">Customer ID:</span>
                </div>
                <p className="font-semibold text-gray-900 ml-6">{dispatch.customerOrderId?.customerId}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {(dispatch.vehicleNumber || dispatch.deliveryPersonName || dispatch.deliveryPersonNumber) && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Delivery Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dispatch.vehicleNumber && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-orange-600" />
                      <span className="text-gray-600 font-medium">Vehicle Number:</span>
                    </div>
                    <p className="font-semibold text-gray-900 ml-6">{dispatch.vehicleNumber}</p>
                  </div>
                )}
                {dispatch.deliveryPersonName && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <span className="text-gray-600 font-medium">Delivery Person:</span>
                    </div>
                    <p className="font-semibold text-gray-900 ml-6">{dispatch.deliveryPersonName}</p>
                  </div>
                )}
                {dispatch.deliveryPersonNumber && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-orange-600" />
                      <span className="text-gray-600 font-medium">Contact Number:</span>
                    </div>
                    <p className="font-semibold text-gray-900 ml-6">{dispatch.deliveryPersonNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {dispatch.notes && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Notes
              </h3>
              <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                {dispatch.notes}
              </p>
            </div>
          )}

          {/* Documents & Photos */}
          {dispatch.documents?.photos && dispatch.documents.photos.length > 0 && (
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-lg border border-pink-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-pink-600" />
                Documents & Photos ({dispatch.documents.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dispatch.documents.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-pink-300 transition-colors">
                      <img
                        src={photo}
                        alt={`Dispatch photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNjAgODkuNTQ0NyA2OC41NDQ3IDgxIDc5IDgxSDEyMUMxMzEuNDU1IDgxIDE0MCA4OS41NDQ3IDE0MCAxMDBWMTIwQzE0MCAxMzAuNDU1IDEzMS40NTUgMTM5IDEyMSAxMzlINzlDNjguNTQ0NyAxMzkgNjAgMTMwLjQ1NSA2MCAxMjBWMTEwWiIgZmlsbD0iI0QxRDRGNyIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI5MCIgcj0iMTUiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/90 hover:bg-white text-gray-800"
                          onClick={() => window.open(photo, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/90 hover:bg-white text-gray-800"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = photo
                            link.download = `dispatch-${dispatch.dispatchNumber}-photo-${index + 1}.jpg`
                            link.click()
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              Timestamps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-gray-600 font-medium">Created:</span>
                <p className="font-semibold text-gray-900">
                  {format(new Date(dispatch.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
              {dispatch.updatedAt && (
                <div className="space-y-2">
                  <span className="text-gray-600 font-medium">Last Updated:</span>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(dispatch.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
