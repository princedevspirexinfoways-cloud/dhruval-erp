import { baseApi } from '@/lib/api/baseApi'

// Enhanced Inventory Types
export interface InventoryItem {
  _id: string
  companyId: string
  itemCode: string
  itemName: string
  itemDescription?: string
  barcode?: string
  qrCode?: string
  companyItemCode: string
  internalSKU?: string
  
  category: {
    primary: 'raw_material' | 'semi_finished' | 'finished_goods' | 'consumables' | 'spare_parts'
    secondary?: string
    tertiary?: string
  }
  
  productType: 'saree' | 'african' | 'garment' | 'digital_print' | 'custom' | 'chemical' | 'dye' | 'machinery' | 'yarn' | 'thread'
  
  designInfo?: {
    designNumber?: string
    designName?: string
    designCategory?: string
    season?: 'spring' | 'summer' | 'monsoon' | 'winter' | 'all_season'
    collection?: string
    artworkFile?: string
    colorVariants?: string[]
    sizeVariants?: string[]
  }
  
  specifications: {
    gsm?: number
    width?: number
    length?: number
    weight?: number
    color?: string
    colorCode?: string
    design?: string
    pattern?: string
    fabricComposition?: string
    threadCount?: number
    weaveType?: 'plain' | 'twill' | 'satin' | 'jacquard' | 'dobby' | 'other'
    finish?: string
    tensileStrength?: number
    shrinkage?: number
    colorFastness?: number
    pilling?: number
    concentration?: number
    purity?: number
    phLevel?: number
    batchNumber?: string
    lotNumber?: string
    manufacturingDate?: string
    expiryDate?: string
    customAttributes?: any
  }
  
  stock: {
    currentStock: number
    reservedStock: number
    availableStock: number
    inTransitStock: number
    damagedStock: number
    unit: string
    alternateUnit?: string
    conversionFactor: number
    reorderLevel: number
    minStockLevel: number
    maxStockLevel: number
    economicOrderQuantity?: number
    valuationMethod: 'FIFO' | 'LIFO' | 'Weighted Average'
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
  
  ageing: {
    ageInDays: number
    ageCategory: 'fresh' | 'good' | 'aging' | 'old' | 'obsolete'
    lastMovementDate: string
    turnoverRate: number
    daysInStock: number
    slowMovingThreshold: number
    obsoleteThreshold: number
  }
  
  qualityControl: {
    qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject'
    qualityScore: number
    defectRate: number
    lastQualityCheck?: string
    qualityCheckDue?: string
    qualityNotes: Array<{
      date: string
      inspector: string
      grade: string
      notes: string
      images: string[]
    }>
    requiresInspection: boolean
  }
  
  pricing: {
    costPrice?: number
    standardCost?: number
    lastPurchasePrice?: number
    sellingPrice?: number
    marginPercentage?: number
  }
  
  status: {
    isActive: boolean
    isDiscontinued: boolean
    isFastMoving: boolean
    isSlowMoving: boolean
    isObsolete: boolean
    requiresApproval: boolean
  }
  
  createdAt: string
  updatedAt: string
}

export interface InventoryBatch {
  _id: string
  companyId: string
  itemId: string
  batchNumber: string
  lotNumber?: string
  manufacturingDate: string
  expiryDate?: string
  receivedDate: string
  supplierId?: string
  supplierBatchNumber?: string
  
  initialQuantity: number
  currentQuantity: number
  reservedQuantity: number
  damagedQuantity: number
  unit: string
  
  locations: Array<{
    warehouseId: string
    warehouseName: string
    zone?: string
    rack?: string
    bin?: string
    quantity: number
    lastUpdated: string
  }>
  
  qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject'
  qualityScore: number
  qualityNotes?: string
  qualityCheckDate?: string
  qualityCheckedBy?: string
  
  specifications: {
    gsm?: number
    width?: number
    length?: number
    color?: string
    colorCode?: string
    design?: string
    pattern?: string
    fabricComposition?: string
    shrinkage?: number
    colorFastness?: number
    tensileStrength?: number
  }
  
  processStage?: 'grey' | 'printed' | 'washed' | 'fixed' | 'finished'
  processHistory: Array<{
    stage: string
    startDate: string
    endDate?: string
    operator?: string
    machineId?: string
    notes?: string
    qualityCheck?: {
      grade: string
      score: number
      notes: string
      checkedBy: string
      checkDate: string
    }
  }>
  
  costPerUnit: number
  totalCost: number
  additionalCosts: Array<{
    type: string
    description: string
    amount: number
    date: string
  }>
  
  status: 'active' | 'consumed' | 'expired' | 'damaged' | 'returned'
  isActive: boolean
  
  item?: InventoryItem
  supplier?: any
  ageInDays?: number
  
