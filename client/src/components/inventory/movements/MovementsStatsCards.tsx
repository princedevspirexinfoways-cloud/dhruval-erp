'use client'

import { ArrowUpDown, ArrowDown, ArrowUp, Calendar } from 'lucide-react'
import { StockMovement } from './types'

interface MovementsStatsCardsProps {
  theme: 'light' | 'dark'
  movements: StockMovement[]
}

export function MovementsStatsCards({ theme, movements }: MovementsStatsCardsProps) {
  const todayMovements = movements.filter((m) => {
    const today = new Date().toDateString()
    const movementDate = new Date(m.movementDate || m.timestamp || m.createdAt).toDateString()
    return today === movementDate
  }).length

  const inwardCount = movements.filter((m) => m.movementType === 'inward').length
  const outwardCount = movements.filter((m) => m.movementType === 'outward').length
  const pendingCount = movements.filter((m) => m.status === 'pending').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Total Movements */}
      <div className={`rounded-xl border shadow-lg p-6 hover:shadow-xl transition-shadow ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-sky-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Total Movements</p>
            <p className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>{movements.length || 0}</p>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>+{todayMovements} today</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-sky-900/30 to-blue-900/30 border border-sky-700/50'
              : 'bg-gradient-to-br from-sky-100 to-blue-100'
          }`}>
            <ArrowUpDown className={`h-6 w-6 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`} />
          </div>
        </div>
      </div>

      {/* Inbound */}
      <div className={`rounded-xl border shadow-lg p-6 hover:shadow-xl transition-shadow ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-sky-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Inbound</p>
            <p className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>{inwardCount}</p>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Stock received</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50'
              : 'bg-gradient-to-br from-green-100 to-emerald-100'
          }`}>
            <ArrowDown className={`h-6 w-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
      </div>

      {/* Outbound */}
      <div className={`rounded-xl border shadow-lg p-6 hover:shadow-xl transition-shadow ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-sky-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Outbound</p>
            <p className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>{outwardCount}</p>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Stock issued</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-700/50'
              : 'bg-gradient-to-br from-red-100 to-pink-100'
          }`}>
            <ArrowUp className={`h-6 w-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className={`rounded-xl border shadow-lg p-6 hover:shadow-xl transition-shadow ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-sky-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Pending</p>
            <p className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            }`}>{pendingCount}</p>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            }`}>Need approval</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-700/50'
              : 'bg-gradient-to-br from-yellow-100 to-orange-100'
          }`}>
            <Calendar className={`h-6 w-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
















