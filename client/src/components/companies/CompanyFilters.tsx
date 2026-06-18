'use client'

import React from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  RotateCcw, 
  Calendar,
  MapPin,
  Building2,
  SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CompanyFiltersProps {
  filters: {
    search: string
    status: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    dateRange?: {
      start: string
      end: string
    }
    location?: string
    industry?: string
  }
  onFiltersChange: (filters: any) => void
  onReset: () => void
  onCreateNew: () => void
  isLoading?: boolean
}

const CompanyFilters: React.FC<CompanyFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  onCreateNew,
  isLoading = false
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value })
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    onFiltersChange({ ...filters, sortBy, sortOrder })
  }

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value })
  }

  const handleIndustryChange = (value: string) => {
    onFiltersChange({ ...filters, industry: value })
  }

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.location || filters.industry

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-6 lg:p-8 transition-all duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search Section */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search companies by name, code, or GSTIN..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-4 pr-10 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 text-gray-900 dark:text-white font-medium"
              disabled={isLoading}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="under_review">Under Review</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                handleSortChange(sortBy, sortOrder as 'asc' | 'desc')
              }}
              className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-4 pr-10 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 text-gray-900 dark:text-white font-medium"
              disabled={isLoading}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="companyCode-asc">Code A-Z</option>
              <option value="companyCode-desc">Code Z-A</option>
            </select>
            <SlidersHorizontal className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Location..."
              value={filters.location || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="pl-10 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white w-40"
              disabled={isLoading}
            />
          </div>

          {/* Industry Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={filters.industry || ''}
              onChange={(e) => handleIndustryChange(e.target.value)}
              className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-8 py-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 text-gray-900 dark:text-white font-medium"
              disabled={isLoading}
            >
              <option value="">All Industries</option>
              <option value="textile">Textile</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="trading">Trading</option>
              <option value="services">Services</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="retail">Retail</option>
            </select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isLoading}
              className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-6 py-4 rounded-xl font-medium transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}


        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700">
                Search: "{filters.search}"
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                Status: {filters.status}
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">
                Location: {filters.location}
              </span>
            )}
            {filters.industry && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                Industry: {filters.industry}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyFilters
