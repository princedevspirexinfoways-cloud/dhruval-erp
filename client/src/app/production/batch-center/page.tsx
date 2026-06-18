'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetBatchCentersQuery,
  useCreateBatchCenterMutation,
  useUpdateReceivedMeterMutation,
  useGetPartyNameByLotQuery,
  BatchCenter
} from '@/lib/api/productionModulesApi'
import { Plus, Edit, Calendar, Package, CheckCircle, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function BatchCenterPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<BatchCenter | null>(null)
  const [receivedMeter, setReceivedMeter] = useState(0)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    lotNumber: '',
    partyName: '',
    customerId: '',
    quality: '',
    totalMeter: 0,
    receivedMeter: 0
  })

  // Search, Filter, Sort, and Pagination states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [qualityFilter, setQualityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, refetch } = useGetBatchCentersQuery({})
  const [createBatch] = useCreateBatchCenterMutation()
  const [updateReceivedMeter] = useUpdateReceivedMeterMutation()
  
  // Auto-fill party name when lot number changes
  const { data: partyNameData, refetch: refetchPartyName } = useGetPartyNameByLotQuery(
    formData.lotNumber,
    { skip: !formData.lotNumber }
  )

  const batches = data?.data || []

  // Filtered, sorted, and paginated data
  const filteredAndSortedBatches = useMemo(() => {
    let filtered = batches.filter((batch) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        batch.lotNumber.toLowerCase().includes(searchLower) ||
        batch.partyName.toLowerCase().includes(searchLower) ||
        batch.quality.toLowerCase().includes(searchLower) ||
        batch.totalMeter?.toString().includes(searchLower) ||
        batch.receivedMeter?.toString().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'all' || batch.status === statusFilter

      // Quality filter
      const matchesQuality = qualityFilter === 'all' || batch.quality === qualityFilter

      return matchesSearch && matchesStatus && matchesQuality
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
        case 'totalMeter':
          aValue = a.totalMeter || 0
          bValue = b.totalMeter || 0
          break
        case 'receivedMeter':
          aValue = a.receivedMeter || 0
          bValue = b.receivedMeter || 0
          break
        case 'pendingMeter':
          aValue = a.pendingMeter || 0
          bValue = b.pendingMeter || 0
          break
        case 'status':
          aValue = a.status
          bValue = b.status
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
  }, [batches, searchQuery, statusFilter, qualityFilter, sortBy, sortOrder])

  // Pagination
  const totalItems = filteredAndSortedBatches.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBatches = filteredAndSortedBatches.slice(startIndex, endIndex)

  // Get unique values for filters
  const uniqueStatuses = [...new Set(batches.map(b => b.status).filter(Boolean))] as string[]
  const uniqueQualities = [...new Set(batches.map(b => b.quality).filter(Boolean))] as string[]

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
    setQualityFilter('all')
    setSortBy('date')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const handleQuickComplete = async (batch: BatchCenter) => {
    if (batch.status === 'completed') {
      toast.error('Batch is already completed')
      return
    }
    
    try {
      await updateReceivedMeter({
        id: batch._id!,
        data: { receivedMeter: batch.totalMeter }
      }).unwrap()
      toast.success('Batch marked as completed')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete batch')
    }
  }

  useEffect(() => {
    if (formData.lotNumber && partyNameData?.data?.partyName) {
      setFormData(prev => ({ ...prev, partyName: partyNameData.data.partyName || '' }))
    }
  }, [formData.lotNumber, partyNameData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBatch(formData).unwrap()
      toast.success('Batch entry created successfully')
      setShowCreateModal(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        lotNumber: '',
        partyName: '',
        customerId: '',
        quality: '',
        totalMeter: 0,
        receivedMeter: 0
      })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create batch entry')
    }
  }

  const handleUpdateClick = (batch: BatchCenter) => {
    setSelectedBatch(batch)
    setReceivedMeter(batch.receivedMeter)
    setShowUpdateModal(true)
  }

  const handleUpdate = async () => {
    if (!selectedBatch || receivedMeter < 0) {
      toast.error('Please enter a valid received meter')
      return
    }
    if (receivedMeter > selectedBatch.totalMeter) {
      toast.error(`Received meter cannot exceed total meter (${selectedBatch.totalMeter})`)
      return
    }
    try {
      await updateReceivedMeter({
        id: selectedBatch._id!,
        data: { receivedMeter }
      }).unwrap()
      toast.success('Received meter updated successfully')
      setShowUpdateModal(false)
      setSelectedBatch(null)
      setReceivedMeter(0)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update received meter')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Batch Center</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage batch entries and received meters ({totalItems} total, {paginatedBatches.length} showing)
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Batch Entry
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {batches.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Batches</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {batches.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {batches.filter(b => b.status === 'partial').length}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Partial</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {batches.reduce((sum, b) => sum + (b.totalMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Meters</div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {batches.reduce((sum, b) => sum + (b.receivedMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-teal-600 dark:text-teal-400">Received Meters</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {batches.reduce((sum, b) => sum + (b.pendingMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Pending Meters</div>
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
                    placeholder="Search by lot number, party name, quality..."
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
                {(statusFilter !== 'all' || qualityFilter !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {[statusFilter !== 'all' ? 1 : 0, qualityFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
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
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Quality</Label>
                    <Select value={qualityFilter} onValueChange={(value) => {
                      setQualityFilter(value)
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Qualities</SelectItem>
                        {uniqueQualities.map(quality => (
                          <SelectItem key={quality} value={quality}>
                            {quality}
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
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="totalMeter">Total Meter</SelectItem>
                          <SelectItem value="receivedMeter">Received Meter</SelectItem>
                          <SelectItem value="pendingMeter">Pending Meter</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
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

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Results */}
            <div className="grid gap-4">
              {paginatedBatches.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      {filteredAndSortedBatches.length === 0 
                        ? "No batch entries found matching your criteria."
                        : "No results on this page."
                      }
                    </p>
                    {(searchQuery || statusFilter !== 'all' || qualityFilter !== 'all') && (
                      <Button variant="outline" onClick={resetFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                paginatedBatches.map((batch) => (
                  <Card key={batch._id} className="bg-white dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Lot: {batch.lotNumber}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Party: {batch.partyName} | Date: {new Date(batch.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(batch.status)}>
                            {batch.status}
                          </Badge>
                          {batch.status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickComplete(batch)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Quick Complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateClick(batch)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Received
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                            <span className="ml-2 font-medium">{batch.quality}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Total Meter:</span>
                            <span className="ml-2 font-medium">{batch.totalMeter}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Received Meter:</span>
                            <span className="ml-2 font-medium text-green-600">{batch.receivedMeter}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-yellow-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Pending Meter:</span>
                            <span className="ml-2 font-medium text-yellow-600">{batch.pendingMeter}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="pt-6">
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
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Batch Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Lot Number *</Label>
                  <Input
                    value={formData.lotNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, lotNumber: e.target.value })
                    }}
                    required
                  />
                </div>
                <CustomerSearchInput
                  value={formData.partyName}
                  customerId={formData.customerId}
                  onChange={(partyName, customerId) => {
                    setFormData({ ...formData, partyName, customerId })
                  }}
                  label="Party Name * (Auto-filled from lot or search)"
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
                  <Label>Total Meter *</Label>
                  <Input
                    type="number"
                    value={formData.totalMeter}
                    onChange={(e) => setFormData({ ...formData, totalMeter: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label>Received Meter</Label>
                  <Input
                    type="number"
                    value={formData.receivedMeter}
                    onChange={(e) => setFormData({ ...formData, receivedMeter: parseFloat(e.target.value) || 0 })}
                  />
                </div>
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

        {/* Update Received Meter Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Received Meter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBatch && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Lot Number: <span className="font-medium">{selectedBatch.lotNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Total Meter: <span className="font-medium">{selectedBatch.totalMeter}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Current Received: <span className="font-medium">{selectedBatch.receivedMeter}</span>
                  </p>
                </div>
              )}
              <div>
                <Label>Received Meter *</Label>
                <Input
                  type="number"
                  value={receivedMeter}
                  onChange={(e) => setReceivedMeter(parseFloat(e.target.value) || 0)}
                  max={selectedBatch?.totalMeter}
                  required
                />
                {selectedBatch && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pending: {selectedBatch.totalMeter - receivedMeter} meters (auto-calculated)
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowUpdateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}


