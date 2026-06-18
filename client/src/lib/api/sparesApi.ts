import { baseApi } from './baseApi'

// Types
export interface Spare {
  _id: string
  companyId: string
  spareCode: string
  spareName: string
  spareDescription?: string
  category: 'mechanical' | 'electrical' | 'electronic' | 'hydraulic' | 'pneumatic' | 'consumable' | 'tool' | 'safety' | 'other'
  subCategory?: string
  partNumber: string
  manufacturerPartNumber?: string
  alternatePartNumbers?: string[]
  manufacturer: string
  brand?: string
  spareModel?: string
  specifications: {
    dimensions?: {
      length?: number
      width?: number
      height?: number
      diameter?: number
      unit: string
    }
    weight?: {
      value: number
      unit: string
    }
    material?: string
    color?: string
    finish?: string
  }
  compatibility: Array<{
    equipmentType: string
    equipmentModel: string
    equipmentBrand: string
    equipmentId?: string
    isUniversal: boolean
  }>
  stock: {
    currentStock: number
    reservedStock: number
    availableStock: number
    inTransitStock: number
    damagedStock: number
    unit: string
    alternateUnit?: string
    conversionFactor?: number
    reorderLevel: number
    minStockLevel: number
    maxStockLevel: number
    economicOrderQuantity?: number
    averageCost: number
    totalValue: number
  }
  locations: Array<{
    warehouseId?: string
    warehouseName?: string
    zone?: string
    rack?: string
    bin?: string
    quantity: number
    lastUpdated: string
    isActive: boolean
  }>
  pricing: {
    costPrice?: number
    standardCost?: number
    lastPurchasePrice?: number
    averagePurchasePrice?: number
    currency: string
  }
  suppliers: Array<{
    supplierId: string
    supplierName: string
    supplierCode: string
    partNumber: string
    isPrimary: boolean
    leadTime: number
    minOrderQuantity: number
    lastSupplyDate?: string
    lastSupplyRate?: number
    qualityRating: number
    warrantyPeriod?: number
  }>
  maintenance: {
    isConsumable: boolean
    expectedLifespan?: number
    maintenanceSchedule?: {
      scheduleType: 'preventive' | 'predictive' | 'corrective'
      frequency: number
      lastMaintenance?: string
      nextMaintenance?: string
      maintenanceNotes?: string
      isActive: boolean
    }
    criticality: 'low' | 'medium' | 'high' | 'critical'
    failureRate?: number
    mtbf?: number
  }
  usage: {
    totalUsed: number
    averageMonthlyUsage: number
    lastUsedDate?: string
    usageHistory: Array<{
      usedDate: string
      quantity: number
      equipmentId?: string
      equipmentName?: string
      workOrderId?: string
      workOrderNumber?: string
      usedBy: string
      usedByName: string
      reason: string
      notes?: string
    }>
  }
  quality: {
    qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C'
    qualityCheckRequired: boolean
    qualityParameters: string[]
    lastQualityCheck?: string
    qualityNotes?: string
    certifications: string[]
    complianceStandards: string[]
  }
  storage: {
    storageConditions?: string
    temperatureRange?: {
      min: number
      max: number
      unit: string
    }
    humidityRange?: {
      min: number
      max: number
    }
    specialHandling?: string
    shelfLife?: number
    expiryDate?: string
  }
  documentation: {
    images?: string[]
    manuals?: string[]
    drawings?: string[]
    certificates?: string[]
    notes?: string
  }
  status: {
    isActive: boolean
    isDiscontinued: boolean
    isCritical: boolean
    isObsolete: boolean
    requiresApproval: boolean
    isHazardous: boolean
  }
  tracking: {
    lastModifiedBy?: string
    lastStockUpdate?: string
    lastMovementDate?: string
    totalInward: number
    totalOutward: number
    totalAdjustments: number
  }
  // Virtual fields
  isLowStock?: boolean
  isOutOfStock?: boolean
  isCriticalLowStock?: boolean
  createdAt: string
  updatedAt: string
}

