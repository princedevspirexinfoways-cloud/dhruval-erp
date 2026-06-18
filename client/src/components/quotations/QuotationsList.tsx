'use client'

import { useState, useMemo } from 'react'
import { Plus, Grid, List, Download, RefreshCw } from 'lucide-react'
import { QuotationCard } from './QuotationCard'
import { QuotationFilters } from './QuotationFilters'
import { QuotationStats } from './QuotationStats'
import { Quotation } from '@/lib/api/quotationsApi'
import { useGetQuotationsQuery, useGetQuotationStatsQuery } from '@/lib/api/quotationsApi'

interface QuotationsListProps {
  onCreateNew?: () => void
  onViewQuotation?: (quotation: Quotation) => void
  onEditQuotation?: (quotation: Quotation) => void
  onDeleteQuotation?: (quotation: Quotation) => void
  onSendQuotation?: (quotation: Quotation) => void
  onDuplicateQuotation?: (quotation: Quotation) => void
  onDownloadQuotation?: (quotation: Quotation) => void
}

export function QuotationsList({
  onCreateNew,
  onViewQuotation,
  onEditQuotation,
  onDeleteQuotation,
  onSendQuotation,
  onDuplicateQuotation,
  onDownloadQuotation
}: QuotationsListProps) {
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [amountRange, setAmountRange] = useState({ min: 0, max: 1000000 })
  const [customerFilter, setCustomerFilter] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit: pageSize,
      search: searchTerm
    }

    if (statusFilter) params.status = statusFilter
    if (dateRange.start) params.startDate = dateRange.start
    if (dateRange.end) params.endDate = dateRange.end
    if (amountRange.min > 0) params.minAmount = amountRange.min
    if (amountRange.max < 1000000) params.maxAmount = amountRange.max
    if (customerFilter) params.customer = customerFilter

    return params
  }, [currentPage, pageSize, searchTerm, statusFilter, dateRange, amountRange, customerFilter])

  // RTK Query hooks
  const {
    data: quotationsData,
    isLoading: quotationsLoading,
    error: quotationsError,
    refetch: refetchQuotations
  } = useGetQuotationsQuery(queryParams)

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useGetQuotationStatsQuery({})

  // Handle filter changes
  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setDateRange({ start: '', end: '' })
    setAmountRange({ min: 0, max: 1000000 })
    setCustomerFilter('')
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    refetchQuotations()
    refetchStats()
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const quotations = quotationsData?.data || []
  const totalCount = quotationsData?.pagination?.total || 0
  const totalPages = quotationsData?.pagination?.pages || Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Quotations</h1>
          <p className="text-sky-600 mt-1">
            Manage your quotations and track their status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <div className="flex items-center bg-sky-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-sky-500 hover:text-sky-600'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-sky-500 hover:text-sky-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Quotation</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <QuotationStats stats={statsData?.data} isLoading={statsLoading} />

      {/* Filters */}
      <QuotationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        amountRange={amountRange}
        onAmountRangeChange={setAmountRange}
        customerFilter={customerFilter}
        onCustomerChange={setCustomerFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Loading State */}
      {quotationsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border-2 border-sky-500 p-6 animate-pulse">
              <div className="h-4 bg-sky-200 rounded mb-4"></div>
              <div className="h-6 bg-sky-200 rounded mb-2"></div>
              <div className="h-4 bg-sky-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-sky-200 rounded w-1/3"></div>
                <div className="h-4 bg-sky-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {quotationsError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">Failed to load quotations</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Quotations Grid/List */}
      {!quotationsLoading && !quotationsError && (
        <>
          {quotations.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-sky-500 p-12 text-center">
              <div className="text-sky-400 mb-4">
                <Grid className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">No quotations found</h3>
              <p className="text-sky-600 mb-6">
                {searchTerm || statusFilter || dateRange.start || customerFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first quotation.'}
              </p>
              {onCreateNew && (
                <button
                  onClick={onCreateNew}
                  className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create First Quotation</span>
                </button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {quotations.map((quotation) => (
                <QuotationCard
                  key={quotation._id}
                  quotation={quotation}
                  onView={onViewQuotation}
                  onEdit={onEditQuotation}
                  onDelete={onDeleteQuotation}
                  onSend={onSendQuotation}
                  onDuplicate={onDuplicateQuotation}
                  onDownload={onDownloadQuotation}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border-2 border-sky-500 p-4">
              <div className="flex items-center space-x-2 text-sm text-sky-600">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="border border-sky-200 rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>of {totalCount} quotations</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-sky-200 rounded text-sky-600 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === page
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'border-sky-200 text-sky-600 hover:bg-sky-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-sky-200 rounded text-sky-600 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
