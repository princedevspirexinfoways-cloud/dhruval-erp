'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  Zap, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  AlertTriangle,
  CheckCircle,
  Activity,
  Battery,
  Power,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetElectricalPanelsQuery, useGetElectricityStatsQuery, useGetElectricityTrendsQuery } from '@/lib/api/electricityApi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import clsx from 'clsx'

export default function ElectricityMonitoringPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedPanel, setSelectedPanel] = useState('all')

  // Fetch electrical panels data from API
  const { data: panelsData, isLoading, error } = useGetElectricalPanelsQuery({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  // Fetch electricity statistics
  const { data: electricityStats } = useGetElectricityStatsQuery({
    timeRange,
  })

  // Fetch electricity trends
  const { data: electricityTrends } = useGetElectricityTrendsQuery({
    timeRange,
    panelId: selectedPanel !== 'all' ? selectedPanel : undefined,
  })

  const electricalPanels = panelsData?.data || []
  const powerConsumptionData = electricityTrends?.data?.powerConsumptionData || []
  const voltageData = electricityTrends?.data?.voltageData || []
  const loadDistributionData = electricityTrends?.data?.loadDistributionData || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1"
    switch (status) {
      case 'operational':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'maintenance':
        return `${baseClasses} bg-blue-100 text-blue-600`
      case 'offline':
        return `${baseClasses} bg-gray-100 text-gray-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-3 w-3" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3" />
      case 'critical':
        return <AlertTriangle className="h-3 w-3" />
      case 'maintenance':
        return <Activity className="h-3 w-3" />
      case 'offline':
        return <Power className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const getVoltageColor = (voltage: number) => {
    if (voltage === 0) return 'text-gray-500'
    if (voltage < 380) return 'text-red-500'
    if (voltage < 400) return 'text-yellow-500'
    if (voltage <= 440) return 'text-green-500'
    return 'text-red-500'
  }

  const getLoadColor = (load: number) => {
    if (load < 60) return 'text-green-500'
    if (load < 80) return 'text-yellow-500'
    if (load < 95) return 'text-orange-500'
    return 'text-red-500'
  }

  const getTemperatureColor = (temp: number) => {
    if (temp < 40) return 'text-green-500'
    if (temp < 50) return 'text-yellow-500'
    if (temp < 60) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Electricity Monitoring
                </h1>
                <p className="text-gray-600 mt-1">
                  Real-time electrical system monitoring and control ({electricalPanels.length} panels)
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <BarChart3 className="h-4 w-4 mr-2" />
                Energy Report
              </button>
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Add Reading
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Power</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(electricityStats?.data?.totalPower || 0)} kW
                </p>
                <p className="text-sm text-green-600 mt-1">+5% from yesterday</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <Power className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Voltage</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(electricityStats?.data?.averageVoltage || 0)} V
                </p>
                <p className="text-sm text-gray-500 mt-1">Within range</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Battery className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-yellow-600">{electricityStats?.data?.totalAlerts || 0}</p>
                <p className="text-sm text-yellow-600 mt-1">Need attention</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Load</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(electricityStats?.data?.averageLoad || 0)}%
                </p>
                <p className="text-sm text-green-600 mt-1">Optimal range</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Power Consumption Chart */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Power Consumption</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={powerConsumptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="consumption" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Consumption (kW)" />
                  <Area type="monotone" dataKey="demand" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.4} name="Demand (kW)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Load Distribution Chart */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Load Distribution</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Load %</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loadDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="panel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="load" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Voltage & Current Trends */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Voltage & Current Trends</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Voltage (V)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Current (A)</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={voltageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="voltage" orientation="left" />
                <YAxis yAxisId="current" orientation="right" />
                <Tooltip />
                <Line yAxisId="voltage" type="monotone" dataKey="voltage" stroke="#3b82f6" strokeWidth={2} name="Voltage (V)" />
                <Line yAxisId="current" type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2} name="Current (A)" />
              </LineChart>
            </ResponsiveContainer>
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
                  placeholder="Search electrical panels..."
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
                <option value="operational">Operational</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <select
                value={selectedPanel}
                onChange={(e) => setSelectedPanel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option value="all">All Panels</option>
                {electricalPanels.map(panel => (
                  <option key={panel._id} value={panel._id}>{panel.panelName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Electrical Panels Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                    <div className="h-3 bg-blue-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-500 shadow-lg p-6 text-center">
            <Zap className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Panels</h3>
            <p className="text-red-600">Failed to load electrical panel data. Please try again.</p>
          </div>
        ) : electricalPanels.length === 0 ? (
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 text-center">
            <Zap className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No Panels Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? 'No electrical panels match your search criteria.'
                : 'No electrical panels have been configured yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {electricalPanels.map((panel) => (
            <div key={panel._id} className="bg-white rounded-xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{panel.panelName}</h3>
                    <p className="text-blue-100 text-sm">{panel.panelCode}</p>
                  </div>
                  <span className={getStatusBadge(panel.status)}>
                    {getStatusIcon(panel.status)}
                    <span className="capitalize">{panel.status}</span>
                  </span>
                </div>
              </div>

              {/* Panel Metrics */}
              <div className="p-6 space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={clsx("text-2xl font-bold", getVoltageColor(panel.voltage))}>
                      {panel.voltage} V
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <Battery className="h-3 w-3 mr-1" />
                      Voltage
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {panel.current} A
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <Zap className="h-3 w-3 mr-1" />
                      Current
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Power className="h-4 w-4 mr-1 text-green-500" />
                      Power:
                    </span>
                    <span className="font-medium text-gray-900">{panel.power} kW</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-purple-500" />
                      Load:
                    </span>
                    <span className={clsx("font-medium", getLoadColor(panel.load))}>{panel.load}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" />
                      Power Factor:
                    </span>
                    <span className="font-medium text-gray-900">{panel.powerFactor}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Temperature:</span>
                    <span className={clsx("font-medium", getTemperatureColor(panel.temperature))}>{panel.temperature}°C</span>
                  </div>
                </div>

                {/* Technician & Maintenance */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Technician:</span>
                    <span className="font-medium text-gray-900">{panel.technician}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next Maintenance:</span>
                    <span className="font-medium text-gray-900">{formatDate(panel.nextMaintenance)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-sm">Details</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="text-sm">Control</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span className="text-sm">History</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
