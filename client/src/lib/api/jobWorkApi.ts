import { baseApi } from './baseApi'

export interface JobWork {
  _id: string
  companyId: string
  isJobWork: boolean
  jobWorkerId: string
  jobWorkerName: string
  jobWorkerRate: number
  expectedDelivery: string
  actualDelivery?: string
  jobWorkCost: number
  qualityAgreement?: string
  jobWorkType: string
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_check'
  productionOrderId?: string
  batchId?: string
  quantity: number
  unit: string
  // Challan Information
  challanNumber?: string
  challanDate?: string
  categoryId?: string | { _id: string; name: string }
  categoryName?: string
  subcategoryId?: string | { _id: string; name: string }
  subcategoryName?: string
  itemName?: string
  attributeName?: string
  price?: number
  lotNumber?: string
  // Party Details
  partyName?: string
  partyGstNumber?: string
  partyAddress?: string
  // Transport Details
  transportName?: string
  transportNumber?: string
  materialProvided?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  materialReturned?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  materialUsed?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  materialWasted?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  outputQuantity?: number
  wasteQuantity: number
  qualityStatus: 'pending' | 'approved' | 'rejected' | 'rework'
  qualityNotes?: string
  paymentStatus: 'pending' | 'partial' | 'paid'
  paymentAmount: number
  paymentDate?: string
  remarks?: string
  createdBy: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface JobWorkStats {
  totalJobWorks: number
  pendingJobWorks: number
  inProgressJobWorks: number
  completedJobWorks: number
  totalCost: number
  pendingPayments: number
}

export interface CreateJobWorkRequest {
  jobWorkerId: string
  jobWorkerName: string
  jobWorkerRate: number
  expectedDelivery: string
  jobWorkType: string
  quantity: number
  unit: string
  productionOrderId?: string
  batchId?: string
  materialProvided?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  qualityAgreement?: string
  remarks?: string
}

export interface UpdateJobWorkRequest {
  status?: string
  actualDelivery?: string
  jobWorkCost?: number
  outputQuantity?: number
  wasteQuantity?: number
  qualityStatus?: string
  qualityNotes?: string
  paymentStatus?: string
  paymentAmount?: number
  paymentDate?: string
  materialReturned?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  materialUsed?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  materialWasted?: Array<{
    itemId: string
    itemName: string
    quantity: number
    unit: string
  }>
  remarks?: string
}

export interface JobWorkFilters {
  jobWorkerId?: string
  status?: string
  jobWorkType?: string
  startDate?: string
  endDate?: string
  paymentStatus?: string
  qualityStatus?: string
  page?: number
  limit?: number
}

export const jobWorkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all job works with filters
    getJobWorks: builder.query<{ data: JobWork[]; pagination: any }, JobWorkFilters>({
      query: (filters) => {
        const params = new URLSearchParams()
        if (filters.jobWorkerId) params.append('jobWorkerId', filters.jobWorkerId)
        if (filters.status) params.append('status', filters.status)
        if (filters.jobWorkType) params.append('jobWorkType', filters.jobWorkType)
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)
        if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
        if (filters.qualityStatus) params.append('qualityStatus', filters.qualityStatus)
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())

        return {
          url: `/job-work?${params.toString()}`,
          method: 'GET'
        }
      },
      providesTags: ['JobWork']
    }),

    // Get job work by ID
    getJobWorkById: builder.query<{ data: JobWork }, string>({
      query: (id) => `/job-work/${id}`,
      providesTags: (result, error, id) => [{ type: 'JobWork', id }]
    }),

    // Create job work
    createJobWork: builder.mutation<{ data: JobWork }, CreateJobWorkRequest>({
      query: (data) => ({
        url: '/job-work',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['JobWork']
    }),

    // Update job work
    updateJobWork: builder.mutation<{ data: JobWork }, { id: string; data: UpdateJobWorkRequest }>({
      query: ({ id, data }) => ({
        url: `/job-work/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'JobWork', id }, 'JobWork']
    }),

    // Delete job work
    deleteJobWork: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/job-work/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['JobWork']
    }),

    // Get job work statistics
    getJobWorkStats: builder.query<{ data: JobWorkStats }, { startDate?: string; endDate?: string }>({
      query: (filters) => {
        const params = new URLSearchParams()
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)
        return {
          url: `/job-work/stats?${params.toString()}`,
          method: 'GET'
        }
      },
      providesTags: ['JobWork']
    }),

    // Get job works by worker
    getJobWorksByWorker: builder.query<{ data: JobWork[] }, string>({
      query: (workerId) => `/job-work/worker/${workerId}`,
      providesTags: ['JobWork']
    })
  })
})

export const {
  useGetJobWorksQuery,
  useGetJobWorkByIdQuery,
  useCreateJobWorkMutation,
  useUpdateJobWorkMutation,
  useDeleteJobWorkMutation,
  useGetJobWorkStatsQuery,
  useGetJobWorksByWorkerQuery
} = jobWorkApi

