import { baseApi } from './baseApi'

// Types for Automated Reports
export interface AutomatedReport {
  _id: string
  companyId: string
  reportType: 'daily' | 'weekly' | 'monthly'
  status: 'pending' | 'generating' | 'completed' | 'failed'
  generatedAt?: Date
  recipients: string[]
  formats: string[]
  fileUrls?: string[]
  errorMessage?: string
  metadata: {
    totalRecords: number
    processingTime: number
    fileSize: number
  }
}

export interface ProductionDashboard {
  _id: string
  companyId: string
  machineStatus: Array<{
    machineId: string
    machineName: string
    status: 'running' | 'idle' | 'maintenance' | 'offline'
    currentOrder?: string
    efficiency: number
    lastUpdated: Date
  }>
  dailySummary: {
    date: Date
    totalProduction: number
    completedOrders: number
    pendingOrders: number
    efficiency: number
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: Date
    acknowledged: boolean
  }>
  performanceMetrics: {
    overallEfficiency: number
    qualityScore: number
    downtime: number
    targetAchievement: number
  }
}

export interface AdvancedReportConfig {
  _id: string
  companyId: string
  name: string
  description: string
  category: string
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
    month?: number
    enabled: boolean
  }
  filters: Record<string, any>
  recipients: string[]
  formats: string[]
  accessControl: {
    public: boolean
    allowedUsers: string[]
    allowedRoles: string[]
  }
}

export interface DocumentManagement {
  _id: string
  companyId: string
  title: string
  description: string
  category: string
  type: string
  fileUrl: string
  fileSize: number
  mimeType: string
  version: number
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  metadata: Record<string, any>
}

export interface ReportGenerationRequest {
  companyId: string
  reportType: 'daily' | 'weekly' | 'monthly'
  formats?: string[]
  recipients?: string[]
  customFilters?: Record<string, any>
}

export interface ReportStatusResponse {
  success: boolean
  data: {
    isRunning: boolean
    activeTasks: number
    lastRun: Date
    nextRun: Date
    configuration: {
      dailyTime: string
      weeklyTime: string
      monthlyTime: string
      formats: string[]
      recipients: Record<string, string[]>
    }
  }
}

export const automatedReportsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get automated reports status
    getAutomatedReportsStatus: builder.query<ReportStatusResponse, void>({
      query: () => ({
        url: '/health/automated-reports',
        method: 'GET',
      }),
      providesTags: ['AutomatedReport'],
    }),

    // Trigger manual report generation
    triggerManualReport: builder.mutation<{ success: boolean; message: string }, ReportGenerationRequest>({
      query: (data) => ({
        url: '/api/trigger-report',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AutomatedReport'],
    }),

    // Get production dashboard
    getProductionDashboard: builder.query<{ success: boolean; data: ProductionDashboard }, string>({
      query: (companyId) => ({
        url: `/api/v1/production-dashboard?companyId=${companyId}`,
        method: 'GET',
      }),
      providesTags: ['ProductionDashboard'],
    }),

    // Update machine status
    updateMachineStatus: builder.mutation<{ success: boolean }, { companyId: string; machineId: string; status: any }>({
      query: ({ companyId, machineId, status }) => ({
        url: `/api/v1/production-dashboard/machine-status`,
        method: 'PUT',
        body: { companyId, machineId, status },
      }),
      invalidatesTags: ['ProductionDashboard'],
    }),

    // Get daily production summary
    getDailyProductionSummary: builder.query<{ success: boolean; data: any[] }, string>({
      query: (companyId) => ({
        url: `/api/v1/production-dashboard/daily-summary?companyId=${companyId}`,
        method: 'GET',
      }),
      providesTags: ['ProductionDashboard'],
    }),

    // Add daily production summary
    addDailyProductionSummary: builder.mutation<{ success: boolean }, { companyId: string; summary: any }>({
      query: ({ companyId, summary }) => ({
        url: `/api/v1/production-dashboard/daily-summary`,
        method: 'POST',
        body: { companyId, summary },
      }),
      invalidatesTags: ['ProductionDashboard'],
    }),

    // Get advanced reports
    getAdvancedReports: builder.query<{ success: boolean; data: AdvancedReportConfig[] }, string>({
      query: (companyId) => ({
        url: `/api/v1/advanced-reports?companyId=${companyId}`,
        method: 'GET',
      }),
      providesTags: ['AdvancedReport'],
    }),

    // Create advanced report
    createAdvancedReport: builder.mutation<{ success: boolean; data: AdvancedReportConfig }, Partial<AdvancedReportConfig>>({
      query: (data) => ({
        url: '/api/v1/advanced-reports',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdvancedReport'],
    }),

    // Generate report
    generateReport: builder.mutation<{ success: boolean; data: any }, { reportId: string; filters?: any }>({
      query: ({ reportId, filters }) => ({
        url: `/api/v1/advanced-reports/${reportId}/generate`,
        method: 'POST',
        body: { filters },
      }),
      invalidatesTags: ['AdvancedReport'],
    }),

    // Export report
    exportReport: builder.mutation<Blob, { reportId: string; format: string; filters?: any }>({
      query: ({ reportId, format, filters }) => ({
        url: `/api/v1/advanced-reports/${reportId}/export`,
        method: 'POST',
        body: { format, filters },
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    // Get documents
    getDocuments: builder.query<{ success: boolean; data: DocumentManagement[] }, string>({
      query: (companyId) => ({
        url: `/api/v1/documents?companyId=${companyId}`,
        method: 'GET',
      }),
      providesTags: ['Document'],
    }),

    // Upload document
    uploadDocument: builder.mutation<{ success: boolean; data: DocumentManagement }, FormData>({
      query: (data) => ({
        url: '/api/v1/documents',
        method: 'POST',
        body: data,
        formData: true,
      }),
      invalidatesTags: ['Document'],
    }),

    // Get report history
    getReportHistory: builder.query<{ success: boolean; data: AutomatedReport[] }, { companyId: string; reportType?: string }>({
      query: ({ companyId, reportType }) => ({
        url: `/api/v1/advanced-reports/history?companyId=${companyId}${reportType ? `&reportType=${reportType}` : ''}`,
        method: 'GET',
      }),
      providesTags: ['AutomatedReport'],
    }),

    // Get report analytics
    getReportAnalytics: builder.query<{ success: boolean; data: any }, string>({
      query: (companyId) => ({
        url: `/api/v1/advanced-reports/analytics?companyId=${companyId}`,
        method: 'GET',
      }),
      providesTags: ['AdvancedReport'],
    }),

    // Update schedule
    updateSchedule: builder.mutation<{ success: boolean; data: AdvancedReportConfig }, { reportId: string; schedule: Partial<AdvancedReportConfig['schedule']> }>({
      query: ({ reportId, schedule }) => ({
        url: `/api/v1/advanced-reports/${reportId}/schedule`,
        method: 'PUT',
        body: { schedule },
      }),
      invalidatesTags: ['AdvancedReport'],
    }),
  }),
})

export const {
  useGetAutomatedReportsStatusQuery,
  useTriggerManualReportMutation,
  useGetProductionDashboardQuery,
  useUpdateMachineStatusMutation,
  useGetDailyProductionSummaryQuery,
  useAddDailyProductionSummaryMutation,
  useGetAdvancedReportsQuery,
  useCreateAdvancedReportMutation,
  useGenerateReportMutation,
  useExportReportMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useGetReportHistoryQuery,
  useGetReportAnalyticsQuery,
  useUpdateScheduleMutation,
} = automatedReportsApi
