'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StockMovement } from './types'

interface DeleteMovementModalProps {
  theme: 'light' | 'dark'
  movement: StockMovement
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteMovementModal({
  theme,
  movement,
  isLoading,
  onConfirm,
  onCancel
}: DeleteMovementModalProps) {
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-theme ${
      theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-sm' : 'bg-gray-500/50 backdrop-blur-sm'
    }`}>
      <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 transition-theme border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            theme === 'dark'
              ? 'bg-red-900/30 border border-red-700/50'
              : 'bg-red-100'
          }`}>
            <Trash2 className={`w-8 h-8 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>Delete Stock Movement</h3>
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Are you sure you want to delete movement #{movement.movementNumber}?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
              className={`transition-theme ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Movement
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


