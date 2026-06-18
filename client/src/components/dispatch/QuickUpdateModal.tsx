'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useQuickUpdateDispatchStatusMutation } from '@/lib/api/enhancedDispatchApi'
import { Dispatch } from '@/lib/api/enhancedDispatchApi'
import toast from 'react-hot-toast'
import { Zap, CheckCircle, Clock, PlayCircle, XCircle, AlertCircle, Save, X, Loader2 } from 'lucide-react'

interface QuickUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  dispatch: Dispatch | null
  onSuccess?: (dispatch: Dispatch) => void
}

export const QuickUpdateModal = ({
  isOpen,
  onClose,
  dispatch,
  onSuccess
}: QuickUpdateModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPriority, setSelectedPriority] = useState<string>('')
  
  const [quickUpdate, { isLoading }] = useQuickUpdateDispatchStatusMutation()

  // Initialize with current values when modal opens
  React.useEffect(() => {
    if (isOpen && dispatch) {
      setSelectedStatus(dispatch.status)
      setSelectedPriority(dispatch.priority)
    }
  }, [isOpen, dispatch])

  const statusOptions = [
    { 
      value: 'draft', 
      label: 'Draft', 
      icon: <AlertCircle className="h-4 w-4" />, 
      color: 'bg-gradient-to-r from-gray-400 to-slate-500',
      description: 'Initial state, not yet ready'
    },
    { 
      value: 'pending', 
      label: 'Pending', 
      icon: <Clock className="h-4 w-4" />, 
      color: 'bg-gradient-to-r from-amber-400 to-orange-500',
      description: 'Awaiting action or approval'
    },
    { 
      value: 'in-progress', 
      label: 'In Progress', 
      icon: <PlayCircle className="h-4 w-4" />, 
      color: 'bg-gradient-to-r from-blue-400 to-indigo-500',
      description: 'Currently being processed'
    },
    { 
      value: 'completed', 
      label: 'Completed', 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: 'bg-gradient-to-r from-green-400 to-emerald-500',
      description: 'Task completed successfully'
    },
    { 
      value: 'delivered', 
      label: 'Delivered', 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: 'bg-gradient-to-r from-emerald-400 to-teal-500',
      description: 'Successfully delivered to customer'
    },
    { 
      value: 'cancelled', 
      label: 'Cancelled', 
      icon: <XCircle className="h-4 w-4" />, 
      color: 'bg-gradient-to-r from-red-400 to-pink-500',
      description: 'Cancelled or rejected'
    }
  ]

  const priorityOptions = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      color: 'bg-gradient-to-r from-gray-400 to-slate-500',
      emoji: '🟢',
      description: 'Can be handled with normal timeline'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      color: 'bg-gradient-to-r from-blue-400 to-indigo-500',
      emoji: '🟡',
      description: 'Standard priority level'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      color: 'bg-gradient-to-r from-orange-400 to-red-500',
      emoji: '🟠',
      description: 'Needs attention soon'
    },
    { 
      value: 'urgent', 
      label: 'Urgent', 
      color: 'bg-gradient-to-r from-red-500 to-pink-600 animate-pulse',
      emoji: '🔴',
      description: 'Immediate attention required'
    }
  ]

  const handleQuickUpdate = async () => {
    if (!dispatch) return

    const hasChanges = selectedStatus !== dispatch.status || selectedPriority !== dispatch.priority

    if (!hasChanges) {
      onClose()
      return
    }

    try {
      const result = await quickUpdate({
        id: dispatch._id,
        status: selectedStatus,
        priority: selectedPriority
      }).unwrap()
      
      toast.success('Dispatch updated successfully!')
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to update dispatch:', error)
      toast.error('Failed to update dispatch')
    }
  }

  if (!dispatch) return null

  const currentStatus = statusOptions.find(s => s.value === dispatch.status)
  const currentPriority = priorityOptions.find(p => p.value === dispatch.priority)
  const selectedStatusOption = statusOptions.find(s => s.value === selectedStatus)
  const selectedPriorityOption = priorityOptions.find(p => p.value === selectedPriority)

  const hasChanges = selectedStatus !== dispatch.status || selectedPriority !== dispatch.priority

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Update</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">#{dispatch.dispatchNumber}</p>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Current State */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current State</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${currentStatus?.color}`}>
                {currentStatus?.icon}
                <span className="ml-1">{currentStatus?.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Priority:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${currentPriority?.color}`}>
                {currentPriority?.emoji}
                <span className="ml-1">{currentPriority?.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status Update */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📊 Update Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedStatus === status.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${status.color}`}>
                      {status.icon}
                      <span className="ml-1">{status.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{status.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Update */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">⚡ Update Priority</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {priorityOptions.map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => setSelectedPriority(priority.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedPriority === priority.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${priority.color}`}>
                      {priority.emoji}
                      <span className="ml-1">{priority.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{priority.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Changes */}
        {hasChanges && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">Changes Preview</h3>
            <div className="space-y-2">
              {selectedStatus !== dispatch.status && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${currentStatus?.color}`}>
                    {currentStatus?.label}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${selectedStatusOption?.color}`}>
                    {selectedStatusOption?.label}
                  </span>
                </div>
              )}
              {selectedPriority !== dispatch.priority && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${currentPriority?.color}`}>
                    {currentPriority?.label}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${selectedPriorityOption?.color}`}>
                    {selectedPriorityOption?.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {hasChanges ? 'Changes will be applied immediately' : 'No changes to apply'}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleQuickUpdate}
              disabled={isLoading || !hasChanges}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
