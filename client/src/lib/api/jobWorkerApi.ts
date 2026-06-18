import { baseApi } from './baseApi'

export interface JobWorker {
  _id: string
  companyId: string
  workerCode: string
  name: string
  phoneNumber: string
  alternatePhoneNumber?: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
    fullAddress?: string
  }
  aadharNumber?: string
  panNumber?: string
  gstNumber?: string
  bankDetails?: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    branchName?: string
  }
  specialization?: string[]
  experience?: number
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  hourlyRate?: number
  dailyRate?: number
  status: 'active' | 'inactive' | 'suspended'
  isActive: boolean
  notes?: string
  tags?: string[]
  createdBy: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface JobWorkerSummary {
  worker: JobWorker
  summary: {
    totalAssignments: number
    activeAssignments: number
    completedAssignments: number
    totalMaterialsGiven: number
    totalMaterialsUsed: number
    totalMaterialsReturned: number
    totalMaterialsRemaining: number
    totalAmountEarned: number
    totalAmountPending: number
  }
}

export interface JobWorkerAssignment {
  _id: string
  companyId: string
  workerId: string
  workerName: string
  workerCode: string
  assignmentNumber: string
  jobWorkId?: string
  jobType: 'printing' | 'dyeing' | 'washing' | 'finishing' | 'cutting' | 'packing' | 'stitching' | 'quality_check' | 'other'
  jobDescription?: string
  status: 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  assignedDate: string
  expectedCompletionDate?: string
  actualCompletionDate?: string
  startDate?: string
  materials: MaterialTracking[]
  outputQuantity?: number
  outputUnit?: string
  outputQuality?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject'
  outputNotes?: string
  jobRate?: number
  totalAmount?: number
  advancePaid?: number
  balanceAmount?: number
  paymentStatus?: 'pending' | 'partial' | 'paid'
  paymentDate?: string
  qualityRating?: number
  qualityNotes?: string
  remarks?: string
  issues?: string[]
  createdBy: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialTracking {
  itemId: string
  itemName: string
  itemCode?: string
  categoryId?: string
  categoryName?: string
  unit: string
  quantityGiven: number
  quantityUsed: number
  quantityReturned: number
  quantityRemaining: number
  quantityWasted?: number
  rate?: number
  totalValue?: number
  notes?: string
}

export interface AssignmentSummary {
  assignment: JobWorkerAssignment
  summary: {
    totalMaterials: number
    totalGiven: number
    totalUsed: number
    totalReturned: number
    totalRemaining: number
    totalWasted: number
    totalValue: number
  }
}

export interface CreateJobWorkerRequest {
  name: string
  phoneNumber: string
  alternatePhoneNumber?: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
    fullAddress?: string
  }
  aadharNumber?: string
  panNumber?: string
  gstNumber?: string
  bankDetails?: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    branchName?: string
  }
  specialization?: string[]
  experience?: number
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  hourlyRate?: number
  dailyRate?: number
  status?: 'active' | 'inactive' | 'suspended'
  notes?: string
  tags?: string[]
}

export interface UpdateJobWorkerRequest extends Partial<CreateJobWorkerRequest> {}

export interface CreateAssignmentRequest {
  workerId: string
  jobWorkId?: string
  jobType: string
  jobDescription?: string
  expectedCompletionDate?: string
  materials?: MaterialTracking[]
  jobRate?: number
  totalAmount?: number
  advancePaid?: number
}

export interface UpdateAssignmentRequest {
  status?: string
  jobDescription?: string
  expectedCompletionDate?: string
  actualCompletionDate?: string
  materials?: MaterialTracking[]
  outputQuantity?: number
  outputUnit?: string
  outputQuality?: string
  outputNotes?: string
  jobRate?: number
  totalAmount?: number
  advancePaid?: number
  qualityRating?: number
  qualityNotes?: string
  remarks?: string
  issues?: string[]
}

