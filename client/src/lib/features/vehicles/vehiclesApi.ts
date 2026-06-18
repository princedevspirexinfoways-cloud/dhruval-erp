import { baseApi } from '@/lib/api/baseApi'

export interface Vehicle {
  _id: string
  vehicleNumber: string
  driverName: string
  driverPhone: string
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other'
  reason: string
  timeIn: string
  timeOut?: string
  status: 'in' | 'out' | 'pending'
  currentStatus: 'in' | 'out' | 'pending'
  gatePassNumber?: string
  images?: string[]
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface VehicleStats {
  totalVehicles: number
  vehiclesIn: number
  vehiclesOut: number
  pendingVehicles: number
  deliveryVehicles: number
  pickupVehicles: number
  maintenanceVehicles: number
  todayEntries: number
  vehiclesByPurpose: {
    purpose: string
    count: number
  }[]
  averageStayTime: number
}

export interface VehiclesResponse {
  data: Vehicle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateVehicleRequest {
  vehicleNumber: string
  driverName: string
  driverPhone: string
  purpose: Vehicle['purpose']
  reason: string
  gatePassNumber?: string
  companyId: string
}

export interface UpdateVehicleRequest {
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string
  purpose?: Vehicle['purpose']
  reason?: string
  timeOut?: string
  status?: Vehicle['status']
  gatePassNumber?: string
}

export interface UploadVehicleImageRequest {
  vehicleId: string
  images: File[]
}

export interface UploadVehicleDocumentRequest {
  vehicleId: string
  documentType: 'registration' | 'insurance' | 'puc' | 'license'
  document: File
}

export const vehiclesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllVehicles: builder.query<VehiclesResponse, {
      page?: number
      limit?: number
      search?: string
      purpose?: string
      status?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      dateFrom?: string
      dateTo?: string
      companyId?: string
    }>({
      query: (params) => ({
        url: '/vehicles',
        params,
      }),
      providesTags: ['Vehicle'],
    }),
    getVehicleById: builder.query<Vehicle, string>({
      query: (id) => `/vehicles/${id}`,
      providesTags: (_, __, id) => [{ type: 'Vehicle', id }],
    }),
    getVehicleStats: builder.query<VehicleStats, {
      dateFrom?: string
      dateTo?: string
      companyId?: string
    }>({
      query: (params) => ({
        url: '/vehicles/stats',
        params,
      }),
      providesTags: ['VehicleStats'],
    }),
    createVehicle: builder.mutation<Vehicle, CreateVehicleRequest>({
      query: (vehicle) => ({
        url: '/vehicles',
        method: 'POST',
        body: vehicle,
      }),
      invalidatesTags: ['Vehicle', 'VehicleStats'],
    }),
    updateVehicle: builder.mutation<Vehicle, { id: string; vehicle: UpdateVehicleRequest }>({
      query: ({ id, vehicle }) => ({
        url: `/vehicles/${id}`,
        method: 'PUT',
        body: vehicle,
      }),
      invalidatesTags: ['Vehicle', 'VehicleStats'],
    }),
    updateVehicleStatus: builder.mutation<Vehicle, { id: string; status: Vehicle['status'] }>({
      query: ({ id, status }) => ({
        url: `/vehicles/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Vehicle', 'VehicleStats'],
    }),
    checkoutVehicle: builder.mutation<Vehicle, { id: string; timeOut?: string }>({
      query: ({ id, timeOut }) => ({
        url: `/vehicles/${id}/checkout`,
        method: 'PATCH',
        body: { timeOut: timeOut || new Date().toISOString() },
      }),
      invalidatesTags: ['Vehicle', 'VehicleStats'],
    }),
    deleteVehicle: builder.mutation<void, string>({
      query: (id) => ({
        url: `/vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vehicle', 'VehicleStats'],
    }),
    uploadVehicleImages: builder.mutation<{ success: boolean; data: { images: string[] } }, UploadVehicleImageRequest>({
      query: ({ vehicleId, images }) => {
        const formData = new FormData()
        images.forEach((image) => {
          formData.append(`images`, image)
        })
        return {
          url: `/vehicles/${vehicleId}/images`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Vehicle'],
    }),
    uploadVehicleDocument: builder.mutation<{ success: boolean; data: { documentUrl: string } }, UploadVehicleDocumentRequest>({
      query: ({ vehicleId, documentType, document }) => {
        const formData = new FormData()
        formData.append('document', document)
        formData.append('documentType', documentType)
        return {
          url: `/vehicles/${vehicleId}/documents`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Vehicle'],
    }),
    deleteVehicleImage: builder.mutation<void, { vehicleId: string; imageUrl: string }>({
      query: ({ vehicleId, imageUrl }) => ({
        url: `/vehicles/${vehicleId}/images`,
        method: 'DELETE',
        body: { imageUrl },
      }),
      invalidatesTags: ['Vehicle'],
    }),
    addMaintenanceRecord: builder.mutation<Vehicle, { 
      vehicleId: string
      record: {
        type: string
        description: string
        cost: number
        nextServiceDate?: string
      }
    }>({
      query: ({ vehicleId, record }) => ({
        url: `/vehicles/${vehicleId}/maintenance`,
        method: 'POST',
        body: record,
      }),
      invalidatesTags: ['Vehicle', 'VehicleStats'],
    }),
    addFuelRecord: builder.mutation<Vehicle, { 
      vehicleId: string
      record: {
        quantity: number
        cost: number
        odometer: number
      }
    }>({
      query: ({ vehicleId, record }) => ({
        url: `/vehicles/${vehicleId}/fuel`,
        method: 'POST',
        body: record,
      }),
      invalidatesTags: ['Vehicle', 'VehicleStats'],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetAllVehiclesQuery,
  useGetVehicleByIdQuery,
  useGetVehicleStatsQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useUpdateVehicleStatusMutation,
  useCheckoutVehicleMutation,
  useDeleteVehicleMutation,
  useUploadVehicleImagesMutation,
  useUploadVehicleDocumentMutation,
  useDeleteVehicleImageMutation,
  useAddMaintenanceRecordMutation,
  useAddFuelRecordMutation,
} = vehiclesApi
