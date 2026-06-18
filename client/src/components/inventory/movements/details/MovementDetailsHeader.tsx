'use client'

import { ArrowLeft, Package, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { StockMovement } from '../types'

interface MovementDetailsHeaderProps {
  theme: 'light' | 'dark'
  movement: StockMovement
  onEdit: () => void
  onDelete: () => void
}

export function MovementDetailsHeader({
  theme,
  movement,
  onEdit,
  onDelete
}: MovementDetailsHeaderProps) {
  const router = useRouter()

  return (
    <div className={`rounded-2xl border shadow-lg p-4 sm:p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-sky-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/inventory/movements')}
            variant="outline"
            size="sm"
            className={`${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-12 w-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Movement #{movement.movementNumber}
            </h1>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Stock Movement Details
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onEdit}
            variant="outline"
            className={`${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className={`${
              theme === 'dark'
                ? 'border-red-600 text-red-400 hover:bg-red-900/20'
                : 'border-red-300 text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
















