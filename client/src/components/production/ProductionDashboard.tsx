'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentCompany } from '@/lib/features/auth/authSlice'
import {
  useGetProductionDashboardQuery,
  useUpdateMachineStatusMutation,
  useGetDailyProductionSummaryQuery,
  useAddDailyProductionSummaryMutation
} from '@/lib/api/automatedReportsApi'
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  Settings,
  BarChart3,
  Target,
  Zap,
  Gauge
} from 'lucide-react'
import { toast } from 'sonner'

interface MachineStatus {
  machineId: string
  machineName: string
  status: 'running' | 'idle' | 'maintenance' | 'offline'
  currentOrder?: string
  efficiency: number
  lastUpdated: Date
}

interface ProductionAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: Date
  acknowledged: boolean
}

export function ProductionDashboard() {
  const currentCompany = useSelector(selectCurrentCompany)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<'running' | 'idle' | 'maintenance' | 'offline'>('idle')

  // Fetch production dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useGetProductionDashboardQuery(
    currentCompany?._id || ''
  )
  const { data: dailySummaryData, isLoading: summaryLoading, refetch: refetchSummary } = useGetDailyProductionSummaryQuery(
    currentCompany?._id || ''
  )

  // Mutations
  const [updateMachineStatus, { isLoading: updatingStatus }] = useUpdateMachineStatusMutation()
  const [addDailySummary, { isLoading: addingSummary }] = useAddDailyProductionSummaryMutation()

  const handleStatusUpdate = async (machineId: string) => {
    if (!currentCompany?._id) {
      toast.error('No company selected')
      return
    }

    try {
      const result = await updateMachineStatus({
        companyId: currentCompany._id,
        machineId,
        status: {
          status: newStatus,
          updatedAt: new Date()
        }
      }).unwrap()

      if (result.success) {
        toast.success('Machine status updated successfully')
        refetchDashboard()
        setSelectedMachine(null)
        setNewStatus('idle')
      } else {
        toast.error('Failed to update machine status')
      }
    } catch (error) {
      toast.error('Error updating machine status')
      console.error('Error:', error)
    }
  }

  const handleAddDailySummary = async () => {
    if (!currentCompany?._id) {
      toast.error('No company selected')
      return
    }

    try {
      const summary = {
        date: new Date(),
        totalProduction: dashboardData?.data?.dailySummary?.totalProduction || 0,
        completedOrders: dashboardData?.data?.dailySummary?.completedOrders || 0,
        pendingOrders: dashboardData?.data?.dailySummary?.pendingOrders || 0,
        efficiency: dashboardData?.data?.performanceMetrics?.overallEfficiency || 0
      }

      const result = await addDailySummary({
        companyId: currentCompany._id,
        summary
      }).unwrap()

      if (result.success) {
        toast.success('Daily summary added successfully')
        refetchSummary()
      } else {
        toast.error('Failed to add daily summary')
      }
    } catch (error) {
      toast.error('Error adding daily summary')
      console.error('Error:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'idle':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'maintenance':
        return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'offline':
        return 'text-red-600 bg-red-100 border-red-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4" />
      case 'idle':
        return <Pause className="h-4 w-4" />
      case 'maintenance':
        return <Settings className="h-4 w-4" />
      case 'offline':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200'
      case 'error':
        return 'text-red-800 bg-red-100 border-red-200'
      case 'info':
        return 'text-blue-800 bg-blue-100 border-blue-200'
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
        return <XCircle className="h-4 w-4" />
      case 'info':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
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

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!dashboardData?.data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No production dashboard data available
      </div>
    )
  }

  const { machineStatus, dailySummary, alerts, performanceMetrics } = dashboardData.data

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <Gauge className="h-8 w-8" />
            <div className="ml-3">
              <p className="text-sm opacity-90">Overall Efficiency</p>
              <p className="text-2xl font-bold">
                {performanceMetrics?.overallEfficiency || 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <Target className="h-8 w-8" />
            <div className="ml-3">
              <p className="text-sm opacity-90">Target Achievement</p>
              <p className="text-2xl font-bold">
                {performanceMetrics?.targetAchievement || 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <Zap className="h-8 w-8" />
            <div className="ml-3">
              <p className="text-sm opacity-90">Quality Score</p>
              <p className="text-2xl font-bold">
                {performanceMetrics?.qualityScore || 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <div className="ml-3">
              <p className="text-sm opacity-90">Downtime</p>
              <p className="text-2xl font-bold">
                {performanceMetrics?.downtime || 0}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Machine Status</h3>
          <button
            onClick={handleAddDailySummary}
            disabled={addingSummary}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {addingSummary ? (
              <Activity className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            Add Daily Summary
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machineStatus?.map((machine) => (
            <div key={machine.machineId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{machine.machineName}</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(machine.status)}`}>
                  {getStatusIcon(machine.status)}
                  <span className="ml-1">{machine.status}</span>
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>Efficiency: {machine.efficiency}%</p>
                {machine.currentOrder && (
                  <p>Order: {machine.currentOrder}</p>
                )}
                <p>Updated: {formatDate(machine.lastUpdated)}</p>
              </div>
              
              <button
                onClick={() => setSelectedMachine(machine.machineId)}
                className="mt-3 w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Status
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">Total Production</p>
              <p className="text-2xl font-bold text-blue-900">
                {dailySummary.totalProduction}
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">Completed Orders</p>
              <p className="text-2xl font-bold text-green-900">
                {dailySummary.completedOrders}
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-900">
                {dailySummary.pendingOrders}
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-800">Efficiency</p>
              <p className="text-2xl font-bold text-purple-900">
                {dailySummary.efficiency}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center p-3 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                {getAlertIcon(alert.type)}
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs opacity-75">
                    {formatDate(alert.timestamp)}
                  </p>
                </div>
                {!alert.acknowledged && (
                  <button className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75">
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Machine Status
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="running">Running</option>
                    <option value="idle">Idle</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedMachine)}
                    disabled={updatingStatus}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Update'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedMachine(null)
                      setNewStatus('idle')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
