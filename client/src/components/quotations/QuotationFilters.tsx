'use client'

import { useState } from 'react'
import { Search, Filter, Calendar, DollarSign, User, X } from 'lucide-react'

interface QuotationFiltersProps {
  searchTerm: string
  onSearchChange: (search: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  dateRange: { start: string; end: string }
  onDateRangeChange: (range: { start: string; end: string }) => void
  amountRange: { min: number; max: number }
  onAmountRangeChange: (range: { min: number; max: number }) => void
  customerFilter: string
  onCustomerChange: (customer: string) => void
  onClearFilters: () => void
}

export function QuotationFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  amountRange,
  onAmountRangeChange,
  customerFilter,
  onCustomerChange,
  onClearFilters
}: QuotationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' }
  ]

  const hasActiveFilters = statusFilter || dateRange.start || dateRange.end || 
    amountRange.min > 0 || amountRange.max < 1000000 || customerFilter

  return (
    <div className="bg-white rounded-xl border-2 border-sky-500 p-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-600 h-5 w-5" />
        <input
          type="text"
          placeholder="Search quotations by number, customer, or description..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:outline-none text-black placeholder-sky-400"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sky-600 hover:text-sky-800 font-medium"
        >
          <Filter className="h-5 w-5" />
          <span>Advanced Filters</span>
          {hasActiveFilters && (
            <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
          >
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-sky-200">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:outline-none text-black"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:outline-none text-black"
              />
            </div>
          </div>

          {/* Amount Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Min Amount (₹)
              </label>
              <input
                type="number"
                value={amountRange.min || ''}
                onChange={(e) => onAmountRangeChange({ 
                  ...amountRange, 
                  min: parseInt(e.target.value) || 0 
                })}
                placeholder="0"
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Max Amount (₹)
              </label>
              <input
                type="number"
                value={amountRange.max === 1000000 ? '' : amountRange.max}
                onChange={(e) => onAmountRangeChange({ 
                  ...amountRange, 
                  max: parseInt(e.target.value) || 1000000 
                })}
                placeholder="No limit"
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:outline-none text-black"
              />
            </div>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Customer
            </label>
            <input
              type="text"
              value={customerFilter}
              onChange={(e) => onCustomerChange(e.target.value)}
              placeholder="Filter by customer name..."
              className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:outline-none text-black placeholder-sky-400"
            />
          </div>
        </div>
      )}
    </div>
  )
}
