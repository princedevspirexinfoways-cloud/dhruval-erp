import { baseApi } from './baseApi'

export interface JobWorkType {
  _id: string
  companyId: string | null
  name: string
  description?: string
  icon?: string
  color?: string
  isActive: boolean
  createdBy: string
  lastModifiedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateJobWorkTypeRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  companyId?: string
}

export interface UpdateJobWorkTypeRequest {
  name?: string
  description?: string
  icon?: string
  color?: string
  isActive?: boolean
}

export interface JobWorkTypeFilters {
  companyId?: string
  search?: string
  isActive?: boolean
}

export const jobWorkTypeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all job work types
    getJobWorkTypes: builder.query<
      { success: boolean; data: JobWorkType[]; message: string },
      JobWorkTypeFilters | void
    >({
      query: (filters = {}) => ({
        url: '/job-work-types',
        method: 'GET',
        params: filters
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'JobWorkType' as const, id: _id })),
              { type: 'JobWorkType', id: 'LIST' }
            ]
          : [{ type: 'JobWorkType', id: 'LIST' }]
    }),

    // Get job work type by ID
    getJobWorkTypeById: builder.query<
      { success: boolean; data: JobWorkType },
      string
    >({
      query: (id) => ({
        url: `/job-work-types/${id}`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'JobWorkType', id }]
    }),

    // Create job work type
    createJobWorkType: builder.mutation<
      { success: boolean; data: JobWorkType; message: string },
      CreateJobWorkTypeRequest
    >({
      query: (jobWorkTypeData) => ({
        url: '/job-work-types',
        method: 'POST',
        body: jobWorkTypeData
      }),
      invalidatesTags: [{ type: 'JobWorkType', id: 'LIST' }]
    }),

    // Update job work type
    updateJobWorkType: builder.mutation<
      { success: boolean; data: JobWorkType; message: string },
      { id: string; data: UpdateJobWorkTypeRequest }
    >({
      query: ({ id, data }) => ({
        url: `/job-work-types/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'JobWorkType', id },
        { type: 'JobWorkType', id: 'LIST' }
      ]
    }),

    // Delete job work type
    deleteJobWorkType: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/job-work-types/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'JobWorkType', id: 'LIST' }]
    })
  }),
  overrideExisting: true
})

export const {
  useGetJobWorkTypesQuery,
  useGetJobWorkTypeByIdQuery,
  useCreateJobWorkTypeMutation,
  useUpdateJobWorkTypeMutation,
  useDeleteJobWorkTypeMutation
} = jobWorkTypeApi