  createdAt: string
  updatedAt: string
}

export interface InventorySummary {
  category: string
  totalItems: number
  totalValue: number
  totalQuantity: number
  lowStockItems: number
  outOfStockItems: number
}

export interface ProductSummary {
  productType: string
  totalItems: number
  totalValue: number
  totalQuantity: number
  avgGSM: number
  uniqueColorsCount: number
  uniqueDesignsCount: number
  qualityDistribution: string[]
}

export interface LocationInventory {
  location: {
    warehouseId: string
    warehouseName: string
    zone?: string
    rack?: string
  }
  totalItems: number
  totalQuantity: number
  items: Array<{
    itemId: string
    itemCode: string
    itemName: string
    productType: string
    quantity: number
    unit: string
    bin?: string
    lastUpdated: string
  }>
}

export interface AgeingAnalysis {
  ageCategory: string
  count: number
  totalValue: number
  totalQuantity: number
  avgAge: number
  items: Array<{
    itemId: string
    itemCode: string
    itemName: string
    productType: string
    ageInDays: number
    currentStock: number
    totalValue: number
  }>
}

export interface BatchSummary {
  processStage: string
  totalBatches: number
  totalQuantity: number
  totalValue: number
  avgQualityScore: number
  qualityDistribution: string[]
}

export const enhancedInventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Inventory Summary
    getInventorySummary: builder.query<{
      data: InventorySummary[]
      total: number
    }, void>({
      query: () => '/inventory-enhanced/summary',
      providesTags: ['Inventory'],
    }),

    // Product Summary
    getProductSummary: builder.query<{
      data: ProductSummary[]
      total: number
    }, void>({
      query: () => '/inventory-enhanced/product-summary',
      providesTags: ['Inventory'],
    }),

    // Location-wise Inventory
    getLocationWiseInventory: builder.query<{
      data: LocationInventory[]
      total: number
    }, {
      warehouseId?: string
      zone?: string
      rack?: string
    }>({
      query: (params) => ({
        url: '/inventory-enhanced/location-wise',
        params: Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
        ),
      }),
      providesTags: ['Inventory'],
    }),

    // Ageing Analysis
    getAgeingAnalysis: builder.query<{
      data: AgeingAnalysis[]
      total: number
    }, void>({
      query: () => '/inventory-enhanced/ageing-analysis',
      providesTags: ['Inventory'],
    }),

    // Advanced Search
    advancedSearch: builder.query<{
      data: InventoryItem[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }, {
      search?: string
      category?: string
      productType?: string
      designNumber?: string
      gsm?: number
      color?: string
      batchNumber?: string
      qualityGrade?: string
      ageCategory?: string
      location?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }>({
      query: (params) => ({
        url: '/inventory-enhanced/advanced-search',
        params: Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
        ),
      }),
      providesTags: ['Inventory'],
    }),

    // Batch Management
    getAllBatches: builder.query<{
      data: InventoryBatch[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }, {
      itemId?: string
      processStage?: string
      qualityGrade?: string
      status?: string
      search?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }>({
      query: (params) => ({
        url: '/inventory-enhanced/batches',
        params: Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
        ),
      }),
      providesTags: ['InventoryItem'],
    }),

    getBatchById: builder.query<{
      data: InventoryBatch
    }, string>({
      query: (id) => `/inventory-enhanced/batches/${id}`,
      providesTags: (_, __, id) => [{ type: 'InventoryItem', id }],
    }),

    createBatch: builder.mutation<{
      data: InventoryBatch
      message: string
    }, Partial<InventoryBatch>>({
      query: (batch) => ({
        url: '/inventory-enhanced/batches',
        method: 'POST',
        body: batch,
      }),
      invalidatesTags: ['InventoryItem'],
    }),

    updateBatch: builder.mutation<{
      data: InventoryBatch
      message: string
    }, { id: string; batch: Partial<InventoryBatch> }>({
      query: ({ id, batch }) => ({
        url: `/inventory-enhanced/batches/${id}`,
        method: 'PUT',
        body: batch,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'InventoryItem', id }, 'InventoryItem'],
    }),

    getBatchSummaryByStage: builder.query<{
      data: BatchSummary[]
      total: number
    }, void>({
      query: () => '/inventory-enhanced/batches/summary/by-stage',
      providesTags: ['Batch'],
    }),

    updateProcessStage: builder.mutation<{
      data: InventoryBatch
      message: string
    }, {
      id: string
      stage: string
      operator?: string
      machineId?: string
      notes?: string
      qualityCheck?: {
        grade: string
        score: number
        notes: string
        checkedBy: string
      }
    }>({
      query: ({ id, ...body }) => ({
        url: `/inventory-enhanced/batches/${id}/process-stage`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'InventoryItem', id }, 'InventoryItem'],
    }),
  }),
})

export const {
  useGetInventorySummaryQuery,
  useGetProductSummaryQuery,
  useGetLocationWiseInventoryQuery,
  useGetAgeingAnalysisQuery,
  useAdvancedSearchQuery,
  useGetAllBatchesQuery,
  useGetBatchByIdQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useGetBatchSummaryByStageQuery,
  useUpdateProcessStageMutation,
} = enhancedInventoryApi
