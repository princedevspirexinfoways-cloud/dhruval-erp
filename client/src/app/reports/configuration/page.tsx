'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectCurrentCompany } from '@/lib/features/auth/authSlice'
import { AppLayout } from '@/components/layout/AppLayout'
import { ReportsHeader } from '@/components/ui/PageHeader'
import {
  useGetAdvancedReportsQuery,
  useCreateAdvancedReportMutation,
  useUpdateScheduleMutation
} from '@/lib/api/automatedReportsApi'
import { 
  Settings, 
  Clock, 
  Mail, 
  FileText, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'

export default function ReportConfigurationPage() {
  const user = useSelector(selectCurrentUser)
  const currentCompany = useSelector(selectCurrentCompany)
  const [isCreating, setIsCreating] = useState(false)
  const [editingReport, setEditingReport] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'production',
    frequency: 'daily',
    time: '09:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    month: 1,
    enabled: true,
    recipients: '',
    formats: ['excel', 'csv']
  })

  // Fetch advanced reports
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useGetAdvancedReportsQuery(
    currentCompany?._id || ''
  )

  // Mutations
  const [createReport, { isLoading: creatingReport }] = useCreateAdvancedReportMutation()
  const [updateSchedule, { isLoading: updatingSchedule }] = useUpdateScheduleMutation()

  const handleCreateReport = async () => {
    if (!currentCompany?._id) {
      toast.error('No company selected')
      return
    }

    try {
      const recipients = formData.recipients.split(',').map(email => email.trim()).filter(Boolean)
      
      const result = await createReport({
        companyId: currentCompany._id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        schedule: {
          frequency: formData.frequency as any,
          time: formData.time,
          dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
          dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
          month: formData.frequency === 'yearly' ? formData.month : undefined,
          enabled: formData.enabled
        },
        filters: {},
        recipients,
        formats: formData.formats,
        accessControl: {
          public: false,
          allowedUsers: [user?._id || ''],
          allowedRoles: ['admin', 'manager']
        }
      }).unwrap()

      if (result.success) {
        toast.success('Report configuration created successfully')
        setIsCreating(false)
        resetForm()
        refetchReports()
      } else {
        toast.error('Failed to create report configuration')
      }
    } catch (error) {
      toast.error('Error creating report configuration')
      console.error('Error:', error)
    }
  }

  const handleUpdateSchedule = async (reportId: string, enabled: boolean) => {
    if (!currentCompany?._id) {
      toast.error('No company selected')
      return
    }

    try {
      const result = await updateSchedule({
        reportId,
        schedule: { enabled }
      }).unwrap()

      if (result.success) {
        toast.success('Schedule updated successfully')
        refetchReports()
      } else {
        toast.error('Failed to update schedule')
      }
    } catch (error) {
      toast.error('Error updating schedule')
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'production',
      frequency: 'daily',
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      month: 1,
      enabled: true,
      recipients: '',
      formats: ['excel', 'csv']
    })
  }

  const getFrequencyText = (frequency: string, dayOfWeek?: number, dayOfMonth?: number, month?: number) => {
    switch (frequency) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return `Weekly on ${days[dayOfWeek || 0]}`
      case 'monthly':
        return `Monthly on day ${dayOfMonth || 1}`
      case 'quarterly':
        return 'Quarterly'
      case 'yearly':
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        return `Yearly in ${months[(month || 1) - 1]}`
      default:
        return frequency
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'production':
        return '🏭'
      case 'inventory':
        return '📦'
      case 'sales':
        return '💰'
      case 'financial':
        return '💳'
      case 'quality':
        return '✅'
      case 'hr':
        return '👥'
      default:
        return '📊'
    }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <ReportsHeader
          title="Report Configuration"
          description="Configure automated report schedules, recipients, and delivery settings"
          icon={<Settings className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={refetchReports}
        >
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </button>
        </ReportsHeader>

        {/* Create Report Form */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Report Configuration</h3>
              <button
                onClick={() => {
                  setIsCreating(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Daily Production Report"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="production">Production</option>
                  <option value="inventory">Inventory</option>
                  <option value="sales">Sales</option>
                  <option value="financial">Financial</option>
                  <option value="quality">Quality</option>
                  <option value="hr">HR</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}
              
              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {formData.frequency === 'yearly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients (comma-separated)</label>
                <input
                  type="text"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user1@company.com, user2@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formats</label>
                <div className="space-y-2">
                  {['excel', 'csv', 'pdf'].map((format) => (
                    <label key={format} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.formats.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, formats: [...formData.formats, format] })
                          } else {
                            setFormData({ ...formData, formats: formData.formats.filter(f => f !== format) })
                          }
                        }}
                        className="mr-2"
                      />
                      {format.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreating(false)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={creatingReport || !formData.name || !formData.recipients}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingReport ? 'Creating...' : 'Create Report'}
              </button>
            </div>
          </div>
        )}

        {/* Existing Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Report Configurations</h3>
          
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reportsData?.data && reportsData.data.length > 0 ? (
            <div className="space-y-4">
              {reportsData.data.map((report) => (
                <div key={report._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getCategoryIcon(report.category)}</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getFrequencyText(report.schedule.frequency, report.schedule.dayOfWeek, report.schedule.dayOfMonth, report.schedule.month)} at {report.schedule.time}
                          </span>
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {report.recipients.length} recipients
                          </span>
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {report.formats.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={report.schedule.enabled}
                          onChange={(e) => handleUpdateSchedule(report._id, e.target.checked)}
                          disabled={updatingSchedule}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Enabled</span>
                      </label>
                      
                      <button
                        onClick={() => setEditingReport(report._id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No report configurations found. Create your first automated report above.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
