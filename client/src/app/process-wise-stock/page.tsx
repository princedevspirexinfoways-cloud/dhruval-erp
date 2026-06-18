'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  Filter, 
  Download,
  Calendar,
  Activity,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Factory,
  Scissors,
  Droplets,
  Palette,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  DollarSign
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import clsx from 'clsx'

export default function ProcessWiseStockPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  
  // State management
  const [selectedProcess, setSelectedProcess] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [includeDetails, setIncludeDetails] = useState(false)

  // Mock data for demonstration (replace with real API calls)
  const [stockData, setStockData] = useState({
    summary: {
      totalStock: 12500,
      stockGrowth: 8.5,
      activeProcesses: 6,
      processesGrowth: 2.1,
      totalValue: 2500000,
      valueGrowth: 12.3,
      lowStockItems: 15,
      lowStockGrowth: -5.2
    },
    processData: [
      {
        processId: 'proc_001',
        processName: 'Raw Material Stock',
        category: 'Raw Materials',
        currentStock: 3500,
        minStock: 1000,
        maxStock: 8000,
        unit: 'kg',
        value: 700000,
        status: 'normal',
        lastUpdated: '2024-01-15T10:30:00Z',
        trend: 'up'
      },
      {
        processId: 'proc_002',
        processName: 'Printing Process Stock',
        category: 'Printing',
        currentStock: 2800,
        minStock: 1500,
        maxStock: 5000,
        unit: 'meters',
        value: 560000,
        status: 'normal',
        lastUpdated: '2024-01-15T10:30:00Z',
        trend: 'stable'
      },
      {
        processId: 'proc_003',
        processName: 'Washing Process Stock',
        category: 'Washing',
        currentStock: 1200,
        minStock: 800,
        maxStock: 3000,
        unit: 'kg',
        value: 240000,
        status: 'low',
        lastUpdated: '2024-01-15T10:30:00Z',
        trend: 'down'
      },
      {
        processId: 'proc_004',
        processName: 'Finishing Process Stock',
        category: 'Finishing',
        currentStock: 900,
        minStock: 500,
        maxStock: 2000,
        unit: 'pieces',
        value: 180000,
        status: 'critical',
        lastUpdated: '2024-01-15T10:30:00Z',
        trend: 'down'
      },
      {
        processId: 'proc_005',
        processName: 'Packing Material Stock',
        category: 'Packing',
        currentStock: 2100,
        minStock: 1000,
        maxStock: 4000,
        unit: 'pieces',
        value: 420000,
        status: 'normal',
        lastUpdated: '2024-01-15T10:30:00Z',
        trend: 'stable'
      }
    ],
    stockTrends: [
      { period: 'Jan 1', raw: 3200, printing: 2500, washing: 1400, finishing: 1100, packing: 1900 },
      { period: 'Jan 2', raw: 3300, printing: 2600, washing: 1350, finishing: 1050, packing: 1950 },
      { period: 'Jan 3', raw: 3400, printing: 2700, washing: 1300, finishing: 1000, packing: 2000 },
      { period: 'Jan 4', raw: 3450, printing: 2750, washing: 1250, finishing: 950, packing: 2050 },
      { period: 'Jan 5', raw: 3500, printing: 2800, washing: 1200, finishing: 900, packing: 2100 }
    ],
    categoryDistribution: [
      { name: 'Raw Materials', value: 28, color: '#3b82f6' },
      { name: 'Printing', value: 22.4, color: '#10b981' },
      { name: 'Washing', value: 9.6, color: '#f59e0b' },
      { name: 'Finishing', value: 7.2, color: '#ef4444' },
      { name: 'Packing', value: 16.8, color: '#8b5cf6' }
    ]
  })

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  // Utility functions
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100'
      case 'low': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4" />
      case 'low': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  const getStockLevelColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    if (percentage >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const handleRefresh = () => {
    // Refresh data logic here
    console.log('Refreshing stock data...')
  }

  const filteredProcessData = stockData.processData.filter(process => {
    if (selectedProcess !== 'all' && process.category !== selectedProcess) return false
    if (selectedCategory !== 'all' && process.category !== selectedCategory) return false
    if (selectedStatus !== 'all' && process.status !== selectedStatus) return false
    return true
  })

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Process-Wise Stock Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Real-time monitoring of stock levels across all production processes
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Process Category</label>
                <select
                  value={selectedProcess}
                  onChange={(e) => setSelectedProcess(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Processes</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Printing">Printing</option>
                  <option value="Washing">Washing</option>
                  <option value="Finishing">Finishing</option>
                  <option value="Packing">Packing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low Stock</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeDetails}
                    onChange={(e) => setIncludeDetails(e.target.checked)}
                    className="mr-2"
                  />
                  Include Detailed Data
                </label>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stock</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatNumber(stockData.summary.totalStock)}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", stockData.summary.stockGrowth > 0 ? 'text-green-600' : 'text-red-600')}>
                  {stockData.summary.stockGrowth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="ml-1">{Math.abs(stockData.summary.stockGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Processes</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stockData.summary.activeProcesses}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", stockData.summary.processesGrowth > 0 ? 'text-green-600' : 'text-red-600')}>
                  {stockData.summary.processesGrowth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="ml-1">{Math.abs(stockData.summary.processesGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <Factory className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stockData.summary.totalValue)}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", stockData.summary.valueGrowth > 0 ? 'text-green-600' : 'text-red-600')}>
                  {stockData.summary.valueGrowth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="ml-1">{Math.abs(stockData.summary.valueGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stockData.summary.lowStockItems}
                </p>
                <div className={clsx("flex items-center text-sm mt-1", stockData.summary.lowStockGrowth < 0 ? 'text-green-600' : 'text-red-600')}>
                  {stockData.summary.lowStockGrowth < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span className="ml-1">{Math.abs(stockData.summary.lowStockGrowth)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Trends */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Stock Trends</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Raw Materials</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Printing</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockData.stockTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="raw" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="printing" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="washing" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Stock Distribution</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockData.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Process Stock Table */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Process Stock Details</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => {/* Export logic */}}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
          
          {filteredProcessData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProcessData.map((process, index) => {
                    const stockPercentage = getStockPercentage(process.currentStock, process.maxStock)
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                              {process.category === 'Raw Materials' && <Package className="h-5 w-5 text-purple-600" />}
                              {process.category === 'Printing' && <BarChart3 className="h-5 w-5 text-purple-600" />}
                              {process.category === 'Washing' && <Droplets className="h-5 w-5 text-purple-600" />}
                              {process.category === 'Finishing' && <Scissors className="h-5 w-5 text-purple-600" />}
                              {process.category === 'Packing' && <Package className="h-5 w-5 text-purple-600" />}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{process.processName}</div>
                              <div className="text-sm text-gray-500">{process.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatNumber(process.currentStock)} {process.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Min: {formatNumber(process.minStock)} | Max: {formatNumber(process.maxStock)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={clsx("h-2 rounded-full", getStockLevelColor(stockPercentage))}
                                style={{ width: `${stockPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{stockPercentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(process.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx("inline-flex px-2 py-1 text-xs font-semibold rounded-full", getStatusColor(process.status))}>
                            {getStatusIcon(process.status)}
                            <span className="ml-1 capitalize">{process.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTrendIcon(process.trend)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(process.lastUpdated).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No process data available for selected filters</div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
