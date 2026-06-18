import React from 'react'
import { X, Car, User, Phone, Clock, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Vehicle } from '@/lib/features/vehicles/vehiclesApi'
import { formatDistanceToNow, format } from 'date-fns'

interface VehicleDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle
}

export default function VehicleDetailsModal({ isOpen, onClose, vehicle }: VehicleDetailsModalProps) {
  if (!isOpen) return null

  const getStatusBadge = (status: Vehicle['status']) => {
    const statusConfig = {
      in: { color: 'bg-green-100 text-green-800', label: 'In' },
      out: { color: 'bg-gray-100 text-gray-800', label: 'Out' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
    }

    const config = statusConfig[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPurposeBadge = (purpose: Vehicle['purpose']) => {
    const purposeConfig = {
      delivery: { color: 'bg-blue-100 text-blue-800', label: 'Delivery' },
      pickup: { color: 'bg-purple-100 text-purple-800', label: 'Pickup' },
      maintenance: { color: 'bg-orange-100 text-orange-800', label: 'Maintenance' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Other' }
    }

    const config = purposeConfig[purpose]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getDuration = () => {
    if (!vehicle.timeOut) return 'Still inside'
    
    const duration = new Date(vehicle.timeOut).getTime() - new Date(vehicle.timeIn).getTime()
    const minutes = Math.floor(duration / (1000 * 60))
    
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Vehicle Details</h2>
              <p className="text-sm text-gray-500">View complete vehicle information</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Car className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <p className="text-lg font-semibold text-gray-900">{vehicle.vehicleNumber}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Gate Pass
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {vehicle.gatePassNumber || 'No active gate pass'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div>{getStatusBadge(vehicle.status)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <div>{getPurposeBadge(vehicle.purpose)}</div>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Driver Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <p className="text-gray-900">{vehicle.driverName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{vehicle.driverPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-600" />
              Time Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time In
                </label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <p className="text-gray-900">{format(new Date(vehicle.timeIn), 'PPp')}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(vehicle.timeIn), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
              
              {vehicle.timeOut && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Out
                  </label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-gray-900">{format(new Date(vehicle.timeOut), 'PPp')}</p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(vehicle.timeOut), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <p className="text-gray-900">{getDuration()}</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Reason for Visit
            </h3>
            <p className="text-gray-900 whitespace-pre-wrap">{vehicle.reason}</p>
          </div>

          {/* Images */}
          {vehicle.images && vehicle.images.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vehicle Images ({vehicle.images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicle.images.map((image, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(image, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">{format(new Date(vehicle.createdAt), 'PPp')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">{format(new Date(vehicle.updatedAt), 'PPp')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
