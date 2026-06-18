import { baseApi } from './baseApi'

export interface ProductionTrackingData {
  summary: {
    totalJobs: number
    activeJobs: number
    completedJobs: number
    pendingJobs: number
    totalProduction: number
    productionEfficiency: number
    machineUtilization: number
    qualityScore: number
  }
  printingStatus: Array<{
    jobId: string
    jobNumber: string
    customerName: string
    productName: string
    printingType: 'table' | 'machine'
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold'
    progress: number
    startTime: string
    estimatedCompletion: string
    actualCompletion?: string
    machineId?: string
    operatorId?: string
    qualityChecks: Array<{
      checkId: string
      checkType: string
      status: 'passed' | 'failed' | 'pending'
      notes?: string
      timestamp: string
    }>
  }>
  jobWorkTracking: Array<{
    jobId: string
    jobNumber: string
    customerName: string
    jobType: 'in_house' | 'third_party'
    contractorName?: string
    contractorContact?: string
    startDate: string
    estimatedCompletion: string
    actualCompletion?: string
    status: 'pending' | 'in_progress' | 'completed' | 'delayed'
    progress: number
    stages: Array<{
      stageId: string
      stageName: string
      status: 'pending' | 'in_progress' | 'completed'
      startTime?: string
      completionTime?: string
      operatorId?: string
      notes?: string
    }>
  }>
  processTracking: Array<{
    jobId: string
    jobNumber: string
    customerName: string
    currentStage: string
    overallProgress: number
    stages: {
      stitching: {
        status: 'pending' | 'in_progress' | 'completed'
        progress: number
        startTime?: string
        completionTime?: string
        operatorId?: string
        machineId?: string
        qualityChecks: Array<{
          checkId: string
          checkType: string
          status: 'passed' | 'failed' | 'pending'
          notes?: string
          timestamp: string
        }>
      }
      washing: {
        status: 'pending' | 'in_progress' | 'completed'
        progress: number
        startTime?: string
        completionTime?: string
        operatorId?: string
        machineId?: string
        chemicalDetails: Array<{
          chemicalId: string
          chemicalName: string
          quantity: number
          unit: string
        }>
        qualityChecks: Array<{
          checkId: string
          checkType: string
          status: 'passed' | 'failed' | 'pending'
          notes?: string
          timestamp: string
        }>
      }
      silicate: {
        status: 'pending' | 'in_progress' | 'completed'
        progress: number
        startTime?: string
        completionTime?: string
        operatorId?: string
        machineId?: string
        silicateType: string
        concentration: number
        qualityChecks: Array<{
          checkId: string
          checkType: string
          status: 'passed' | 'failed' | 'pending'
          notes?: string
          timestamp: string
        }>
      }
      colorFixing: {
        status: 'pending' | 'in_progress' | 'completed'
        progress: number
        startTime?: string
        completionTime?: string
        operatorId?: string
        machineId?: string
        fixingAgent: string
        temperature: number
        duration: number
        qualityChecks: Array<{
          checkId: string
          checkType: string
          status: 'passed' | 'failed' | 'pending'
          notes?: string
          timestamp: string
        }>
      }
      finishing: {
        status: 'pending' | 'in_progress' | 'completed'
        progress: number
        startTime?: string
        completionTime?: string
        operatorId?: string
        machineId?: string
        finishingType: string
        qualityChecks: Array<{
          checkId: string
          checkType: string
          status: 'passed' | 'failed' | 'pending'
          notes?: string
          timestamp: string
        }>
      }
    }
  }>
  dailyProductionSummary: Array<{
    date: string
    firmId: string
    firmName: string
    totalJobs: number
    completedJobs: number
    totalProduction: number
    efficiency: number
    qualityScore: number
    machineUtilization: number
    breakdown: {
      stitching: { jobs: number; production: number }
      washing: { jobs: number; production: number }
      silicate: { jobs: number; production: number }
      colorFixing: { jobs: number; production: number }
      finishing: { jobs: number; production: number }
    }
  }>
  machineWiseSummary: Array<{
    machineId: string
    machineName: string
    machineType: string
    totalJobs: number
    completedJobs: number
    totalProduction: number
    efficiency: number
    uptime: number
    downtime: number
    maintenanceStatus: 'operational' | 'maintenance' | 'breakdown'
    lastMaintenance: string
    nextMaintenance: string
  }>
}

export interface ProductionUpdateRequest {
  jobId: string
  stageId?: string
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'delayed'
  progress?: number
  operatorId?: string
  machineId?: string
  notes?: string
  qualityChecks?: Array<{
    checkType: string
    status: 'passed' | 'failed' | 'pending'
    notes?: string
  }>
}

