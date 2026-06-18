'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Gauge,
  Zap,
  Wrench,
  Factory,
  Printer,
  Scissors,
  Droplets,
  Palette,
  Package,
  Eye,
  EyeOff,
  Filter,
  Download,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetRealTimeProductionDashboardQuery,
  useGetProductionTrackingDataQuery,
  useGetPrintingStatusQuery,
  useGetMachineWiseSummaryQuery,
  useUpdateProductionStatusMutation,
  useStartProductionStageMutation,
  useCompleteProductionStageMutation
} from '@/lib/api/productionTrackingApi'
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
  Cell,
  ComposedChart
} from 'recharts'
import clsx from 'clsx'

export default function RealTimeProductionPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  
  // State management
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds
  const [selectedFirm, setSelectedFirm] = useState('all')
  const [selectedMachine, setSelectedMachine] = useState('all')
  const [selectedProcess, setSelectedProcess] = useState('all')
  const [showAlerts, setShowAlerts] = useState(true)
  const [showCharts, setShowCharts] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)

  // API queries with auto-refresh
  const { data: realTimeData, isLoading: realTimeLoading, error: realTimeError, refetch: refetchRealTime } = useGetRealTimeProductionDashboardQuery({
    companyId: user?.companyId,
    refreshInterval: autoRefresh ? refreshInterval : 0,
    includeCharts: showCharts,
  })

  const { data: trackingData, isLoading: trackingLoading, error: trackingError, refetch: refetchTracking } = useGetProductionTrackingDataQuery({
    companyId: user?.companyId,
    firmId: selectedFirm !== 'all' ? selectedFirm : undefined,
    machineId: selectedMachine !== 'all' ? selectedMachine : undefined,
    includeDetails: true,
  })

  const { data: printingStatus, isLoading: printingLoading, error: printingError, refetch: refetchPrinting } = useGetPrintingStatusQuery({
    companyId: user?.companyId,
    machineId: selectedMachine !== 'all' ? selectedMachine : undefined,
  })

  const { data: machineSummary, isLoading: machineLoading, error: machineError, refetch: refetchMachine } = useGetMachineWiseSummaryQuery({
    companyId: user?.companyId,
    machineType: selectedProcess !== 'all' ? selectedProcess : undefined,
    includeMaintenance: true,
  })

  // Mutations
  const [updateStatus] = useUpdateProductionStatusMutation()
  const [startStage] = useStartProductionStageMutation()
  const [completeStage] = useCompleteProductionStageMutation()

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetchRealTime()
      refetchTracking()
      refetchPrinting()
      refetchMachine()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refetchRealTime, refetchTracking, refetchPrinting, refetchMachine])

  // Data processing
  const productionData = realTimeData?.data || {}
  const tracking = trackingData?.data || {}
  const printing = printingStatus?.data || []
  const machines = machineSummary?.data || []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  // Utility functions
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'on_hold': return 'text-orange-600 bg-orange-100'
      case 'delayed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Activity className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'on_hold': return <Pause className="h-4 w-4" />
      case 'delayed': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      case 'breakdown': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleUpdateStatus = async (jobId: string, status: string) => {
    try {
      await updateStatus({
        jobId,
        status: status as any,
        operatorId: user?._id || '',
      }).unwrap()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleStartStage = async (jobId: string, stageId: string) => {
    try {
      await startStage({
        jobId,
        stageId,
        operatorId: user?._id || '',
        startTime: new Date().toISOString(),
      }).unwrap()
    } catch (error) {
      console.error('Failed to start stage:', error)
    }
  }

  const handleCompleteStage = async (jobId: string, stageId: string) => {
    try {
      await completeStage({
        jobId,
        stageId,
        operatorId: user?._id || '',
        completionTime: new Date().toISOString(),
        qualityChecks: [],
      }).unwrap()
    } catch (error) {
      console.error('Failed to complete stage:', error)
    }
  }

  const isLoading = realTimeLoading || trackingLoading || printingLoading || machineLoading
  const hasError = realTimeError || trackingError || printingError || machineError

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
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
        </div>
      </AppLayout>
    )
  }

  if (hasError) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
          <div className="bg-white rounded-xl border border-red-500 shadow-lg p-6 text-center">
            <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Production Dashboard</h3>
            <p className="text-red-600">Failed to load real-time production data. Please try again.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Real-Time Production Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Live monitoring of production processes, machine status, and job progress
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  refetchRealTime()
                  refetchTracking()
                  refetchPrinting()
                  refetchMachine()
                }}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={clsx(
                  "flex items-center px-4 py-2 rounded-xl transition-colors",
                  autoRefresh 
                    ? "bg-green-500 text-white hover:bg-green-600" 
                    : "bg-gray-500 text-white hover:bg-gray-600"
                )}
              >
                {autoRefresh ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {autoRefresh ? 'Auto' : 'Manual'}
              </button>
              <select
                value={refreshInterval / 1000}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Firm</label>
              <select
                value={selectedFirm}
                onChange={(e) => setSelectedFirm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Firms</option>
                {/* Add firm options dynamically */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Machine</label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Machines</option>
                {/* Add machine options dynamically */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Process</label>
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Processes</option>
                <option value="printing">Printing</option>
                <option value="stitching">Stitching</option>
                <option value="washing">Washing</option>
                <option value="finishing">Finishing</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showAlerts}
                  onChange={(e) => setShowAlerts(e.target.checked)}
                  className="mr-2"
                />
                Show Alerts
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showCharts}
                  onChange={(e) => setShowCharts(e.target.checked)}
                  className="mr-2"
                />
                Show Charts
              </label>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-blue-600">
                  {(tracking as any)?.summary?.activeJobs || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Total: {(tracking as any)?.summary?.totalJobs || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <Factory className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Production Efficiency</p>
                <p className="text-3xl font-bold text-green-600">
                  {(tracking as any)?.summary?.productionEfficiency || 0}%
                </p>
                <p className="text-sm text-gray-500">
                  Target: 85%
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Machine Utilization</p>
                <p className="text-3xl font-bold text-purple-600">
                  {(tracking as any)?.summary?.machineUtilization || 0}%
                </p>
                <p className="text-sm text-gray-500">
                  Operational machines
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Gauge className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-3xl font-bold text-orange-600">
                  {(tracking as any)?.summary?.qualityScore || 0}%
                </p>
                <p className="text-sm text-gray-500">
                  Pass rate
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Production Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Printing Status */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Printer className="h-5 w-5 mr-2 text-blue-600" />
                Printing Status
              </h3>
              <div className="text-sm text-gray-600">
                {printing.filter((p: any) => p.status === 'in_progress').length} Active
              </div>
            </div>
            
            {printing.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {printing.map((job: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={clsx("px-2 py-1 text-xs font-semibold rounded-full", getStatusColor(job.status))}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1">{job.status.replace('_', ' ')}</span>
                        </span>
                        <span className="text-sm font-medium text-gray-900">#{job.jobNumber}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.printingType === 'table' ? 'Table' : 'Machine'}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-900 font-medium">{job.customerName}</div>
                      <div className="text-sm text-gray-600">{job.productName}</div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Started: {formatTime(job.startTime)}</span>
                      <span>ETA: {formatTime(job.estimatedCompletion)}</span>
                    </div>
                    
                    {job.status === 'in_progress' && (
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => handleUpdateStatus(job.jobId, 'on_hold')}
                          className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Hold
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(job.jobId, 'completed')}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No active printing jobs</div>
            )}
          </div>

          {/* Machine Status */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Machine Status
              </h3>
              <div className="text-sm text-gray-600">
                {machines.filter((m: any) => m.maintenanceStatus === 'operational').length} Operational
              </div>
            </div>
            
            {machines.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {machines.map((machine: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={clsx("px-2 py-1 text-xs font-semibold rounded-full", getMachineStatusColor(machine.maintenanceStatus))}>
                          {machine.maintenanceStatus}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{machine.machineName}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {machine.machineType}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Jobs:</span>
                          <span className="ml-2 font-medium">{machine.completedJobs}/{machine.totalJobs}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Efficiency:</span>
                          <span className="ml-2 font-medium">{machine.efficiency}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Uptime:</span>
                          <span className="ml-2 font-medium">{machine.uptime}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Production:</span>
                          <span className="ml-2 font-medium">{machine.totalProduction}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <div>Last Maintenance: {formatDate(machine.lastMaintenance)}</div>
                      <div>Next Maintenance: {formatDate(machine.nextMaintenance)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No machine data available</div>
            )}
          </div>
        </div>

        {/* Process Tracking */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Process Tracking
            </h3>
            <div className="text-sm text-gray-600">
              {(tracking as any)?.processTracking?.length || 0} Active Processes
            </div>
          </div>
          
          {(tracking as any)?.processTracking?.length > 0 ? (
            <div className="space-y-4">
                              {(tracking as any).processTracking.map((process: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">#{process.jobNumber}</span>
                      <span className="text-sm text-gray-600">{process.customerName}</span>
                      <span className="text-sm text-gray-500">{process.currentStage}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {process.overallProgress}% Complete
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${process.overallProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(process.stages).map(([stageName, stageData]: [string, any]) => (
                      <div key={stageName} className="text-center">
                        <div className="text-xs text-gray-600 mb-1 capitalize">{stageName}</div>
                        <div className={clsx(
                          "w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-medium",
                          stageData.status === 'completed' ? 'bg-green-100 text-green-800' :
                          stageData.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {stageData.status === 'completed' ? '✓' : 
                           stageData.status === 'in_progress' ? '⟳' : '○'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{stageData.progress}%</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => setSelectedJob(process.jobId)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleStartStage(process.jobId, 'current')}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Start Stage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No active processes</div>
          )}
        </div>

        {/* Charts Section */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production Trends */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productionData.productionTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Process Distribution */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productionData.processDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(productionData.processDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Section */}
        {showAlerts && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Production Alerts
              </h3>
              <div className="text-sm text-gray-600">
                {productionData.alerts?.length || 0} Active Alerts
              </div>
            </div>
            
            {productionData.alerts?.length > 0 ? (
              <div className="space-y-3">
                {productionData.alerts.map((alert: any, index: number) => (
                  <div key={index} className={clsx(
                    "border rounded-lg p-4",
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={clsx(
                          "px-2 py-1 text-xs font-semibold rounded-full",
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        )}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{alert.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{alert.message}</p>
                    {alert.jobId && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Job: </span>
                        <span className="text-xs font-medium text-blue-600">#{alert.jobId}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No active alerts</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
