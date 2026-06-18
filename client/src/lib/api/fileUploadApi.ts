import { baseApi } from './baseApi'

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

export interface FileUploadRequest {
  fileName: string
  contentType: string
  fileType?: string
}

export interface FileUploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
}

export const fileUploadApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get presigned URL for upload
    getUploadUrl: builder.mutation<UploadUrlResponse, FileUploadRequest>({
      query: (data) => ({
        url: '/visitors/upload-url',
        method: 'POST',
        body: data,
      }),
    }),

    // Get presigned URL for download
    getDownloadUrl: builder.query<DownloadUrlResponse, string>({
      query: (key) => `/visitors/download/${encodeURIComponent(key)}`,
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

    // Create visitor with files
    createVisitorWithFiles: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/visitors/with-files',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['File'],
    }),

    // Upload entry photo
    uploadEntryPhoto: builder.mutation<any, { visitorId: string; formData: FormData }>({
      query: ({ visitorId, formData }) => ({
        url: `/visitors/${visitorId}/entry-photo`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['File'],
    }),

    // Upload exit photo
    uploadExitPhoto: builder.mutation<any, { visitorId: string; formData: FormData }>({
      query: ({ visitorId, formData }) => ({
        url: `/visitors/${visitorId}/exit-photo`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['File'],
    }),
  }),
})

export const {
  useGetUploadUrlMutation,
  useGetDownloadUrlQuery,
  useUploadToS3Mutation,
  useCreateVisitorWithFilesMutation,
  useUploadEntryPhotoMutation,
  useUploadExitPhotoMutation,
} = fileUploadApi

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

// Helper function to create FormData for visitor with files
export const createVisitorFormData = (visitorData: any, files: any): FormData => {
  const formData = new FormData()

  // Add visitor data as JSON
  formData.append('visitorData', JSON.stringify(visitorData))

  // Add files
  if (files.entryPhoto && files.entryPhoto.length > 0) {
    formData.append('entryPhoto', files.entryPhoto[0])
  }

  if (files.documents && files.documents.length > 0) {
    files.documents.forEach((file: File) => {
      formData.append('documents', file)
    })
  }

  if (files.attachments && files.attachments.length > 0) {
    files.attachments.forEach((file: File) => {
      formData.append('attachments', file)
    })
  }

  return formData
}

// Helper function to get file URL from key
export const getFileUrl = (key: string): string => {
  // This would typically be your S3 bucket URL or CDN URL
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://usc1.contabostorage.com/erp'
  return `${baseUrl}/${key}`
}

// Helper function to extract file extension
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

// Helper function to check if file is image
export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const extension = getFileExtension(fileName)
  return imageExtensions.includes(extension)
}

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to validate file type
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  const fileExtension = getFileExtension(file.name)
  const mimeType = file.type

  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return fileExtension === type.substring(1)
    }
    if (type.includes('/*')) {
      return mimeType.startsWith(type.split('/')[0])
    }
    return mimeType === type
  })
}

// Helper function to validate file size
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export default fileUploadApi
