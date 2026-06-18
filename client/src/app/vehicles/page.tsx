'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Upload, Car, RefreshCw, Sun, Moon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import VehicleList from '@/components/vehicles/VehicleList'
import VehicleFormModal from '@/components/vehicles/modals/VehicleFormModal'
import VehicleFilters from '@/components/vehicles/VehicleFilters'
import VehicleStats from '@/components/vehicles/VehicleStats'
import { useGetAllVehiclesQuery, useGetVehicleStatsQuery, type Vehicle } from '@/lib/features/vehicles/vehiclesApi'
import { toast } from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { selectTheme, toggleTheme } from '@/lib/features/ui/uiSlice'

export default function VehiclesPage() {
  const theme = useSelector(selectTheme)
  const dispatch = useDispatch()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({
    purpose: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })

  // RTK Query hooks with real-time data
  const {
    data: vehiclesResponse,
    isLoading: isLoadingVehicles,
    error: vehiclesError,
    refetch: refetchVehicles
  } = useGetAllVehiclesQuery({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    purpose: filters.purpose,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  }, {
    pollingInterval: 30000, // Poll every 30 seconds for real-time updates
    refetchOnFocus: true,
    refetchOnReconnect: true
  })

  const {
    data: statsData,
    isLoading: isLoadingStats
  } = useGetVehicleStatsQuery({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  }, {
    pollingInterval: 60000, // Poll every minute for stats
    refetchOnFocus: true
  })

  // Handle both array response and structured response
  const vehicles: Vehicle[] = Array.isArray(vehiclesResponse)
    ? vehiclesResponse
    : (vehiclesResponse?.data || [])

  const totalPages = Array.isArray(vehiclesResponse)
    ? Math.ceil(vehiclesResponse.length / pageSize)
    : (vehiclesResponse?.totalPages || Math.ceil(vehicles.length / pageSize))

  const totalVehicles = Array.isArray(vehiclesResponse)
    ? vehiclesResponse.length
    : (vehiclesResponse?.total || vehicles.length)

  // Debug log to see the actual response
  console.log('Vehicles Response:', vehiclesResponse)
  console.log('Processed Vehicles:', vehicles)
  console.log('Total Pages:', totalPages, 'Total Vehicles:', totalVehicles)
  
  // Debug individual vehicle status
  vehicles.forEach((vehicle, index) => {
    console.log(`Vehicle ${index}:`, {
      id: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      status: vehicle.status,
      currentStatus: vehicle.currentStatus,
      timeOut: vehicle.timeOut
    })
  })

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFirstPage = () => {
    setCurrentPage(1)
  }

  const handleLastPage = () => {
    setCurrentPage(totalPages)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    refetchVehicles()
    toast.success('Vehicle created successfully!')
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success('Export functionality coming soon!')
  }

  const handleImport = () => {
    // TODO: Implement import functionality
    toast.success('Import functionality coming soon!')
  }

  const handleThemeToggle = () => {
    dispatch(toggleTheme())
    toast.success(`${theme === 'light' ? 'Dark' : 'Light'} theme enabled`)
  }

  // Handle errors in useEffect to avoid setState during render
  useEffect(() => {
    if (vehiclesError) {
      toast.error('Failed to load vehicles')
    }
  }, [vehiclesError])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Theme Colors */}
        <PageHeader
          title="Vehicle Management"
          description="Manage vehicle gate pass system and track entries/exits"
          icon={<Car className="h-6 w-6" />}
          variant="emerald"
        >
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleThemeToggle}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={() => refetchVehicles()}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              disabled={isLoadingVehicles}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingVehicles ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleImport}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white text-emerald-600 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </PageHeader>

        {/* Stats Section */}
        <VehicleStats
          stats={statsData}
          isLoading={isLoadingStats}
        />

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vehicles, drivers, or gate pass numbers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {Object.values(filters).some(v => v) && (
                <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <VehicleFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={() => {
                  setFilters({
                    purpose: '',
                    status: '',
                    dateFrom: '',
                    dateTo: ''
                  })
                }}
              />
            </div>
          )}
        </div>

        {/* Enhanced Pagination Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show:
              </label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            {/* Pagination Info */}
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalVehicles)} of {totalVehicles} vehicles
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <Button
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="p-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>

                {/* Previous Page */}
                <Button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="p-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 5
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                    
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1)
                    }

                    // Add first page and ellipsis if needed
                    if (startPage > 1) {
                      pages.push(
                        <Button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          className={`w-8 h-8 p-0 ${currentPage === 1 ? '' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          1
                        </Button>
                      )
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="text-gray-500 dark:text-gray-400 px-2">
                            ...
                          </span>
                        )
                      }
                    }

                    // Add visible page numbers
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          variant={currentPage === i ? "default" : "outline"}
                          size="sm"
                          className={`w-8 h-8 p-0 ${currentPage === i ? '' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          {i}
                        </Button>
                      )
                    }

                    // Add last page and ellipsis if needed
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="text-gray-500 dark:text-gray-400 px-2">
                            ...
                          </span>
                        )
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          className={`w-8 h-8 p-0 ${currentPage === totalPages ? '' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          {totalPages}
                        </Button>
                      )
                    }

                    return pages
                  })()}
                </div>

                {/* Next Page */}
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="p-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Last Page */}
                <Button
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="p-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle List */}
        <VehicleList
          vehicles={vehicles}
          isLoading={isLoadingVehicles}
          page={currentPage}
          totalPages={totalPages}
          totalVehicles={totalVehicles}
          onPageChange={handlePageChange}
          onRefresh={refetchVehicles}
        />

        {/* Create Vehicle Modal */}
        <VehicleFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </AppLayout>
  )
}