export const productionTrackingApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get comprehensive production tracking data
    getProductionTrackingData: builder.query<
      { success: boolean; data: ProductionTrackingData },
      {
        companyId?: string
        date?: string
        firmId?: string
        machineId?: string
        status?: string
        includeDetails?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/production/tracking',
        method: 'GET',
        params,
      }),
      providesTags: ['ProductionTracking'],
    }),

    // Get real-time printing status
    getPrintingStatus: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        printingType?: 'table' | 'machine'
        status?: string
        machineId?: string
        operatorId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/production/printing-status',
        method: 'GET',
        params,
      }),
      providesTags: ['PrintingStatus'],
    }),

    // Get job work tracking
    getJobWorkTracking: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        jobType?: 'in_house' | 'third_party'
        status?: string
        contractorId?: string
        startDate?: string
        endDate?: string
      }
    >({
      query: (params = {}) => ({
        url: '/production/job-work-tracking',
        method: 'GET',
        params,
      }),
      providesTags: ['JobWorkTracking'],
    }),

    // Get process tracking
    getProcessTracking: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        jobId?: string
        stage?: string
        status?: string
        includeQualityChecks?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/production/process-tracking',
        method: 'GET',
        params,
      }),
      providesTags: ['ProcessTracking'],
    }),

    // Get daily production summary
    getDailyProductionSummary: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        date?: string
        firmId?: string
        includeBreakdown?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/production/daily-summary',
        method: 'GET',
        params,
      }),
      providesTags: ['ProductionSummary'],
    }),

    // Get machine-wise production summary
    getMachineWiseSummary: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        machineType?: string
        status?: string
        includeMaintenance?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/production/machine-summary',
        method: 'GET',
        params,
      }),
      providesTags: ['MachineSummary'],
    }),

    // Update production status
    updateProductionStatus: builder.mutation<
      { success: boolean; data: any; message: string },
      ProductionUpdateRequest
    >({
      query: (params) => ({
        url: '/production/update-status',
        method: 'PATCH',
        body: params,
      }),
      invalidatesTags: ['ProductionTracking', 'PrintingStatus', 'JobWorkTracking', 'ProcessTracking'],
    }),

    // Start production stage
    startProductionStage: builder.mutation<
      { success: boolean; data: any; message: string },
      {
        jobId: string
        stageId: string
        operatorId: string
        machineId?: string
        startTime?: string
        notes?: string
      }
    >({
      query: (params) => ({
        url: '/production/start-stage',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['ProductionTracking', 'ProcessTracking'],
    }),

    // Complete production stage
    completeProductionStage: builder.mutation<
      { success: boolean; data: any; message: string },
      {
        jobId: string
        stageId: string
        operatorId: string
        completionTime?: string
        qualityChecks: Array<{
          checkType: string
          status: 'passed' | 'failed' | 'pending'
          notes?: string
        }>
        notes?: string
      }
    >({
      query: (params) => ({
        url: '/production/complete-stage',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['ProductionTracking', 'ProcessTracking'],
    }),

    // Add quality check
    addQualityCheck: builder.mutation<
      { success: boolean; data: any; message: string },
      {
        jobId: string
        stageId?: string
        checkType: string
        status: 'passed' | 'failed' | 'pending'
        notes?: string
        operatorId?: string
        timestamp?: string
      }
    >({
      query: (params) => ({
        url: '/production/quality-check',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['ProductionTracking', 'ProcessTracking'],
    }),

    // Get production alerts
    getProductionAlerts: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        alertType?: 'delayed' | 'quality' | 'maintenance' | 'efficiency'
        severity?: 'low' | 'medium' | 'high' | 'critical'
        includeResolved?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/production/alerts',
        method: 'GET',
        params,
      }),
      providesTags: ['ProductionAlerts'],
    }),

    // Get production efficiency metrics
    getProductionEfficiency: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        timeRange?: string
        startDate?: string
        endDate?: string
        firmId?: string
        machineId?: string
        metric?: 'overall' | 'machine' | 'operator' | 'process'
      }
    >({
      query: (params = {}) => ({
        url: '/production/efficiency',
        method: 'GET',
        params,
      }),
      providesTags: ['ProductionEfficiency'],
    }),

    // Get real-time production dashboard
    getRealTimeProductionDashboard: builder.query<
      { success: boolean; data: any },
      {
        companyId?: string
        refreshInterval?: number
        includeCharts?: boolean
      }
    >({
      query: (params = {}) => ({
        url: '/production/realtime-dashboard',
        method: 'GET',
        params,
      }),
      providesTags: ['RealTimeProduction'],
    }),
  }),
})

export const {
  useGetProductionTrackingDataQuery,
  useGetPrintingStatusQuery,
  useGetJobWorkTrackingQuery,
  useGetProcessTrackingQuery,
  useGetDailyProductionSummaryQuery,
  useGetMachineWiseSummaryQuery,
  useUpdateProductionStatusMutation,
  useStartProductionStageMutation,
  useCompleteProductionStageMutation,
  useAddQualityCheckMutation,
  useGetProductionAlertsQuery,
  useGetProductionEfficiencyQuery,
  useGetRealTimeProductionDashboardQuery,
} = productionTrackingApi
