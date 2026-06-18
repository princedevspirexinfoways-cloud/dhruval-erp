'use client'

import { User, Calendar } from 'lucide-react'
import { StockMovement } from '../types'
import { formatDate } from '../utils'

interface MovementAuditInfoProps {
  theme: 'light' | 'dark'
  movement: StockMovement
}

export function MovementAuditInfo({ theme, movement }: MovementAuditInfoProps) {
  const getCreatedByName = () => {
    if (typeof movement.createdBy === 'object' && movement.createdBy?.personalInfo) {
      const firstName = movement.createdBy.personalInfo.firstName || ''
      const lastName = movement.createdBy.personalInfo.lastName || ''
      const fullName = `${firstName} ${lastName}`.trim()
      return fullName || movement.createdBy.username || 'System'
    }
    return movement.createdBy || 'System'
  }

  return (
    <div className={`rounded-xl p-6 transition-theme border ${
      theme === 'dark'
        ? 'bg-gray-700/30 border-gray-600'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}>Audit Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Created By</label>
          <div className="flex items-center space-x-2">
            <User className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
              {String(getCreatedByName())}
            </p>
          </div>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Created At</label>
          <div className="flex items-center space-x-2">
            <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
              {formatDate(movement.createdAt)}
            </p>
          </div>
        </div>
        {(movement as any).updatedAt && (
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Last Updated</label>
            <div className="flex items-center space-x-2">
              <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                {formatDate((movement as any).updatedAt)}
              </p>
            </div>
          </div>
        )}
        {movement.performedBy && (
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Performed By</label>
            <div className="flex items-center space-x-2">
              <User className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                {movement.performedBy}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



