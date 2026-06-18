'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetHazerSilicateCuringQuery,
  useCreateHazerSilicateCuringMutation,
  useUpdateHazerSilicateCuringOutputMutation,
  HazerSilicateCuring
} from '@/lib/api/productionModulesApi'
import { Plus, Clock, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { useGetLotDetailsQuery, useGetAvailableInputMeterQuery } from '@/lib/api/productionModulesApi'

export default function HazerSilicateCuringPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showOutputModal, setShowOutputModal] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<HazerSilicateCuring | null>(null)
  const [formData, setFormData] = useState({
    lotNumber: '',
    partyName: '',
    customerId: '',
    quality: '',
    inputMeter: 0,
    printingId: '',
    processType: 'hazer' as 'hazer' | 'silicate' | 'curing',
    chemicalUsed: '',
    temperature: 0,
    time: 0,
    operatorName: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [outputData, setOutputData] = useState({
    processedMeter: 0,
    lossMeter: 0
  })

  // Search, Filter, Sort, and Pagination states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [processTypeFilter, setProcessTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, refetch } = useGetHazerSilicateCuringQuery({})
  const [createProcess] = useCreateHazerSilicateCuringMutation()
  const [updateOutput] = useUpdateHazerSilicateCuringOutputMutation()

  // Auto-fill from lot number
  const { data: lotDetailsData, refetch: refetchLotDetails } = useGetLotDetailsQuery(
    formData.lotNumber,
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )
  const { data: availableMeterData } = useGetAvailableInputMeterQuery(
    { lotNumber: formData.lotNumber, targetModule: 'hazer' },
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )

  const processes = data?.data || []

  // Filtered, sorted, and paginated data
  const filteredAndSortedProcesses = useMemo(() => {
    let filtered = processes.filter((process) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        process.lotNumber.toLowerCase().includes(searchLower) ||
        process.partyName.toLowerCase().includes(searchLower) ||
        process.quality.toLowerCase().includes(searchLower) ||
        process.operatorName?.toLowerCase().includes(searchLower) ||
        process.chemicalUsed?.toLowerCase().includes(searchLower) ||
        process.inputMeter?.toString().includes(searchLower) ||
        process.processedMeter?.toString().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'all' || process.status === statusFilter

      // Process type filter
      const matchesProcessType = processTypeFilter === 'all' || process.processType === processTypeFilter

      return matchesSearch && matchesStatus && matchesProcessType
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'lotNumber':
          aValue = a.lotNumber
          bValue = b.lotNumber
          break
        case 'partyName':
          aValue = a.partyName
          bValue = b.partyName
          break
        case 'quality':
          aValue = a.quality
          bValue = b.quality
          break
        case 'processType':
          aValue = a.processType
          bValue = b.processType
          break
        case 'inputMeter':
          aValue = a.inputMeter || 0
          bValue = b.inputMeter || 0
          break
        case 'processedMeter':
          aValue = a.processedMeter || 0
          bValue = b.processedMeter || 0
          break
        case 'lossMeter':
          aValue = a.lossMeter || 0
          bValue = b.lossMeter || 0
          break
        case 'pendingMeter':
          aValue = a.pendingMeter || 0
          bValue = b.pendingMeter || 0
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'operatorName':
          aValue = a.operatorName || ''
          bValue = b.operatorName || ''
          break
        default: // date
          aValue = new Date(a.date || 0)
          bValue = new Date(b.date || 0)
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    return filtered
  }, [processes, searchQuery, statusFilter, processTypeFilter, sortBy, sortOrder])

  // Pagination
  const totalItems = filteredAndSortedProcesses.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProcesses = filteredAndSortedProcesses.slice(startIndex, endIndex)

  // Get unique values for filters
  const uniqueStatuses = [...new Set(processes.map(p => p.status).filter(Boolean))] as string[]
  const uniqueProcessTypes = [...new Set(processes.map(p => p.processType).filter(Boolean))] as string[]

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setProcessTypeFilter('all')
    setSortBy('date')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const handleQuickComplete = async (process: HazerSilicateCuring) => {
    if (process.status === 'completed') {
      toast.error('Process is already completed')
      return
    }
    
    try {
      await updateOutput({
        id: process._id!,
        data: { 
          processedMeter: process.inputMeter,
          lossMeter: 0
        }
      }).unwrap()
      toast.success('Process marked as completed')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete process')
    }
  }

  // Auto-fill party name, quality, and customerId when lot number changes
  useEffect(() => {
    if (lotDetailsData?.data?.lotDetails && formData.lotNumber) {
      const lotDetails = lotDetailsData.data.lotDetails
      setFormData(prev => ({
        ...prev,
        partyName: lotDetails.partyName || prev.partyName,
        customerId: lotDetails.customerId || prev.customerId,
        quality: lotDetails.quality || prev.quality
      }))
    }
  }, [lotDetailsData, formData.lotNumber])

  // Auto-fill input meter from Printing module
  useEffect(() => {
    if (availableMeterData?.data?.availableMeter && availableMeterData.data.availableMeter > 0) {
      setFormData(prev => ({
        ...prev,
        inputMeter: availableMeterData.data.availableMeter
      }))
    }
  }, [availableMeterData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProcess(formData).unwrap()
      toast.success('Process entry created successfully')
      setShowCreateModal(false)
      resetForm()
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create process entry')
    }
  }

  const handleUpdateOutput = async () => {
    if (!selectedProcess) return
    if (outputData.processedMeter + outputData.lossMeter > selectedProcess.inputMeter) {
      toast.error('Processed + Loss meter cannot exceed input meter')
      return
    }
    try {
      await updateOutput({
        id: selectedProcess._id!,
        data: outputData
      }).unwrap()
      toast.success('Process output updated successfully')
      setShowOutputModal(false)
      setSelectedProcess(null)
      setOutputData({ processedMeter: 0, lossMeter: 0 })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update process output')
    }
  }

  const resetForm = () => {
    setFormData({
      lotNumber: '',
      partyName: '',
      customerId: '',
      quality: '',
      inputMeter: 0,
      printingId: '',
      processType: 'hazer',
      chemicalUsed: '',
      temperature: 0,
      time: 0,
      operatorName: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Hazer / Silicate / Curing</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage chemical fixation, curing & coating processes ({totalItems} total, {paginatedProcesses.length} showing)
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Process Entry
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {processes.length}
              </div>
              <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400">Total Processes</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-gray-600 dark:text-gray-400">
                {processes.filter(p => p.status === 'pending').length}
              </div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {processes.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-xs md:text-sm text-orange-600 dark:text-orange-400">In Progress</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                {processes.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-xs md:text-sm text-green-600 dark:text-green-400">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {processes.reduce((sum, p) => sum + (p.inputMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400">Total Input</div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-teal-600 dark:text-teal-400">
                {processes.reduce((sum, p) => sum + (p.processedMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-teal-600 dark:text-teal-400">Processed Meters</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                {processes.reduce((sum, p) => sum + (p.lossMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-red-600 dark:text-red-400">Loss Meters</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by lot number, party name, quality, operator..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(statusFilter !== 'all' || processTypeFilter !== 'all') && (
                    <Badge variant="secondary" className="ml-2">
                      {[statusFilter !== 'all' ? 1 : 0, processTypeFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>

                {/* Items per page */}
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={(value) => {
                      setStatusFilter(value)
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Process Type</Label>
                    <Select value={processTypeFilter} onValueChange={(value) => {
                      setProcessTypeFilter(value)
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueProcessTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Sort By</Label>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={(value) => {
                        setSortBy(value)
                        setCurrentPage(1)
                      }}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="lotNumber">Lot Number</SelectItem>
                          <SelectItem value="partyName">Party Name</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="processType">Process Type</SelectItem>
                          <SelectItem value="inputMeter">Input Meter</SelectItem>
                          <SelectItem value="processedMeter">Processed Meter</SelectItem>
                          <SelectItem value="lossMeter">Loss Meter</SelectItem>
                          <SelectItem value="pendingMeter">Pending Meter</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="operatorName">Operator</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSort(sortBy)}
                        className="px-3 shrink-0"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Process Entries */}
        <Card>
          <CardHeader>
            <CardTitle>All Process Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <>
                {/* Results */}
                <div className="space-y-4">
                  {paginatedProcesses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        {filteredAndSortedProcesses.length === 0 
                          ? "No process entries found matching your criteria."
                          : "No results on this page."
                        }
                      </p>
                      {(searchQuery || statusFilter !== 'all' || processTypeFilter !== 'all') && (
                        <Button variant="outline" onClick={resetFilters} className="mt-4">
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    paginatedProcesses.map((process) => (
                      <div key={process._id} className="border rounded-lg p-3 md:p-4">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="font-semibold text-sm md:text-base truncate">
                                {process.partyName} - Lot: {process.lotNumber}
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {process.status === 'in_progress' && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    In Progress
                                  </Badge>
                                )}
                                {process.status === 'pending' && (
                                  <Badge variant="outline" className="text-gray-600 border-gray-300 text-xs">
                                    Pending
                                  </Badge>
                                )}
                                {process.status === 'completed' && (
                                  <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground mt-1">
                              Type: {process.processType} | Quality: {process.quality}
                            </div>
                            {process.operatorName && (
                              <div className="text-xs md:text-sm text-muted-foreground">
                                Operator: {process.operatorName}
                              </div>
                            )}
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
                              <div>
                                <span className="text-muted-foreground">Input:</span> {process.inputMeter}m
                              </div>
                              <div>
                                <span className="text-muted-foreground">Processed:</span> {process.processedMeter || 0}m
                              </div>
                              <div>
                                <span className="text-muted-foreground">Loss:</span> {process.lossMeter || 0}m
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pending:</span> {process.pendingMeter || 0}m
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap lg:flex-nowrap lg:flex-col xl:flex-row">
                            {process.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickComplete(process)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs flex-1 lg:flex-none"
                                title="Quick Complete"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Complete</span>
                              </Button>
                            )}
                            {(process.pendingMeter || 0) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedProcess(process)
                                  setOutputData({
                                    processedMeter: process.processedMeter || 0,
                                    lossMeter: process.lossMeter || 0
                                  })
                                  setShowOutputModal(true)
                                }}
                                className="text-xs flex-1 lg:flex-none"
                              >
                                Update Output
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                      </div>
                      
                      <div className="flex items-center gap-2 order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="text-xs"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="w-8 h-8 p-0 text-xs"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="text-xs"
                        >
                          <span className="hidden sm:inline mr-1">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Process Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Lot Number *</Label>
                  <Input
                    value={formData.lotNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, lotNumber: e.target.value })
                      if (e.target.value.length >= 3) {
                        refetchLotDetails()
                      }
                    }}
                    placeholder="Enter lot number to auto-fill details"
                    required
                  />
                  {lotDetailsData?.data?.lotDetails && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Auto-filled from {lotDetailsData.data.lotDetails.sourceModule}
                    </p>
                  )}
                </div>
                <CustomerSearchInput
                  value={formData.partyName}
                  customerId={formData.customerId}
                  onChange={(partyName, customerId) => {
                    setFormData({ ...formData, partyName, customerId })
                  }}
                  label="Party Name"
                  required
                />
                <div>
                  <Label>Quality *</Label>
                  <Input
                    value={formData.quality}
                    onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Input Meter *</Label>
                  <Input
                    type="number"
                    value={formData.inputMeter}
                    onChange={(e) => setFormData({ ...formData, inputMeter: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Process Type *</Label>
                  <Select
                    value={formData.processType}
                    onValueChange={(value: 'hazer' | 'silicate' | 'curing') => 
                      setFormData({ ...formData, processType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hazer">Hazer</SelectItem>
                      <SelectItem value="silicate">Silicate</SelectItem>
                      <SelectItem value="curing">Curing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Chemical Used</Label>
                  <Input
                    value={formData.chemicalUsed}
                    onChange={(e) => setFormData({ ...formData, chemicalUsed: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Time (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Operator Name</Label>
                  <Input
                    value={formData.operatorName}
                    onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update Output Modal */}
        <Dialog open={showOutputModal} onOpenChange={setShowOutputModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Process Output</DialogTitle>
            </DialogHeader>
            {selectedProcess && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total Input: {selectedProcess.inputMeter}m
                </div>
                <div>
                  <Label>Processed Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.processedMeter}
                    onChange={(e) => setOutputData({ ...outputData, processedMeter: Number(e.target.value) })}
                    max={selectedProcess.inputMeter}
                    required
                  />
                </div>
                <div>
                  <Label>Loss Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.lossMeter}
                    onChange={(e) => setOutputData({ ...outputData, lossMeter: Number(e.target.value) })}
                    max={selectedProcess.inputMeter - outputData.processedMeter}
                    required
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Pending: {selectedProcess.inputMeter - outputData.processedMeter - outputData.lossMeter}m
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowOutputModal(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateOutput} className="w-full sm:w-auto">Update</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}


