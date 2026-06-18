'use client'

import { ArrowUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface MovementsHeaderProps {
  theme: 'light' | 'dark'
  movementsCount: number
  onCreateClick: () => void
}

export function MovementsHeader({ theme, movementsCount, onCreateClick }: MovementsHeaderProps) {
  return (
    <div className={`rounded-2xl border shadow-lg p-4 sm:p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-sky-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <ArrowUpDown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent ${
              theme === 'dark' ? 'text-gray-100' : ''
            }`}>
              Inventory Movements
            </h1>
            <p className={`mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Track all stock movements and transfers ({movementsCount} movements)
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateClick}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Movement
        </Button>
      </div>
    </div>
  )
}
















