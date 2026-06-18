'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Filter, Download, Upload, Users, DollarSign, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AppLayout } from '@/components/layout/AppLayout'
import { toast } from 'react-hot-toast'

// Import API hooks
import { 
  useGetAllCustomerVisitsQuery, 
  useGetHospitalityStatsQuery 
} from '@/lib/features/hospitality/hospitalityApi'

// Dynamic imports to avoid SSR issues
import dynamic from 'next/dynamic'

const CustomerVisitList = dynamic(() => import('@/components/hospitality/CustomerVisitList'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>,
  ssr: false
})

const CustomerVisitFormModal = dynamic(() => import('@/components/hospitality/modals/CustomerVisitFormModal'), {
  ssr: false
})

const HospitalityFilters = dynamic(() => import('@/components/hospitality/HospitalityFilters'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>,
  ssr: false
})

const HospitalityStats = dynamic(() => import('@/components/hospitality/HospitalityStats'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>,
  ssr: false
})

const ExpenseTracking = dynamic(() => import('@/components/hospitality/ExpenseTracking'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>,
  ssr: false
})

export default function HospitalityPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    purpose: '',
    travelType: '',
    approvalStatus: '',
    dateFrom: '',
    dateTo: ''
  })
  const [hasError, setHasError] = useState(false)

  // RTK Query hooks with error handling
  const {
    data: visitsResponse,
    isLoading: isLoadingVisits,
    error: visitsError,
    refetch: refetchVisits
  } = useGetAllCustomerVisitsQuery({
    page: currentPage,
    limit: 10,
    search: searchTerm,
    purpose: filters.purpose,
    travelType: filters.travelType,
    approvalStatus: filters.approvalStatus,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  }, {
    // skip: hasError,
    refetchOnFocus: true,
    refetchOnReconnect: true
  })

  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError
  } = useGetHospitalityStatsQuery({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  }, {
    // skip: hasError,
    refetchOnFocus: true
  })

  // Handle response structure - visitsResponse is the transformed data object containing { data: [], total, totalPages, page, limit }
  const visits = visitsResponse?.data || []
  const totalPages = visitsResponse?.totalPages || 1
  const totalVisits = visitsResponse?.total || 0

  // Mock data for testing
  const mockVisits = [
    {
      _id: 'mock-1',
      partyName: 'Sample Company Ltd',
      contactPerson: 'John Doe',
      contactPhone: '+91 9876543210',
      contactEmail: 'john@sample.com',
      visitDate: new Date().toISOString(),
      purpose: 'meeting',
      purposeDescription: 'Quarterly business review and planning session',
      travelType: 'local',
      approvalStatus: 'pending',
      totalExpenses: {
        accommodation: 5000,
        food: 2000,
        transportation: 1500,
        gifts: 500,
        other: 300,
        total: 9300
      },
      foodExpenses: 2000,
      giftsGiven: 500,
      transportationExpenses: 1500,
      otherExpenses: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      companyId: 'sample-company',
      createdBy: 'sample-user'
    },
    {
      _id: 'mock-2',
      partyName: 'Tech Solutions Inc',
      contactPerson: 'Jane Smith',
      contactPhone: '+91 9876543211',
      contactEmail: 'jane@techsolutions.com',
      visitDate: new Date(Date.now() - 86400000).toISOString(),
      purpose: 'demo',
      purposeDescription: 'Product demonstration and technical discussion',
      travelType: 'outstation',
      approvalStatus: 'approved',
      totalExpenses: {
        accommodation: 8000,
        food: 3000,
        transportation: 2500,
        gifts: 1000,
        other: 500,
        total: 15000
      },
      foodExpenses: 3000,
      giftsGiven: 1000,
      transportationExpenses: 2500,
      otherExpenses: 500,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      companyId: 'sample-company',
      createdBy: 'sample-user'
    }
  ]

  const mockStats = {
    totalVisits: 2,
    totalExpenses: 24300,
    avgExpensePerVisit: 12150,
    accommodationTotal: 13000,
    foodTotal: 5000,
    transportationTotal: 4000,
    giftsTotal: 1500,
    otherTotal: 800,
    pendingApprovals: 1,
    approvedVisits: 1,
    reimbursedVisits: 0
  }

  // Use mock data only if there's an error AND no real data
  const displayVisits = useMemo(() => {
    const shouldUseMock = visitsError && visits.length === 0
    console.log('Display visits logic:', {
      visitsError: !!visitsError,
      visitsLength: visits.length,
      shouldUseMock,
      willShowMock: shouldUseMock
    })
    return shouldUseMock ? mockVisits : visits
  }, [visitsError, visits])
  
  const displayStats = useMemo(() => {
    return statsError && !statsData ? mockStats : statsData
  }, [statsError, statsData])

  // Debug logging for data flow
  console.log('Data flow debug:', {
    visitsResponse,
    visits,
    visitsLength: visits?.length,
    displayVisits,
    displayVisitsLength: displayVisits?.length,
    isLoadingVisits,
    visitsError,
    hasError,
    loadingState: isLoadingVisits && !hasError && !visitsError,
    skipCondition: hasError
  })

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    refetchVisits()
    toast.success('Customer visit created successfully!')
  }

  const handleExport = () => {
    toast.success('Export functionality coming soon!')
  }

  const handleImport = () => {
    toast.success('Import functionality coming soon!')
  }

  const handleRetry = () => {
    setHasError(false)
    refetchVisits()
    toast('Refreshing data...', { icon: '🔄' })
  }

  const testAPI = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
      const response = await fetch(`${baseUrl}/customer-visits/test`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      })
      
      const data = await response.json()
      console.log('API Test Response:', data)
      
      if (response.ok) {
        toast.success('API connection successful!')
      } else {
        toast.error(`API Error: ${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('API Test Error:', error)
      toast.error('API connection failed - check server')
    }
  }

  // Handle errors
  useEffect(() => {
    if (visitsError) {
      console.error('Customer visits error:', visitsError)
      console.error('Error details:', {
        status: 'status' in visitsError ? visitsError.status : undefined,
        data: 'data' in visitsError ? visitsError.data : undefined,
        message: 'message' in visitsError ? visitsError.message : undefined,
        error: 'error' in visitsError ? visitsError.error : undefined
      })
      // Only set hasError if there's actually an error and no data
      if (visits.length === 0) {
        setHasError(true)
        toast.error('Unable to load customer visits. Showing sample data.')
      }
    } else {
      setHasError(false)
    }
  }, [visitsError, visits?.length])

  useEffect(() => {
    if (statsError) {
      console.error('Stats error:', statsError)
      console.error('Stats error details:', {
        status: (statsError as any)?.status,
        data: (statsError as any)?.data,
        message: (statsError as any)?.message,
        error: (statsError as any)?.error
      })
      // Only show error toast if there's no stats data
      if (!statsData) {
        toast.error('Unable to load statistics. Showing sample data.')
      }
    }
  }, [statsError, statsData])

  // Show notification when using mock data
  useEffect(() => {
    if (visitsError && visits.length === 0 && displayVisits.length > 0) {
      toast('Showing sample data. Please check your server connection.', { icon: '⚠️' })
    }
  }, [visitsError, visits?.length, displayVisits?.length])

  // Debug logging
  useEffect(() => {
    console.log('Hospitality page debug:', {
      isLoadingVisits,
      visitsError: visitsError ? {
        status: (visitsError as any)?.status,
        data: (visitsError as any)?.data,
        message: (visitsError as any)?.message
      } : null,
      visits: visits?.length,
      displayVisits: displayVisits?.length,
      totalVisits,
      hasError,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    })
  }, [isLoadingVisits, visitsError, visits?.length, displayVisits?.length, totalVisits, hasError])

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                  Hospitality Management
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage customer visit expenses, hotel bookings, food expenses, and gifts tracking
                </p>
                {(hasError || visitsError) && (
                  <div className="mt-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full inline-block">
                    ⚠️ Showing sample data - Server connection issue
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={testAPI}
                  variant="outline"
                  className="flex items-center text-xs"
                >
                  🔧 Test API
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="flex items-center"
                  disabled={isLoadingVisits}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingVisits ? 'animate-spin' : ''}`} />
                  {isLoadingVisits ? 'Loading...' : 'Refresh'}
                </Button>
                <Button
                  onClick={handleImport}
                  variant="outline"
                  className="flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer Visit
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <HospitalityStats
            stats={displayStats}
            isLoading={isLoadingStats && !hasError && !statsError}
          />
        </div>

        {/* Expense Tracking Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <ExpenseTracking
            visits={displayVisits as any}
            isLoading={isLoadingVisits && !hasError && !visitsError}
            onExport={handleExport}
          />
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by party name, contact person, or purpose..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <HospitalityFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={() => {
                    setFilters({
                      purpose: '',
                      travelType: '',
                      approvalStatus: '',
                      dateFrom: '',
                      dateTo: ''
                    })
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Customer Visits List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <CustomerVisitList
            visits={displayVisits as any}
            isLoading={isLoadingVisits && !hasError && !visitsError}
            page={currentPage}
            totalPages={totalPages || 1}
            totalVisits={totalVisits || displayVisits.length}
            onPageChange={setCurrentPage}
            onRefresh={handleRetry}
          />
        </div>

        {/* Create Customer Visit Modal */}
        {isCreateModalOpen && (
          <CustomerVisitFormModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </AppLayout>
  )
}