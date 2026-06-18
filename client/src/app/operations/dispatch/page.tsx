'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  MapPin,
  Clock,
  Package,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Navigation,
  Calendar,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { CreateEditModal } from '@/components/modals/CreateEditModal'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import clsx from 'clsx'

export default function DispatchManagementPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data - replace with real API calls
  const dispatches = [
    {
      _id: '1',
      dispatchNumber: 'DSP-2025-001',
      orderNumber: 'SO-2025-001',
      customerName: 'ABC Manufacturing Ltd',
      destination: 'Mumbai, Maharashtra',
      distance: 450,
      vehicleNumber: 'MH-01-AB-1234',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91-9876543210',
      status: 'in_transit',
      priority: 'high',
      dispatchDate: '2025-01-30T08:00:00Z',
      estimatedDelivery: '2025-01-31T18:00:00Z',
      actualDelivery: null,
      items: [
        { name: 'Steel Rods 12mm', quantity: 100, weight: 500 },
        { name: 'Safety Helmets', quantity: 50, weight: 25 }
      ],
      totalWeight: 525,
      totalValue: 125000,
      notes: 'Urgent delivery required'
    },
    {
      _id: '2',
      dispatchNumber: 'DSP-2025-002',
      orderNumber: 'SO-2025-002',
      customerName: 'XYZ Industries Pvt Ltd',
      destination: 'Pune, Maharashtra',
      distance: 150,
      vehicleNumber: 'MH-02-CD-5678',
      driverName: 'Suresh Patel',
      driverPhone: '+91-9876543211',
      status: 'delivered',
      priority: 'medium',
      dispatchDate: '2025-01-29T10:00:00Z',
      estimatedDelivery: '2025-01-29T16:00:00Z',
      actualDelivery: '2025-01-29T15:30:00Z',
      items: [
        { name: 'Hydraulic Oil 20L', quantity: 25, weight: 500 },
        { name: 'Filters', quantity: 10, weight: 15 }
      ],
      totalWeight: 515,
      totalValue: 85000,
      notes: 'Standard delivery'
    },
    {
      _id: '3',
      dispatchNumber: 'DSP-2025-003',
      orderNumber: 'SO-2025-003',
      customerName: 'Tech Solutions Inc',
      destination: 'Bangalore, Karnataka',
      distance: 850,
      vehicleNumber: 'KA-03-EF-9012',
      driverName: 'Amit Singh',
      driverPhone: '+91-9876543212',
      status: 'pending',
      priority: 'low',
      dispatchDate: '2025-01-31T06:00:00Z',
      estimatedDelivery: '2025-02-02T18:00:00Z',
      actualDelivery: null,
      items: [
        { name: 'Computer Hardware', quantity: 5, weight: 50 },
        { name: 'Cables', quantity: 100, weight: 25 }
      ],
      totalWeight: 75,
      totalValue: 195000,
      notes: 'Handle with care - fragile items'
    }
  ]

  // Mock chart data
  const deliveryTrends = [
    { month: 'Jan', dispatches: 45, onTime: 42, delayed: 3 },
    { month: 'Feb', dispatches: 52, onTime: 48, delayed: 4 },
    { month: 'Mar', dispatches: 48, onTime: 46, delayed: 2 },
    { month: 'Apr', dispatches: 55, onTime: 51, delayed: 4 },
    { month: 'May', dispatches: 60, onTime: 57, delayed: 3 },
    { month: 'Jun', dispatches: 58, onTime: 55, delayed: 3 }
  ]

  const statusDistribution = [
    { name: 'Delivered', value: 45, color: '#10b981' },
    { name: 'In Transit', value: 25, color: '#3b82f6' },
    { name: 'Pending', value: 15, color: '#f59e0b' },
    { name: 'Delayed', value: 10, color: '#ef4444' },
    { name: 'Cancelled', value: 5, color: '#6b7280' }
  ]

  const dispatchFields = [
    { name: 'orderNumber', label: 'Order Number', type: 'text' as const, required: true },
    { name: 'customerName', label: 'Customer Name', type: 'text' as const, required: true },
    { name: 'destination', label: 'Destination', type: 'text' as const, required: true },
    { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text' as const, required: true },
    { name: 'driverName', label: 'Driver Name', type: 'text' as const, required: true },
    { name: 'driverPhone', label: 'Driver Phone', type: 'tel' as const, required: true },
    { 
      name: 'priority', 
      label: 'Priority', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    },
    { name: 'dispatchDate', label: 'Dispatch Date', type: 'datetime-local' as const, required: true },
    { name: 'estimatedDelivery', label: 'Estimated Delivery', type: 'datetime-local' as const, required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' as const }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      case 'dispatched':
        return `${baseClasses} bg-blue-100 text-blue-600`
      case 'in_transit':
        return `${baseClasses} bg-purple-100 text-purple-600`
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'delayed':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'dispatched':
        return <Truck className="h-3 w-3" />
      case 'in_transit':
        return <Navigation className="h-3 w-3" />
      case 'delivered':
        return <CheckCircle className="h-3 w-3" />
      case 'delayed':
        return <AlertTriangle className="h-3 w-3" />
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (priority) {
      case 'urgent':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-600`
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      case 'low':
        return `${baseClasses} bg-green-100 text-green-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getDeliveryStatus = (estimated: string, actual: string | null) => {
    if (!actual) return null
    const estimatedTime = new Date(estimated).getTime()
    const actualTime = new Date(actual).getTime()
    const diffHours = (actualTime - estimatedTime) / (1000 * 60 * 60)
    
    if (diffHours <= 0) return { status: 'on-time', text: 'On Time', color: 'text-green-600' }
    if (diffHours <= 2) return { status: 'slight-delay', text: 'Slight Delay', color: 'text-yellow-600' }
    return { status: 'delayed', text: 'Delayed', color: 'text-red-600' }
  }

  const handleCreateDispatch = async (data: any) => {
    console.log('Creating dispatch:', data)
    // Implement API call
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Dispatch Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage all shipments and deliveries ({dispatches.length} active)
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Dispatch
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dispatches</p>
                <p className="text-3xl font-bold text-gray-900">{dispatches.length}</p>
                <p className="text-sm text-green-600 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-3xl font-bold text-sky-600">{dispatches.filter(d => d.status === 'in_transit').length}</p>
                <p className="text-sm text-gray-500 mt-1">Active shipments</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center">
                <Navigation className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-3xl font-bold text-green-600">{dispatches.filter(d => d.status === 'delivered').length}</p>
                <p className="text-sm text-green-600 mt-1">Completed</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-cyan-600">
                  {formatCurrency(dispatches.reduce((sum, d) => sum + d.totalValue, 0))}
                </p>
                <p className="text-sm text-green-600 mt-1">+12% growth</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Performance */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Delivery Performance</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>On Time</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Delayed</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={deliveryTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="onTime" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="delayed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Dispatch Status Distribution</h3>
              <div className="text-sm text-gray-600">
                Total: {statusDistribution.reduce((sum, item) => sum + item.value, 0)}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dispatches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="dispatched">Dispatched</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dispatches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {dispatches.map((dispatch) => {
            const deliveryStatus = getDeliveryStatus(dispatch.estimatedDelivery, dispatch.actualDelivery)
            return (
              <div key={dispatch._id} className="bg-white rounded-xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
                {/* Dispatch Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{dispatch.dispatchNumber}</h3>
                      <p className="text-blue-100 text-sm">{dispatch.orderNumber}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={getStatusBadge(dispatch.status)}>
                        {getStatusIcon(dispatch.status)}
                        <span className="capitalize">{dispatch.status.replace('_', ' ')}</span>
                      </span>
                      <span className={getPriorityBadge(dispatch.priority)}>
                        {dispatch.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dispatch Details */}
                <div className="p-6 space-y-4">
                  {/* Customer & Destination */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{dispatch.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{dispatch.customerName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Truck className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{dispatch.vehicleNumber}</span>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Driver:</span>
                      <span className="font-medium text-gray-900">{dispatch.driverName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{dispatch.driverPhone}</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dispatch Date:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(dispatch.dispatchDate)} {formatTime(dispatch.dispatchDate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Est. Delivery:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(dispatch.estimatedDelivery)} {formatTime(dispatch.estimatedDelivery)}
                      </span>
                    </div>
                    {dispatch.actualDelivery && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Actual Delivery:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {formatDate(dispatch.actualDelivery)} {formatTime(dispatch.actualDelivery)}
                          </span>
                          {deliveryStatus && (
                            <span className={clsx("text-xs font-medium", deliveryStatus.color)}>
                              ({deliveryStatus.text})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipment Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{dispatch.items.length}</p>
                      <p className="text-xs text-gray-500">Items</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(dispatch.totalValue)}</p>
                      <p className="text-xs text-gray-500">Value</p>
                    </div>
                  </div>

                  {/* Weight & Distance */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium text-gray-900">{dispatch.totalWeight} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium text-gray-900">{dispatch.distance} km</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="text-sm">Track</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center px-3 py-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="text-sm">Edit</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      <span className="text-sm">Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Create/Edit Modal */}
        <CreateEditModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDispatch}
          title="Create New Dispatch"
          fields={dispatchFields}
          submitText="Create Dispatch"
        />
      </div>
    </AppLayout>
  )
}
