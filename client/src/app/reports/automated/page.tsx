'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectCurrentCompany } from '@/lib/features/auth/authSlice'
import { AppLayout } from '@/components/layout/AppLayout'
import { ReportsHeader } from '@/components/ui/PageHeader'
import {
  useGetAutomatedReportsStatusQuery,
  useTriggerManualReportMutation,
  useGetReportHistoryQuery,
  useGetReportAnalyticsQuery
} from '@/lib/api/automatedReportsApi'
import { 
  BarChart3, 
  Clock, 
  FileText, 
  Mail, 
  Download, 
  RefreshCw,
  Play,
  Pause,
  Settings,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

export default function AutomatedReportsPage() {
  const user = useSelector(selectCurrentUser)
  const currentCompany = useSelector(selectCurrentCompany)
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Fetch automated reports data
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useGetAutomatedReportsStatusQuery()
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useGetReportHistoryQuery({
    companyId: currentCompany?._id || '',
    reportType: selectedReportType
  })
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useGetReportAnalyticsQuery(
    currentCompany?._id || ''
  )

  // Mutations
  const [triggerReport, { isLoading: triggeringReport }] = useTriggerManualReportMutation()

  const handleTriggerReport = async () => {
    if (!currentCompany?._id) {
      toast.error('No company selected')
      return
    }

    try {
      const result = await triggerReport({
        companyId: currentCompany._id,
        reportType: selectedReportType,
        formats: ['excel', 'csv'],
        recipients: [user?.email || '']
      }).unwrap()

      if (result.success) {
        toast.success(result.message)
        refetchHistory()
        refetchAnalytics()
      } else {
        toast.error('Failed to trigger report')
      }
    } catch (error) {
      toast.error('Error triggering report')
      console.error('Error:', error)
    }
  }

  const handleRefresh = () => {
    refetchStatus()
    refetchHistory()
    refetchAnalytics()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'generating':
        return 'text-blue-600 bg-blue-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'generating':
        return <Activity className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <ReportsHeader
          title="Automated Reports Dashboard"
          description="Monitor and manage automated report generation, scheduling, and delivery"
          icon={<BarChart3 className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={handleRefresh}
        >
          <div className="flex items-center space-x-3">
            <button
              onClick={handleTriggerReport}
              disabled={triggeringReport || !currentCompany?._id}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {triggeringReport ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Generate {selectedReportType} Report
            </button>
          </div>
        </ReportsHeader>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          {statusLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : statusData?.data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Status</p>
                    <p className="text-lg font-semibold text-green-900">
                      {statusData.data.isRunning ? 'Running' : 'Stopped'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">Active Tasks</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {statusData.data.activeTasks}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-800">Next Run</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {statusData.data.nextRun ? formatDate(statusData.data.nextRun) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Mail className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-800">Daily Time</p>
                    <p className="text-lg font-semibold text-orange-900">
                      {statusData.data.configuration.dailyTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Unable to fetch system status
            </div>
          )}
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Type</h3>
          <div className="flex space-x-2">
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedReportType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedReportType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} Reports
              </button>
            ))}
          </div>
        </div>

        {/* Report History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report History</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : historyData?.data && historyData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyData.data.map((report) => (
                    <tr key={report._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">{report.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.generatedAt ? formatDate(report.generatedAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.recipients.length} recipients
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.metadata?.fileSize ? formatFileSize(report.metadata.fileSize) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {report.fileUrls && report.fileUrls.length > 0 ? (
                          <div className="flex space-x-2">
                            {report.formats.map((format) => (
                              <button
                                key={format}
                                onClick={() => {
                                  const fileUrl = report.fileUrls?.find(url => url.includes(format))
                                  if (fileUrl) {
                                    window.open(fileUrl, '_blank')
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No files</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No report history available
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        {analyticsData?.data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8" />
                  <div className="ml-3">
                    <p className="text-sm opacity-90">Total Reports</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.data.totalReports || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8" />
                  <div className="ml-3">
                    <p className="text-sm opacity-90">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.data.successRate || 0}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FileText className="h-8 w-8" />
                  <div className="ml-3">
                    <p className="text-sm opacity-90">Avg. Size</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.data.averageFileSize ? formatFileSize(analyticsData.data.averageFileSize) : '0 KB'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