export interface JobWorkerFilters {
  status?: string
  isActive?: boolean
  specialization?: string
  search?: string
  companyId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AssignmentFilters {
  workerId?: string
  status?: string
  jobType?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  companyId?: string
}

export const jobWorkerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all workers
    getWorkers: builder.query<
      { success: boolean; data: JobWorker[]; total: number; page: number; limit: number; totalPages: number },
      JobWorkerFilters | void
    >({
      query: (filters = {}) => ({
        url: '/job-workers',
        method: 'GET',
        params: filters
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'JobWorker' as const, id: _id })),
              { type: 'JobWorker', id: 'LIST' }
            ]
          : [{ type: 'JobWorker', id: 'LIST' }]
    }),

    // Get worker by ID
    getWorkerById: builder.query<
      { success: boolean; data: JobWorker },
      string
    >({
      query: (id) => ({
        url: `/job-workers/${id}`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'JobWorker', id }]
    }),

    // Get worker with summary
    getWorkerWithSummary: builder.query<
      { success: boolean; data: JobWorkerSummary },
      string
    >({
      query: (id) => ({
        url: `/job-workers/${id}?includeSummary=true`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'JobWorker', id }]
    }),

    // Create worker
    createWorker: builder.mutation<
      { success: boolean; data: JobWorker; message: string },
      CreateJobWorkerRequest
    >({
      query: (workerData) => ({
        url: '/job-workers',
        method: 'POST',
        body: workerData
      }),
      invalidatesTags: [{ type: 'JobWorker', id: 'LIST' }]
    }),

    // Update worker
    updateWorker: builder.mutation<
      { success: boolean; data: JobWorker; message: string },
      { id: string; data: UpdateJobWorkerRequest }
    >({
      query: ({ id, data }) => ({
        url: `/job-workers/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'JobWorker', id },
        { type: 'JobWorker', id: 'LIST' }
      ]
    }),

    // Delete worker
    deleteWorker: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/job-workers/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'JobWorker', id: 'LIST' }]
    }),

    // Get assignments
    getAssignments: builder.query<
      { success: boolean; data: JobWorkerAssignment[]; total: number },
      AssignmentFilters | void
    >({
      query: (filters = {}) => ({
        url: '/job-workers/assignments',
        method: 'GET',
        params: filters
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'JobWorkerAssignment' as const, id: _id })),
              { type: 'JobWorkerAssignment', id: 'LIST' }
            ]
          : [{ type: 'JobWorkerAssignment', id: 'LIST' }]
    }),

    // Get assignments by worker
    getAssignmentsByWorker: builder.query<
      { success: boolean; data: JobWorkerAssignment[]; total: number },
      { workerId: string; status?: string; jobType?: string; dateFrom?: string; dateTo?: string }
    >({
      query: ({ workerId, ...filters }) => ({
        url: `/job-workers/${workerId}/assignments`,
        method: 'GET',
        params: filters
      }),
      providesTags: (result, error, { workerId }) => [
        { type: 'JobWorkerAssignment', id: 'LIST' },
        { type: 'JobWorker', id: workerId }
      ]
    }),

    // Get assignment by ID
    getAssignmentById: builder.query<
      { success: boolean; data: JobWorkerAssignment },
      string
    >({
      query: (id) => ({
        url: `/job-workers/assignments/${id}`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'JobWorkerAssignment', id }]
    }),

    // Get assignment with summary
    getAssignmentWithSummary: builder.query<
      { success: boolean; data: AssignmentSummary },
      string
    >({
      query: (id) => ({
        url: `/job-workers/assignments/${id}?includeSummary=true`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'JobWorkerAssignment', id }]
    }),

    // Create assignment
    createAssignment: builder.mutation<
      { success: boolean; data: JobWorkerAssignment; message: string },
      CreateAssignmentRequest
    >({
      query: (assignmentData) => ({
        url: '/job-workers/assignments',
        method: 'POST',
        body: assignmentData
      }),
      invalidatesTags: [
        { type: 'JobWorkerAssignment', id: 'LIST' },
        { type: 'JobWorker', id: 'LIST' }
      ]
    }),

    // Update assignment
    updateAssignment: builder.mutation<
      { success: boolean; data: JobWorkerAssignment; message: string },
      { id: string; data: UpdateAssignmentRequest }
    >({
      query: ({ id, data }) => ({
        url: `/job-workers/assignments/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'JobWorkerAssignment', id },
        { type: 'JobWorkerAssignment', id: 'LIST' }
      ]
    }),

    // Update assignment status
    updateAssignmentStatus: builder.mutation<
      { success: boolean; data: JobWorkerAssignment; message: string },
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/job-workers/assignments/${id}/status`,
        method: 'PATCH',
        body: { status }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'JobWorkerAssignment', id },
        { type: 'JobWorkerAssignment', id: 'LIST' }
      ]
    }),

    // Add material to assignment
    addMaterial: builder.mutation<
      { success: boolean; data: JobWorkerAssignment; message: string },
      { id: string; material: MaterialTracking }
    >({
      query: ({ id, material }) => ({
        url: `/job-workers/assignments/${id}/materials`,
        method: 'POST',
        body: material
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'JobWorkerAssignment', id },
        { type: 'JobWorkerAssignment', id: 'LIST' }
      ]
    }),

    // Update material tracking
    updateMaterialTracking: builder.mutation<
      { success: boolean; data: JobWorkerAssignment; message: string },
      { id: string; materialIndex: number; material: Partial<MaterialTracking> }
    >({
      query: ({ id, materialIndex, material }) => ({
        url: `/job-workers/assignments/${id}/materials/${materialIndex}`,
        method: 'PUT',
        body: material
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'JobWorkerAssignment', id },
        { type: 'JobWorkerAssignment', id: 'LIST' }
      ]
    }),

    // Get material tracking report
    getMaterialTrackingReport: builder.query<
      { success: boolean; data: Array<MaterialTracking & { totalGiven?: number; totalUsed?: number; totalReturned?: number; totalRemaining?: number; totalWasted?: number }>; total: number },
      { workerId: string; dateFrom?: string; dateTo?: string }
    >({
      query: ({ workerId, dateFrom, dateTo }) => {
        const params = new URLSearchParams()
        if (dateFrom) params.append('dateFrom', dateFrom)
        if (dateTo) params.append('dateTo', dateTo)
        return {
          url: `/job-workers/${workerId}/materials/report?${params.toString()}`,
          method: 'GET'
        }
      },
      providesTags: (result, error, { workerId }) => [
        { type: 'JobWorker', id: workerId }
      ]
    })
  }),
  overrideExisting: true
})

export const {
  useGetWorkersQuery,
  useGetWorkerByIdQuery,
  useGetWorkerWithSummaryQuery,
  useCreateWorkerMutation,
  useUpdateWorkerMutation,
  useDeleteWorkerMutation,
  useGetAssignmentsQuery,
  useGetAssignmentsByWorkerQuery,
  useGetAssignmentByIdQuery,
  useGetAssignmentWithSummaryQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useUpdateAssignmentStatusMutation,
  useAddMaterialMutation,
  useUpdateMaterialTrackingMutation,
  useGetMaterialTrackingReportQuery
} = jobWorkerApi

