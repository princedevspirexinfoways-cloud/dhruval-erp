'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveContainer, ResponsiveGrid } from '@/components/ui/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { 
  Factory, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  AlertCircle,
  Printer,
  Droplets,
  Scissors,
  Palette,
  Users,
  Building,
  Activity,
  RefreshCw
} from 'lucide-react'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import {
  useGetProductionTrackingDataQuery,
  useGetPrintingStatusQuery,
  useGetJobWorkTrackingQuery,
  useGetDailyProductionSummaryQuery,
  useUpdateProductionStatusMutation,
  useStartProductionStageMutation,
  useCompleteProductionStageMutation
} from '@/lib/api/productionTrackingApi'

export default function EnhancedProductionPage() {
  const user = useSelector(selectCurrentUser)
  const [activeTab, setActiveTab] = useState('realtime')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFirm, setSelectedFirm] = useState('all')
  const [selectedMachine, setSelectedMachine] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds

  // Real-time API queries
  const { 
    data: trackingData, 
    isLoading: trackingLoading, 
    error: trackingError,
    refetch: refetchTracking 
  } = useGetProductionTrackingDataQuery({
    companyId: user?.companyId,
    includeDetails: true
  })

  // Type the production data properly
  const productionData = (trackingData?.data || {}) as {
    summary?: {
      activeJobs?: number
      completedJobs?: number
      totalProduction?: number
      productionEfficiency?: number
    }
  }

  const { 
    data: printingStatus, 
    isLoading: printingLoading, 
    error: printingError,
    refetch: refetchPrinting 
  } = useGetPrintingStatusQuery({
    companyId: user?.companyId
  })

  const { 
    data: jobWorkData, 
    isLoading: jobWorkLoading, 
    error: jobWorkError,
    refetch: refetchJobWork 
  } = useGetJobWorkTrackingQuery({
    companyId: user?.companyId
  })

  const { 
    data: dailySummary, 
    isLoading: dailySummaryLoading, 
    error: dailySummaryError,
    refetch: refetchDailySummary 
  } = useGetDailyProductionSummaryQuery({
    companyId: user?.companyId,
    date: new Date().toISOString().split('T')[0]
  })

  // Mutations
  const [updateStatus] = useUpdateProductionStatusMutation()
  const [startStage] = useStartProductionStageMutation()
  const [completeStage] = useCompleteProductionStageMutation()

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetchTracking()
      refetchPrinting()
      refetchJobWork()
      refetchDailySummary()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refetchTracking, refetchPrinting, refetchJobWork, refetchDailySummary])

  // Data processing
  const printingData = printingStatus?.data || []
  const jobWorkDataList = jobWorkData?.data || []
  const dailySummaryData = dailySummary?.data || []

  const currentTime = new Date()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'table': return <Printer className="h-4 w-4" />
      case 'machine': return <Factory className="h-4 w-4" />
      case 'washing': return <Droplets className="h-4 w-4" />
      case 'stitching': return <Scissors className="h-4 w-4" />
      case 'finishing': return <Palette className="h-4 w-4" />
      default: return <Factory className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'on_hold': return 'bg-orange-100 text-orange-800'
      case 'delayed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const handleStatusUpdate = async (jobId: string, stageId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'delayed') => {
    try {
      await updateStatus({
        jobId,
        stageId,
        status: newStatus
      }).unwrap()
      
      // Refetch data
      refetchTracking()
      refetchPrinting()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleStartStage = async (jobId: string, stageId: string) => {
    try {
      await startStage({
        jobId,
        stageId,
        operatorId: user?._id || '',
        startTime: new Date().toISOString()
      }).unwrap()
      
      refetchTracking()
    } catch (error) {
      console.error('Error starting stage:', error)
    }
  }

  const handleCompleteStage = async (jobId: string, stageId: string, completedQuantity: number) => {
    try {
      await completeStage({
        jobId,
        stageId,
        operatorId: user?._id || '',
        completionTime: new Date().toISOString(),
        qualityChecks: [],
        notes: `Completed with quantity: ${completedQuantity}`
      }).unwrap()
      
      refetchTracking()
    } catch (error) {
      console.error('Error completing stage:', error)
    }
  }

  return (
    <AppLayout>
      <ResponsiveContainer className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Enhanced Production Tracking"
          description={`Real-time production monitoring - ${currentTime.toLocaleTimeString()}`}
          icon={<Factory className="h-6 w-6 text-white" />}
          actions={
            <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchTracking()
                refetchPrinting()
                refetchJobWork()
                refetchDailySummary()
              }}
              disabled={trackingLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${trackingLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="h-4 w-4 mr-2" />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
                      </div>
          }
        />

        {/* Stats Cards */}
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {productionData.summary?.activeJobs || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">
                    {productionData.summary?.completedJobs || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Production</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {productionData.summary?.totalProduction || 0}
                  </p>
                </div>
                <Factory className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Efficiency</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {productionData.summary?.productionEfficiency?.toFixed(1) || 0}%
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'realtime'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Real-time Printing
          </button>
          <button
            onClick={() => setActiveTab('jobwork')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'jobwork'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Job Work Tracking
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'daily'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Factory className="h-4 w-4 inline mr-2" />
            Daily Summary
          </button>
        </div>

        {/* Tab Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'realtime' && 'Real-time Printing Status'}
              {activeTab === 'jobwork' && 'Job Work Tracking'}
              {activeTab === 'daily' && 'Daily Production Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Real-time Printing Tab */}
            {activeTab === 'realtime' && (
              <div className="space-y-4">
                {printingLoading ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading printing status...</p>
                  </div>
                ) : printingData.length === 0 ? (
                  <div className="text-center py-8">
                    <Printer className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No active printing jobs</p>
                  </div>
                ) : (
                  printingData.map((job: any) => (
                    <div key={job.jobId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(job.printingType)}
                          <div>
                            <p className="font-medium text-gray-900">{job.jobNumber}</p>
                            <p className="text-sm text-gray-600">{job.productName}</p>
                            <p className="text-xs text-gray-500">Customer: {job.customerName}</p>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {job.progress?.toFixed(1) || 0}%
                          </p>
                          <p className="text-sm text-gray-600">
                            Started: {job.startTime ? formatTime(job.startTime) : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            ETA: {job.estimatedCompletion ? formatTime(job.estimatedCompletion) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${job.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(job.jobId, job.stageId, 'on_hold')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Hold
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(job.jobId, job.stageId, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Job Work Tracking Tab */}
            {activeTab === 'jobwork' && (
              <div className="space-y-4">
                {jobWorkLoading ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading job work data...</p>
                  </div>
                ) : jobWorkDataList.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No job work data available</p>
                  </div>
                ) : (
                  jobWorkDataList.map((job: any) => (
                    <div key={job.jobId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{job.jobNumber}</p>
                            <p className="text-sm text-gray-600">Customer: {job.customerName}</p>
                            <p className="text-xs text-gray-500">
                              Type: {job.jobType === 'in_house' ? 'In-house' : 'Third-party'}
                            </p>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {job.progress?.toFixed(1) || 0}%
                          </p>
                          <p className="text-sm text-gray-600">
                            Start: {job.startDate ? formatDate(job.startDate) : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Due: {job.estimatedCompletion ? formatDate(job.estimatedCompletion) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${job.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Daily Summary Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-4">
                {dailySummaryLoading ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading daily summary...</p>
                  </div>
                ) : dailySummaryData.length === 0 ? (
                  <div className="text-center py-8">
                    <Factory className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No daily summary data available</p>
                  </div>
                ) : (
                  dailySummaryData.map((summary: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            Date: {summary._id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total Orders: {summary.totalOrders}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {summary.overallEfficiency?.toFixed(1) || 0}% Efficiency
                          </p>
                          <p className="text-sm text-gray-600">
                            Completed: {summary.completedQuantity}
                          </p>
                        </div>
                      </div>
                      
                      {/* Firm-wise breakdown */}
                      {summary.firmWiseSummary && summary.firmWiseSummary.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Firm-wise Breakdown:</p>
                          <div className="space-y-2">
                            {summary.firmWiseSummary.map((firm: any, firmIndex: number) => (
                              <div key={firmIndex} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                <span>{firm.firmId || 'Unknown Firm'} - {firm.processType}</span>
                                <span>
                                  {firm.totalOrders} orders, {firm.efficiency?.toFixed(1) || 0}% efficiency
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </ResponsiveContainer>
    </AppLayout>
  )
}
