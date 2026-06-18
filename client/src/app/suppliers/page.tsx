'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Truck,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  DollarSign,
  Package,
  Star,
  Clock,
  Grid3X3,
  List,
  RefreshCw,
  MoreVertical,
  X,
  ChevronDown,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Factory,
  Briefcase,
  Settings,
  User
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { useGetSuppliersQuery } from '@/lib/api/suppliersApi'
import { useGetAllCompaniesQuery } from '@/lib/api/authApi'
import { SupplierFormModal } from '@/components/suppliers/modals/SupplierFormModal'
import { SupplierDetailsModal } from '@/components/suppliers/modals/SupplierDetailsModal'
import { AgentFormModal } from '@/components/agents/modals/AgentFormModal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useGetAgentsQuery } from '@/lib/api/agentsApi'
import clsx from 'clsx'

interface SupplierFilters {
  search: string
  status: string
  category: string
  page: number
  limit: number
}

type ViewMode = 'grid' | 'list'

export default function SuppliersPage() {
  const router = useRouter()

  // State management
  const [activeTab, setActiveTab] = useState<'suppliers' | 'agents'>('suppliers')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [showSupplierDetails, setShowSupplierDetails] = useState(false)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [editingAgent, setEditingAgent] = useState<any>(null)

  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    status: 'all',
    category: 'all',
    page: 1,
    limit: 10
  })

  // Agent filters
  const [agentFilters, setAgentFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 10
  })

  // API queries
  const {
    data: suppliersData,
    isLoading: suppliersLoading,
    error: suppliersError,
    refetch: refetchSuppliers
  } = useGetSuppliersQuery({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    category: filters.category !== 'all' ? filters.category : undefined
  }, {
    skip: activeTab !== 'suppliers'
  })

  const {
    data: agentsData,
    isLoading: agentsLoading,
    error: agentsError,
    refetch: refetchAgents
  } = useGetAgentsQuery({
    page: agentFilters.page,
    limit: agentFilters.limit,
    search: agentFilters.search || undefined,
    status: agentFilters.status !== 'all' ? agentFilters.status : undefined
  }, {
    skip: activeTab !== 'agents'
  })

  const isLoading = activeTab === 'suppliers' ? suppliersLoading : agentsLoading
  const error = activeTab === 'suppliers' ? suppliersError : agentsError
  const refetch = activeTab === 'suppliers' ? refetchSuppliers : refetchAgents

  // Get companies data for displaying company names
  const { data: companiesData } = useGetAllCompaniesQuery(undefined, {
    skip: !suppliersData?.data?.data?.length
  })

  const companies = companiesData?.data || []

  // Handle different possible data structures
  const suppliers = (Array.isArray(suppliersData?.data?.data) 
    ? suppliersData.data.data 
    : Array.isArray(suppliersData?.data) 
    ? suppliersData.data 
    : []) as any[]
  const suppliersPagination = suppliersData?.data?.pagination

  const agents = (Array.isArray(agentsData?.data?.data) 
    ? agentsData.data.data 
    : Array.isArray(agentsData?.data) 
    ? agentsData.data 
    : []) as any[]
  const agentsPagination = agentsData?.data?.pagination

  const pagination = activeTab === 'suppliers' ? suppliersPagination : agentsPagination

  // Helper functions
  const getCompanyName = (companyId: string | any) => {
    // If companyId is an object (populated), use it directly
    if (companyId && typeof companyId === 'object' && companyId.companyName) {
      return companyId.companyName
    }
    // Otherwise, find in companies array
    const company = companies.find(c => c._id === companyId)
    return company?.companyName || 'Unknown Company'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      'inactive': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      'pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      'blacklisted': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      'suspended': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'raw_materials': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      'packaging': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      'machinery': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      'services': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
      'utilities': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }

  const getIndustryIcon = (industry: string) => {
    switch (industry?.toLowerCase()) {
      case 'automotive':
        return <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'manufacturing':
        return <Factory className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      case 'electronics':
        return <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      case 'food processing':
        return <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
      default:
        return <Building className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  // Event handlers
  const handleFilterChange = (key: keyof SupplierFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when other filters change
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      page: 1,
      limit: 10
    })
  }

  const handleViewSupplier = (supplier: any) => {
    router.push(`/suppliers/${supplier._id}`)
  }

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier)
    setShowSupplierForm(true)
  }

  const handleSupplierDetails = (supplier: any) => {
    setSelectedSupplier(supplier)
    setShowSupplierDetails(true)
  }

  const handleEditFromDetails = () => {
    setEditingSupplier(selectedSupplier)
    setShowSupplierDetails(false)
    setShowSupplierForm(true)
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-theme">Supplier & Agent Management</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 transition-theme">Manage supplier and agent relationships and procurement</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-sky-200 dark:border-gray-700 transition-theme">
                    <Building className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{pagination?.total || suppliers.length} suppliers</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-sky-200 dark:border-gray-700 transition-theme">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{suppliers.filter(s => s.isActive).length} active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-sky-200 dark:border-gray-700 transition-theme">
                  <Button
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === 'list'
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === 'grid'
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-sky-200 dark:border-gray-700 px-4 py-2 rounded-xl font-medium shadow-sm transition-all duration-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(filters.search || filters.status !== 'all' || filters.category !== 'all') && (
                    <div className="ml-2 h-2 w-2 bg-sky-500 rounded-full"></div>
                  )}
                </Button>

                <Button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-sky-200 dark:border-gray-700 px-4 py-2 rounded-xl font-medium shadow-sm transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={clsx("h-4 w-4 mr-2 transition-transform", isLoading && "animate-spin")} />
                  Refresh
                </Button>

                <Button
                  onClick={() => {
                    if (activeTab === 'suppliers') {
                      setEditingSupplier(null)
                      setShowSupplierForm(true)
                    } else {
                      setEditingAgent(null)
                      setShowAgentForm(true)
                    }
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add {activeTab === 'suppliers' ? 'Supplier' : 'Agent'}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Suppliers Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Total Suppliers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {pagination?.total || suppliers.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">+12% from last month</p>
                </div>
                <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                  <Truck className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
            </div>

            {/* Active Suppliers Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Active Suppliers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {suppliers.filter(s => s.isActive).length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Excellent health</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Total Orders Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {suppliers.reduce((sum, s) => sum + (s.supplyHistory?.totalOrders || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">+8% this quarter</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Total Spend Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Total Spend</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatCurrency(suppliers.reduce((sum, s) => sum + (s.supplyHistory?.totalOrderValue || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Within budget</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <DollarSign className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 mb-8 transition-theme">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                    <Filter className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Refine your supplier search</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 bg-transparent border-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Suppliers
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name, code, email..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {filters.search && (
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 appearance-none cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 appearance-none cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Categories</option>
                      <option value="raw_materials">Raw Materials</option>
                      <option value="packaging">Packaging</option>
                      <option value="machinery">Machinery</option>
                      <option value="services">Services</option>
                      <option value="utilities">Utilities</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>Active filters:</span>
                  <div className="flex items-center gap-2">
                    {filters.search && (
                      <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-xs font-medium">
                        Search: "{filters.search}"
                      </span>
                    )}
                    {filters.status !== 'all' && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        Status: {filters.status}
                      </span>
                    )}
                    {filters.category !== 'all' && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                        Category: {filters.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 font-medium"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all duration-200 font-medium shadow-sm"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-12 transition-theme">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600 dark:text-sky-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Loading suppliers...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-red-200 dark:border-red-800 p-6 transition-theme">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p>Failed to load suppliers. Please try again.</p>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!isLoading && !error && suppliers.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-12 transition-theme">
              <div className="flex flex-col items-center justify-center">
                <Truck className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Suppliers Found</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  {filters.search || filters.status !== 'all' || filters.category !== 'all'
                    ? 'No suppliers match your search criteria. Try adjusting your filters.'
                    : 'No suppliers have been added yet. Click "Add Supplier" to get started.'}
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'suppliers' | 'agents')}>
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-white dark:bg-gray-800 border border-sky-200 dark:border-gray-700">
                <TabsTrigger 
                  value="suppliers" 
                  className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
                >
                  Suppliers
                </TabsTrigger>
                <TabsTrigger 
                  value="agents"
                  className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
                >
                  Agents
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Suppliers Content */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'suppliers' | 'agents')}>
            <TabsContent value="suppliers" className="mt-0">
              {!isLoading && !error && suppliers.length > 0 && (
            <>
              {/* List View */}
              {viewMode === 'list' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 overflow-hidden transition-theme">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suppliers Directory</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Showing {suppliers.length} of {pagination?.total || suppliers.length} suppliers
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Live Data</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Supplier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Business
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Performance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {suppliers.map((supplier: any) => (
                          <tr
                            key={supplier._id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                                  <span className="text-sky-600 dark:text-sky-400 font-semibold text-sm">
                                    {supplier.supplierName?.charAt(0)?.toUpperCase() || 'S'}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {supplier.supplierName}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {supplier.supplierCode}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500">
                                    {getCompanyName(supplier.companyId)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                <div className="font-medium">{supplier.contactInfo?.primaryEmail || 'N/A'}</div>
                                <div className="text-gray-500 dark:text-gray-400">{supplier.contactInfo?.primaryPhone || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                <div className="font-medium">{supplier.businessInfo?.industry || 'N/A'}</div>
                                <div className="text-gray-500 dark:text-gray-400">{supplier.addresses?.[0]?.city || 'N/A'}, {supplier.addresses?.[0]?.state || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                <div className="font-medium">{supplier.supplyHistory?.totalOrders || 0} orders</div>
                                <div className="text-gray-500 dark:text-gray-400">{formatCurrency(supplier.supplyHistory?.totalOrderValue || 0)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className={clsx(
                                  'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                                  getStatusColor(supplier.isActive ? 'active' : 'inactive')
                                )}>
                                  {supplier.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                <span className={clsx(
                                  'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                                  getCategoryColor(supplier.relationship?.supplierCategory)
                                )}>
                                  {supplier.relationship?.supplierCategory?.toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() => handleViewSupplier(supplier)}
                                  className="p-2 text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors bg-transparent border-0"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleEditSupplier(supplier)}
                                  className="p-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors bg-transparent border-0"
                                  title="Edit Supplier"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleSupplierDetails(supplier)}
                                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors bg-transparent border-0"
                                  title="Quick View"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {suppliers.map((supplier: any) => (
                    <div
                      key={supplier._id}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200"
                    >
                    {/* Supplier Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-semibold">
                              {supplier.supplierName?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {supplier.supplierName}
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                              {supplier.supplierCode}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getCompanyName(supplier.companyId)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(supplier.isActive ? 'active' : 'inactive')
                        )}>
                          {supplier.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {supplier.contactInfo?.primaryEmail && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                          <span className="truncate">{supplier.contactInfo.primaryEmail}</span>
                        </div>
                      )}

                      {supplier.contactInfo?.primaryPhone && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                          <span>{supplier.contactInfo.primaryPhone}</span>
                        </div>
                      )}

                      {supplier.addresses?.[0] && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                          <span className="truncate">{supplier.addresses[0].city}, {supplier.addresses[0].state}</span>
                        </div>
                      )}

                      {supplier.businessInfo?.industry && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          {getIndustryIcon(supplier.businessInfo.industry)}
                          <span className="ml-2 truncate">{supplier.businessInfo.industry}</span>
                        </div>
                      )}
                    </div>

                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        getCategoryColor(supplier.relationship?.supplierCategory)
                      )}>
                        {supplier.relationship?.supplierCategory?.toUpperCase()}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{supplier.supplyHistory?.totalOrders || 0}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(supplier.supplyHistory?.totalOrderValue || 0)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Total Spend</p>
                      </div>
                    </div>

                    {/* Performance Indicators */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300">On-time Delivery</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{supplier.supplyHistory?.onTimeDeliveryRate || 0}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300">Quality Score</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{supplier.quality?.qualityRating || 0}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300">Lead Time</span>
                        <span className="font-medium text-gray-900 dark:text-white">{supplier.supplyHistory?.averageLeadTime || 0} days</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300">Payment Terms</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {supplier.financialInfo?.paymentTerms || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleViewSupplier(supplier)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors bg-transparent border-0"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors bg-transparent border-0"
                          title="Edit Supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleSupplierDetails(supplier)}
                          className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors bg-transparent border-0"
                          title="Quick View"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {supplier.supplyHistory?.lastOrderDate ? formatDate(supplier.supplyHistory.lastOrderDate) : 'No orders'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
              )}
            </TabsContent>

            {/* Agents Content */}
            <TabsContent value="agents" className="mt-0">
              {!isLoading && !error && agents.length > 0 && (
                <>
                  {/* List View for Agents */}
                  {viewMode === 'list' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 overflow-hidden transition-theme">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agents Directory</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              Showing {agents.length} of {pagination?.total || agents.length} agents
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Agent
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Contact
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Address
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {agents.map((agent: any) => (
                              <tr
                                key={agent._id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                                      <span className="text-sky-600 dark:text-sky-400 font-semibold text-sm">
                                        {agent.agentName?.charAt(0)?.toUpperCase() || 'A'}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {agent.agentName}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {agent.agentCode}
                                      </div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500">
                                        {agent.contactPersonName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    <div className="font-medium">{agent.contactInfo?.primaryEmail || 'N/A'}</div>
                                    <div className="text-gray-500 dark:text-gray-400">{agent.contactInfo?.primaryPhone || 'N/A'}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    <div className="font-medium">{agent.addresses?.[0]?.city || 'N/A'}, {agent.addresses?.[0]?.state || 'N/A'}</div>
                                    <div className="text-gray-500 dark:text-gray-400">{agent.addresses?.[0]?.addressLine1 || 'N/A'}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={clsx(
                                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                                    getStatusColor(agent.isActive ? 'active' : 'inactive')
                                  )}>
                                    {agent.isActive ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      onClick={() => {
                                        setSelectedAgent(agent)
                                        setEditingAgent(agent)
                                        setShowAgentForm(true)
                                      }}
                                      className="p-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors bg-transparent border-0"
                                      title="Edit Agent"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Grid View for Agents */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {agents.map((agent: any) => (
                        <div
                          key={agent._id}
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                  <span className="text-white font-semibold">
                                    {agent.agentName?.charAt(0)?.toUpperCase() || 'A'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {agent.agentName}
                                  </h3>
                                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    {agent.agentCode}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {agent.contactPersonName}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <span className={clsx(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              getStatusColor(agent.isActive ? 'active' : 'inactive')
                            )}>
                              {agent.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            {agent.contactInfo?.primaryEmail && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                <span className="truncate">{agent.contactInfo.primaryEmail}</span>
                              </div>
                            )}

                            {agent.contactInfo?.primaryPhone && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                <span>{agent.contactInfo.primaryPhone}</span>
                              </div>
                            )}

                            {agent.addresses?.[0] && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                <span className="truncate">{agent.addresses[0].city}, {agent.addresses[0].state}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              onClick={() => {
                                setSelectedAgent(agent)
                                setEditingAgent(agent)
                                setShowAgentForm(true)
                              }}
                              className="p-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors bg-transparent border-0"
                              title="Edit Agent"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* No Agents State */}
              {!isLoading && !error && agents.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-12 transition-theme">
                  <div className="flex flex-col items-center justify-center">
                    <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Agents Found</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      No agents have been added yet. Click "Add Agent" to get started.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
                onLimitChange={handleItemsPerPageChange}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 transition-theme"
              />
            </div>
          )}



          {/* Supplier Form Modal */}
          {showSupplierForm && (
            <SupplierFormModal
              isOpen={showSupplierForm}
              onClose={() => {
                setShowSupplierForm(false)
                setEditingSupplier(null)
              }}
              onSuccess={() => {
                refetchSuppliers()
                setShowSupplierForm(false)
                setEditingSupplier(null)
              }}
              supplier={editingSupplier}
            />
          )}

          {/* Supplier Details Modal */}
          {showSupplierDetails && selectedSupplier && (
            <SupplierDetailsModal
              isOpen={showSupplierDetails}
              onClose={() => {
                setShowSupplierDetails(false)
                setSelectedSupplier(null)
              }}
              supplier={selectedSupplier}
              onEdit={handleEditFromDetails}
            />
          )}

          {/* Agent Form Modal */}
          {showAgentForm && (
            <AgentFormModal
              isOpen={showAgentForm}
              onClose={() => {
                setShowAgentForm(false)
                setEditingAgent(null)
              }}
              onSuccess={() => {
                refetchAgents()
                setShowAgentForm(false)
                setEditingAgent(null)
              }}
              agent={editingAgent}
            />
          )}
        </div>
      </div>
    </AppLayout>
  )
}