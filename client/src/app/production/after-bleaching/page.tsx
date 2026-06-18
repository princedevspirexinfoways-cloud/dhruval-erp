'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetAfterBleachingStocksQuery,
  useSendToPrintingMutation,
  useGetLongationStockQuery,
  AfterBleaching
} from '@/lib/api/productionModulesApi'
import { Send, Package, TrendingUp, TrendingDown, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AfterBleachingPage() {
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState<AfterBleaching | null>(null)
  const [meterToSend, setMeterToSend] = useState(0)

  // Search, Filter, Sort, and Pagination states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('lotNumber')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, refetch } = useGetAfterBleachingStocksQuery({})
  const { data: longationData, refetch: refetchLongation } = useGetLongationStockQuery()
  const [sendToPrinting] = useSendToPrintingMutation()

  const stocks = data?.data || []
  const totalLongation = longationData?.data?.totalLongation || 0

  // Filtered, sorted, and paginated data
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks.filter((stock) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        stock.lotNumber.toLowerCase().includes(searchLower) ||
        stock.partyName.toLowerCase().includes(searchLower) ||
        stock.totalMeter?.toString().includes(searchLower) ||
        stock.availableMeter?.toString().includes(searchLower) ||
        stock.sentToPrinting?.toString().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'all' || stock.status === statusFilter

      // Availability filter
      const matchesAvailability = availabilityFilter === 'all' || 
        (availabilityFilter === 'available' && stock.availableMeter > 0) ||
        (availabilityFilter === 'no_stock' && stock.availableMeter === 0) ||
        (availabilityFilter === 'has_longation' && stock.longationStock > 0)

      return matchesSearch && matchesStatus && matchesAvailability
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
        case 'totalMeter':
          aValue = a.totalMeter || 0
          bValue = b.totalMeter || 0
          break
        case 'availableMeter':
          aValue = a.availableMeter || 0
          bValue = b.availableMeter || 0
          break
        case 'sentToPrinting':
          aValue = a.sentToPrinting || 0
          bValue = b.sentToPrinting || 0
          break
        case 'longationStock':
          aValue = a.longationStock || 0
          bValue = b.longationStock || 0
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default: // lotNumber
          aValue = a.lotNumber
          bValue = b.lotNumber
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
  }, [stocks, searchQuery, statusFilter, availabilityFilter, sortBy, sortOrder])

  // Pagination
  const totalItems = filteredAndSortedStocks.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStocks = filteredAndSortedStocks.slice(startIndex, endIndex)

  // Get unique values for filters
  const uniqueStatuses = [...new Set(stocks.map(s => s.status).filter(Boolean))] as string[]

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
    setAvailabilityFilter('all')
    setSortBy('lotNumber')
    setSortOrder('asc')
    setCurrentPage(1)
  }

  const handleSendClick = (stock: AfterBleaching) => {
    setSelectedStock(stock)
    setMeterToSend(0)
    setShowSendModal(true)
  }

  const handleSend = async () => {
    if (!selectedStock || meterToSend <= 0) {
      toast.error('Please enter a valid meter amount')
      return
    }
    if (meterToSend > selectedStock.availableMeter) {
      toast.error(`Cannot send more than available meter (${selectedStock.availableMeter})`)
      return
    }
    try {
      await sendToPrinting({
        id: selectedStock._id!,
        data: { meter: meterToSend }
      }).unwrap()
      toast.success('Meter sent to printing successfully')
      setShowSendModal(false)
      setSelectedStock(null)
      setMeterToSend(0)
      // Safely refetch if queries are active
      if (refetch && typeof refetch === 'function') {
        try {
          refetch()
        } catch (err) {
          // Query might not be started yet, mutation will invalidate tags anyway
          console.log('Refetch skipped:', err)
        }
      }
      if (refetchLongation && typeof refetchLongation === 'function') {
        try {
          refetchLongation()
        } catch (err) {
          console.log('Longation refetch skipped:', err)
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send to printing')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully_allocated': return 'bg-green-100 text-green-800'
      case 'partially_allocated': return 'bg-yellow-100 text-yellow-800'
      case 'available': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">After Bleaching Stock</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage stock after bleaching process ({totalItems} total, {paginatedStocks.length} showing)
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stocks.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Stocks</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stocks.filter(s => s.availableMeter > 0).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Available</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stocks.filter(s => s.status === 'fully_allocated').length}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Fully Allocated</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stocks.reduce((sum, s) => sum + (s.totalMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Meters</div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {stocks.reduce((sum, s) => sum + (s.availableMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-teal-600 dark:text-teal-400">Available Meters</div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stocks.reduce((sum, s) => sum + (s.sentToPrinting || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Sent to Printing</div>
            </CardContent>
          </Card>
        </div>

        {/* Longation Stock Summary */}
        {totalLongation > 0 && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Longation Stock</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {totalLongation} meters
                    </p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Extra/Shrinkage Meter
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Controls */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by lot number, party name, meters..."
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
                {(statusFilter !== 'all' || availabilityFilter !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {[statusFilter !== 'all' ? 1 : 0, availabilityFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
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
                    <Label className="text-sm font-medium">Availability</Label>
                    <Select value={availabilityFilter} onValueChange={(value) => {
                      setAvailabilityFilter(value)
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="available">Available Stock</SelectItem>
                        <SelectItem value="no_stock">No Stock</SelectItem>
                        <SelectItem value="has_longation">Has Longation</SelectItem>
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
                          <SelectItem value="lotNumber">Lot Number</SelectItem>
                          <SelectItem value="partyName">Party Name</SelectItem>
                          <SelectItem value="totalMeter">Total Meter</SelectItem>
                          <SelectItem value="availableMeter">Available Meter</SelectItem>
                          <SelectItem value="sentToPrinting">Sent to Printing</SelectItem>
                          <SelectItem value="longationStock">Longation Stock</SelectItem>
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
              {paginatedStocks.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      {filteredAndSortedStocks.length === 0 
                        ? "No after bleaching stocks found matching your criteria."
                        : "No results on this page."
                      }
                    </p>
                    {(searchQuery || statusFilter !== 'all' || availabilityFilter !== 'all') && (
                      <Button variant="outline" onClick={resetFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                paginatedStocks.map((stock) => (
                  <Card key={stock._id} className="bg-white dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Lot: {stock.lotNumber}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Party: {stock.partyName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(stock.status)}>
                            {stock.status.replace('_', ' ')}
                          </Badge>
                          {stock.availableMeter > 0 && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSendClick(stock)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send to Printing
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Total Meter:</span>
                            <span className="ml-2 font-medium">{stock.totalMeter}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Available Meter:</span>
                            <span className="ml-2 font-medium text-blue-600">{stock.availableMeter}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-green-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Sent to Printing:</span>
                            <span className="ml-2 font-medium text-green-600">{stock.sentToPrinting}</span>
                          </div>
                        </div>
                        {stock.longationStock > 0 && (
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-yellow-400" />
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Longation:</span>
                              <span className="ml-2 font-medium text-yellow-600">{stock.longationStock}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {stock.printingEntries && stock.printingEntries.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Printing Entries:</p>
                          <div className="space-y-1">
                            {stock.printingEntries.map((entry, index) => (
                              <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(entry.date).toLocaleDateString()} - {entry.meter} meters
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

        {/* Send to Printing Modal */}
        <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send to Printing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedStock && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Lot Number: <span className="font-medium">{selectedStock.lotNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Available Meter: <span className="font-medium">{selectedStock.availableMeter}</span>
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
                    Remaining meter will be automatically added to Longation Stock
                  </p>
                </div>
              )}
              <div>
                <Label>Meter to Send *</Label>
                <Input
                  type="number"
                  value={meterToSend}
                  onChange={(e) => setMeterToSend(parseFloat(e.target.value) || 0)}
                  max={selectedStock?.availableMeter}
                  required
                />
                {selectedStock && (
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining: {selectedStock.totalMeter - (selectedStock.sentToPrinting + meterToSend)} meters
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSendModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Printing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}


