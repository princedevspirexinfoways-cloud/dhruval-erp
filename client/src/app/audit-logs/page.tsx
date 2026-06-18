'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Shield,
  Search,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Download
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { SecurityHeader } from '@/components/ui/PageHeader'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetAuditLogsQuery, useGetAuditStatsQuery } from '@/lib/api/auditApi'
// import clsx from 'clsx' // Unused

export default function AuditLogsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Fetch audit logs data
  const { data: logsData, isLoading, error } = useGetAuditLogsQuery({
    page,
    limit: 20,
    search: searchTerm,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    entityType: entityFilter !== 'all' ? entityFilter : undefined,
    userId: userFilter !== 'all' ? userFilter : undefined
  })

  // Fetch audit statistics
  const { data: auditStats } = useGetAuditStatsQuery({})

  const logs = logsData?.data || []
  const pagination = logsData?.pagination

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'update':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'logout':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-sky-500" />
    }
  }

  const getActionBadge = (action: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (action) {
      case 'create':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'update':
        return `${baseClasses} bg-blue-100 text-blue-600`
      case 'delete':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'login':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'logout':
        return `${baseClasses} bg-gray-100 text-gray-600`
      case 'failed_login':
        return `${baseClasses} bg-red-100 text-red-600`
      default:
        return `${baseClasses} bg-sky-100 text-sky-600`
    }
  }

  const getRiskLevel = (log: { action: string }) => {
    if (log.action === 'delete' || log.action === 'failed_login') return 'high'
    if (log.action === 'update' || log.action === 'login') return 'medium'
    return 'low'
  }

  const getRiskBadge = (risk: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (risk) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      case 'low':
        return `${baseClasses} bg-green-100 text-green-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* New Header */}
        <SecurityHeader
          title="Audit Logs"
          description={`Track system activities and security events (${logs.length} logs)`}
          icon={<Shield className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={() => window.location.reload()}
        >
          <button className="flex items-center px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 border border-white transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </SecurityHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Events</p>
                <p className="text-2xl font-bold text-black">{auditStats?.data?.totalLogs || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-sky-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Today&apos;s Events</p>
                <p className="text-2xl font-bold text-blue-600">{auditStats?.data?.todayLogs || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{auditStats?.data?.highRiskLogs || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{auditStats?.data?.activeUsers || 0}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-sky-500 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-500" />
                <input
                  type="text"
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
              >
                <option value="all">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="failed_login">Failed Login</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
              >
                <option value="all">All Entities</option>
                <option value="User">Users</option>
                <option value="Customer">Customers</option>
                <option value="Supplier">Suppliers</option>
                <option value="Order">Orders</option>
                <option value="Invoice">Invoices</option>
                <option value="Product">Products</option>
              </select>
            </div>

            {/* User Filter */}
            <div>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
              >
                <option value="all">All Users</option>
                {/* User options will be populated from API */}
              </select>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl border-2 border-sky-500 p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-4 bg-sky-200 rounded w-1/8"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/4"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/8"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border-2 border-red-500 p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Audit Logs</h3>
            <p className="text-red-600">Failed to load audit logs. Please try again.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-sky-500 p-6 text-center">
            <Shield className="h-12 w-12 text-sky-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No Audit Logs Found</h3>
            <p className="text-black opacity-75">
              {searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || userFilter !== 'all'
                ? 'No audit logs match your search criteria.'
                : 'No audit logs have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-sky-500 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sky-200">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Risk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-sky-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-sky-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-sky-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-black">
                              {log.user?.name || 'System'}
                            </div>
                            <div className="text-sm text-sky-600">
                              {log.user?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <span className={getActionBadge(log.action)}>
                            {log.action?.replace('_', ' ') || 'Unknown Action'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {log.entityType}
                        </div>
                        {log.entityId && (
                          <div className="text-sm text-sky-600">
                            ID: {log.entityId.slice(-8)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black max-w-xs truncate">
                          {log.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRiskBadge(getRiskLevel(log))}>
                          {getRiskLevel(log)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black font-mono">
                          {log.ipAddress || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-sky-500 hover:text-black p-1 rounded hover:bg-sky-50">
                          <Eye className="h-4 w-4" />
                        </button>
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
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-black">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
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
