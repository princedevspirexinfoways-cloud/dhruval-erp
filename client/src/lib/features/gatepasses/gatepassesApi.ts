import { baseApi } from '@/lib/api/baseApi'

export interface GatePass {
  _id: string
  gatePassNumber: string
  vehicleId: string
  vehicleNumber: string
  driverName: string
  driverPhone: string
  driverIdNumber?: string
  driverLicenseNumber?: string
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other'
  reason: string
  personToMeet?: string
  department?: string
  companyId: string
  timeIn: string
  timeOut?: string
  status: 'active' | 'completed' | 'expired' | 'cancelled'
  securityNotes?: string
  items?: {
    description: string
    quantity: number
    value?: number
  }[]
  images?: string[]
  printedAt?: string
  printedBy?: string
  approvedBy?: string
  approvedAt?: string
  createdBy: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GatePassStats {
  totalGatePasses: number
  activeGatePasses: number
  completedGatePasses: number
  expiredGatePasses: number
  cancelledGatePasses: number
  averageDuration: number
  todayGatePasses: number
  purposeBreakdown: {
    delivery: number
    pickup: number
    maintenance: number
    other: number
  }
}

export interface GatePassesResponse {
  data: GatePass[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateGatePassRequest {
  vehicleId: string
  vehicleNumber: string
  driverName: string
  driverPhone: string
  driverIdNumber?: string
  driverLicenseNumber?: string
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other'
  reason: string
  personToMeet?: string
  department?: string
  companyId: string
  securityNotes?: string
  items?: {
    description: string
    quantity: number
    value?: number
  }[]
  images?: string[]
}

export interface UpdateGatePassRequest {
  driverName?: string
  driverPhone?: string
  driverIdNumber?: string
  driverLicenseNumber?: string
  purpose?: 'delivery' | 'pickup' | 'maintenance' | 'other'
  reason?: string
  personToMeet?: string
  department?: string
  securityNotes?: string
  items?: {
    description: string
    quantity: number
    value?: number
  }[]
  images?: string[]
}

export const gatepassesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllGatePasses: builder.query<GatePassesResponse, {
      page?: number
      limit?: number
      search?: string
      status?: string
      purpose?: string
      dateFrom?: string
      dateTo?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }>({
      query: (params) => ({
        url: '/gatepasses',
        params,
      }),
      providesTags: ['GatePass'],
    }),
    
    getGatePassById: builder.query<GatePass, string>({
      query: (id) => `/gatepasses/${id}`,
      providesTags: (_, __, id) => [{ type: 'GatePass', id }],
    }),
    
    getGatePassByNumber: builder.query<GatePass, string>({
      query: (gatePassNumber) => `/gatepasses/number/${gatePassNumber}`,
      providesTags: (_, __, gatePassNumber) => [{ type: 'GatePass', id: gatePassNumber }],
    }),
    
    getGatePassStats: builder.query<GatePassStats, {
      dateFrom?: string
      dateTo?: string
      companyId?: string
    }>({
      query: (params) => ({
        url: '/gatepasses/stats',
        params,
      }),
      providesTags: ['GatePassStats'],
    }),
    
    getActiveGatePasses: builder.query<GatePass[], void>({
      query: () => '/gatepasses/active',
      providesTags: ['GatePass'],
    }),
    
    getVehicleGatePassHistory: builder.query<GatePass[], string>({
      query: (vehicleNumber) => `/gatepasses/vehicle/${vehicleNumber}/history`,
      providesTags: (_, __, vehicleNumber) => [{ type: 'GatePass', id: vehicleNumber }],
    }),
    
    createGatePass: builder.mutation<GatePass, CreateGatePassRequest>({
      query: (gatePass) => ({
        url: '/gatepasses',
        method: 'POST',
        body: gatePass,
      }),
      invalidatesTags: ['GatePass', 'GatePassStats'],
    }),
    
    updateGatePass: builder.mutation<GatePass, { id: string; gatePass: UpdateGatePassRequest }>({
      query: ({ id, gatePass }) => ({
        url: `/gatepasses/${id}`,
        method: 'PUT',
        body: gatePass,
      }),
      invalidatesTags: ['GatePass', 'GatePassStats'],
    }),
    
    completeGatePass: builder.mutation<GatePass, string>({
      query: (id) => ({
        url: `/gatepasses/${id}/complete`,
        method: 'PATCH',
      }),
      invalidatesTags: ['GatePass', 'GatePassStats'],
    }),

    markOutAtGate: builder.mutation<GatePass, string>({
      query: (id) => ({
        url: `/gatepasses/${id}/mark-out`,
        method: 'PATCH',
      }),
      invalidatesTags: ['GatePass', 'GatePassStats'],
    }),
    
    cancelGatePass: builder.mutation<GatePass, string>({
      query: (id) => ({
        url: `/gatepasses/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['GatePass', 'GatePassStats'],
    }),
    
    printGatePass: builder.mutation<GatePass, string>({
      query: (id) => ({
        url: `/gatepasses/${id}/print`,
        method: 'PATCH',
      }),
      invalidatesTags: ['GatePass'],
    }),
    
    deleteGatePass: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/gatepasses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GatePass', 'GatePassStats'],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetAllGatePassesQuery,
  useGetGatePassByIdQuery,
  useGetGatePassByNumberQuery,
  useGetGatePassStatsQuery,
  useGetActiveGatePassesQuery,
  useGetVehicleGatePassHistoryQuery,
  useCreateGatePassMutation,
  useUpdateGatePassMutation,
  useCompleteGatePassMutation,
  useMarkOutAtGateMutation,
  useCancelGatePassMutation,
  usePrintGatePassMutation,
  useDeleteGatePassMutation,
} = gatepassesApi
