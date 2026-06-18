'use client'

import { ArrowUpDown, MapPin, Calendar } from 'lucide-react'
import { StockMovement } from '../types'
import { formatDate } from '../utils'

interface MovementLocationInfoProps {
  theme: 'light' | 'dark'
  movement: StockMovement
}

export function MovementLocationInfo({ theme, movement }: MovementLocationInfoProps) {
  return (
    <div className={`rounded-xl border p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}>
        <ArrowUpDown className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
        <span>Movement Details</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>From Location</label>
          <div className="flex items-center space-x-2">
            <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
              {typeof movement.fromLocation === 'string'
                ? movement.fromLocation
                : (movement.fromLocation as any)?.warehouseName || 'N/A'
              }
            </p>
          </div>
          {typeof movement.fromLocation === 'object' && (movement.fromLocation as any)?.isExternal && (
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
              External Location
            </p>
          )}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>To Location</label>
          <div className="flex items-center space-x-2">
            <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
              {typeof movement.toLocation === 'string'
                ? movement.toLocation
                : (movement.toLocation as any)?.warehouseName || 'N/A'
              }
            </p>
          </div>
          {typeof movement.toLocation === 'object' && (movement.toLocation as any)?.isExternal && (
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
              External Location
            </p>
          )}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Movement Date</label>
          <div className="flex items-center space-x-2">
            <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
              {formatDate(movement.movementDate || movement.timestamp || movement.createdAt)}
            </p>
          </div>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Created Date</label>
          <div className="flex items-center space-x-2">
            <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
              {formatDate(movement.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

