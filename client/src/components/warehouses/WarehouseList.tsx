'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetWarehousesQuery, useDeleteWarehouseMutation } from '@/lib/api/warehousesApi'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Package, 
  Users, 
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Building2,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'
import { Can } from '@/lib/casl/Can'

interface WarehouseListProps {
  companyId: string
  onEditWarehouse: (warehouse: any) => void
  viewMode?: 'list' | 'grid'
  searchTerm?: string
  filters?: {
    status: string
    type: string
    capacity: string
  }
}

export function WarehouseList({ companyId, onEditWarehouse, viewMode = 'list', searchTerm = '', filters }: WarehouseListProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [localFilters, setLocalFilters] = useState({
    status: filters?.status || 'all',
    type: filters?.type || 'all',
    capacity: filters?.capacity || 'all'
  })
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(companyId)
  
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)

  // Fetch companies for super admin
  const { data: companiesData, isLoading: companiesLoading } = useGetAllCompaniesQuery(undefined, {
    skip: !isSuperAdmin
  })

  // Use passed filters or defaults
  const statusFilter = localFilters.status
  const typeFilter = localFilters.type

  // Fetch warehouses data - if super admin and company filter is 'all', don't filter by company
  const { data: warehousesData, isLoading, error, refetch } = useGetWarehousesQuery({
    page,
    limit,
    search: localSearchTerm || searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    warehouseType: typeFilter !== 'all' ? typeFilter : undefined,
    companyId: selectedCompanyFilter !== 'all' ? selectedCompanyFilter : undefined
  })

  // Mutations
  const [deleteWarehouse] = useDeleteWarehouseMutation()

  const warehouses = warehousesData?.data || []
  const pagination = warehousesData?.pagination
  const companies = companiesData?.data || []

  // Update local state when props change
  useEffect(() => {
    if (searchTerm !== localSearchTerm) {
      setLocalSearchTerm(searchTerm)
      setPage(1) // Reset to first page when search changes
    }
  }, [searchTerm, localSearchTerm])

  useEffect(() => {
    if (filters) {
      setLocalFilters(filters)
      setPage(1) // Reset to first page when filters change
    }
  }, [filters])

  useEffect(() => {
    if (companyId !== selectedCompanyFilter) {
      setSelectedCompanyFilter(companyId)
      setPage(1) // Reset to first page when company changes
    }
  }, [companyId, selectedCompanyFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'inactive':
        return <XCircle className="w-4 h-4" />
      case 'maintenance':
        return <Wrench className="w-4 h-4" />
      case 'closed':
        return <XCircle className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
    }
  }

  const handleSearch = (value: string) => {
    setLocalSearchTerm(value)
    setPage(1)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
    setPage(1)
  }

  const handleCompanyFilterChange = (companyId: string) => {
    setSelectedCompanyFilter(companyId)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleDeleteWarehouse = async (warehouseId: string) => {
    try {
      await deleteWarehouse(warehouseId).unwrap()
      toast.success('Warehouse deleted successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to delete warehouse')
      console.error('Error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading warehouses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Warehouses</h3>
        <p className="text-gray-600 mb-4">There was an error loading the warehouse data.</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (warehouses.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Warehouses Found</h3>
        <p className="text-gray-600">
          {localSearchTerm || Object.values(localFilters).some(f => f !== 'all')
            ? 'No warehouses match your current search criteria.'
            : 'No warehouses found for this company.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search warehouses..."
                value={localSearchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Company Filter for Super Admin */}
          {isSuperAdmin && (
            <div className="flex items-center space-x-3">
              <Building2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Company:</span>
              <select
                value={selectedCompanyFilter}
                onChange={(e) => handleCompanyFilterChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.companyName} ({company.companyCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={localFilters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Types</option>
              <option value="distribution">Distribution</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="retail">Retail</option>
              <option value="cold_storage">Cold Storage</option>
              <option value="hazardous">Hazardous</option>
              <option value="bonded">Bonded</option>
              <option value="transit">Transit</option>
              <option value="cross_dock">Cross Dock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count and Pagination Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination?.total || 0)} of {pagination?.total || 0} warehouses
        </span>
        <div className="flex items-center space-x-2">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Warehouses Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <div key={warehouse._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{warehouse.warehouseName}</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className={getStatusColor(warehouse.status)}>
                      {getStatusIcon(warehouse.status)}
                      <span className="ml-1 capitalize">{warehouse.status}</span>
                    </Badge>
                    {warehouse.warehouseCode && (
                      <Badge variant="outline" className="text-xs">
                        {warehouse.warehouseCode}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{warehouse.address?.city || 'N/A'}, {warehouse.address?.state || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Package className="w-4 h-4" />
                  <span className="capitalize">{warehouse.warehouseType?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{warehouse.management?.totalStaff || 0} staff</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(warehouse.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => onEditWarehouse(warehouse)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    onClick={() => window.open(`/warehouses/${warehouse._id}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </Button>
                </div>
                <Can I="delete" a="Warehouse">
                  <Button
                    onClick={() => handleDeleteWarehouse(warehouse._id)}
                    variant="destructive"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </Button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.map((warehouse) => (
                  <tr key={warehouse._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{warehouse.warehouseName}</div>
                        {warehouse.warehouseCode && (
                          <div className="text-sm text-gray-500">{warehouse.warehouseCode}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {companies.find(c => c._id === warehouse.companyId)?.companyName || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {warehouse.address?.city || 'N/A'}, {warehouse.address?.state || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {warehouse.warehouseType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(warehouse.status)}>
                        {getStatusIcon(warehouse.status)}
                        <span className="ml-1 capitalize">{warehouse.status}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {warehouse.management?.totalStaff || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(warehouse.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => onEditWarehouse(warehouse)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          onClick={() => window.open(`/warehouses/${warehouse._id}`, '_blank')}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Button>
                        <Can I="delete" a="Warehouse">
                          <Button
                            onClick={() => handleDeleteWarehouse(warehouse._id)}
                            variant="destructive"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </Button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>
                Page {page} of {pagination.pages}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* First Page */}
              <Button
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ChevronsLeft className="w-4 h-4" />
                <span>First</span>
              </Button>
              
              {/* Previous Page */}
              <Button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum
                  if (pagination.pages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              {/* Next Page */}
              <Button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              {/* Last Page */}
              <Button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={page === pagination.pages}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>Last</span>
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
