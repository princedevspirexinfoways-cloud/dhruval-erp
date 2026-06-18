import { baseApi } from './baseApi'

export interface Dispatch {
  _id: string
  companyId: {
    _id: string
    companyName?: string
  }
  dispatchNumber: string
  dispatchDate: string
  dispatchType: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sourceWarehouseId: {
    _id: string
    warehouseName?: string
    warehouseCode?: string
  }
  customerOrderId: {
    _id: string
    orderNumber?: string
    customerName?: string
    customerId?: string
  }
  vehicleNumber?: string
  deliveryPersonName?: string
  deliveryPersonNumber?: string
  status: 'draft' | 'pending' | 'in-progress' | 'completed' | 'delivered' | 'cancelled'
  documents?: {
    photos?: string[]
  }
  notes?: string
  assignedTo?: {
    _id: string
    name?: string
    email?: string
  }
  createdBy: {
    _id: string
    name?: string
    email?: string
  }
  createdAt: string
  updatedAt: string
  __v: number
}

export interface CreateDispatchRequest {
  companyId: string
  dispatchNumber?: string // Optional - will be auto-generated on backend
  dispatchDate: string
  dispatchType: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  sourceWarehouseId: string
  customerOrderId: string
  vehicleNumber?: string
  deliveryPersonName?: string
  deliveryPersonNumber?: string
  status?: 'draft' | 'pending' | 'in-progress' | 'completed' | 'delivered' | 'cancelled'
  documents?: {
    photos?: string[]
  }
  notes?: string
}

export interface UpdateDispatchRequest {
  id: string
  companyId?: string
  dispatchNumber?: string
  dispatchDate?: string
  dispatchType?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  sourceWarehouseId?: string
  customerOrderId?: string
  vehicleNumber?: string
  deliveryPersonName?: string
  deliveryPersonNumber?: string
  status?: 'draft' | 'pending' | 'in-progress' | 'completed' | 'delivered' | 'cancelled'
  documents?: {
    photos?: string[]
  }
  notes?: string
  assignedTo?: string
}

export interface Company {
  _id: string
  name: string
}

export interface User {
  _id: string
  name: string
  email: string
  role: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  key: string
  publicUrl: string
  expiresAt: string
  expiresIn: number
}

export interface DownloadUrlResponse {
  downloadUrl: string
  expiresAt: string
  expiresIn: number
}

export const enhancedDispatchApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getDispatches: builder.query<Dispatch[], { status?: string; priority?: string; companyId?: string; assignedTo?: string; search?: string }>({
      query: (params) => ({
        url: '/enhanced-dispatch',
        params,
      }),
      providesTags: ['Dispatch'],
    }),

    getDispatchById: builder.query<Dispatch, string>({
      query: (id) => `/enhanced-dispatch/${id}`,
      providesTags: (result, error, id) => [{ type: 'Dispatch', id }],
    }),

    createDispatch: builder.mutation<Dispatch, CreateDispatchRequest>({
      query: (dispatch) => ({
        url: '/enhanced-dispatch',
        method: 'POST',
        body: dispatch,
      }),
      invalidatesTags: ['Dispatch'],
    }),

    updateDispatch: builder.mutation<Dispatch, UpdateDispatchRequest>({
      query: ({ id, ...updateData }) => ({
        url: `/enhanced-dispatch/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Dispatch', id },
        'Dispatch',
      ],
    }),

    quickUpdateDispatchStatus: builder.mutation<Dispatch, { id: string; status: string; priority?: string }>({
      query: ({ id, status, priority }) => ({
        url: `/enhanced-dispatch/${id}`,
        method: 'PUT',
        body: { status, priority },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Dispatch', id },
        'Dispatch',
      ],
    }),

    deleteDispatch: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/enhanced-dispatch/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Dispatch'],
    }),

    getCompanies: builder.query<Company[], void>({
      query: () => '/enhanced-dispatch/companies/list',
      providesTags: ['Company'],
    }),

    getUsers: builder.query<User[], void>({
      query: () => '/enhanced-dispatch/users/list',
      providesTags: ['User'],
    }),

    // Get presigned URL for upload
    getUploadUrl: builder.mutation<UploadUrlResponse, { fileName: string; contentType: string; fileType?: string }>({
      query: (data) => ({
        url: '/enhanced-dispatch/upload-url',
        method: 'POST',
        body: data,
      }),
    }),

    // Get presigned URL for download
    getDownloadUrl: builder.query<DownloadUrlResponse, string>({
      query: (key) => `/enhanced-dispatch/download/${encodeURIComponent(key)}`,
    }),

    // Upload file directly to S3 using presigned URL
    uploadToS3: builder.mutation<void, { uploadUrl: string; file: File; onProgress?: (progress: number) => void }>({
      queryFn: async ({ uploadUrl, file, onProgress }) => {
        try {
          const xhr = new XMLHttpRequest()

          return new Promise<{ data: void } | { error: any }>((resolve) => {
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100)
                onProgress(progress)
              }
            })

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ data: undefined as void })
              } else {
                resolve({
                  error: {
                    status: xhr.status,
                    data: { message: `Upload failed with status ${xhr.status}` }
                  }
                })
              }
            })

            xhr.addEventListener('error', () => {
              resolve({
                error: {
                  status: 'FETCH_ERROR',
                  data: { message: 'Network error during upload' }
                }
              })
            })

            xhr.addEventListener('abort', () => {
              resolve({
                error: {
                  status: 'FETCH_ERROR',
                  data: { message: 'Upload was aborted' }
                }
              })
            })

            xhr.open('PUT', uploadUrl)
            xhr.setRequestHeader('Content-Type', file.type)
            xhr.send(file)
          })
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              data: { message: error instanceof Error ? error.message : 'Failed to upload file' }
            }
          }
        }
      },
    }),

    // Upload dispatch photos
    uploadDispatchPhotos: builder.mutation<any, { dispatchId: string; formData: FormData }>({
      query: ({ dispatchId, formData }) => ({
        url: `/enhanced-dispatch/${dispatchId}/dispatch-photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { dispatchId }) => [{ type: 'Dispatch', id: dispatchId }],
    }),

    // Upload cargo photos
    uploadCargoPhotos: builder.mutation<any, { dispatchId: string; formData: FormData }>({
      query: ({ dispatchId, formData }) => ({
        url: `/enhanced-dispatch/${dispatchId}/cargo-photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { dispatchId }) => [{ type: 'Dispatch', id: dispatchId }],
    }),

    // Upload vehicle photos
    uploadVehiclePhotos: builder.mutation<any, { dispatchId: string; formData: FormData }>({
      query: ({ dispatchId, formData }) => ({
        url: `/enhanced-dispatch/${dispatchId}/vehicle-photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { dispatchId }) => [{ type: 'Dispatch', id: dispatchId }],
    }),
  }),
})

export const {
  useGetDispatchesQuery,
  useGetDispatchByIdQuery,
  useCreateDispatchMutation,
  useUpdateDispatchMutation,
  useQuickUpdateDispatchStatusMutation,
  useDeleteDispatchMutation,
  useGetCompaniesQuery,
  useGetUsersQuery,
  useGetUploadUrlMutation,
  useGetDownloadUrlQuery,
  useUploadToS3Mutation,
  useUploadDispatchPhotosMutation,
  useUploadCargoPhotosMutation,
  useUploadVehiclePhotosMutation,
} = enhancedDispatchApi