export interface SpareFilters {
  category?: string
  manufacturer?: string
  isActive?: boolean
  isLowStock?: boolean
  isCritical?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SpareStats {
  totalSpares: number
  activeSpares: number
  lowStockSpares: number
  criticalSpares: number
  outOfStockSpares: number
  totalValue: number
  categoriesBreakdown: Array<{
    category: string
    count: number
    value: number
  }>
  criticalityBreakdown: Array<{
    criticality: string
    count: number
  }>
}

export interface StockUpdateRequest {
  quantity: number
  type: 'inward' | 'outward' | 'adjustment'
  reason: string
  warehouseId?: string
}

export interface SparesResponse {
  spares: Spare[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const sparesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get spares with filtering and pagination
    getSpares: builder.query<
      { success: boolean; data: SparesResponse },
      SpareFilters | void
    >({
      query: (filters = {}) => ({
        url: '/spares',
        method: 'GET',
        params: filters,
      }),
      providesTags: (result) =>
        result?.data.spares
          ? [
              ...result.data.spares.map(({ _id }) => ({ type: 'Spare' as const, id: _id })),
              { type: 'Spare', id: 'LIST' },
            ]
          : [{ type: 'Spare', id: 'LIST' }],
    }),

    // Get spare by ID
    getSpareById: builder.query<
      { success: boolean; data: Spare },
      string
    >({
      query: (id) => ({
        url: `/spares/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Spare', id }],
    }),

    // Create spare
    createSpare: builder.mutation<
      { success: boolean; data: Spare; message: string },
      Partial<Spare>
    >({
      query: (spareData) => ({
        url: '/spares',
        method: 'POST',
        body: spareData,
      }),
      invalidatesTags: [{ type: 'Spare', id: 'LIST' }],
    }),

    // Update spare
    updateSpare: builder.mutation<
      { success: boolean; data: Spare; message: string },
      { id: string; data: Partial<Spare> }
    >({
      query: ({ id, data }) => ({
        url: `/spares/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Delete spare
    deleteSpare: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/spares/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Get spare statistics
    getSpareStats: builder.query<
      { success: boolean; data: SpareStats },
      void
    >({
      query: () => ({
        url: '/spares/stats',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'STATS' }],
    }),

    // Get low stock spares
    getLowStockSpares: builder.query<
      { success: boolean; data: Spare[] },
      void
    >({
      query: () => ({
        url: '/spares/low-stock',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'LOW_STOCK' }],
    }),

    // Get spares by category
    getSparesByCategory: builder.query<
      { success: boolean; data: Spare[] },
      string
    >({
      query: (category) => ({
        url: `/spares/category/${category}`,
        method: 'GET',
      }),
      providesTags: (result, error, category) => [
        { type: 'Spare', id: `CATEGORY_${category}` },
      ],
    }),

    // Update spare stock
    updateSpareStock: builder.mutation<
      { success: boolean; data: Spare; message: string },
      { spareId: string; stockUpdate: StockUpdateRequest }
    >({
      query: ({ spareId, stockUpdate }) => ({
        url: `/spares/${spareId}/stock`,
        method: 'POST',
        body: stockUpdate,
      }),
      invalidatesTags: (result, error, { spareId }) => [
        { type: 'Spare', id: spareId },
        { type: 'Spare', id: 'LIST' },
        { type: 'Spare', id: 'STATS' },
        { type: 'Spare', id: 'LOW_STOCK' },
      ],
    }),

    // Check spare code uniqueness
    checkSpareCodeUnique: builder.query<
      { success: boolean; data: { isUnique: boolean } },
      { spareCode: string; excludeId?: string }
    >({
      query: ({ spareCode, excludeId }) => ({
        url: `/spares/check-code/${spareCode}`,
        method: 'GET',
        params: excludeId ? { excludeId } : {},
      }),
    }),
  }),
})

export const {
  useGetSparesQuery,
  useGetSpareByIdQuery,
  useCreateSpareMutation,
  useUpdateSpareMutation,
  useDeleteSpareMutation,
  useGetSpareStatsQuery,
  useGetLowStockSparesQuery,
  useGetSparesByCategoryQuery,
  useUpdateSpareStockMutation,
  useCheckSpareCodeUniqueQuery,
} = sparesApi
