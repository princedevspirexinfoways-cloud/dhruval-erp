import { baseApi } from './baseApi'

export interface DispatchData {
  dispatchInfo: {
    dispatchNumber: string
    dispatchDate: string
    dispatchTime: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  }
  vehicleInfo: {
    vehicleNumber: string
    vehicleType: string
    driverName: string
    driverPhone: string
    driverLicense: string
  }
  routeInfo: {
    pickupLocation: string
    deliveryLocation: string
    estimatedDuration: number
    routeNotes: string
  }
  cargoInfo: {
    cargoType: string
    weight: string
    dimensions: string
    specialHandling: boolean
    handlingNotes: string
  }
  securityInfo: {
    escortRequired: boolean
    securityClearance: 'standard' | 'enhanced' | 'restricted' | 'confidential'
    accessAreas: string[]
    specialInstructions: string
  }
  images?: {
    dispatchPhotos: File[]
    cargoPhotos: File[]
    vehiclePhotos: File[]
    documents: File[]
  }
}

export interface DispatchResponse {
  _id: string
  dispatchNumber: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  // ... other fields
}

export interface UploadUrlResponse {
  uploadUrl: string
  key: string
  expiresAt: string
  expiresIn: number
}

export interface DownloadUrlResponse {
  downloadUrl: string
  expiresAt: string
  expiresIn: number
}

export const dispatchApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all dispatches
    getDispatches: builder.query<{ data: DispatchResponse[]; total: number }, any>({
      query: (params) => ({
        url: '/dispatches',
        method: 'GET',
        params,
      }),
      providesTags: ['Dispatch'],
    }),

    // Get dispatch by ID
    getDispatch: builder.query<DispatchResponse, string>({
      query: (id) => `/dispatches/${id}`,
      providesTags: (result, error, id) => [{ type: 'Dispatch', id }],
    }),

    // Create dispatch
    createDispatch: builder.mutation<DispatchResponse, FormData>({
      query: (formData) => ({
        url: '/dispatches',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Dispatch'],
    }),

    // Update dispatch
    updateDispatch: builder.mutation<DispatchResponse, { id: string; data: Partial<DispatchData> }>({
      query: ({ id, data }) => ({
        url: `/dispatches/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Dispatch', id }],
    }),

    // Delete dispatch
    deleteDispatch: builder.mutation<void, string>({
      query: (id) => ({
        url: `/dispatches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Dispatch'],
    }),

    // Update dispatch status
    updateDispatchStatus: builder.mutation<DispatchResponse, { id: string; status: string; notes?: string }>({
      query: ({ id, status, notes }) => ({
        url: `/dispatches/${id}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Dispatch', id }],
    }),

    // Get presigned URL for upload
    getUploadUrl: builder.mutation<UploadUrlResponse, { fileName: string; contentType: string; fileType?: string }>({
      query: (data) => ({
        url: '/dispatches/upload-url',
        method: 'POST',
        body: data,
      }),
    }),

    // Get presigned URL for download
    getDownloadUrl: builder.query<DownloadUrlResponse, string>({
      query: (key) => `/dispatches/download/${encodeURIComponent(key)}`,
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
                    data: { message: 'Upload failed' }
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

            xhr.open('PUT', uploadUrl)
            xhr.setRequestHeader('Content-Type', file.type)
            xhr.send(file)
          })
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              data: { message: 'Failed to upload file' }
            }
          }
        }
      },
    }),

    // Upload dispatch photos
    uploadDispatchPhotos: builder.mutation<any, { dispatchId: string; formData: FormData }>({
      query: ({ dispatchId, formData }) => ({
        url: `/dispatches/${dispatchId}/dispatch-photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { dispatchId }) => [{ type: 'Dispatch', id: dispatchId }],
    }),

    // Upload cargo photos
    uploadCargoPhotos: builder.mutation<any, { dispatchId: string; formData: FormData }>({
      query: ({ dispatchId, formData }) => ({
        url: `/dispatches/${dispatchId}/cargo-photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { dispatchId }) => [{ type: 'Dispatch', id: dispatchId }],
    }),

    // Upload vehicle photos
    uploadVehiclePhotos: builder.mutation<any, { dispatchId: string; formData: FormData }>({
      query: ({ dispatchId, formData }) => ({
        url: `/dispatches/${dispatchId}/vehicle-photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { dispatchId }) => [{ type: 'Dispatch', id: dispatchId }],
    }),

    // Get dispatch statistics
    getDispatchStatistics: builder.query<any, { period?: number }>({
      query: (params) => ({
        url: '/dispatches/statistics/overview',
        method: 'GET',
        params,
      }),
    }),
  }),
})

export const {
  useGetDispatchesQuery,
  useGetDispatchQuery,
  useCreateDispatchMutation,
  useUpdateDispatchMutation,
  useDeleteDispatchMutation,
  useUpdateDispatchStatusMutation,
  useGetUploadUrlMutation,
  useGetDownloadUrlQuery,
  useUploadToS3Mutation,
  useUploadDispatchPhotosMutation,
  useUploadCargoPhotosMutation,
  useUploadVehiclePhotosMutation,
  useGetDispatchStatisticsQuery,
} = dispatchApi

// Helper function to upload multiple files
export const uploadMultipleFiles = async (
  files: File[],
  fileType: string,
  getUploadUrl: any,
  uploadToS3: any,
  onProgress?: (fileName: string, progress: number) => void,
  onStatusChange?: (fileName: string, status: 'uploading' | 'success' | 'error') => void
): Promise<{ [fileName: string]: string }> => {
  const uploadedFiles: { [fileName: string]: string } = {}
  
  for (const file of files) {
    try {
      if (onStatusChange) {
        onStatusChange(file.name, 'uploading')
      }

      // Get presigned URL
      const { uploadUrl, key } = await getUploadUrl({
        fileName: file.name,
        contentType: file.type,
        fileType,
      }).unwrap()

      // Upload to S3
      await uploadToS3({
        uploadUrl,
        file,
        onProgress: (progress: number) => {
          if (onProgress) {
            onProgress(file.name, progress)
          }
        },
      }).unwrap()

      uploadedFiles[file.name] = key
      
      if (onStatusChange) {
        onStatusChange(file.name, 'success')
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      if (onStatusChange) {
        onStatusChange(file.name, 'error')
      }
    }
  }

  return uploadedFiles
}

// Helper function to create FormData for dispatch with files
export const createDispatchFormData = (dispatchData: DispatchData, files: any): FormData => {
  const formData = new FormData()

  // Add dispatch data as JSON
  formData.append('dispatchData', JSON.stringify(dispatchData))

  // Add files
  if (files.dispatchPhotos && files.dispatchPhotos.length > 0) {
    files.dispatchPhotos.forEach((file: File) => {
      formData.append('dispatchPhotos', file)
    })
  }

  if (files.cargoPhotos && files.cargoPhotos.length > 0) {
    files.cargoPhotos.forEach((file: File) => {
      formData.append('cargoPhotos', file)
    })
  }

  if (files.vehiclePhotos && files.vehiclePhotos.length > 0) {
    files.vehiclePhotos.forEach((file: File) => {
      formData.append('vehiclePhotos', file)
    })
  }

  if (files.documents && files.documents.length > 0) {
    files.documents.forEach((file: File) => {
      formData.append('documents', file)
    })
  }

  return formData
}

// Helper function to get file URL from key
export const getFileUrl = (key: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://usc1.contabostorage.com/erp'
  return `${baseUrl}/${key}`
}

// Helper function to extract file extension
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
