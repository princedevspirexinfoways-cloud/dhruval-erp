'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import {
  useGetPrintingsQuery,
  useGetPrintingWIPQuery,
  useCreatePrintingMutation,
  useUpdatePrintingMutation,
  useUpdatePrintingOutputMutation,
  Printing
} from '@/lib/api/productionModulesApi'
import { Plus, Edit, Printer, CheckCircle, XCircle, Clock, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { useGetLotDetailsQuery, useGetAvailableInputMeterQuery } from '@/lib/api/productionModulesApi'

export default function PrintingPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showOutputModal, setShowOutputModal] = useState(false)
  const [selectedPrinting, setSelectedPrinting] = useState<Printing | null>(null)
  const [formData, setFormData] = useState({
    partyName: '',
    customerId: '',
    orderNumber: '',
    lotNumber: '',
    designNumber: '',
    quality: '',
    totalMeterReceived: 0,
    source: 'after_bleaching' as 'after_bleaching' | 'batch_center',
    sourceId: '',
    screenNo: '',
    designScreen: '',
    printingType: 'reactive' as 'reactive' | 'pigment' | 'digital' | 'kitenge',
    operatorName: '',
    machineName: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    instructions: ''
  })
  const [outputData, setOutputData] = useState({
    printedMeter: 0,
    rejectedMeter: 0
  })

  // Search, Filter, Sort, and Pagination states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [printingTypeFilter, setPrintingTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, refetch } = useGetPrintingsQuery({})
  const { data: wipData } = useGetPrintingWIPQuery()
  const [createPrinting] = useCreatePrintingMutation()
  const [updatePrinting] = useUpdatePrintingMutation()
  const [updateOutput] = useUpdatePrintingOutputMutation()

  // Auto-fill from lot number
  const { data: lotDetailsData, refetch: refetchLotDetails } = useGetLotDetailsQuery(
    formData.lotNumber,
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )
  const { data: availableMeterData } = useGetAvailableInputMeterQuery(
    { lotNumber: formData.lotNumber, targetModule: 'printing' },
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )

  const printings = data?.data || []
  const wip = wipData?.data || []

  // Filtered, sorted, and paginated data
  const filteredAndSortedPrintings = useMemo(() => {
    let filtered = printings.filter((printing) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        printing.lotNumber.toLowerCase().includes(searchLower) ||
        printing.partyName.toLowerCase().includes(searchLower) ||
        printing.designNumber.toLowerCase().includes(searchLower) ||
        printing.quality.toLowerCase().includes(searchLower) ||
        printing.orderNumber?.toLowerCase().includes(searchLower) ||
        printing.operatorName?.toLowerCase().includes(searchLower) ||
        printing.machineName?.toLowerCase().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'all' || printing.status === statusFilter

      // Printing type filter
      const matchesPrintingType = printingTypeFilter === 'all' || printing.printingType === printingTypeFilter

      return matchesSearch && matchesStatus && matchesPrintingType
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
        case 'designNumber':
          aValue = a.designNumber
          bValue = b.designNumber
          break
        case 'quality':
          aValue = a.quality
          bValue = b.quality
          break
        case 'totalMeterReceived':
          aValue = a.totalMeterReceived || 0
          bValue = b.totalMeterReceived || 0
          break
        case 'printedMeter':
          aValue = a.printedMeter || 0
          bValue = b.printedMeter || 0
          break
        case 'rejectedMeter':
          aValue = a.rejectedMeter || 0
          bValue = b.rejectedMeter || 0
          break
        case 'pendingMeter':
          aValue = a.pendingMeter || 0
          bValue = b.pendingMeter || 0
          break
        case 'printingType':
          aValue = a.printingType
          bValue = b.printingType
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
  }, [printings, searchQuery, statusFilter, printingTypeFilter, sortBy, sortOrder])

  // Pagination
  const totalItems = filteredAndSortedPrintings.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPrintings = filteredAndSortedPrintings.slice(startIndex, endIndex)

  // Get unique values for filters
  const uniqueStatuses = [...new Set(printings.map(p => p.status).filter(Boolean))] as string[]
  const uniquePrintingTypes = [...new Set(printings.map(p => p.printingType).filter(Boolean))] as string[]

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
    setPrintingTypeFilter('all')
    setSortBy('date')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const handleQuickComplete = async (printing: Printing) => {
    if (printing.status === 'completed') {
      toast.error('Printing is already completed')
      return
    }
    
    try {
      await updateOutput({
        id: printing._id!,
        data: { 
          printedMeter: printing.totalMeterReceived,
          rejectedMeter: 0
        }
      }).unwrap()
      toast.success('Printing marked as completed')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete printing')
    }
  }

  // Auto-fill party name, quality, and customerId when lot number changes
  useEffect(() => {
    if (lotDetailsData?.data?.lotDetails && formData.lotNumber) {
      const lotDetails = lotDetailsData.data.lotDetails
      setFormData(prev => ({
        ...prev,
        partyName: lotDetails.partyName || prev.partyName,
        customerId: lotDetails.customerId || prev.customerId || '', // Keep customerId from lot
        quality: lotDetails.quality || prev.quality
      }))
    }
  }, [lotDetailsData, formData.lotNumber])

  // Auto-fill input meter from previous module
  useEffect(() => {
    if (availableMeterData?.data?.availableMeter && availableMeterData.data.availableMeter > 0) {
      setFormData(prev => ({
        ...prev,
        totalMeterReceived: availableMeterData.data.availableMeter
      }))
    }
  }, [availableMeterData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Clean up empty strings - convert to undefined for optional fields
      // IMPORTANT: Keep customerId if it exists (from lot auto-fill or manual selection)
      const cleanedData = {
        ...formData,
        customerId: formData.customerId && formData.customerId.trim() !== '' ? formData.customerId.trim() : undefined,
        sourceId: formData.sourceId && formData.sourceId.trim() !== '' ? formData.sourceId.trim() : undefined,
        orderNumber: formData.orderNumber && formData.orderNumber.trim() !== '' ? formData.orderNumber : undefined,
        screenNo: formData.screenNo && formData.screenNo.trim() !== '' ? formData.screenNo : undefined,
        designScreen: formData.designScreen && formData.designScreen.trim() !== '' ? formData.designScreen : undefined,
        operatorName: formData.operatorName && formData.operatorName.trim() !== '' ? formData.operatorName : undefined,
        machineName: formData.machineName && formData.machineName.trim() !== '' ? formData.machineName : undefined,
        remarks: formData.remarks && formData.remarks.trim() !== '' ? formData.remarks : undefined,
        instructions: formData.instructions && formData.instructions.trim() !== '' ? formData.instructions : undefined
      }

      await createPrinting(cleanedData).unwrap()
      toast.success('Printing entry created successfully')
      setShowCreateModal(false)
      resetForm()
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create printing entry')
    }
  }

  const handleUpdateOutput = async () => {
    if (!selectedPrinting) return
    if (outputData.printedMeter + outputData.rejectedMeter > selectedPrinting.totalMeterReceived) {
      toast.error('Printed + Rejected meter cannot exceed received meter')
      return
    }
    try {
      await updateOutput({
        id: selectedPrinting._id!,
        data: outputData
      }).unwrap()
      toast.success('Printing output updated successfully')
      setShowOutputModal(false)
      setSelectedPrinting(null)
      setOutputData({ printedMeter: 0, rejectedMeter: 0 })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update printing output')
    }
  }

  const resetForm = () => {
    setFormData({
      partyName: '',
      customerId: '',
      orderNumber: '',
      lotNumber: '',
      designNumber: '',
      quality: '',
      totalMeterReceived: 0,
      source: 'after_bleaching',
      sourceId: '',
      screenNo: '',
      designScreen: '',
      printingType: 'reactive',
      operatorName: '',
      machineName: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
      instructions: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      on_hold: 'destructive'
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Printing Module</h1>
            <p className="text-muted-foreground">
              Manage printing processes ({totalItems} total, {paginatedPrintings.length} showing)
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Printing Entry
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {printings.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Printings</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {printings.filter(p => p.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {printings.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">In Progress</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {printings.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {printings.reduce((sum, p) => sum + (p.totalMeterReceived || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Received</div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {printings.reduce((sum, p) => sum + (p.printedMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-teal-600 dark:text-teal-400">Printed Meters</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {printings.reduce((sum, p) => sum + (p.rejectedMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">Rejected Meters</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by lot number, party name, design, quality..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(statusFilter !== 'all' || printingTypeFilter !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {[statusFilter !== 'all' ? 1 : 0, printingTypeFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>

              {/* Items per page */}
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-32">
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

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label className="text-sm font-medium">Printing Type</Label>
                    <Select value={printingTypeFilter} onValueChange={(value) => {
                      setPrintingTypeFilter(value)
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniquePrintingTypes.map(type => (
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="lotNumber">Lot Number</SelectItem>
                          <SelectItem value="partyName">Party Name</SelectItem>
                          <SelectItem value="designNumber">Design Number</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="totalMeterReceived">Received Meter</SelectItem>
                          <SelectItem value="printedMeter">Printed Meter</SelectItem>
                          <SelectItem value="rejectedMeter">Rejected Meter</SelectItem>
                          <SelectItem value="pendingMeter">Pending Meter</SelectItem>
                          <SelectItem value="printingType">Printing Type</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="operatorName">Operator</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSort(sortBy)}
                        className="px-3"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        {sortOrder === 'asc' ? '↑' : '↓'}
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

        {/* All Printing Entries */}
        <Card>
          <CardHeader>
            <CardTitle>All Printing Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <>
                {/* Results */}
                <div className="space-y-4">
                  {paginatedPrintings.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        {filteredAndSortedPrintings.length === 0 
                          ? "No printing entries found matching your criteria."
                          : "No results on this page."
                        }
                      </p>
                      {(searchQuery || statusFilter !== 'all' || printingTypeFilter !== 'all') && (
                        <Button variant="outline" onClick={resetFilters} className="mt-4">
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    paginatedPrintings.map((printing) => (
                      <div key={printing._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold">{printing.partyName} - Lot: {printing.lotNumber}</div>
                              {printing.status === 'in_progress' && (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  In Progress
                                </Badge>
                              )}
                              {printing.status === 'pending' && (
                                <Badge variant="outline" className="text-gray-600 border-gray-300">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Order: {printing.orderNumber || 'N/A'} | Design: {printing.designNumber} | Quality: {printing.quality}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Type: {printing.printingType} | Screen: {printing.screenNo || 'N/A'} | Operator: {printing.operatorName || 'N/A'}
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Received:</span> {printing.totalMeterReceived}m
                              </div>
                              <div>
                                <span className="text-muted-foreground">Printed:</span> {printing.printedMeter}m
                              </div>
                              <div>
                                <span className="text-muted-foreground">Rejected:</span> {printing.rejectedMeter}m
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pending:</span> {printing.pendingMeter}m
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(printing.status)}
                            {printing.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickComplete(printing)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Quick Complete"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {printing.pendingMeter > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPrinting(printing)
                                  setOutputData({
                                    printedMeter: printing.printedMeter,
                                    rejectedMeter: printing.rejectedMeter
                                  })
                                  setShowOutputModal(true)
                                }}
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
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
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
                                className="w-10"
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
                        >
                          Next
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Printing Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Order Number</Label>
                  <Input
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  />
                </div>
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
                <div>
                  <Label>Design Number *</Label>
                  <Input
                    value={formData.designNumber}
                    onChange={(e) => setFormData({ ...formData, designNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Quality *</Label>
                  <Input
                    value={formData.quality}
                    onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Total Meter Received *</Label>
                  <Input
                    type="number"
                    value={formData.totalMeterReceived}
                    onChange={(e) => setFormData({ ...formData, totalMeterReceived: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value: 'after_bleaching' | 'batch_center') =>
                      setFormData({ ...formData, source: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after_bleaching">After Bleaching</SelectItem>
                      <SelectItem value="batch_center">Batch Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Printing Type *</Label>
                  <Select
                    value={formData.printingType}
                    onValueChange={(value: 'reactive' | 'pigment' | 'digital' | 'kitenge') =>
                      setFormData({ ...formData, printingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reactive">Reactive</SelectItem>
                      <SelectItem value="pigment">Pigment</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="kitenge">Kitenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Screen No</Label>
                  <Input
                    value={formData.screenNo}
                    onChange={(e) => setFormData({ ...formData, screenNo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Design Screen</Label>
                  <Input
                    value={formData.designScreen}
                    onChange={(e) => setFormData({ ...formData, designScreen: e.target.value })}
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
                  <Label>Machine Name</Label>
                  <Input
                    value={formData.machineName}
                    onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
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
              <div>
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update Output Modal */}
        <Dialog open={showOutputModal} onOpenChange={setShowOutputModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Printing Output</DialogTitle>
            </DialogHeader>
            {selectedPrinting && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total Received: {selectedPrinting.totalMeterReceived}m
                </div>
                <div>
                  <Label>Printed Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.printedMeter}
                    onChange={(e) => setOutputData({ ...outputData, printedMeter: Number(e.target.value) })}
                    max={selectedPrinting.totalMeterReceived}
                    required
                  />
                </div>
                <div>
                  <Label>Rejected Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.rejectedMeter}
                    onChange={(e) => setOutputData({ ...outputData, rejectedMeter: Number(e.target.value) })}
                    max={selectedPrinting.totalMeterReceived - outputData.printedMeter}
                    required
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Pending: {selectedPrinting.totalMeterReceived - outputData.printedMeter - outputData.rejectedMeter}m
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowOutputModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateOutput}>Update</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
