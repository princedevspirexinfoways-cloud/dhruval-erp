'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  Shield,
  Users,
  Settings,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { UserManagementHeader } from '@/components/ui/PageHeader'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetRolesQuery, useGetRoleStatsQuery } from '@/lib/api/rolesApi'
import clsx from 'clsx'

export default function RolesPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch roles data
  const { data: rolesData, isLoading, error } = useGetRolesQuery({
    page,
    limit: 10,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined
  })

  // Fetch role statistics
  const { data: roleStats } = useGetRoleStatsQuery({})

  const roles = rolesData?.data || []
  const pagination = rolesData?.pagination

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'inactive':
        return `${baseClasses} bg-red-100 text-red-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getPermissionCount = (permissions: any) => {
    if (!permissions) return 0
    return Object.values(permissions).flat().length
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* New Header */}
        <UserManagementHeader
          title="Role Management"
          description={`Manage user roles and permissions (${roles.length} roles)`}
          icon={<UserCheck className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={() => window.location.reload()}
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 border border-white transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </button>
        </UserManagementHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Roles</p>
                <p className="text-2xl font-bold text-black">{roleStats?.data?.totalRoles || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-sky-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Active Roles</p>
                <p className="text-2xl font-bold text-green-600">{roleStats?.data?.activeRoles || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Users Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{roleStats?.data?.totalUsersAssigned || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Custom Roles</p>
                <p className="text-2xl font-bold text-sky-600">{roleStats?.data?.customRoles || 0}</p>
              </div>
              <Settings className="h-8 w-8 text-sky-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-sky-500 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-500" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl border-2 border-sky-500 p-6 animate-pulse">
                <div className="h-4 bg-sky-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-sky-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-sky-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-sky-200 rounded w-1/4"></div>
                  <div className="h-3 bg-sky-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border-2 border-red-500 p-6 text-center">
            <UserCheck className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Roles</h3>
            <p className="text-red-600">Failed to load roles. Please try again.</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-sky-500 p-6 text-center">
            <UserCheck className="h-12 w-12 text-sky-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No Roles Found</h3>
            <p className="text-black opacity-75">
              {searchTerm || statusFilter !== 'all'
                ? 'No roles match your search criteria.'
                : 'No roles have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {roles.map((role) => (
              <div key={role._id} className="bg-white rounded-xl border-2 border-sky-500 p-6 hover:border-black transition-colors">
                {/* Role Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-black truncate">
                      {role.roleName}
                    </h3>
                    <p className="text-sm text-sky-600 font-medium">
                      {role.roleCode}
                    </p>
                  </div>
                  <span className={getStatusBadge(role.status)}>
                    {role.status}
                  </span>
                </div>

                {/* Role Description */}
                {role.description && (
                  <div className="mb-4">
                    <p className="text-sm text-black opacity-75 line-clamp-2">
                      {role.description}
                    </p>
                  </div>
                )}

                {/* Role Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-sky-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-black">{role.userCount || 0}</p>
                    <p className="text-xs text-black opacity-75">Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-sky-600">
                      {getPermissionCount(role.permissions)}
                    </p>
                    <p className="text-xs text-black opacity-75">Permissions</p>
                  </div>
                </div>

                {/* Role Type & Level */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-black opacity-75">Type</span>
                    <span className="font-medium text-black capitalize">
                      {role.roleType || 'Custom'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-black opacity-75">Level</span>
                    <span className="font-medium text-black capitalize">
                      {role.level || 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-black opacity-75">Department</span>
                    <span className="font-medium text-black">
                      {role.department || 'All'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-sky-200">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-sky-500 hover:text-black hover:bg-sky-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-sky-500 hover:text-black hover:bg-sky-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    {!role.isSystemRole && (
                      <button className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-black opacity-60">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {role.createdAt ? formatDate(role.createdAt) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-black">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} roles
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm bg-white border border-sky-300 rounded hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-black">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1 text-sm bg-white border border-sky-300 rounded hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
