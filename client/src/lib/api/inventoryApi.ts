import { baseApi } from './baseApi'

export interface InventoryItem {
  _id: string
  itemCode: string
  itemName: string
  itemDescription: string
  companyItemCode: string
  category: {
    primary: string
  }
  productType: string
  designInfo: {
    colorVariants: string[]
    sizeVariants: string[]
  }
  specifications: {
    gsm: number
    width: number
    length: number
    weight: number
    color: string
    design: string
    finish: string
    safetyPrecautions: string[]
    msdsRequired: boolean
    // Optional extended specs used in enhanced inventory form
    hsnCode?: string
    attributeName?: string
    lotNumber?: string
    challan?: string
    grossQuantity?: number
    tareWeight?: number
    fold?: number
    date?: string
    lrNumber?: string
    transportNumber?: string
    additionalDetails?: string
    // Purchase order linkage
    poNumber?: string
    poOrderedQuantity?: number
    poReceivedQuantity?: number
  }
  stock: {
    currentStock: number
    reservedStock: number
    availableStock: number
    unit: string
    reorderLevel: number
    maxStockLevel: number
    inTransitStock: number
    damagedStock: number
    conversionFactor: number
    minStockLevel: number
    valuationMethod: string
    averageCost: number
    totalValue: number
  }
  pricing: {
    costPrice: number
    sellingPrice: number
    mrp: number
    currency: string
  }
  quality: {
    qualityGrade: string
    defectPercentage: number
    qualityCheckRequired: boolean
    qualityParameters: string[]
    certifications: string[]
  }
  ageing: {
    ageInDays: number
    ageCategory: string
    turnoverRate: number
    daysInStock: number
    slowMovingThreshold: number
    obsoleteThreshold: number
    lastMovementDate: string
  }
  qualityControl: {
    qualityGrade: string
    qualityScore: number
    defectRate: number
    requiresInspection: boolean
    qualityNotes: string[]
  }
  tracking: {
    createdBy: string
    lastModifiedBy: string
    lastStockUpdate: string
    totalInward: number
    totalOutward: number
    totalAdjustments: number
  }
  status: {
    isActive: boolean
    isDiscontinued: boolean
    isFastMoving: boolean
    isSlowMoving: boolean
    isObsolete: boolean
    requiresApproval: boolean
  }
  tags: string[]
  images: string[]
  documents: string[]
  locations: string[]
  suppliers: string[]
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  lowStockItems: number
  overstockItems: number
  normalStockItems: number
  categories: {
    [key: string]: number
  }
  totalCategories: number
  averageValue: number
  recentMovements: number
  turnoverRate: string
  itemsGrowth: number
  lowStockChange: number
  valueGrowth: number
  totalMovements: number
  todayMovements: number
  inboundMovements: number
  outboundMovements: number
  pendingMovements: number
}

export interface InventoryAlert {
  _id: string
  itemCode: string
  itemName: string
  currentStock: number
  minStock: number
  shortage: number
  category: string
  supplier: string
  urgency: 'critical' | 'warning'
  lastUpdated: string
}

export interface StockMovement {
  _id: string
  itemId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference: string
  notes: string
  date: string
  recordedBy: string
}

export interface CreateInventoryItemRequest {
  itemCode?: string
  itemName: string
  category: string
  itemDescription?: string
  productType?: string
  warehouseId: string
  reorderPoint: number
  reorderQuantity: number
  stockingMethod: 'fifo' | 'lifo' | 'average' | 'specific'
  initialStockLevel?: number
  unitOfMeasure?: string
  specifications?: {
    gsm?: number
    width?: number
    color?: string
    design?: string
    finish?: string
    length?: number
    batchNumber?: string
    lotNumber?: string
    challan?: string
    manufacturingDate?: string
    expiryDate?: string
  }
  pricing?: {
    costPrice?: number
    sellingPrice?: number
    mrp?: number
  }
  quality?: {
    qualityGrade?: string
    qualityCheckRequired?: boolean
  }
}

