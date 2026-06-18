import { baseApi } from './baseApi'

export interface ProductionOrder {
  _id: string
  orderNumber: string
  productId: string
  productName: string
  productCode: string
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  plannedQuantity: number
  producedQuantity: number
  remainingQuantity: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  assignedTo?: {
    userId: string
    name: string
    email: string
  }
  workstation?: {
    workstationId: string
    name: string
    code: string
  }
  materials: Array<{
    materialId: string
    materialName: string
    materialCode: string
    requiredQuantity: number
    allocatedQuantity: number
    consumedQuantity: number
    unit: string
  }>
  operations: Array<{
    operationId: string
    operationName: string
    sequence: number
    status: 'pending' | 'in_progress' | 'completed'
    plannedDuration: number
    actualDuration?: number
    assignedTo?: string
  }>
  qualityChecks: Array<{
    checkId: string
    checkName: string
    status: 'pending' | 'passed' | 'failed'
    checkedBy?: string
    checkedAt?: string
    notes?: string
  }>
  progressPercentage: number
  notes?: string
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ProductionStats {
  totalOrders: number
  plannedOrders: number
  inProgressOrders: number
  completedOrders: number
  onHoldOrders: number
  cancelledOrders: number
  totalPlannedQuantity: number
  totalProducedQuantity: number
  efficiency: number
  onTimeDelivery: number
  ordersByStatus: {
    [status: string]: number
  }
  ordersByPriority: {
    [priority: string]: number
  }
  productionTrend: Array<{
    date: string
    planned: number
    produced: number
    efficiency: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    orderCount: number
    totalQuantity: number
  }>
  workstationUtilization: Array<{
    workstationId: string
    workstationName: string
    utilizationPercentage: number
    activeOrders: number
  }>
}

export interface CreateProductionOrderRequest {
  productId: string
  plannedQuantity: number
  plannedStartDate: string
  plannedEndDate: string
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
  workstationId?: string
  materials: Array<{
    materialId: string
    requiredQuantity: number
  }>
  operations: Array<{
    operationName: string
    sequence: number
    plannedDuration: number
    assignedTo?: string
  }>
  notes?: string
}

export const productionApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all production orders with filtering and pagination
    getProductionOrders: builder.query<
      {
        success: boolean
        data: ProductionOrder[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        page?: number
        limit?: number
        search?: string
        status?: string
        priority?: string
        workstationId?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/production',
        method: 'GET',
        params,
      }),
      providesTags: ['ProductionOrder'],
    }),

    // Get production statistics
    getProductionStats: builder.query<
      { success: boolean; data: ProductionStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/production/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['ProductionOrder'],
    }),

    // Get production order by ID
    getProductionOrderById: builder.query<
      { success: boolean; data: ProductionOrder },
      string
    >({
      query: (orderId) => ({
        url: `/production/${orderId}`,
        method: 'GET',
      }),
      providesTags: ['ProductionOrder'],
    }),

    // Create new production order
    createProductionOrder: builder.mutation<
      { success: boolean; data: ProductionOrder; message: string },
      CreateProductionOrderRequest
    >({
      query: (orderData) => ({
        url: '/production',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Update production order
    updateProductionOrder: builder.mutation<
      { success: boolean; data: ProductionOrder; message: string },
      { orderId: string; orderData: Partial<CreateProductionOrderRequest> }
    >({
      query: ({ orderId, orderData }) => ({
        url: `/production/${orderId}`,
        method: 'PUT',
        body: orderData,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Delete production order
    deleteProductionOrder: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (orderId) => ({
        url: `/production/${orderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Start production order
    startProductionOrder: builder.mutation<
      { success: boolean; data: ProductionOrder; message: string },
      { orderId: string; notes?: string }
    >({
      query: ({ orderId, notes }) => ({
        url: `/production/${orderId}/start`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Pause production order
    pauseProductionOrder: builder.mutation<
      { success: boolean; data: ProductionOrder; message: string },
      { orderId: string; reason?: string }
    >({
      query: ({ orderId, reason }) => ({
        url: `/production/${orderId}/pause`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Complete production order
    completeProductionOrder: builder.mutation<
      { success: boolean; data: ProductionOrder; message: string },
      { orderId: string; producedQuantity: number; notes?: string }
    >({
      query: ({ orderId, producedQuantity, notes }) => ({
        url: `/production/${orderId}/complete`,
        method: 'POST',
        body: { producedQuantity, notes },
      }),
      invalidatesTags: ['ProductionOrder', 'InventoryItem'],
    }),

    // Update production progress
    updateProductionProgress: builder.mutation<
      { success: boolean; data: ProductionOrder; message: string },
      {
        orderId: string
        operationId: string
        status: 'pending' | 'in_progress' | 'completed'
        actualDuration?: number
        notes?: string
      }
    >({
      query: ({ orderId, ...progressData }) => ({
        url: `/production/${orderId}/progress`,
        method: 'POST',
        body: progressData,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Record quality check
    recordQualityCheck: builder.mutation<
      { success: boolean; data: ProductionOrder; message: string },
      {
        orderId: string
        checkId: string
        status: 'passed' | 'failed'
        notes?: string
      }
    >({
      query: ({ orderId, ...checkData }) => ({
        url: `/production/${orderId}/quality-check`,
        method: 'POST',
        body: checkData,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Get production orders by product
    getProductionOrdersByProduct: builder.query<
      {
        success: boolean
        data: ProductionOrder[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        productId: string
        page?: number
        limit?: number
        status?: string
      }
    >({
      query: ({ productId, ...params }) => ({
        url: `/production/product/${productId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['ProductionOrder'],
    }),
  }),
})

export const {
  useGetProductionOrdersQuery,
  useGetProductionStatsQuery,
  useGetProductionOrderByIdQuery,
  useCreateProductionOrderMutation,
  useUpdateProductionOrderMutation,
  useDeleteProductionOrderMutation,
  useStartProductionOrderMutation,
  usePauseProductionOrderMutation,
  useCompleteProductionOrderMutation,
  useUpdateProductionProgressMutation,
  useRecordQualityCheckMutation,
  useGetProductionOrdersByProductQuery,
} = productionApi
