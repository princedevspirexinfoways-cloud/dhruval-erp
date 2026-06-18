'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Clock, ShoppingCart, Package, XCircle, AlertTriangle, Save } from 'lucide-react'
import { useUpdatePurchaseOrderStatusMutation } from '@/lib/api/purchaseOrdersApi'
import toast from 'react-hot-toast'

interface QuickStatusUpdateProps {
  order: any
  onStatusUpdate?: (orderId: string, newStatus: string) => void
}

export function QuickStatusUpdate({ order, onStatusUpdate }: QuickStatusUpdateProps) {
  const theme = useSelector(selectTheme)
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(order.status || 'pending')
  
  const [updateStatus] = useUpdatePurchaseOrderStatusMutation()

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
    { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'blue' },
    { value: 'ordered', label: 'Ordered', icon: ShoppingCart, color: 'purple' },
    { value: 'received', label: 'Received', icon: Package, color: 'green' },
    { value: 'partial', label: 'Partial', icon: AlertTriangle, color: 'orange' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
  ]

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return

    setIsUpdating(true)
    try {
      // Make API call to update status
      const result = await updateStatus({
        orderId: order._id,
        status: newStatus,
        notes: `Status changed from ${currentStatus} to ${newStatus}`
      }).unwrap()

      if (result.success) {
        setCurrentStatus(newStatus)
        toast.success(`Status updated to ${newStatus}`)
        
        // Call the onStatusUpdate callback if provided (for additional handling)
        if (onStatusUpdate) {
          onStatusUpdate(order._id, newStatus)
        }
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      const errorMessage = error?.data?.message || error?.message || 'Failed to update status'
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    if (statusOption) {
      const IconComponent = statusOption.icon
      return <IconComponent className="h-4 w-4" />
    }
    return <Clock className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    if (statusOption) {
      return statusOption.color
    }
    return 'gray'
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isUpdating}>
        <SelectTrigger className="w-32 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            {getStatusIcon(currentStatus)}
            <span className="capitalize">{currentStatus}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          {statusOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      
      {isUpdating && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
      )}
    </div>
  )
}
