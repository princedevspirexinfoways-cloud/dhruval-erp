'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin, selectCurrentCompany } from '@/lib/features/auth/authSlice'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { useGetWarehouseStatsQuery } from '@/lib/api/warehousesApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { WarehouseList } from '@/components/warehouses/WarehouseList'
import { WarehouseForm } from '@/components/warehouses/WarehouseForm'
import { WarehouseStats } from '@/components/warehouses/WarehouseStats'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Warehouse,
  Building2,
  BarChart3,
  Package,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  Globe,
  Activity,
  Zap,
  Shield,
  Truck,
  Database,
  Layers,
  Tag,
  HardDrive,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { Can } from '@/lib/casl/Can'

export default function WarehousesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [view, setView] = useState<'list' | 'grid' | 'stats'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    capacity: 'all'
  })
  
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const currentCompany = useSelector(selectCurrentCompany)

  // Check if user has full access to all warehouses
  const hasFullAccess = isSuperAdmin || (user?.permissions && Array.isArray(user.permissions) && user.permissions.includes('warehouse:all'))

  // Set default company ID only for regular users
  useEffect(() => {
    if (!hasFullAccess && currentCompany?._id) {
      setSelectedCompanyId(currentCompany._id)
    }
  }, [hasFullAccess, currentCompany])

  // RTK Query hooks
  const { data: companiesData, isLoading: companiesLoading } = useGetAllCompaniesQuery(undefined, {
    skip: !hasFullAccess
  })
  
  const { data: warehouseStatsData, isLoading: statsLoading, refetch: refetchStats } = useGetWarehouseStatsQuery(
    undefined,
    { skip: false }
  )

  const handleCreateWarehouse = () => {
    setEditingWarehouse(null)
    setShowForm(true)
  }

  const handleEditWarehouse = (warehouse: any) => {
    setEditingWarehouse(warehouse)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingWarehouse(null)
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingWarehouse(null)
    // Refresh the stats
    refetchStats()
  }

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleExport = () => {
    toast.info('Export functionality coming soon!')
  }

  const handleImport = () => {
    toast.info('Import functionality coming soon!')
  }

  const handleRefresh = () => {
    refetchStats()
    toast.success('Data refreshed!')
  }

  // Get real data from APIs
  const companies = companiesData?.data || []
  const warehouseStats = warehouseStatsData?.data
  const isLoading = companiesLoading || statsLoading

  // For users with full access, show all warehouses without company selection
  if (hasFullAccess) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Enhanced Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title and Description */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Warehouse Management</h1>
                  <p className="text-gray-600 max-w-2xl">
                    Manage all warehouses across all companies. Full access to create, edit, and delete warehouses with comprehensive oversight.
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Globe className="w-4 h-4" />
                      <span>All Companies</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Package className="w-4 h-4" />
                      <span>Full Access</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      <span>Global Analytics</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <Can I="create" a="Warehouse">
                  <Button
                    onClick={handleCreateWarehouse}
                    className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Warehouse</span>
                  </Button>
                </Can>
                
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Company Filter for Super Admin */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter by Company:</span>
                <CompanySelector
                  selectedCompanyId={selectedCompanyId}
                  onCompanyChange={handleCompanyChange}
                  showAllOption={true}
                  companies={companies}
                  isLoading={companiesLoading}
                />
              </div>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Full Access Mode
              </Badge>
            </div>
          </div>

          {/* Quick Stats Cards - Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium">Total Warehouses</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      warehouseStats?.totalWarehouses || 0
                    )}
                  </p>
                  <p className="text-sky-100 text-xs">
                    {warehouseStats ? `${warehouseStats.activeWarehouses || 0} active` : 'Loading...'}
                  </p>
                </div>
                <Warehouse className="w-8 h-8 text-sky-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Facilities</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      warehouseStats?.activeWarehouses || 0
                    )}
                  </p>
                  <p className="text-green-100 text-xs">
                    {warehouseStats ? `${warehouseStats.averageUtilization || 0}% utilized` : 'Loading...'}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Under Maintenance</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      warehouseStats?.maintenanceWarehouses || 0
                    )}
                  </p>
                  <p className="text-yellow-100 text-xs">
                    {warehouseStats ? 'Scheduled repairs' : 'Loading...'}
                  </p>
                </div>
                <Wrench className="w-8 h-8 text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Capacity</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      warehouseStats?.totalCapacity?.area ? 
                        `${Math.round(warehouseStats.totalCapacity.area / 1000)}K` : '0'
                    )}
                  </p>
                  <p className="text-purple-100 text-xs">
                    {warehouseStats ? 'sq ft available' : 'Loading...'}
                  </p>
                </div>
                <Package className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>

          {/* View Toggle and Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* View Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Grid View</span>
                </button>
                <button
                  onClick={() => setView('stats')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'stats'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </div>

              {/* Export/Import Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImport}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {view === 'stats' ? (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-sky-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Global Warehouse Analytics & Performance</h2>
                </div>
                <WarehouseStats companyId={selectedCompanyId || 'all'} />
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  {view === 'grid' ? (
                    <Grid3X3 className="w-6 h-6 text-sky-600" />
                  ) : (
                    <List className="w-6 h-6 text-sky-600" />
                  )}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {view === 'grid' ? 'Global Warehouse Grid View' : 'Global Warehouse List'}
                  </h2>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {view === 'grid' ? 'Grid Layout' : 'Table Layout'}
                  </Badge>
                  {selectedCompanyId && selectedCompanyId !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      Company Filtered
                    </Badge>
                  )}
                </div>
                <WarehouseList
                  companyId={selectedCompanyId || 'all'}
                  onEditWarehouse={handleEditWarehouse}
                  viewMode={view}
                  searchTerm={searchTerm}
                  filters={filters}
                />
              </div>
            )}
          </div>

          {/* Warehouse Form Modal */}
          {showForm && (
            <WarehouseForm
              warehouse={editingWarehouse}
              companyId={selectedCompanyId || 'all'}
              onClose={handleFormClose}
              onSubmit={handleFormSubmit}
            />
          )}
        </div>
      </AppLayout>
    )
  }

  // For regular users, require company selection
  if (!selectedCompanyId) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Company Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a company to manage warehouses and storage facilities.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You need to be associated with a company to access warehouse management features.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Regular user view
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title and Description */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Warehouse Management</h1>
                <p className="text-gray-600 max-w-2xl">
                  Manage your storage facilities, distribution centers, and warehouse operations.
                  Track capacity, monitor performance, and optimize your supply chain infrastructure.
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Building2 className="w-4 h-4" />
                    <span>Storage Facilities</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    <span>Inventory Management</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    <span>Performance Analytics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <Can I="create" a="Warehouse">
                <Button
                  onClick={handleCreateWarehouse}
                  className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Warehouse</span>
                </Button>
              </Can>
              
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Company Selector for Super Admin */}
        {isSuperAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Company:</span>
                <CompanySelector
                  selectedCompanyId={selectedCompanyId}
                  onCompanyChange={handleCompanyChange}
                  companies={companies}
                  isLoading={companiesLoading}
                />
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                Super Admin Mode
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Stats Cards - Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-sm font-medium">Total Warehouses</p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    warehouseStats?.totalWarehouses || 0
                  )}
                </p>
                <p className="text-sky-100 text-xs">
                  {warehouseStats ? `${warehouseStats.activeWarehouses || 0} active` : 'Loading...'}
                </p>
              </div>
              <Warehouse className="w-8 h-8 text-sky-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Facilities</p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    warehouseStats?.activeWarehouses || 0
                  )}
                </p>
                <p className="text-green-100 text-xs">
                  {warehouseStats ? `${warehouseStats.averageUtilization || 0}% utilized` : 'Loading...'}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Under Maintenance</p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    warehouseStats?.maintenanceWarehouses || 0
                  )}
                </p>
                <p className="text-yellow-100 text-xs">
                  {warehouseStats ? 'Scheduled repairs' : 'Loading...'}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between space-x-2">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Capacity</p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    warehouseStats?.totalCapacity?.area ? 
                      `${Math.round(warehouseStats.totalCapacity.area / 1000)}K` : '0'
                  )}
                </p>
                <p className="text-purple-100 text-xs">
                  {warehouseStats ? 'sq ft available' : 'Loading...'}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* View Toggle and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* View Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List View</span>
              </button>
              <button
                onClick={() => setView('grid')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setView('stats')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'stats'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>

            {/* Export/Import Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleImport}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {view === 'stats' ? (
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-semibold text-gray-900">Warehouse Analytics & Performance</h2>
              </div>
              <WarehouseStats companyId={selectedCompanyId} />
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                {view === 'grid' ? (
                  <Grid3X3 className="w-6 h-6 text-sky-600" />
                ) : (
                  <List className="w-6 h-6 text-sky-600" />
                )}
                <h2 className="text-xl font-semibold text-gray-900">
                  {view === 'grid' ? 'Warehouse Grid View' : 'Warehouse List'}
                </h2>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {view === 'grid' ? 'Grid Layout' : 'Table Layout'}
                </Badge>
              </div>
              <WarehouseList
                companyId={selectedCompanyId}
                onEditWarehouse={handleEditWarehouse}
                viewMode={view}
                searchTerm={searchTerm}
                filters={filters}
              />
            </div>
          )}
        </div>

        {/* Warehouse Form Modal */}
        {showForm && (
          <WarehouseForm
            warehouse={editingWarehouse}
            companyId={selectedCompanyId}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
    </AppLayout>
  )
}

// Simple Company Selector Component
function CompanySelector({ 
  selectedCompanyId, 
  onCompanyChange, 
  showAllOption = false,
  companies = [],
  isLoading = false
}: {
  selectedCompanyId: string;
  onCompanyChange: (companyId: string) => void;
  showAllOption?: boolean;
  companies?: Array<{ _id: string; companyName: string; companyCode: string }>;
  isLoading?: boolean;
}) {
  const selectedCompany = companies.find(c => c._id === selectedCompanyId)

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading companies...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <select
        value={selectedCompanyId}
        onChange={(e) => onCompanyChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
        disabled={isLoading}
      >
        {showAllOption && (
          <option value="all">All Companies</option>
        )}
        {companies.map((company) => (
          <option key={company._id} value={company._id}>
            {company.companyName} ({company.companyCode})
          </option>
        ))}
      </select>
      {selectedCompany && selectedCompanyId !== 'all' && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{selectedCompany.companyCode}</span>
        </div>
      )}
      {selectedCompanyId === 'all' && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Globe className="w-4 h-4" />
          <span>All Companies</span>
        </div>
      )}
    </div>
  )
}

