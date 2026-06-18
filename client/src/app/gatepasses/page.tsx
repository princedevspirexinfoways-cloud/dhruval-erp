'use client'

import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/lib/store'
import { 
  useGetAllGatePassesQuery,
  useGetGatePassStatsQuery,
  useCreateGatePassMutation,
  useUpdateGatePassMutation,
  useDeleteGatePassMutation,
  useCompleteGatePassMutation,
  useCancelGatePassMutation,
  usePrintGatePassMutation,
  GatePass
} from '@/lib/features/gatepasses/gatepassesApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Car, 
  Clock, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Printer,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { generateGatePassPDF, generateBulkGatePassPDF, GatePassPDFData } from '@/utils/gatePassPDFSimple'
import GatePassFormModal from '@/components/gatepasses/modals/GatePassFormModal'
import AdvancedFilters from '@/components/gatepasses/AdvancedFilters'
import GatePassStats from '@/components/gatepasses/GatePassStats'
import GatePassTable from '@/components/gatepasses/GatePassTable'
import { toast } from 'react-hot-toast'
import { selectTheme, toggleTheme } from '@/lib/features/ui/uiSlice'

export default function GatePassesPage() {
  const theme = useSelector(selectTheme)
  const dispatch = useDispatch()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [purposeFilter, setPurposeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedGatePass, setSelectedGatePass] = useState<GatePass | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedGatePasses, setSelectedGatePasses] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const currentUser = useSelector((state: RootState) => (state as any).auth?.user)
  const currentCompany = currentUser?.companyAccess?.[0]?.companyId

  // API calls
  const { data: gatePassesResponse, isLoading, refetch, error } = useGetAllGatePassesQuery({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    purpose: purposeFilter !== 'all' ? purposeFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Debug API response
  console.log('GatePassesPage: API Response:', {
    gatePassesResponse,
    isLoading,
    error,
    currentPage,
    searchTerm,
    statusFilter,
    purposeFilter
  })

  const { data: statsResponse } = useGetGatePassStatsQuery({
    companyId: currentCompany
  })

  const [createGatePass, { isLoading: isCreating }] = useCreateGatePassMutation()
  const [updateGatePass, { isLoading: isUpdating }] = useUpdateGatePassMutation()
  const [deleteGatePass, { isLoading: isDeleting }] = useDeleteGatePassMutation()
  const [completeGatePass, { isLoading: isCompleting }] = useCompleteGatePassMutation()
  const [cancelGatePass, { isLoading: isCancelling }] = useCancelGatePassMutation()
  const [printGatePass, { isLoading: isPrinting }] = usePrintGatePassMutation()

  const gatePasses = gatePassesResponse?.data || []
  const totalPages = gatePassesResponse?.totalPages || 1
  const totalGatePasses = gatePassesResponse?.total || gatePasses.length

  // Theme toggle handler
  const handleThemeToggle = () => {
    dispatch(toggleTheme())
    toast.success(`${theme === 'light' ? 'Dark' : 'Light'} theme enabled`)
  }

  // Enhanced pagination handlers
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFirstPage = () => {
    if (totalPages > 0) {
      setCurrentPage(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleLastPage = () => {
    if (totalPages > 0) {
      setCurrentPage(totalPages)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Debug logging
  console.log('GatePasses Response:', gatePassesResponse)
  console.log('GatePasses Data:', gatePasses)
  console.log('GatePasses Length:', gatePasses.length)
  const stats = statsResponse || {
    totalGatePasses: 0,
    activeGatePasses: 0,
    completedGatePasses: 0,
    expiredGatePasses: 0,
    cancelledGatePasses: 0,
    averageDuration: 0,
    todayGatePasses: 0,
    purposeBreakdown: {
      delivery: 0,
      pickup: 0,
      maintenance: 0,
      other: 0
    }
  }

  const handleCreateGatePass = () => {
    setSelectedGatePass(null)
    setIsFormModalOpen(true)
  }

  const handleEditGatePass = (gatePass: GatePass) => {
    setSelectedGatePass(gatePass)
    setIsFormModalOpen(true)
  }

  const handleViewGatePass = (gatePass: GatePass) => {
    setSelectedGatePass(gatePass)
    setIsViewModalOpen(true)
  }

  const handleDeleteGatePass = async (gatePassId: string) => {
    if (window.confirm('Are you sure you want to delete this gate pass?')) {
      try {
        await deleteGatePass(gatePassId).unwrap()
        toast.success('Gate pass deleted successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to delete gate pass')
      }
    }
  }

  const handleCompleteGatePass = async (gatePassId: string) => {
    try {
      await completeGatePass(gatePassId).unwrap()
      toast.success('Gate pass completed successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to complete gate pass')
    }
  }

  const handleCancelGatePass = async (gatePassId: string) => {
    if (window.confirm('Are you sure you want to cancel this gate pass?')) {
      try {
        await cancelGatePass(gatePassId).unwrap()
        toast.success('Gate pass cancelled successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to cancel gate pass')
      }
    }
  }

  const handlePrintGatePass = async (gatePassId: string) => {
    try {
      // First call the API to mark as printed
      await printGatePass(gatePassId).unwrap()
      
      // Find the gate pass data for PDF generation
      const gatePass = gatePasses.find(gp => gp._id === gatePassId)
      if (gatePass) {
        // Generate and download PDF
        generateGatePassPDF(gatePass as GatePassPDFData, 'Dhruval Exim Pvt. Ltd.')
        toast.success('Gate pass printed and PDF downloaded successfully')
      } else {
        toast.success('Gate pass printed successfully')
      }
      
      refetch()
    } catch (error) {
      toast.error('Failed to print gate pass')
    }
  }

  const handleSelectGatePass = (gatePassId: string) => {
    setSelectedGatePasses(prev => 
      prev.includes(gatePassId) 
        ? prev.filter(id => id !== gatePassId)
        : [...prev, gatePassId]
    )
  }

  const handleSelectAllGatePasses = () => {
    if (selectedGatePasses.length === gatePasses.length) {
      setSelectedGatePasses([])
    } else {
      setSelectedGatePasses(gatePasses.map(gp => gp._id))
    }
  }

  const handleBulkComplete = async () => {
    if (selectedGatePasses.length === 0) return
    
    try {
      await Promise.all(selectedGatePasses.map(id => completeGatePass(id).unwrap()))
      toast.success(`${selectedGatePasses.length} gate passes completed successfully`)
      setSelectedGatePasses([])
      refetch()
    } catch (error) {
      toast.error('Failed to complete some gate passes')
    }
  }

  const handleBulkCancel = async () => {
    if (selectedGatePasses.length === 0) return
    
    if (window.confirm(`Are you sure you want to cancel ${selectedGatePasses.length} gate passes?`)) {
      try {
        await Promise.all(selectedGatePasses.map(id => cancelGatePass(id).unwrap()))
        toast.success(`${selectedGatePasses.length} gate passes cancelled successfully`)
        setSelectedGatePasses([])
        refetch()
      } catch (error) {
        toast.error('Failed to cancel some gate passes')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedGatePasses.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedGatePasses.length} gate passes?`)) {
      try {
        await Promise.all(selectedGatePasses.map(id => deleteGatePass(id).unwrap()))
        toast.success(`${selectedGatePasses.length} gate passes deleted successfully`)
        setSelectedGatePasses([])
        refetch()
      } catch (error) {
        toast.error('Failed to delete some gate passes')
      }
    }
  }

  const handleBulkPrint = async (gatePassIds?: string[]) => {
    const idsToPrint = gatePassIds || selectedGatePasses
    if (idsToPrint.length === 0) return
    
    try {
      // First call the API to mark as printed
      await Promise.all(idsToPrint.map(id => printGatePass(id).unwrap()))
      
      // Find the gate pass data for PDF generation
      const gatePassesToPrint = gatePasses.filter(gp => idsToPrint.includes(gp._id))
      if (gatePassesToPrint.length > 0) {
        // Generate and download PDF
        generateBulkGatePassPDF(gatePassesToPrint as GatePassPDFData[], 'Dhruval Exim Pvt. Ltd.')
        toast.success(`${idsToPrint.length} gate passes printed and PDF downloaded successfully`)
      } else {
        toast.success(`${idsToPrint.length} gate passes printed successfully`)
      }
      
      if (!gatePassIds) {
        setSelectedGatePasses([])
      }
      refetch()
    } catch (error) {
      toast.error('Failed to print some gate passes')
    }
  }

  const handlePrintAll = async () => {
    if (gatePasses.length === 0) {
      toast.error('No gate passes to print')
      return
    }
    if (window.confirm(`Print all ${gatePasses.length} gate passes?`)) {
      await handleBulkPrint(gatePasses.map(gp => gp._id))
    }
  }

  const handleFormSuccess = () => {
    setIsFormModalOpen(false)
    setSelectedGatePass(null)
    refetch()
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPurposeFilter('all')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    refetch()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPurposeBadge = (purpose: string) => {
    const purposeConfig = {
      delivery: { color: 'bg-blue-100 text-blue-800' },
      pickup: { color: 'bg-green-100 text-green-800' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800' },
      other: { color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = purposeConfig[purpose as keyof typeof purposeConfig] || purposeConfig.other
    
    return (
      <Badge className={config.color}>
        {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
      </Badge>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Gate Passes</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage vehicle gate passes and access control</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedGatePasses.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {selectedGatePasses.length} selected
                </span>
                <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkComplete}
                  disabled={isCompleting}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                >
                  Complete All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCancel}
                  disabled={isCancelling}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                >
                  Cancel All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPrint()}
                  disabled={isPrinting}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border-blue-300 dark:border-blue-600 text-xs sm:text-sm"
                >
                    <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Print Selected</span>
                    <span className="sm:hidden">Print</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 dark:border-red-600 text-xs sm:text-sm"
                >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Delete Selected</span>
                    <span className="sm:hidden">Delete</span>
                </Button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
            <Button
                onClick={handleThemeToggle}
              variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 p-2"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
              onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1 sm:gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
            </Button>
              
            <Button
              variant="outline"
                size="sm"
              onClick={handlePrintAll}
                className="flex items-center gap-1 sm:gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isPrinting || gatePasses.length === 0}
            >
              <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print All</span>
            </Button>
              
            <Button
              variant="outline"
                size="sm"
              onClick={() => {
                if (gatePasses.length === 0) {
                  toast.error('No gate passes to download')
                  return
                }
                try {
                  generateBulkGatePassPDF(gatePasses as GatePassPDFData[], 'Dhruval Exim Pvt. Ltd.')
                  toast.success('PDF downloaded successfully')
                } catch (error) {
                  console.error('Error generating PDF:', error)
                  toast.error('Failed to generate PDF')
                }
              }}
                className="flex items-center gap-1 sm:gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={gatePasses.length === 0}
            >
              <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
            </Button>
              
              <Button 
                onClick={handleCreateGatePass} 
                className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
              >
              <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Gate Pass</span>
                <span className="sm:hidden">Create</span>
            </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <GatePassStats stats={stats} isLoading={!statsResponse} />

        {/* Advanced Filters */}
        <AdvancedFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          purposeFilter={purposeFilter}
          setPurposeFilter={setPurposeFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Gate Passes Table */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-gray-50 dark:bg-gray-700">
            <CardTitle className="text-gray-900 dark:text-gray-100">Gate Passes</CardTitle>
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm mt-2">
                Error loading gate passes: {
                  'message' in error 
                    ? error.message 
                    : 'status' in error 
                      ? `HTTP ${error.status}` 
                      : 'Unknown error'
                }
              </div>
            )}
          </CardHeader>
          <CardContent className="bg-white dark:bg-gray-800">
            <GatePassTable
              gatePasses={gatePasses}
              selectedGatePasses={selectedGatePasses}
              onSelectGatePass={handleSelectGatePass}
              onSelectAll={handleSelectAllGatePasses}
              onView={handleViewGatePass}
              onEdit={handleEditGatePass}
              onDelete={handleDeleteGatePass}
              onComplete={handleCompleteGatePass}
              onCancel={handleCancelGatePass}
              onPrint={handlePrintGatePass}
              isLoading={isLoading}
              isCompleting={isCompleting}
              isCancelling={isCancelling}
              isDeleting={isDeleting}
              isPrinting={isPrinting}
            />
          </CardContent>
        </Card>

        {/* Enhanced Pagination Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex flex-col space-y-4">
            {/* Mobile: Stack everything vertically */}
            <div className="flex flex-col sm:hidden space-y-3">
              {/* Page Size Selector */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              {/* Pagination Info */}
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalGatePasses)} of ${totalGatePasses} gate passes`
                )}
              </div>

              {/* Mobile Pagination Controls */}
        {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
            <Button
                    onClick={handleFirstPage}
                    disabled={currentPage === 1 || isLoading}
              variant="outline"
                    size="sm"
                    className="p-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="First page"
            >
                    <ChevronsLeft className="w-4 h-4" />
            </Button>

                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    size="sm"
                    className="p-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                    {currentPage} / {totalPages}
            </span>

            <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isLoading}
              variant="outline"
                    size="sm"
                    className="p-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={handleLastPage}
                    disabled={currentPage === totalPages || isLoading}
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

            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              {/* Pagination Info */}
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalGatePasses)} of ${totalGatePasses} gate passes`
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  {/* First Page */}
                  <Button
                    onClick={handleFirstPage}
                    disabled={currentPage === 1 || isLoading}
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
                    disabled={currentPage === 1 || isLoading}
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
                    disabled={currentPage === totalPages || isLoading}
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
                    disabled={currentPage === totalPages || isLoading}
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
        </div>
      </div>

      {/* Form Modal */}
      <GatePassFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        gatePass={selectedGatePass || undefined}
      />

      {/* View Modal - You can create this component if needed */}
      {isViewModalOpen && selectedGatePass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Gate Pass Details</h2>
              <Button
                variant="ghost"
                onClick={() => setIsViewModalOpen(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Gate Pass Number</label>
                  <p className="text-lg font-semibold">{selectedGatePass.gatePassNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedGatePass.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Vehicle Number</label>
                  <p className="text-lg">{selectedGatePass.vehicleNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Purpose</label>
                  <div className="mt-1">{getPurposeBadge(selectedGatePass.purpose)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Driver Name</label>
                  <p className="text-lg">{selectedGatePass.driverName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Driver Phone</label>
                  <p className="text-lg">{selectedGatePass.driverPhone}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Reason</label>
                <p className="text-lg">{selectedGatePass.reason}</p>
              </div>
              
              {selectedGatePass.personToMeet && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Person to Meet</label>
                  <p className="text-lg">{selectedGatePass.personToMeet}</p>
                </div>
              )}
              
              {selectedGatePass.department && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-lg">{selectedGatePass.department}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Time In</label>
                  <p className="text-lg">{new Date(selectedGatePass.timeIn).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Time Out</label>
                  <p className="text-lg">
                    {selectedGatePass.timeOut ? new Date(selectedGatePass.timeOut).toLocaleString() : 'Not yet'}
                  </p>
                </div>
              </div>
              
              {selectedGatePass.items && selectedGatePass.items.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Items</label>
                  <div className="mt-2 space-y-2">
                    {selectedGatePass.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{item.description}</span>
                        <span className="font-medium">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Export Gate Passes</h2>
              <Button
                variant="ghost"
                onClick={() => setIsExportModalOpen(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Export Format</label>
                <Select defaultValue="pdf">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="pdf" className="bg-white hover:bg-gray-50">PDF</SelectItem>
                    <SelectItem value="excel" className="bg-white hover:bg-gray-50">Excel</SelectItem>
                    <SelectItem value="csv" className="bg-white hover:bg-gray-50">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Date Range</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input type="date" placeholder="From" />
                  <Input type="date" placeholder="To" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Status Filter</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="all" className="bg-white hover:bg-gray-50">All Status</SelectItem>
                    <SelectItem value="active" className="bg-white hover:bg-gray-50">Active</SelectItem>
                    <SelectItem value="completed" className="bg-white hover:bg-gray-50">Completed</SelectItem>
                    <SelectItem value="expired" className="bg-white hover:bg-gray-50">Expired</SelectItem>
                    <SelectItem value="cancelled" className="bg-white hover:bg-gray-50">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsExportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success('Export started. You will receive an email when ready.')
                    setIsExportModalOpen(false)
                  }}
                >
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
