'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { Dispatch } from '@/lib/api/enhancedDispatchApi'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Truck,
  Calendar,
  Building,
  Package,
  User,
  Phone,
  FileText,
  Clock,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlayCircle,
  Zap,
  Edit3
} from 'lucide-react'
import { format } from 'date-fns'

interface DispatchListProps {
  dispatches: Dispatch[]
  onView?: (dispatch: Dispatch) => void
  onEdit?: (dispatch: Dispatch) => void
  onQuickUpdate?: (dispatch: Dispatch) => void
  onDelete?: (dispatch: Dispatch) => void
  onCreate?: () => void
  onRefresh?: () => void
  onStatusChange?: (dispatchId: string, newStatus: string) => void
  isLoading?: boolean
}

export const DispatchList = ({
  dispatches,
  onView,
  onEdit,
  onQuickUpdate,
  onDelete,
  onCreate,
  onRefresh,
  onStatusChange,
  isLoading = false
}: DispatchListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDispatchTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return '📦'
      case 'delivery':
        return '🚚'
      case 'transfer':
        return '🔄'
      case 'return':
        return '↩️'
      default:
        return '📋'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in-progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" /> },
    { value: 'in-progress', label: 'In Progress', icon: <PlayCircle className="h-4 w-4" /> },
    { value: 'completed', label: 'Completed', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'delivered', label: 'Delivered', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-4 w-4" /> }
  ]

  const filteredDispatches = dispatches.filter(dispatch => {
    const matchesSearch = 
      dispatch.dispatchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.sourceWarehouseId?.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.customerOrderId?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.deliveryPersonName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || dispatch.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || dispatch.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const stats = {
    total: dispatches.length,
    pending: dispatches.filter(d => d.status === 'pending').length,
    inProgress: dispatches.filter(d => d.status === 'in-progress').length,
    completed: dispatches.filter(d => d.status === 'completed' || d.status === 'delivered').length,
    cancelled: dispatches.filter(d => d.status === 'cancelled').length
  }

  const handleStatusChange = (dispatchId: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(dispatchId, newStatus)
    }
    setStatusDropdownOpen(null)
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Total Dispatches</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
                <p className="text-blue-200 text-xs mt-1 hidden sm:block">All time</p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
                <Truck className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs sm:text-sm font-medium mb-1">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.pending}</p>
                <p className="text-amber-200 text-xs mt-1 hidden sm:block">Awaiting action</p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs sm:text-sm font-medium mb-1">In Progress</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.inProgress}</p>
                <p className="text-indigo-200 text-xs mt-1 hidden sm:block">Active deliveries</p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
                <p className="text-emerald-200 text-xs mt-1">Successfully delivered</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <FileText className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">Cancelled</p>
                <p className="text-3xl font-bold">{stats.cancelled}</p>
                <p className="text-red-200 text-xs mt-1">Failed deliveries</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <XCircle className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="border-0 shadow-lg dark:shadow-gray-800/20">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-white">Dispatch Management</CardTitle>
            <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search dispatches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1 sm:flex-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1 sm:flex-none"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 w-full lg:w-auto">
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex-1 lg:flex-none"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                )}
                {onCreate && (
                  <Button
                    onClick={onCreate}
                    size="sm"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg flex-1 lg:flex-none"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Dispatch</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Dispatch Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Source & Destination
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Delivery Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status & Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredDispatches.map((dispatch) => (
                  <tr key={dispatch._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getDispatchTypeIcon(dispatch.dispatchType)}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{dispatch.dispatchNumber}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(dispatch.dispatchDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Building className="h-3 w-3" />
                          <span className="font-medium">{dispatch.companyId?.companyName}</span>
                        </div>
                        {/* Images */}
                        {dispatch.documents?.photos && dispatch.documents.photos.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {dispatch.documents.photos.slice(0, 3).map((photo, index) => (
                              <ImageWithFallback
                                key={index}
                                src={photo}
                                alt={`Dispatch photo ${index + 1}`}
                                className="w-8 h-8 object-cover rounded border border-gray-200"
                                fallbackClassName="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center"
                              />
                            ))}
                            {dispatch.documents.photos.length > 3 && (
                              <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                                +{dispatch.documents.photos.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1 bg-blue-100 rounded">
                            <Building className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">From:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.sourceWarehouseId?.warehouseName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1 bg-green-100 rounded">
                            <Package className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Order:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.customerOrderId?.orderNumber}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {dispatch.vehicleNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1 bg-gray-100 rounded">
                              <Truck className="h-3 w-3 text-gray-600" />
                            </div>
                            <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Vehicle:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.vehicleNumber}</p>
                            </div>
                          </div>
                        )}
                        {dispatch.deliveryPersonName && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1 bg-gray-100 rounded">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                            <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Person:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.deliveryPersonName}</p>
                            </div>
                          </div>
                        )}
                        {dispatch.deliveryPersonNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1 bg-gray-100 rounded">
                              <Phone className="h-3 w-3 text-gray-600" />
                            </div>
                            <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Phone:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.deliveryPersonNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(dispatch.status)}
                          <Badge className={`${getStatusColor(dispatch.status)} text-xs font-medium`}>
                            {dispatch.status}
                          </Badge>
                        </div>
                        <Badge className={`${getPriorityColor(dispatch.priority)} text-xs font-medium`}>
                          {dispatch.priority}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          Created: {format(new Date(dispatch.createdAt), 'MMM dd')}
                        </div>
                        {/* Quick Status Change Dropdown */}
                        {onStatusChange && (
                          <div className="relative">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatusDropdownOpen(statusDropdownOpen === dispatch._id ? null : dispatch._id)}
                              className="flex items-center gap-1 text-xs border-gray-300 hover:bg-gray-50"
                            >
                              Change Status
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            {statusDropdownOpen === dispatch._id && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                                {statusOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(dispatch._id, option.value)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-900 dark:text-white"
                                  >
                                    {option.icon}
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(dispatch)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onQuickUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onQuickUpdate(dispatch)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-2"
                            title="Quick Update"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(dispatch)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 p-2"
                            title="Edit Dispatch"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(dispatch)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
                            title="Delete Dispatch"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 p-4">
            {filteredDispatches.map((dispatch) => (
              <Card key={dispatch._id} className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md dark:hover:shadow-gray-800/20 transition-shadow">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getDispatchTypeIcon(dispatch.dispatchType)}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{dispatch.dispatchNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(dispatch.dispatchDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dispatch.status)}
                      <Badge className={`${getStatusColor(dispatch.status)} text-xs font-medium`}>
                        {dispatch.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <Building className="h-3 w-3" />
                    <span className="font-medium">{dispatch.companyId?.companyName}</span>
                  </div>

                  {/* Source & Destination */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1 bg-blue-100 rounded">
                        <Building className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">From:</span>
                        <p className="font-medium text-gray-900">{dispatch.sourceWarehouseId?.warehouseName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1 bg-green-100 rounded">
                        <Package className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">Order:</span>
                        <p className="font-medium text-gray-900">{dispatch.customerOrderId?.orderNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="space-y-2 mb-4">
                    {dispatch.vehicleNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 bg-gray-100 rounded">
                          <Truck className="h-3 w-3 text-gray-600" />
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Vehicle:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.vehicleNumber}</p>
                        </div>
                      </div>
                    )}
                    {dispatch.deliveryPersonName && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 bg-gray-100 rounded">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Person:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.deliveryPersonName}</p>
                        </div>
                      </div>
                    )}
                    {dispatch.deliveryPersonNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 bg-gray-100 rounded">
                          <Phone className="h-3 w-3 text-gray-600" />
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Phone:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{dispatch.deliveryPersonNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  {dispatch.documents?.photos && dispatch.documents.photos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Photos:</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {dispatch.documents.photos.map((photo, index) => (
                          <ImageWithFallback
                            key={index}
                            src={photo}
                            alt={`Dispatch photo ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border border-gray-200"
                            fallbackClassName="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(dispatch.priority)} text-xs font-medium`}>
                        {dispatch.priority}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {format(new Date(dispatch.createdAt), 'MMM dd')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(dispatch)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onQuickUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickUpdate(dispatch)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-1"
                          title="Quick Update"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(dispatch)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 p-1"
                          title="Edit Dispatch"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(dispatch)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                          title="Delete Dispatch"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Status Change for Mobile */}
                  {onStatusChange && (
                    <div className="mt-3">
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStatusDropdownOpen(statusDropdownOpen === dispatch._id ? null : dispatch._id)}
                          className="flex items-center gap-1 text-xs border-gray-300 hover:bg-gray-50 w-full justify-between"
                        >
                          <span>Change Status</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        {statusDropdownOpen === dispatch._id && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                            {statusOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleStatusChange(dispatch._id, option.value)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-900 dark:text-white"
                              >
                                {option.icon}
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDispatches.length === 0 && (
            <div className="text-center py-16">
              <div className="relative mx-auto w-24 h-24 mb-6">
                <Truck className="w-24 h-24 text-gray-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-10 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No dispatches found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first dispatch'}
              </p>
              {onCreate && (
                <Button
                  onClick={onCreate}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Dispatch
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
