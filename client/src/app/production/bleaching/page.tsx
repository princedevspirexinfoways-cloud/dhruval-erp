'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetBleachingDashboardQuery,
  useCreateBleachingProcessMutation,
  useCompleteBleachingProcessMutation,
  BleachingProcess
} from '@/lib/api/productionModulesApi'
import { useGetCustomersQuery } from '@/lib/api/customersApi'
import { selectIsSuperAdmin, selectCurrentCompanyId } from '@/lib/features/auth/authSlice'
import { Plus, CheckCircle, Download, FileText, Truck, Search, X, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function BleachingProcessPage() {
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const currentCompanyId = useSelector(selectCurrentCompanyId)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<BleachingProcess | null>(null)
  const [updatedMeter, setUpdatedMeter] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    partyName: '',
    date: new Date().toISOString().split('T')[0],
    lotNumber: '',
    totalBale: '',
    totalMeter: '',
    transportName: '',
    mercerise: {
      degree: '',
      width: ''
    }
  })

  // Search, Filter, Sort, and Pagination states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [transportFilter, setTransportFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  // Get company ID for customer search
  const companyId = isSuperAdmin ? undefined : (currentCompanyId || undefined)

  // Fetch customers for search
  const { data: customersData } = useGetCustomersQuery({
    companyId: companyId,
    status: 'active',
    limit: 1000
  }, {
    skip: false
  })

  const customers = customersData?.data || []

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer: any) => {
    if (!customerSearch) return false
    const searchLower = customerSearch.toLowerCase()
    return (
      customer.customerName?.toLowerCase().includes(searchLower) ||
      customer.customerCode?.toLowerCase().includes(searchLower) ||
      customer.contactInfo?.primaryPhone?.toLowerCase().includes(searchLower) ||
      customer.contactInfo?.primaryEmail?.toLowerCase().includes(searchLower)
    )
  })

  // Ref for dropdown to handle click outside
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCustomerDropdown])

  const { data, isLoading, refetch } = useGetBleachingDashboardQuery(undefined, {
    // Ensure the query is always active
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: true
  })
  const [createProcess] = useCreateBleachingProcessMutation()
  const [completeProcess] = useCompleteBleachingProcessMutation()

  const processes = data?.data || []

  // Filtered, sorted, and paginated data
  const filteredAndSortedProcesses = useMemo(() => {
    let filtered = processes.filter((process) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        process.lotNumber.toLowerCase().includes(searchLower) ||
        process.partyName.toLowerCase().includes(searchLower) ||
        process.transportName?.toLowerCase().includes(searchLower) ||
        process.totalBale?.toString().includes(searchLower) ||
        process.totalMeter?.toString().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'all' || process.status === statusFilter

      // Transport filter
      const matchesTransport = transportFilter === 'all' || process.transportName === transportFilter

      return matchesSearch && matchesStatus && matchesTransport
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
        case 'totalBale':
          aValue = a.totalBale || 0
          bValue = b.totalBale || 0
          break
        case 'totalMeter':
          aValue = a.totalMeter || 0
          bValue = b.totalMeter || 0
          break
        case 'completedMeter':
          aValue = a.completedMeter || 0
          bValue = b.completedMeter || 0
          break
        case 'transportName':
          aValue = a.transportName || ''
          bValue = b.transportName || ''
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
  }, [processes, searchQuery, statusFilter, transportFilter, sortBy, sortOrder])

  // Pagination
  const totalItems = filteredAndSortedProcesses.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProcesses = filteredAndSortedProcesses.slice(startIndex, endIndex)

  // Get unique values for filters
  const uniqueStatuses = [...new Set(processes.map(p => p.status).filter(Boolean))] as string[]
  const uniqueTransports = [...new Set(processes.map(p => p.transportName).filter(Boolean))] as string[]

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
    setTransportFilter('all')
    setSortBy('date')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const handleQuickComplete = async (process: BleachingProcess) => {
    if (process.isCompleted) {
      toast.error('Process is already completed')
      return
    }
    
    try {
      await completeProcess({
        id: process._id!,
        data: { updatedMeter: process.totalMeter || 0 }
      }).unwrap()
      toast.success('Process marked as completed')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete process')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert string values to numbers, only if they have values
      const submitData = {
        ...formData,
        customerId: formData.customerId || undefined,
        totalBale: formData.totalBale ? parseFloat(formData.totalBale.toString()) : 0,
        totalMeter: formData.totalMeter ? parseFloat(formData.totalMeter.toString()) : 0,
        mercerise: {
          degree: formData.mercerise.degree ? parseFloat(formData.mercerise.degree.toString()) : undefined,
          width: formData.mercerise.width ? parseFloat(formData.mercerise.width.toString()) : undefined
        }
      }
      await createProcess(submitData).unwrap()
      toast.success('Bleaching process created successfully')
      setShowCreateModal(false)
      setFormData({
        customerId: '',
        partyName: '',
        date: new Date().toISOString().split('T')[0],
        lotNumber: '',
        totalBale: '',
        totalMeter: '',
        transportName: '',
        mercerise: {
          degree: '',
          width: ''
        }
      })
      setCustomerSearch('')
      // Refetch data to update the list
      try {
        await refetch().unwrap()
      } catch (err) {
        // Refetch failed, but mutation should have invalidated cache anyway
        console.log('Refetch after create failed:', err)
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create bleaching process')
    }
  }

  const handleComplete = async () => {
    if (!selectedProcess || !updatedMeter || parseFloat(updatedMeter.toString()) <= 0) {
      toast.error('Please enter a valid updated meter')
      return
    }
    try {
      await completeProcess({
        id: selectedProcess._id!,
        data: { updatedMeter: parseFloat(updatedMeter.toString()) }
      }).unwrap()
      toast.success('Bleaching process completed successfully')
      setShowCompleteModal(false)
      setSelectedProcess(null)
      setUpdatedMeter('')
      // Refetch data to update the list
      try {
        await refetch().unwrap()
      } catch (err) {
        // Refetch failed, but mutation should have invalidated cache anyway
        console.log('Refetch after complete failed:', err)
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete bleaching process')
    }
  }

  const handleCompleteClick = (process: BleachingProcess) => {
    setSelectedProcess(process)
    setUpdatedMeter(process.totalMeter?.toString() || '')
    setShowCompleteModal(true)
  }

  const handleCustomerSelect = (customer: any) => {
    const customerName = customer.customerName || customer.displayName || ''
    setFormData({ 
      ...formData, 
      customerId: customer._id || '',
      partyName: customerName 
    })
    setCustomerSearch(customerName)
    setShowCustomerDropdown(false)
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!showCreateModal) {
      setFormData({
        customerId: '',
        partyName: '',
        date: new Date().toISOString().split('T')[0],
        lotNumber: '',
        totalBale: '',
        totalMeter: '',
        transportName: '',
        mercerise: {
          degree: '',
          width: ''
        }
      })
      setCustomerSearch('')
      setShowCustomerDropdown(false)
    }
  }, [showCreateModal])

  const handleDownloadChallan = async (processId: string) => {
    try {
      toast.loading('Generating and downloading challan...', { id: 'download-challan' })
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
      const response = await fetch(`${baseUrl}/production/bleaching/${processId}/challan/pdf`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        console.error('Failed to download challan:', response.statusText)
        toast.error('Failed to download challan. Please try again.', { id: 'download-challan' })
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get lot number from the process
      const processData = processes.find((p: BleachingProcess) => p._id === processId)
      const fileName = `Bleaching-Challan-${processData?.lotNumber || processId}.pdf`
      
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Challan downloaded successfully', { id: 'download-challan' })
      
      // Refresh the data to update challan status
      try {
        await refetch().unwrap()
      } catch (err) {
        // Refetch failed, but data should be updated anyway
        console.log('Refetch after download failed:', err)
      }
    } catch (error) {
      console.error('Error downloading challan:', error)
      toast.error('Error downloading challan. Please try again.', { id: 'download-challan' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bleaching Process</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage bleaching process entries and completion ({totalItems} total, {paginatedProcesses.length} showing)
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Entry
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {processes.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Processes</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {processes.filter(p => p.isCompleted).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {processes.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">In Progress</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {processes.reduce((sum, p) => sum + (p.totalBale || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Bales</div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {processes.reduce((sum, p) => sum + (p.totalMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-teal-600 dark:text-teal-400">Total Meters</div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {processes.reduce((sum, p) => sum + (p.completedMeter || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Completed Meters</div>
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
                    placeholder="Search by lot number, party name, transport..."
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
                {(statusFilter !== 'all' || transportFilter !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {[statusFilter !== 'all' ? 1 : 0, transportFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
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
                    <Label className="text-sm font-medium">Transport</Label>
                    <Select value={transportFilter} onValueChange={(value) => {
                      setTransportFilter(value)
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Transports</SelectItem>
                        {uniqueTransports.map(transport => (
                          <SelectItem key={transport} value={transport}>
                            {transport}
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
                          <SelectItem value="totalBale">Total Bale</SelectItem>
                          <SelectItem value="totalMeter">Total Meter</SelectItem>
                          <SelectItem value="completedMeter">Completed Meter</SelectItem>
                          <SelectItem value="transportName">Transport</SelectItem>
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
              {paginatedProcesses.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      {filteredAndSortedProcesses.length === 0 
                        ? "No bleaching processes found matching your criteria."
                        : "No results on this page."
                      }
                    </p>
                    {(searchQuery || statusFilter !== 'all' || transportFilter !== 'all') && (
                      <Button variant="outline" onClick={resetFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                paginatedProcesses.map((process) => (
                  <Card key={process._id} className="bg-white dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Lot: {process.lotNumber}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Party: {process.partyName} | Date: {new Date(process.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(process.status)}>
                            {process.status}
                          </Badge>
                          {!process.isCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickComplete(process)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Quick Complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Action Buttons Section */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadChallan(process._id!)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Challan
                        </Button>
                        {!process.isCompleted && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCompleteClick(process)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Process
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Transport:</span>
                            <span className="ml-2 font-medium">{process.transportName || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Total Bale:</span>
                            <span className="ml-2 font-medium">{process.totalBale}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Total Meter:</span>
                            <span className="ml-2 font-medium">{process.totalMeter}</span>
                          </div>
                        </div>
                        {process.completedMeter && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Completed Meter:</span>
                              <span className="ml-2 font-medium">{process.completedMeter}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {process.mercerise && (process.mercerise.degree || process.mercerise.width) && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Mercerise Details:</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Degree:</span>
                              <span className="ml-2 font-medium">{process.mercerise.degree || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Width:</span>
                              <span className="ml-2 font-medium">{process.mercerise.width || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Additional Actions Section - Removed duplicate download button */}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Bleaching Process Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={dropdownRef}>
                  <Label>Party Name *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={customerSearch || formData.partyName}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setFormData({ 
                          ...formData, 
                          partyName: e.target.value,
                          customerId: '' // Clear customerId when manually typing
                        })
                        setShowCustomerDropdown(e.target.value.length > 0)
                      }}
                      onFocus={() => {
                        if (customerSearch || formData.partyName) {
                          setShowCustomerDropdown(true)
                        }
                      }}
                      placeholder="Search customer..."
                      className="pl-10"
                      required
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearch('')
                          setFormData({ ...formData, partyName: '', customerId: '' })
                          setShowCustomerDropdown(false)
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCustomers.map((customer: any) => (
                        <div
                          key={customer._id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {customer.customerName || customer.displayName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.customerCode && `Code: ${customer.customerCode}`}
                            {customer.contactInfo?.primaryPhone && ` | Phone: ${customer.contactInfo.primaryPhone}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                <div>
                  <Label>Lot Number *</Label>
                  <Input
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Total Bale *</Label>
                  <Input
                    type="number"
                    value={formData.totalBale}
                    onChange={(e) => setFormData({ ...formData, totalBale: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Total Meter / Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.totalMeter}
                    onChange={(e) => setFormData({ ...formData, totalMeter: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Transport Name</Label>
                  <Input
                    value={formData.transportName}
                    onChange={(e) => setFormData({ ...formData, transportName: e.target.value })}
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mercerise Sub-Module</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Degree</Label>
                      <Input
                        type="number"
                        value={formData.mercerise.degree}
                        onChange={(e) => setFormData({
                          ...formData,
                          mercerise: { ...formData.mercerise, degree: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={formData.mercerise.width}
                        onChange={(e) => setFormData({
                          ...formData,
                          mercerise: { ...formData.mercerise, width: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Complete Process Modal */}
        <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Bleaching Process</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedProcess && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Lot Number: <span className="font-medium">{selectedProcess.lotNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Original Total Meter: <span className="font-medium">{selectedProcess.totalMeter}</span>
                  </p>
                </div>
              )}
              <div>
                <Label>Updated Total Meter *</Label>
                <Input
                  type="number"
                  value={updatedMeter}
                  onChange={(e) => setUpdatedMeter(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will automatically update the After Bleaching stock
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Process
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

