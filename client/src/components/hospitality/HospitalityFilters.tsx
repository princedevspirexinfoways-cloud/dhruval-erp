import React from 'react'
import { Calendar, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HospitalityFiltersProps {
  filters: {
    purpose: string
    travelType: string
    approvalStatus: string
    dateFrom: string
    dateTo: string
  }
  onFilterChange: (filters: HospitalityFiltersProps['filters']) => void
  onReset: () => void
}

export default function HospitalityFilters({ filters, onFilterChange, onReset }: HospitalityFiltersProps) {
  const handleFilterChange = (key: keyof HospitalityFiltersProps['filters'], value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Purpose Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Purpose
        </label>
        <select
          value={filters.purpose}
          onChange={(e) => handleFilterChange('purpose', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Purposes</option>
          <option value="business_meeting">Business Meeting</option>
          <option value="product_demo">Product Demo</option>
          <option value="negotiation">Negotiation</option>
          <option value="follow_up">Follow Up</option>
          <option value="site_visit">Site Visit</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Travel Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Travel Type
        </label>
        <select
          value={filters.travelType}
          onChange={(e) => handleFilterChange('travelType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Travel Types</option>
          <option value="local">Local</option>
          <option value="outstation">Outstation</option>
          <option value="international">International</option>
        </select>
      </div>

      {/* Approval Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Approval Status
        </label>
        <select
          value={filters.approvalStatus}
          onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="reimbursed">Reimbursed</option>
        </select>
      </div>

      {/* Date From Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          From Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Date To Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          To Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="md:col-span-2 lg:col-span-5 flex justify-end">
          <Button
            onClick={onReset}
            variant="outline"
            className="flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}
