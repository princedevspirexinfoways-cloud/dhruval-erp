import { baseApi } from './baseApi'

export interface AuditLog {
  _id: string
  timestamp: string
  userId?: string
  user?: {
    name: string
    email: string
    username: string
  }
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'failed_login' | 'view' | 'export' | 'import'
  entityType: string
  entityId?: string
  entityName?: string
  description: string
  changes?: {
    before?: any
    after?: any
    fields?: string[]
  }
  metadata?: {
    userAgent?: string
    ipAddress?: string
    location?: string
    sessionId?: string
    requestId?: string
  }
  ipAddress?: string
  userAgent?: string
  riskLevel: 'low' | 'medium' | 'high'
  status: 'success' | 'failure' | 'warning'
  companyId: string
  createdAt: string
}

export interface AuditStats {
  totalLogs: number
  todayLogs: number
  thisWeekLogs: number
  thisMonthLogs: number
  highRiskLogs: number
  failedAttempts: number
  activeUsers: number
  uniqueIPs: number
  logsByAction: {
    [action: string]: number
  }
  logsByEntity: {
    [entity: string]: number
  }
  logsByRisk: {
    [risk: string]: number
  }
  logsByStatus: {
    [status: string]: number
  }
  activityTrend: Array<{
    date: string
    total: number
    success: number
    failure: number
    warning: number
  }>
  topUsers: Array<{
    userId: string
    userName: string
    activityCount: number
    lastActivity: string
  }>
  topEntities: Array<{
    entityType: string
    activityCount: number
  }>
  riskEvents: Array<{
    timestamp: string
    action: string
    entityType: string
    description: string
    riskLevel: string
  }>
}

export const auditApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all audit logs with filtering and pagination
    getAuditLogs: builder.query<
      {
        success: boolean
        data: AuditLog[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        page?: number
        limit?: number
        search?: string
        action?: string
        entityType?: string
        userId?: string
        riskLevel?: string
        status?: string
        startDate?: string
        endDate?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/audit-logs',
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Get audit statistics
    getAuditStats: builder.query<
      { success: boolean; data: AuditStats },
      { companyId?: string; startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({
        url: '/audit-logs/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Get audit log by ID
    getAuditLogById: builder.query<
      { success: boolean; data: AuditLog },
      string
    >({
      query: (logId) => ({
        url: `/audit-logs/${logId}`,
        method: 'GET',
      }),
      providesTags: ['AuditLog'],
    }),

    // Get audit logs by user
    getAuditLogsByUser: builder.query<
      {
        success: boolean
        data: AuditLog[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        userId: string
        page?: number
        limit?: number
        startDate?: string
        endDate?: string
      }
    >({
      query: ({ userId, ...params }) => ({
        url: `/audit-logs/user/${userId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Get audit logs by entity
    getAuditLogsByEntity: builder.query<
      {
        success: boolean
        data: AuditLog[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        entityType: string
        entityId?: string
        page?: number
        limit?: number
        startDate?: string
        endDate?: string
      }
    >({
      query: ({ entityType, ...params }) => ({
        url: `/audit-logs/entity/${entityType}`,
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Get security events (high risk logs)
    getSecurityEvents: builder.query<
      {
        success: boolean
        data: AuditLog[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        page?: number
        limit?: number
        startDate?: string
        endDate?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/audit-logs/security-events',
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Get activity timeline for a specific entity
    getEntityTimeline: builder.query<
      {
        success: boolean
        data: AuditLog[]
      },
      {
        entityType: string
        entityId: string
        limit?: number
      }
    >({
      query: ({ entityType, entityId, ...params }) => ({
        url: `/audit-logs/timeline/${entityType}/${entityId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Export audit logs
    exportAuditLogs: builder.mutation<
      { success: boolean; data: { downloadUrl: string }; message: string },
      {
        format: 'csv' | 'excel' | 'pdf'
        filters?: {
          startDate?: string
          endDate?: string
          action?: string
          entityType?: string
          userId?: string
          riskLevel?: string
        }
      }
    >({
      query: ({ format, filters }) => ({
        url: `/audit-logs/export/${format}`,
        method: 'POST',
        body: { filters },
      }),
    }),

    // Get compliance report
    getComplianceReport: builder.query<
      {
        success: boolean
        data: {
          summary: {
            totalEvents: number
            complianceScore: number
            riskScore: number
            criticalEvents: number
          }
          categories: Array<{
            category: string
            events: number
            compliance: number
            risk: number
          }>
          recommendations: Array<{
            priority: 'high' | 'medium' | 'low'
            title: string
            description: string
            action: string
          }>
        }
      },
      { startDate: string; endDate: string; companyId?: string }
    >({
      query: (params) => ({
        url: '/audit-logs/compliance-report',
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Get user activity summary
    getUserActivitySummary: builder.query<
      {
        success: boolean
        data: Array<{
          userId: string
          userName: string
          email: string
          totalActivities: number
          lastActivity: string
          riskScore: number
          topActions: Array<{
            action: string
            count: number
          }>
          activityTrend: Array<{
            date: string
            count: number
          }>
        }>
      },
      { startDate?: string; endDate?: string; companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/audit-logs/user-activity-summary',
        method: 'GET',
        params,
      }),
      providesTags: ['AuditLog'],
    }),

    // Delete old audit logs (admin only)
    deleteOldAuditLogs: builder.mutation<
      { success: boolean; data: { deletedCount: number }; message: string },
      { olderThanDays: number }
    >({
      query: ({ olderThanDays }) => ({
        url: '/audit-logs/cleanup',
        method: 'DELETE',
        body: { olderThanDays },
      }),
      invalidatesTags: ['AuditLog'],
    }),
  }),
})

export const {
  useGetAuditLogsQuery,
  useGetAuditStatsQuery,
  useGetAuditLogByIdQuery,
  useGetAuditLogsByUserQuery,
  useGetAuditLogsByEntityQuery,
  useGetSecurityEventsQuery,
  useGetEntityTimelineQuery,
  useExportAuditLogsMutation,
  useGetComplianceReportQuery,
  useGetUserActivitySummaryQuery,
  useDeleteOldAuditLogsMutation,
} = auditApi
