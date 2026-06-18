'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  Thermometer, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  AlertTriangle,
  CheckCircle,
  Activity,
  Gauge,
  Flame,
  Droplets,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetBoilersQuery, useGetBoilerStatsQuery, useGetBoilerTrendsQuery } from '@/lib/api/boilerApi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import clsx from 'clsx'

export default function BoilerMonitoringPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedBoiler, setSelectedBoiler] = useState('all')

  // Fetch boilers data from API
  const { data: boilersData, isLoading, error } = useGetBoilersQuery({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  // Fetch boiler statistics
  const { data: boilerStats } = useGetBoilerStatsQuery({
    timeRange,
  })

  // Fetch boiler trends
  const { data: boilerTrends } = useGetBoilerTrendsQuery({
    timeRange,
    boilerId: selectedBoiler !== 'all' ? selectedBoiler : undefined,
  })

  const boilers = boilersData?.data || []
  const temperatureData = boilerTrends?.data?.temperatureData || []
  const efficiencyData = boilerTrends?.data?.efficiencyData || []

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
        return <Activity className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const getTemperatureColor = (temp: number) => {
    if (temp === 0) return 'text-gray-500'
    if (temp < 400) return 'text-blue-500'
    if (temp < 500) return 'text-green-500'
    if (temp < 550) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getPressureColor = (pressure: number) => {
    if (pressure === 0) return 'text-gray-500'
    if (pressure < 10) return 'text-blue-500'
    if (pressure < 15) return 'text-green-500'
    if (pressure < 18) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-orange-50 via-white to-red-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-orange-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Boiler Monitoring
                </h1>
                <p className="text-gray-600 mt-1">
                  Real-time monitoring and control of boiler systems ({boilers.length} units)
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </button>
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Add Reading
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Boilers</p>
                <p className="text-3xl font-bold text-green-600">{boilerStats?.data?.activeBoilers || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Running normally</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Temperature</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(boilerStats?.data?.averageTemperature || 0)}°C
                </p>
                <p className="text-sm text-green-600 mt-1">Within range</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                <Thermometer className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-3xl font-bold text-yellow-600">{boilerStats?.data?.totalAlerts || 0}</p>
                <p className="text-sm text-yellow-600 mt-1">Need attention</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(boilerStats?.data?.averageEfficiency || 0)}%
                </p>
                <p className="text-sm text-green-600 mt-1">+2% this week</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature & Pressure Chart */}
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Temperature & Pressure Trends</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="temp" orientation="left" />
                  <YAxis yAxisId="pressure" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} name="Temperature (°C)" />
                  <Line yAxisId="pressure" type="monotone" dataKey="pressure" stroke="#3b82f6" strokeWidth={2} name="Pressure (bar)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency Chart */}
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Efficiency Trends</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Efficiency %</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="efficiency" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search boilers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-gray-900"
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
                value={selectedBoiler}
                onChange={(e) => setSelectedBoiler(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option value="all">All Boilers</option>
                {boilers.map(boiler => (
                  <option key={boiler._id} value={boiler._id}>{boiler.boilerName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Boilers Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-orange-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-orange-200 rounded w-3/4"></div>
                    <div className="h-3 bg-orange-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-500 shadow-lg p-6 text-center">
            <Flame className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Boilers</h3>
            <p className="text-red-600">Failed to load boiler data. Please try again.</p>
          </div>
        ) : boilers.length === 0 ? (
          <div className="bg-white rounded-xl border border-orange-200 shadow-lg p-6 text-center">
            <Flame className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No Boilers Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? 'No boilers match your search criteria.'
                : 'No boilers have been configured yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {boilers.map((boiler) => (
            <div key={boiler._id} className="bg-white rounded-xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
              {/* Boiler Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{boiler.boilerName}</h3>
                    <p className="text-orange-100 text-sm">{boiler.boilerCode}</p>
                  </div>
                  <span className={getStatusBadge(boiler.status)}>
                    {getStatusIcon(boiler.status)}
                    <span className="capitalize">{boiler.status}</span>
                  </span>
                </div>
              </div>

              {/* Boiler Metrics */}
              <div className="p-6 space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={clsx("text-2xl font-bold", getTemperatureColor(boiler.temperature))}>
                      {boiler.temperature}°C
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <Thermometer className="h-3 w-3 mr-1" />
                      Temperature
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={clsx("text-2xl font-bold", getPressureColor(boiler.pressure))}>
                      {boiler.pressure} bar
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <Gauge className="h-3 w-3 mr-1" />
                      Pressure
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-blue-500" />
                      Efficiency:
                    </span>
                    <span className="font-medium text-gray-900">{boiler.efficiency}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                      Water Level:
                    </span>
                    <span className="font-medium text-gray-900">{boiler.waterLevel}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-green-500" />
                      Steam Output:
                    </span>
                    <span className="font-medium text-gray-900">{boiler.steamOutput} kg/h</span>
                  </div>
                </div>

                {/* Operator & Maintenance */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Operator:</span>
                    <span className="font-medium text-gray-900">{boiler.operator}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next Maintenance:</span>
                    <span className="font-medium text-gray-900">{formatDate(boiler.nextMaintenance)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors">
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-sm">Details</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
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
