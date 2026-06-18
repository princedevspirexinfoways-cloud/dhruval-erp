import React from 'react'
import {
  Search,
  Filter,
  RotateCcw,
  Plus,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

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

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: Partial<UserFilters>) => void
  onReset: () => void
  onCreateNew: () => void
  isLoading: boolean
  companies?: Array<{ _id: string; companyCode: string; companyName: string }>
  isSuperAdmin?: boolean
}

export default function UserFilters({
  filters,
  onFiltersChange,
  onReset,
  onCreateNew,
  isLoading,
  companies = [],
  isSuperAdmin = false
}: UserFiltersProps) {
  const hasActiveFilters = filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.companyId !== 'all'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-6 mb-8 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl transition-all duration-300">
            <Filter className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Filter Users</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Search and filter user accounts</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              onClick={onReset}
              disabled={isLoading}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          
          <Button
            onClick={onCreateNew}
            disabled={isLoading}
            className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Search Users
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              disabled={isLoading}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => onFiltersChange({ role: e.target.value })}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="production_manager">Production Manager</option>
            <option value="accountant">Accountant</option>
            <option value="sales_executive">Sales Executive</option>
            <option value="security_guard">Security Guard</option>
            <option value="operator">Operator</option>
            <option value="helper">Helper</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value })}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Permission Module Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Permission Module
          </label>
          <select
            value={filters.permissionModule}
            onChange={(e) => onFiltersChange({ permissionModule: e.target.value })}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Modules</option>
            <option value="inventory">Inventory</option>
            <option value="production">Production</option>
            <option value="orders">Orders</option>
            <option value="financial">Financial</option>
            <option value="security">Security</option>
            <option value="hr">Human Resources</option>
            <option value="admin">Administration</option>
          </select>
        </div>

        {/* Permission Action Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Permission Action
          </label>
          <select
            value={filters.permissionAction}
            onChange={(e) => onFiltersChange({ permissionAction: e.target.value })}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Actions</option>
            <option value="view">View</option>
            <option value="create">Create</option>
            <option value="edit">Edit</option>
            <option value="delete">Delete</option>
            <option value="approve">Approve</option>
            <option value="viewReports">View Reports</option>
            <option value="userManagement">User Management</option>
            <option value="systemSettings">System Settings</option>
          </select>
        </div>

        {/* Company Filter - Only for Super Admins */}
        {isSuperAdmin && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Company
            </label>
            <select
              value={filters.companyId}
              onChange={(e) => onFiltersChange({ companyId: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
      </div>

      {/* Sort Options */}
      <div className="mt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                onFiltersChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' })
              }}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="email-desc">Email (Z-A)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="lastLogin-desc">Recent Login</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700">
                Search: "{filters.search}"
              </span>
            )}
            
            {filters.role !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                Role: {filters.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
            
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">
                Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
              </span>
            )}

            {filters.permissionModule !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                Module: {filters.permissionModule.charAt(0).toUpperCase() + filters.permissionModule.slice(1)}
              </span>
            )}

            {filters.permissionAction !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                Action: {filters.permissionAction.charAt(0).toUpperCase() + filters.permissionAction.slice(1)}
              </span>
            )}
            
            {filters.companyId !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                Company: {companies.find(c => c._id === filters.companyId)?.companyName || filters.companyId}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
