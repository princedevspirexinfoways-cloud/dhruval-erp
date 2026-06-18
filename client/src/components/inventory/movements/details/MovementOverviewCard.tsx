'use client'

import { getMovementIcon, getMovementBadge, getStatusBadge, getPriorityBadge } from '../utils'
import { StockMovement } from '../types'
import { CheckCircle, Clock, XCircle, TrendingUp, AlertTriangle } from 'lucide-react'

interface MovementOverviewCardProps {
  theme: 'light' | 'dark'
  movement: StockMovement
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-600" />
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-600" />
    case 'in_progress':
      return <TrendingUp className="w-4 h-4 text-blue-600" />
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-600" />
  }
}

export function MovementOverviewCard({ theme, movement }: MovementOverviewCardProps) {
  return (
    <div className={`rounded-xl border p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gradient-to-r from-sky-900/20 to-blue-900/20 border-sky-700/50'
        : 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200'
    }`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
          }`}>
            {getMovementIcon(movement.movementType, theme)}
          </div>
          <div className={getMovementBadge(movement.movementType, theme)}>
            {getMovementIcon(movement.movementType, theme)}
            <span className="capitalize">{movement.movementType || 'Unknown'}</span>
          </div>
        </div>

        <div className="text-center">
          <div className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {movement.quantity}
          </div>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {movement.unit || (typeof movement.itemId === 'object' && movement.itemId?.stock?.unit) || (movement as any).stock?.unit || 'PCS'} {movement.movementType === 'outward' ? 'Moved Out' : 'Moved In'}
          </p>
        </div>

        <div className="text-center">
          <div className={getStatusBadge(movement.status || 'completed', theme)}>
            {getStatusIcon(movement.status)}
            <span className="capitalize">{(movement.status || 'completed').replace('_', ' ')}</span>
          </div>
          {(movement as any).priority && (
            <div className="mt-2">
              <span className={getPriorityBadge((movement as any).priority, theme)}>
                {(movement as any).priority} Priority
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



