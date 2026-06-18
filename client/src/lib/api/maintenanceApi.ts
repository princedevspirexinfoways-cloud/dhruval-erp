import { baseApi } from './baseApi'

// Types
export interface MaintenanceSchedule {
  _id?: string
  spareId: string
  scheduleType: 'preventive' | 'predictive' | 'corrective'
  frequency: number
  frequencyUnit: 'days' | 'weeks' | 'months' | 'years'
  lastMaintenance?: string
  nextMaintenance?: string
  maintenanceNotes?: string
  isActive: boolean
  assignedTechnician?: string
  estimatedDuration?: number
  estimatedCost?: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt?: string
  updatedAt?: string
}

export interface MaintenanceRecord {
  _id?: string
  id?: string // For compatibility with components
  spareId: string
  date: string
  type: 'preventive' | 'predictive' | 'corrective' | 'emergency'
  description: string
  technician: string
  duration: number
  cost: number
  partsUsed: Array<{
    spareId: string
    spareName: string
    quantity: number
    cost: number
  }>
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
  images?: string[]
  nextMaintenanceDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface MaintenanceAnalytics {
  totalSchedules: number
  activeSchedules: number
  completedRecords: number
  overdueSchedules: number
  totalCost: number
  averageDuration: number
  scheduleTypeBreakdown: Array<{
    type: string
    count: number
    percentage: number
  }>
  priorityBreakdown: Array<{
    priority: string
    count: number
    percentage: number
  }>
  monthlyTrends: Array<{
    month: string
    scheduled: number
    completed: number
    cost: number
  }>
}

export interface MaintenanceFilters {
  spareId?: string
  scheduleType?: string
  priority?: string
  status?: string
  technician?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const maintenanceApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get maintenance schedules for a spare
    getMaintenanceSchedules: builder.query<
      { success: boolean; data: MaintenanceSchedule[] },
      string
    >({
      query: (spareId) => ({
        url: `/maintenance/schedules/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: `SPARE_${spareId}` },
      ],
    }),

    // Create maintenance schedule
    createMaintenanceSchedule: builder.mutation<
      { success: boolean; data: MaintenanceSchedule; message: string },
      MaintenanceSchedule
    >({
      query: (scheduleData) => ({
        url: '/maintenance/schedules',
        method: 'POST',
        body: scheduleData,
      }),
      invalidatesTags: (result, error, scheduleData) => [
        { type: 'Spare', id: `SPARE_${scheduleData.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Update maintenance schedule
    updateMaintenanceSchedule: builder.mutation<
      { success: boolean; data: MaintenanceSchedule; message: string },
      { id: string; data: Partial<MaintenanceSchedule> }
    >({
      query: ({ id, data }) => ({
        url: `/maintenance/schedules/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => [
        { type: 'Spare', id: id },
        { type: 'Spare', id: `SPARE_${data.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Delete maintenance schedule
    deleteMaintenanceSchedule: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/maintenance/schedules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Get maintenance records for a spare
    getMaintenanceRecords: builder.query<
      { success: boolean; data: MaintenanceRecord[] },
      string
    >({
      query: (spareId) => ({
        url: `/maintenance/records/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: `SPARE_${spareId}` },
      ],
    }),

    // Create maintenance record
    createMaintenanceRecord: builder.mutation<
      { success: boolean; data: MaintenanceRecord; message: string },
      MaintenanceRecord
    >({
      query: (recordData) => ({
        url: '/maintenance/records',
        method: 'POST',
        body: recordData,
      }),
      invalidatesTags: (result, error, recordData) => [
        { type: 'Spare', id: `SPARE_${recordData.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Update maintenance record
    updateMaintenanceRecord: builder.mutation<
      { success: boolean; data: MaintenanceRecord; message: string },
      { id: string; data: Partial<MaintenanceRecord> }
    >({
      query: ({ id, data }) => ({
        url: `/maintenance/records/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => [
        { type: 'Spare', id },
        { type: 'Spare', id: `SPARE_${data.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Delete maintenance record
    deleteMaintenanceRecord: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/maintenance/records/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Get maintenance analytics for a spare
    getMaintenanceAnalytics: builder.query<
      { success: boolean; data: MaintenanceAnalytics },
      string
    >({
      query: (spareId) => ({
        url: `/maintenance/analytics/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: spareId },
      ],
    }),

    // Get overdue maintenance schedules
    getOverdueMaintenance: builder.query<
      { success: boolean; data: MaintenanceSchedule[] },
      void
    >({
      query: () => ({
        url: '/maintenance/overdue',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'OVERDUE' }],
    }),

    // Get maintenance due soon
    getMaintenanceDueSoon: builder.query<
      { success: boolean; data: MaintenanceSchedule[] },
      number
    >({
      query: (days) => ({
        url: `/maintenance/due-soon/${days}`,
        method: 'GET',
      }),
      providesTags: (result, error, days) => [
        { type: 'Spare', id: `DUE_SOON_${days}` },
      ],
    }),

    // Get overall maintenance statistics
    getMaintenanceStats: builder.query<
      { success: boolean; data: MaintenanceAnalytics },
      void
    >({
      query: () => ({
        url: '/maintenance/stats',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'OVERALL' }],
    }),
  }),
})

export const {
  useGetMaintenanceSchedulesQuery,
  useCreateMaintenanceScheduleMutation,
  useUpdateMaintenanceScheduleMutation,
  useDeleteMaintenanceScheduleMutation,
  useGetMaintenanceRecordsQuery,
  useCreateMaintenanceRecordMutation,
  useUpdateMaintenanceRecordMutation,
  useDeleteMaintenanceRecordMutation,
  useGetMaintenanceAnalyticsQuery,
  useGetOverdueMaintenanceQuery,
  useGetMaintenanceDueSoonQuery,
  useGetMaintenanceStatsQuery,
} = maintenanceApi
