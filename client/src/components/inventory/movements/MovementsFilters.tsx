'use client'

import { Search } from 'lucide-react'

interface MovementsFiltersProps {
  theme: 'light' | 'dark'
  searchTerm: string
  typeFilter: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onTypeFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
}

export function MovementsFilters({
  theme,
  searchTerm,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange
}: MovementsFiltersProps) {
  return (
    <div className={`rounded-xl border shadow-lg p-4 sm:p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-sky-200'
    }`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search movements..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-theme ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-theme ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100'
                : 'border-gray-200 bg-gray-50 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="inward">Inward</option>
            <option value="outward">Outward</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment_note">Adjustment</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-theme ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100'
                : 'border-gray-200 bg-gray-50 text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  )
}
















