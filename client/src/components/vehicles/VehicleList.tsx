import React, { useState } from 'react'
import {
  Eye,
  Edit,
  Trash2,
  Clock,
  User,
  Phone,
  Car,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Vehicle, useDeleteVehicleMutation, useCheckoutVehicleMutation } from '@/lib/features/vehicles/vehiclesApi'
import VehicleFormModal from './modals/VehicleFormModal'
import VehicleDetailsModal from './modals/VehicleDetailsModal'

import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export interface VehicleListProps {
  vehicles: Vehicle[]
  isLoading: boolean
  totalPages: number
  totalVehicles: number
  page: number
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export default function VehicleList({
  vehicles,
  isLoading,
  totalPages,
  totalVehicles,
  page,
  onPageChange,
  onRefresh
}: VehicleListProps) {
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null)

  const [deleteVehicle, { isLoading: isDeleting }] = useDeleteVehicleMutation()
  const [checkoutVehicle, { isLoading: isCheckingOut }] = useCheckoutVehicleMutation()

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
  }

  const handleView = (vehicle: Vehicle) => {
    setViewingVehicle(vehicle)
  }

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      await deleteVehicle(vehicleId).unwrap()
      toast.success('Vehicle deleted successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete vehicle')
    }
  }

  const handleCheckout = async (vehicleId: string) => {
    try {
      const result = await checkoutVehicle({ id: vehicleId }).unwrap()
      console.log('Checkout result:', result)
      toast.success('Vehicle checked out successfully')
      onRefresh()
    } catch (error: any) {
      console.error('Checkout error:', error)
      const errorMessage = error?.data?.message || error?.message || 'Failed to checkout vehicle'
      
      // Handle specific error cases
      if (errorMessage.includes('already checked out')) {
        toast.error('This vehicle is already checked out')
        onRefresh() // Refresh to get updated status
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleEditSuccess = () => {
    setEditingVehicle(null)
    onRefresh()
    toast.success('Vehicle updated successfully')
  }

  const getStatusBadge = (status: Vehicle['status']) => {
    const statusConfig = {
      in: { color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', icon: CheckCircle, label: 'In' },
      out: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', icon: XCircle, label: 'Out' },
      pending: { color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200', icon: Clock, label: 'Pending' }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getPurposeBadge = (purpose: Vehicle['purpose']) => {
    const purposeConfig = {
      delivery: { color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', label: 'Delivery' },
      pickup: { color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200', label: 'Pickup' },
      maintenance: { color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200', label: 'Maintenance' },
      other: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', label: 'Other' }
    }

    const config = purposeConfig[purpose]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-12 text-center">
          <Car className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No vehicles found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No vehicles match your current search and filter criteria.
          </p>
          <Button onClick={onRefresh} variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Vehicles ({totalVehicles})
            </h2>
            <Button onClick={onRefresh} variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {vehicles.map((vehicle) => (
            <div key={vehicle._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {vehicle.vehicleNumber}
                      </h3>
                      {getStatusBadge(vehicle.status || vehicle.currentStatus || 'in')}
                      {getPurposeBadge(vehicle.purpose)}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {vehicle.driverName}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {vehicle.driverPhone}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {vehicle.timeIn ? formatDistanceToNow(new Date(vehicle.timeIn), { addSuffix: true }) : 'No time recorded'}
                      </div>
                      {vehicle.timeOut && (
                        <div className="flex items-center text-orange-600 dark:text-orange-400">
                          <Clock className="w-4 h-4 mr-1" />
                          Out: {formatDistanceToNow(new Date(vehicle.timeOut), { addSuffix: true })}
                        </div>
                      )}
                    </div>

                    {vehicle.gatePassNumber && (
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Gate Pass: <span className="font-medium">{vehicle.gatePassNumber}</span>
                      </div>
                    )}

                    {vehicle.reason && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {vehicle.reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleView(vehicle)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => handleEdit(vehicle)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  {(vehicle.status === 'in' || vehicle.currentStatus === 'in') && !vehicle.timeOut && (
                    <Button
                      onClick={() => handleCheckout(vehicle._id)}
                      disabled={isCheckingOut}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {isCheckingOut ? 'Checking Out...' : 'Check Out'}
                    </Button>
                  )}
                  
                  {(vehicle.status === 'out' || vehicle.currentStatus === 'out' || vehicle.timeOut) && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      Checked Out
                    </div>
                  )}

                  <Button
                    onClick={() => handleDelete(vehicle._id)}
                    disabled={isDeleting}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border-red-300 dark:border-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingVehicle && (
        <VehicleFormModal
          isOpen={true}
          onClose={() => setEditingVehicle(null)}
          onSuccess={handleEditSuccess}
          vehicle={editingVehicle}
        />
      )}

      {/* Details Modal */}
      {viewingVehicle && (
        <VehicleDetailsModal
          isOpen={true}
          onClose={() => setViewingVehicle(null)}
          vehicle={viewingVehicle}
        />
      )}
    </>
  )
}