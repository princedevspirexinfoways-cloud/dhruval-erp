'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Shield,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useSelector } from 'react-redux'

import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'

import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { selectIsSuperAdmin, selectCurrentCompanyId } from '@/lib/features/auth/authSlice'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import {
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useGetCompanyStatsQuery,
  useGetDashboardStatsQuery
} from '@/lib/features/companies/companiesApi'

// Lazy load components for better performance
const CompanyStats = React.lazy(() => import('@/components/companies/CompanyStats'))
const CompanyFilters = React.lazy(() => import('@/components/companies/CompanyFilters'))
const CompanyList = React.lazy(() => import('@/components/companies/CompanyList'))
const CompanyFormModal = React.lazy(() => import('@/components/companies/modals/CompanyFormModal'))


export default function CompaniesPage() {
  const router = useRouter()
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const currentCompanyId = useSelector(selectCurrentCompanyId)

  // For non-superadmin users, redirect directly to their assigned company page
  useEffect(() => {
    if (!isSuperAdmin && currentCompanyId) {
      router.replace(`/companies/${currentCompanyId}`)
    }
  }, [isSuperAdmin, currentCompanyId, router])

  // State management
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    location: '',
    industry: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)


  // API hooks
  const { data: companiesData, isLoading, error, refetch } = useGetAllCompaniesQuery(undefined, {
    skip: !isSuperAdmin
  })

  const { data: companyStatsData } = useGetCompanyStatsQuery(undefined, {
    skip: !isSuperAdmin
  })

  const { data: dashboardStatsData } = useGetDashboardStatsQuery(undefined, {
    skip: !isSuperAdmin
  })

  const [createCompany, { isLoading: createLoading }] = useCreateCompanyMutation()
  const [updateCompany, { isLoading: updateLoading }] = useUpdateCompanyMutation()
  const [deleteCompany, { isLoading: deleteLoading }] = useDeleteCompanyMutation()

  // Data processing
  const companies = companiesData?.data || []

  // Filter companies based on search and status
  const filteredCompanies = companies.filter((company: any) => {
    const matchesSearch = !filters.search ||
      company.companyName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      company.companyCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
      company.registrationDetails?.gstin?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'active' && company.status === 'active') ||
      (filters.status === 'inactive' && company.status === 'inactive') ||
      (filters.status === 'suspended' && company.status === 'suspended') ||
      (filters.status === 'pending_approval' && company.status === 'pending_approval') ||
      (filters.status === 'under_review' && company.status === 'under_review')

    const matchesLocation = !filters.location ||
      company.addresses?.registeredOffice?.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
      company.addresses?.registeredOffice?.state?.toLowerCase().includes(filters.location.toLowerCase())

    return matchesSearch && matchesStatus && matchesLocation
  }).sort((a: any, b: any) => {
    const aValue = a[filters.sortBy] || ''
    const bValue = b[filters.sortBy] || ''

    if (filters.sortOrder === 'asc') {
      return aValue.toString().localeCompare(bValue.toString())
    } else {
      return bValue.toString().localeCompare(aValue.toString())
    }
  })

  // Stats calculation using real API data
  const stats = {
    totalCompanies: companyStatsData?.totalCompanies || companies.length,
    activeCompanies: companyStatsData?.activeCompanies || companies.filter((c: any) => c.status === 'active').length,
    inactiveCompanies: companyStatsData?.inactiveCompanies || companies.filter((c: any) => c.status === 'inactive').length,
    suspendedCompanies: companies.filter((c: any) => c.status === 'suspended').length,
    pendingApproval: companies.filter((c: any) => c.status === 'pending_approval').length,
    underReview: companies.filter((c: any) => c.status === 'under_review').length,
    newThisMonth: companies.filter((c: any) =>
      c.createdAt && new Date(c.createdAt).getMonth() === new Date().getMonth()
    ).length,
    // Real stats from dashboard API
    totalUsers: dashboardStatsData?.totalUsers || 0,
    totalRevenue: dashboardStatsData?.totalRevenue || 0,
    totalProduction: dashboardStatsData?.totalProduction || 0,
    totalOrders: dashboardStatsData?.totalOrders || 0,
    totalCustomers: dashboardStatsData?.totalCustomers || 0
  }



  // Event handlers
  const handleCreateCompany = async (data: any) => {
    try {
      await createCompany(data).unwrap()
      toast.success('Company created successfully')
      setShowCreateModal(false)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create company')
    }
  }

  const handleView = (company: any) => {
    router.push(`/companies/${company._id}`)
  }

  const handleEditCompany = (company: any) => {
    setSelectedCompany(company)
    setShowEditModal(true)
  }

  const handleUpdateCompany = async (data: any) => {
    if (!selectedCompany) return
    try {
      await updateCompany({
        id: selectedCompany._id,
        company: data
      }).unwrap()
      toast.success('Company updated successfully')
      setShowEditModal(false)
      setSelectedCompany(null)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update company')
    }
  }

  const handleDeleteClick = (company: any) => {
    setSelectedCompany(company)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCompany) return
    try {
      await deleteCompany(selectedCompany._id).unwrap()
      toast.success('Company deleted successfully')
      setShowDeleteModal(false)
      setSelectedCompany(null)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete company')
    }
  }

  // Access control
  // If non-superadmin and we have a company, show a lightweight loader while redirecting
  if (!isSuperAdmin && currentCompanyId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-sky-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loading your company…</h2>
            <p className="text-gray-600 dark:text-gray-400">Redirecting to your company details</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // If non-superadmin and there is no company context, block access
  if (!isSuperAdmin && !currentCompanyId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Company Access Required</h2>
            <p className="text-gray-600 dark:text-gray-400">Your account doesn’t have a company assigned.</p>
          </div>
        </div>
      </AppLayout>
    )
  }



  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Companies</h2>
            <p className="text-gray-600 mb-4">There was an error loading the companies data.</p>
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-6 sm:p-8 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  Companies Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">
                  Manage all companies in the system with comprehensive tools
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-semibold rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Company
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          }>
            <CompanyStats stats={stats} isLoading={isLoading} />
          </Suspense>

          {/* Search and Filters */}
          <Suspense fallback={
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-12 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                  <div className="h-12 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                  <div className="h-12 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                </div>
              </div>
            </div>
          }>
            <CompanyFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({
                search: '',
                status: 'all',
                sortBy: 'name',
                sortOrder: 'asc',
                location: '',
                industry: ''
              })}
              onCreateNew={() => setShowCreateModal(true)}
              isLoading={isLoading}
            />
          </Suspense>

          {/* Companies Grid */}
          {isLoading ? (
            <div className="space-y-6">
              {/* Loading Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center transition-all duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
                <Building2 className="h-20 w-20 text-blue-500 dark:text-blue-400 mx-auto mb-6 relative z-10 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {filters.search || filters.status !== 'all' || filters.location || filters.industry ? 'No companies found' : 'Welcome to Companies Management'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg transition-colors duration-300">
                {filters.search || filters.status !== 'all' || filters.location || filters.industry
                  ? 'Try adjusting your search criteria or filters to find the companies you\'re looking for.'
                  : 'Start building your business network by adding your first company to the system.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(filters.search || filters.status !== 'all' || filters.location || filters.industry) && (
                  <Button
                    onClick={() => setFilters({
                      search: '',
                      status: 'all',
                      sortBy: 'name',
                      sortOrder: 'asc',
                      location: '',
                      industry: ''
                    })}
                    variant="outline"
                    className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Company
                </Button>
              </div>
            </div>
          ) : (
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }>
              <CompanyList
                companies={filteredCompanies}
                isLoading={isLoading}
                onView={handleView}
                onEdit={handleEditCompany}
                onDelete={handleDeleteClick}
                realStats={{
                  totalUsers: stats.totalUsers,
                  totalRevenue: stats.totalRevenue,
                  totalProduction: stats.totalProduction,
                  totalOrders: stats.totalOrders,
                  totalCustomers: stats.totalCustomers
                }}
              />
            </Suspense>
          )}

          {/* Modals */}
          <Suspense fallback={null}>
            <CompanyFormModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateCompany}
              isLoading={createLoading}
            />
          </Suspense>

          <Suspense fallback={null}>
            <CompanyFormModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false)
                setSelectedCompany(null)
              }}
              company={selectedCompany}
              onSubmit={handleUpdateCompany}
              isLoading={updateLoading}
            />
          </Suspense>

          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedCompany(null)
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete Company"
            message={`Are you sure you want to delete "${selectedCompany?.companyName}"? This action cannot be undone.`}
            confirmText="Delete Company"
            isLoading={deleteLoading}
            type="danger"
          />
        </div>
      </div>
    </AppLayout>
  )
}