export const inventoryApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all inventory items with filtering and pagination
    getInventoryItems: builder.query<
      {
        success: boolean
        data: {
          data: InventoryItem[]
          pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
            hasNext: boolean
            hasPrev: boolean
          }
        }
      },
      {
        page?: number
        limit?: number
        search?: string
        category?: string
        status?: string
        sortBy?: string
        sortOrder?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/inventory',
        method: 'GET',
        params,
      }),
      providesTags: ['Inventory'],
    }),

    // Get inventory statistics
    getInventoryStats: builder.query<
      { success: boolean; data: InventoryStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/inventory/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Inventory'],
    }),

    // Get low stock alerts
    getInventoryAlerts: builder.query<
      { success: boolean; data: InventoryAlert[]; total: number },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/inventory/alerts',
        method: 'GET',
        params,
      }),
      providesTags: ['Inventory'],
    }),

    // Get inventory item by ID
    getInventoryItemById: builder.query<
      { success: boolean; data: InventoryItem },
      string
    >({
      query: (itemId) => ({
        url: `/inventory/${itemId}`,
        method: 'GET',
      }),
      providesTags: ['Inventory'],
    }),

    // Create new inventory item
    createInventoryItem: builder.mutation<
      { success: boolean; data: InventoryItem; message: string },
      CreateInventoryItemRequest
    >({
      query: (itemData) => ({
        url: '/inventory',
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Update inventory item
    updateInventoryItem: builder.mutation<
      { success: boolean; data: InventoryItem; message: string },
      { itemId: string; itemData: Partial<CreateInventoryItemRequest> }
    >({
      query: ({ itemId, itemData }) => ({
        url: `/inventory/${itemId}`,
        method: 'PUT',
        body: itemData,
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Get inventory movements
    getInventoryMovements: builder.query<
      {
        success: boolean
        data: {
          data: StockMovement[]
          pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
            hasNext: boolean
            hasPrev: boolean
          }
        }
      },
      {
        page?: number
        limit?: number
        search?: string
        type?: string
        status?: string
        itemId?: string
        startDate?: string
        endDate?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/stock-movements',
        method: 'GET',
        params,
      }),
      providesTags: ['Inventory'],
    }),

    // Create stock movement
    createStockMovement: builder.mutation<
      { success: boolean; data: StockMovement; message: string },
      any
    >({
      query: (movementData) => ({
        url: '/stock-movements',
        method: 'POST',
        body: movementData,
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Get stock movement by ID
    getStockMovementById: builder.query<
      { success: boolean; data: StockMovement; message: string },
      string
    >({
      query: (id) => `/stock-movements/${id}`,
      providesTags: (result, error, id) => [{ type: 'Inventory', id }],
    }),

    // Update stock movement
    updateStockMovement: builder.mutation<
      { success: boolean; data: StockMovement; message: string },
      { id: string; data: any }
    >({
      query: ({ id, data }) => ({
        url: `/stock-movements/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Inventory', id }],
    }),

    // Delete stock movement
    deleteStockMovement: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/stock-movements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Record stock movement (legacy - keeping for backward compatibility)
    recordStockMovement: builder.mutation<
      { success: boolean; data: StockMovement; message: string },
      {
        itemId: string
        type: 'in' | 'out' | 'adjustment'
        quantity: number
        reference: string
        notes?: string
      }
    >({
      query: (movementData) => ({
        url: '/stock-movements',
        method: 'POST',
        body: movementData,
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Delete inventory item
    deleteInventoryItem: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (itemId) => ({
        url: `/inventory/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inventory'],
    }),
  }),
})

export const {
  useGetInventoryItemsQuery,
  useGetInventoryStatsQuery,
  useGetInventoryAlertsQuery,
  useGetInventoryItemByIdQuery,
  useGetInventoryMovementsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useRecordStockMovementMutation,
  useDeleteInventoryItemMutation,
  // Stock Movement CRUD
  useCreateStockMovementMutation,
  useGetStockMovementByIdQuery,
  useUpdateStockMovementMutation,
  useDeleteStockMovementMutation,
} = inventoryApi
