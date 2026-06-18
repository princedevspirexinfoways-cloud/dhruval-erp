'use client'

import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Shield,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { usePermission } from '@/lib/hooks/usePermission'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { ProtectedPage } from '@/components/auth/ProtectedPage'
import { useCompanyScope } from '@/lib/hooks/useCompanyScope'
import {
  useGetAllCustomersQuery,
  Customer
} from '@/lib/features/customers/customersApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'

// Import components directly
import CustomerStats from '@/components/customers/CustomerStats'
import CustomerFilters from '@/components/customers/CustomerFilters'
import CustomerList from '@/components/customers/CustomerList'
import { useModals } from '@/hooks/useModals'

interface CustomerFilters {
  search: string
  customerType: string
  status: string
  companyId: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function CustomersPage() {
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const { has } = usePermission()
  const { companyParam } = useCompanyScope()
  const { openCustomerForm, openCustomerDetails, openDeleteCustomer } = useModals()

  // State management
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    customerType: 'all',
    status: 'all',
    companyId: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  // API query with proper parameters
  const {
    data: customersResponse,
    isLoading,
    error,
    refetch,
    isFetching
  } = useGetAllCustomersQuery({
    search: filters.search || undefined,
    customerType: filters.customerType !== 'all' ? filters.customerType : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    companyId: (filters.companyId !== 'all' ? filters.companyId : undefined) || companyParam,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: 1,
    limit: 50
  })

  const customers = customersResponse?.data || []
  const totalCustomers = customersResponse?.total || 0

  // Event handlers
  const handleView = (customer: Customer) => {
    openCustomerDetails({ customer })
  }

  const handleEdit = (customer: Customer) => {
    openCustomerForm({
      customer,
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success('Customer updated successfully!')
      }
    })
  }

  const handleDelete = (customer: Customer) => {
    openDeleteCustomer({
      customer,
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success('Customer deleted successfully!')
      }
    })
  }

  const handleCreateNew = () => {
    openCustomerForm({
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success('Customer created successfully!')
      }
    })
  }

  const handleFilterChange = (newFilters: Partial<CustomerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleReset = () => {
    setFilters({
      search: '',
      customerType: 'all',
      status: 'all',
      companyId: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    })
  }

  // Access control: require customers:view to access
  const canView = isSuperAdmin || has('customers', 'view')
  if (!canView) {
    return (
      <ProtectedPage module="customers">
        <></>
      </ProtectedPage>
    )
  }

  // Error handling
  if (error) {
    console.error('Customers page error:', error)
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Customers</h3>
            <p className="text-gray-600 mb-4">
              {error && 'data' in error
                ? (error.data as any)?.message || 'Failed to load customers'
                : 'An unexpected error occurred'
              }
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
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
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-200 dark:border-gray-700 p-6 sm:p-8 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  Customers Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">
                  Manage all customers in the system with comprehensive tools
                </p>
              </div>
              <RequirePermission module="customers" action="create">
                <Button
                  onClick={handleCreateNew}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-semibold rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Customer
                </Button>
              </RequirePermission>
            </div>
          </div>

          {/* Stats Cards */}
          <CustomerStats
            customers={customers}
            isLoading={isLoading}
            currentCompany={filters.companyId !== 'all' ? filters.companyId : undefined}
            isSuperAdmin={isSuperAdmin}
          />

          {/* Search and Filters */}
          <CustomerFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onCreateNew={handleCreateNew}
            isLoading={isLoading}
          />

          {/* Customers List */}
          {isLoading ? (
            <div className="space-y-6">
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center transition-all duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
                <Shield className="h-20 w-20 text-blue-500 dark:text-blue-400 mx-auto mb-6 relative z-10 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {filters.search || filters.customerType !== 'all' || filters.status !== 'all' ? 'No customers found' : 'Welcome to Customers Management'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg transition-colors duration-300">
                {filters.search || filters.customerType !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your search criteria or filters to find the customers you\'re looking for.'
                  : 'Start building your customer base by adding your first customer to the system.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(filters.search || filters.customerType !== 'all' || filters.status !== 'all' || filters.companyId !== 'all') && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  onClick={handleCreateNew}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Customer
                </Button>
              </div>
            </div>
          ) : (
            <CustomerList
              customers={customers}
              isLoading={isLoading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

        </div>
      </div>
    </AppLayout>
  )
}

