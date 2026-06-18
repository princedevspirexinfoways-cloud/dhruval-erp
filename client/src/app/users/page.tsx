'use client'

import React, { useState, Suspense } from 'react'
import { toast } from 'react-hot-toast'
import {
  Shield,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { usePermission } from '@/lib/hooks/usePermission'
import { useGetAllUsersQuery, useGetCompaniesForFilteringQuery } from '@/lib/features/users/usersApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'

// Lazy loaded components
const UserStats = React.lazy(() => import('@/components/users/UserStats'))
const UserFilters = React.lazy(() => import('@/components/users/UserFilters'))
const UserList = React.lazy(() => import('@/components/users/UserList'))

// Import modal hook
import { useModals } from '@/hooks/useModals'

interface UserFilters {
  search: string
  role: string
  status: string
  companyId: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  permissionModule: string
  permissionAction: string
}

interface PaginationState {
  page: number
  limit: number
}

export default function UsersPage() {
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const { has } = usePermission()
  const {
    openUserForm,
    openUserDetails,
    openDeleteUser,
    openPasswordModal,
    openToggle2FA
  } = useModals()

  // State management
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    companyId: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    permissionModule: 'all',
    permissionAction: 'all'
  })

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10
  })

  // API queries
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch
  } = useGetAllUsersQuery({
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search || undefined,
    role: filters.role !== 'all' ? filters.role : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    companyId: filters.companyId !== 'all' ? filters.companyId : undefined,
  })

  // Get companies for filtering (super admin only)
  const { data: companiesResponse } = useGetCompaniesForFilteringQuery()

  const users = usersResponse?.data?.users || []
  const paginationInfo = usersResponse?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 }

  // Event handlers
  const handleView = (user: any) => {
    openUserDetails({
      user,
      onEdit: () => {
        openUserForm({
          user,
          onSuccess: () => {
            setTimeout(() => {
              refetch()
            }, 500)
            toast.success('User updated successfully!')
          }
        })
      },
      onChangePassword: () => {
        openPasswordModal({
          user,
          onSuccess: () => {
            setTimeout(() => {
              refetch()
            }, 500)
            toast.success('Password updated successfully!')
          }
        })
      },
      onToggle2FA: () => {
        openToggle2FA({
          user,
          onSuccess: () => {
            setTimeout(() => {
              refetch()
            }, 500)
            toast.success(`2FA ${(user.is2FAEnabled || user.twoFactorEnabled) ? 'disabled' : 'enabled'} successfully!`)
          }
        })
      }
    })
  }

  const handleEdit = (user: any) => {
    openUserForm({
      user,
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success('User updated successfully!')
      }
    })
  }

  const handleDelete = (user: any) => {
    openDeleteUser({
      user,
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success('User deleted successfully!')
      }
    })
  }

  const handleChangePassword = (user: any) => {
    openPasswordModal({
      user,
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success('Password updated successfully!')
      }
    })
  }

  const handleToggle2FA = (user: any) => {
    openToggle2FA({
      user,
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success(`2FA ${(user.is2FAEnabled || user.twoFactorEnabled) ? 'disabled' : 'enabled'} successfully!`)
      }
    })
  }

  const handleCreateNew = () => {
    openUserForm({
      onSuccess: () => {
        // Add a small delay to avoid race conditions
        setTimeout(() => {
          refetch()
        }, 500)
        toast.success('User created successfully!')
      }
    })
  }

  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleReset = () => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      companyId: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      permissionModule: 'all',
      permissionAction: 'all'
    })
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination({ page: 1, limit })
  }

  // Access control: require view permission for users module
  const canView = isSuperAdmin || has('users', 'view') || has('admin', 'userManagement')
  if (!canView) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You dont have permission to view users.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    console.error('Users page error:', error)
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-4">
              {error && 'data' in error
                ? (error.data as any)?.message || 'Failed to load users'
                : 'An unexpected error occurred'
              }
            </p>
            <Button onClick={() => refetch()} className="bg-sky-500 hover:bg-sky-600 text-white">
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
                  Users Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">
                  Manage all users in the system with comprehensive tools
                </p>
              </div>
              <RequirePermission module="users" action="create">
                <Button
                  onClick={() => openUserForm({
                    onSuccess: () => {
                      setTimeout(() => {
                        refetch()
                      }, 500)
                      toast.success('User created successfully!')
                    }
                  })}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-semibold rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add User
                </Button>
              </RequirePermission>
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
            <UserStats
              currentCompany={filters.companyId !== 'all' ? filters.companyId : undefined}
              isSuperAdmin={isSuperAdmin}
            />
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
            <UserFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              onReset={handleReset}
              onCreateNew={() => openUserForm({
                onSuccess: (operation: 'create' | 'update') => {
                  setTimeout(() => {
                    refetch()
                  }, 500)
                  if (operation === 'create') {
                    toast.success('User created successfully!')
                  } else {
                    toast.success('User updated successfully!')
                  }
                }
              })}
              isLoading={isLoading}
              companies={companiesResponse?.data || []}
              isSuperAdmin={isSuperAdmin}
            />
          </Suspense>

          {/* Users List */}
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
          ) : users.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center transition-all duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
                <Shield className="h-20 w-20 text-blue-500 dark:text-blue-400 mx-auto mb-6 relative z-10 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {filters.search || filters.role !== 'all' || filters.status !== 'all' ? 'No users found' : 'Welcome to Users Management'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg transition-colors duration-300">
                {filters.search || filters.role !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your search criteria or filters to find the users you\'re looking for.'
                  : 'Start building your team by adding your first user to the system.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(filters.search || filters.role !== 'all' || filters.status !== 'all') && (
                  <Button
                    onClick={() => setFilters({
                      search: '',
                      role: 'all',
                      status: 'all',
                      companyId: 'all',
                      sortBy: 'name',
                      sortOrder: 'asc',
                      permissionModule: 'all',
                      permissionAction: 'all'
                    })}
                    variant="outline"
                    className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  onClick={() => openUserForm({
                    onSuccess: (operation: 'create' | 'update') => {
                      refetch()
                      if (operation === 'create') {
                        toast.success('User created successfully!')
                      } else {
                        toast.success('User updated successfully!')
                      }
                    }
                  })}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First User
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
              <UserList
                users={users}
                isLoading={isLoading}
                onView={(user) => openUserDetails({
                  user,
                  onEdit: () => {
                    openUserForm({
                      user,
                      onSuccess: () => {
                        setTimeout(() => {
                          refetch()
                        }, 500)
                        toast.success('User updated successfully!')
                      }
                    })
                  },
                  onChangePassword: () => {
                    openPasswordModal({
                      user,
                      onSuccess: () => {
                        setTimeout(() => {
                          refetch()
                        }, 500)
                        toast.success('Password updated successfully!')
                      }
                    })
                  },
                  onToggle2FA: () => {
                    openToggle2FA({
                      user,
                      onSuccess: () => {
                        setTimeout(() => {
                          refetch()
                        }, 500)
                        toast.success('2FA status updated successfully!')
                      }
                    })
                  }
                })}
                onEdit={(user) => openUserForm({
                  user,
                  onSuccess: () => {
                    setTimeout(() => {
                      refetch()
                    }, 500)
                    toast.success('User updated successfully!')
                  }
                })}
                onDelete={(user) => openDeleteUser({
                  user,
                  onSuccess: () => {
                    setTimeout(() => {
                      refetch()
                    }, 500)
                    toast.success('User deleted successfully!')
                  }
                })}
              />
            </Suspense>
          )}

          {/* Pagination */}
          {users.length > 0 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={paginationInfo.pages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
                totalItems={paginationInfo.total}
                itemsPerPage={pagination.limit}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
