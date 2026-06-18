import { baseApi } from './baseApi'

// Types
export interface Equipment {
  _id?: string
  name: string
  type: string
  model: string
  brand: string
  serialNumber: string
  location: string
  status: 'operational' | 'maintenance' | 'down' | 'retired'
  lastMaintenance?: string
  nextMaintenance?: string
  specifications?: {
    power?: string
    capacity?: string
    dimensions?: string
    weight?: string
    voltage?: string
    frequency?: string
    [key: string]: any
  }
  createdAt?: string
  updatedAt?: string
}

export interface CompatibilityRecord {
  _id?: string
  spareId: string
  equipmentId: string
  equipmentName: string
  equipmentType: string
  equipmentModel: string
  equipmentBrand: string
  isUniversal: boolean
  compatibilityNotes?: string
  verifiedBy?: string
  verifiedDate?: string
  status: 'verified' | 'unverified' | 'incompatible' | 'pending'
  installationDate?: string
  removalDate?: string
  performanceRating?: number
  issues?: string[]
  testResults?: {
    testDate: string
    testType: string
    result: 'pass' | 'fail' | 'partial'
    notes?: string
  }
  costImplications?: {
    installationCost?: number
    maintenanceCost?: number
    replacementCost?: number
    notes?: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface CompatibilityAnalytics {
  totalRecords: number
  verifiedRecords: number
  unverifiedRecords: number
  incompatibleRecords: number
  universalParts: number
  averagePerformanceRating: number
  equipmentTypeBreakdown: Array<{
    type: string
    count: number
    percentage: number
  }>
  statusBreakdown: Array<{
    status: string
    count: number
    percentage: number
  }>
  performanceDistribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
  monthlyTrends: Array<{
    month: string
    newRecords: number
    verifiedRecords: number
    averageRating: number
  }>
}

export interface CompatibilityFilters {
  spareId?: string
  equipmentType?: string
  equipmentBrand?: string
  status?: string
  isUniversal?: boolean
  performanceRating?: number
  page?: number
  limit?: number
}

export const compatibilityApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get compatibility records for a spare
    getCompatibilityRecords: builder.query<
      { success: boolean; data: CompatibilityRecord[] },
      string
    >({
      query: (spareId) => ({
        url: `/compatibility/records/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: `SPARE_${spareId}` },
      ],
    }),

    // Create compatibility record
    createCompatibilityRecord: builder.mutation<
      { success: boolean; data: CompatibilityRecord; message: string },
      CompatibilityRecord
    >({
      query: (recordData) => ({
        url: '/compatibility/records',
        method: 'POST',
        body: recordData,
      }),
      invalidatesTags: (result, error, recordData) => [
        { type: 'Spare', id: `SPARE_${recordData.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Update compatibility record
    updateCompatibilityRecord: builder.mutation<
      { success: boolean; data: CompatibilityRecord; message: string },
      { id: string; data: Partial<CompatibilityRecord> }
    >({
      query: ({ id, data }) => ({
        url: `/compatibility/records/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => [
        { type: 'Spare', id },
        { type: 'Spare', id: `SPARE_${data.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Delete compatibility record
    deleteCompatibilityRecord: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/compatibility/records/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Get all equipment
    getEquipment: builder.query<
      { success: boolean; data: Equipment[] },
      void
    >({
      query: () => ({
        url: '/compatibility/equipment',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'LIST' }],
    }),

    // Create equipment
    createEquipment: builder.mutation<
      { success: boolean; data: Equipment; message: string },
      Equipment
    >({
      query: (equipmentData) => ({
        url: '/compatibility/equipment',
        method: 'POST',
        body: equipmentData,
      }),
      invalidatesTags: [{ type: 'Spare', id: 'LIST' }],
    }),

    // Update equipment
    updateEquipment: builder.mutation<
      { success: boolean; data: Equipment; message: string },
      { id: string; data: Partial<Equipment> }
    >({
      query: ({ id, data }) => ({
        url: `/compatibility/equipment/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Delete equipment
    deleteEquipment: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/compatibility/equipment/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Get compatibility analytics for a spare
    getCompatibilityAnalytics: builder.query<
      { success: boolean; data: CompatibilityAnalytics },
      string
    >({
      query: (spareId) => ({
        url: `/compatibility/analytics/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: spareId },
      ],
    }),

    // Get universal parts
    getUniversalParts: builder.query<
      { success: boolean; data: CompatibilityRecord[] },
      void
    >({
      query: () => ({
        url: '/compatibility/universal-parts',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'UNIVERSAL' }],
    }),

    // Get equipment by type
    getEquipmentByType: builder.query<
      { success: boolean; data: Equipment[] },
      string
    >({
      query: (type) => ({
        url: `/compatibility/equipment/type/${type}`,
        method: 'GET',
      }),
      providesTags: (result, error, type) => [
        { type: 'Spare', id: `TYPE_${type}` },
      ],
    }),

    // Get equipment by brand
    getEquipmentByBrand: builder.query<
      { success: boolean; data: Equipment[] },
      string
    >({
      query: (brand) => ({
        url: `/compatibility/equipment/brand/${brand}`,
        method: 'GET',
      }),
      providesTags: (result, error, brand) => [
        { type: 'Spare', id: `BRAND_${brand}` },
      ],
    }),

    // Search equipment
    searchEquipment: builder.query<
      { success: boolean; data: Equipment[] },
      string
    >({
      query: (query) => ({
        url: `/compatibility/equipment/search`,
        method: 'GET',
        params: { q: query },
      }),
      providesTags: (result, error, query) => [
        { type: 'Spare', id: `SEARCH_${query}` },
      ],
    }),

    // Get overall compatibility statistics
    getCompatibilityStats: builder.query<
      { success: boolean; data: CompatibilityAnalytics },
      void
    >({
      query: () => ({
        url: '/compatibility/stats',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'OVERALL' }],
    }),

    // Perform bulk compatibility check
    bulkCompatibilityCheck: builder.mutation<
      { success: boolean; data: CompatibilityRecord[]; message: string },
      { spareIds: string[]; equipmentIds: string[] }
    >({
      query: (bulkData) => ({
        url: '/compatibility/bulk-check',
        method: 'POST',
        body: bulkData,
      }),
      invalidatesTags: [{ type: 'Spare', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetCompatibilityRecordsQuery,
  useCreateCompatibilityRecordMutation,
  useUpdateCompatibilityRecordMutation,
  useDeleteCompatibilityRecordMutation,
  useGetEquipmentQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
  useGetCompatibilityAnalyticsQuery,
  useGetUniversalPartsQuery,
  useGetEquipmentByTypeQuery,
  useGetEquipmentByBrandQuery,
  useSearchEquipmentQuery,
  useGetCompatibilityStatsQuery,
  useBulkCompatibilityCheckMutation,
} = compatibilityApi
