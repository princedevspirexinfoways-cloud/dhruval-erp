'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, RefreshCw, Sparkles, Package, Building, CheckCircle } from 'lucide-react'
import { useGetSalesOrderQuery } from '@/lib/api/salesApi'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import toast from 'react-hot-toast'

interface DispatchFiltersProps {
  searchTerm: string
  statusFilter: string
  priorityFilter: string
  selectedCompanyId?: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onPriorityFilterChange: (value: string) => void
  onCompanyChange?: (companyId: string) => void
  onClearFilters: () => void
}

export const DispatchFilters = ({
  searchTerm,
  statusFilter,
  priorityFilter,
  selectedCompanyId,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onCompanyChange,
  onClearFilters
}: DispatchFiltersProps) => {
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || selectedCompanyId

  // Sales order detection state
  const [detectedSalesOrderId, setDetectedSalesOrderId] = useState<string>('')
  const [isDetectingOrder, setIsDetectingOrder] = useState(false)

  // RTK Query hooks
  const { data: companies = [] } = useGetAllCompaniesQuery()
  const { data: salesOrderData, isLoading: salesOrderLoading } = useGetSalesOrderQuery(
    detectedSalesOrderId, 
    { skip: !detectedSalesOrderId }
  )

  // Function to detect sales order ID from search term
  const detectSalesOrderId = (searchValue: string) => {
    // Common patterns for sales order IDs
    const salesOrderPatterns = [
      /^SO-\d{4}-\d{6}$/, // SO-2024-123456
      /^ORDER-\d{4}-\d{6}$/, // ORDER-2024-123456
      /^SALES-\d{4}-\d{6}$/, // SALES-2024-123456
      /^\d{4}-\d{6}$/, // 2024-123456
      /^[A-Z]{2,4}-\d{4}-\d{6}$/, // Any 2-4 letter prefix
    ]

    // Check if the search term matches any sales order pattern
    const matchedPattern = salesOrderPatterns.find(pattern => pattern.test(searchValue))
    
    if (matchedPattern) {
      return searchValue
    }
    
    // Also check if it's just a number (common for internal IDs)
    if (/^\d{6,12}$/.test(searchValue)) {
      return searchValue
    }

    return null
  }

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    
    // Detect if this looks like a sales order ID
    const detectedId = detectSalesOrderId(value)
    
    if (detectedId && detectedId !== detectedSalesOrderId) {
      setDetectedSalesOrderId(detectedId)
      setIsDetectingOrder(true)
    } else if (!detectedId) {
      setDetectedSalesOrderId('')
      setIsDetectingOrder(false)
    }
  }

  // Handle sales order detection and company auto-selection
  useEffect(() => {
    if (salesOrderData?.data && onCompanyChange) {
      const salesOrder = salesOrderData.data
      
      // Try to find the company from the sales order
      // Since SalesOrder doesn't have companyId directly, we'll need to infer it
      // For now, we'll show a success message and let the user know
      toast.success(`Sales Order ${salesOrder.orderNumber} detected!`, {
        duration: 3000,
        icon: '📦',
      })
      
      // If we have company information in the sales order, we could auto-select it
      // For now, we'll just show the detected order info
      setIsDetectingOrder(false)
    }
  }, [salesOrderData, onCompanyChange])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
      case 'in-progress': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
      case 'completed': return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
      case 'delivered': return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
      case 'cancelled': return 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
      default: return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white'
      case 'medium': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
      case 'high': return 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
      case 'urgent': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-pulse'
      default: return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white'
    }
  }

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <Filter className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Filter & Search</h3>
        <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Search Section */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            🔍 Smart Search & Sales Order Detection
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search dispatches, paste sales order ID (e.g., SO-2024-123456), or click to auto-detect..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  onSearchChange('')
                  setDetectedSalesOrderId('')
                  setIsDetectingOrder(false)
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Sales Order Detection Status */}
          {isDetectingOrder && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Detecting sales order: {detectedSalesOrderId}
                </span>
              </div>
            </div>
          )}

          {/* Detected Sales Order Info */}
          {salesOrderData?.data && !isDetectingOrder && (
            <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Sales Order Detected!
                </span>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                <p><strong>Order:</strong> {salesOrderData.data.orderNumber}</p>
                <p><strong>Customer:</strong> {salesOrderData.data.customerName || 'N/A'}</p>
                <p><strong>Amount:</strong> ₹{salesOrderData.data.orderSummary?.finalAmount?.toLocaleString() || 'N/A'}</p>
                <p><strong>Status:</strong> {salesOrderData.data.status}</p>
              </div>
            </div>
          )}

          {/* Quick Sales Order ID Examples */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">💡 Quick examples: SO-2024-123456, ORDER-2024-123456, or just paste the ID</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSearchChange('SO-2024-123456')}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              >
                SO-2024-123456
              </button>
              <button
                onClick={() => handleSearchChange('ORDER-2024-123456')}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              >
                ORDER-2024-123456
              </button>
              <button
                onClick={() => handleSearchChange('123456789')}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              >
                123456789
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Company Filter */}
          {onCompanyChange && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🏢 Company Filter
              </label>
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="w-full px-4 py-3 h-14 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all duration-300"
              >
                <option value="">All Companies</option>
                {(Array.isArray(companies) ? companies : companies?.data || []).map((company: any) => (
                  <option key={company._id} value={company._id}>
                    🏢 {company.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📊 Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-4 py-3 h-14 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="delivered">📦 Delivered</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              ⚡ Priority Filter
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="w-full px-4 py-3 h-14 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all duration-300"
            >
              <option value="all">All Priority</option>
              <option value="low">🐌 Low</option>
              <option value="medium">⚖️ Medium</option>
              <option value="high">🔥 High</option>
              <option value="urgent">🚨 Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end mt-6">
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Filters:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {searchTerm && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                🔍 Search: "{searchTerm}"
              </Badge>
            )}
            {selectedCompanyId && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                🏢 Company: {(Array.isArray(companies) ? companies : companies?.data || []).find((c: any) => c._id === selectedCompanyId)?.companyName || 'Selected'}
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge className={`${getStatusBadgeColor(statusFilter)} px-4 py-2 rounded-full font-semibold shadow-lg`}>
                📊 Status: {statusFilter}
              </Badge>
            )}
            {priorityFilter !== 'all' && (
              <Badge className={`${getPriorityBadgeColor(priorityFilter)} px-4 py-2 rounded-full font-semibold shadow-lg`}>
                ⚡ Priority: {priorityFilter}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
