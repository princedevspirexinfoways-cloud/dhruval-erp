'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Upload, Car } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import VehicleList from '@/components/vehicles/VehicleList'
import VehicleFormModal from '@/components/vehicles/modals/VehicleFormModal'
import VehicleFilters from '@/components/vehicles/VehicleFilters'
import VehicleStats from '@/components/vehicles/VehicleStats'
import { useGetAllVehiclesQuery, useGetVehicleStatsQuery, type Vehicle } from '@/lib/features/vehicles/vehiclesApi'
import { toast } from 'react-hot-toast'

export default function VehiclesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
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
    limit: 10,
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
    ? Math.ceil(vehiclesResponse.length / 10)
    : (vehiclesResponse?.totalPages || Math.ceil(vehicles.length / 10))

  const totalVehicles = Array.isArray(vehiclesResponse)
    ? vehiclesResponse.length
    : (vehiclesResponse?.total || vehicles.length)

  // Debug log to see the actual response
  console.log('Vehicles Response:', vehiclesResponse)
  console.log('Processed Vehicles:', vehicles)
  console.log('Total Pages:', totalPages, 'Total Vehicles:', totalVehicles)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filtering
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vehicles, drivers, or gate pass numbers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {Object.values(filters).some(v => v) && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
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

        {/* Vehicle List */}
        <VehicleList
          vehicles={vehicles}
          isLoading={isLoadingVehicles}
          page={currentPage}
          totalPages={totalPages}
          totalVehicles={totalVehicles}
          onPageChange={setCurrentPage}
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