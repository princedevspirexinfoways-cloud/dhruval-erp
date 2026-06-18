import { baseApi } from './baseApi'

// Enhanced Order Interfaces
export interface EnhancedOrderItem {
  _id: string
  productId: string
  productName: string
  productCode: string
  design: string
  color: string
  gsm: number
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  discount?: number
  tax?: number
  productionStatus: 'pending' | 'in_production' | 'completed' | 'quality_check' | 'packed'
  productionPriority: 'low' | 'medium' | 'high' | 'urgent'
  productionStartDate?: string
  productionEndDate?: string
  qualityStatus?: 'pending' | 'passed' | 'failed' | 'rework'
  qualityNotes?: string
}

export interface EnhancedOrder {
  _id: string
  orderNumber: string
  orderType: 'export' | 'local' | 'domestic'
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  status: 'draft' | 'pending' | 'confirmed' | 'in_production' | 'quality_check' | 'packed' | 'dispatched' | 'delivered' | 'cancelled' | 'returned'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  productionPriority: 'low' | 'medium' | 'high' | 'urgent'
  orderDate: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  productionStartDate?: string
  productionEndDate?: string
  items: EnhancedOrderItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  shippingAmount: number
  totalAmount: number
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded' | 'failed'
  paymentMethod?: string
  shippingMethod?: string
  trackingNumber?: string
  
  // Production Integration
  productionOrderId?: string
  productionStatus: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  productionProgress: number
  productionNotes?: string
  
  // Dispatch Details
  dispatchDetails?: {
    dispatchDate?: string
    courierName?: string
    courierTrackingNumber?: string
    awbNumber?: string
    lrNumber?: string
    vehicleNumber?: string
    driverName?: string
    driverPhone?: string
    estimatedDeliveryDate?: string
    actualDeliveryDate?: string
    deliveryStatus: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned'
    deliveryNotes?: string
    proofOfDelivery?: string[]
  }
  
  // RTO & Returns
  rtoDetails?: {
    isRTO: boolean
    rtoDate?: string
    rtoReason?: string
    rtoAmount?: number
    rtoStatus: 'pending' | 'processed' | 'completed'
    returnTrackingNumber?: string
    returnNotes?: string
  }
  
  // Packing Details
  packingDetails?: {
    billNumber?: string
    lrNumber?: string
    packageCount: number
    packageWeight: number
    packageDimensions?: {
      length: number
      width: number
      height: number
    }
    packingMaterial?: string[]
    specialInstructions?: string
    packingDate?: string
    packedBy?: string
  }
  
  // Export/Local Specific
  exportDetails?: {
    isExport: boolean
    countryOfDestination?: string
    currency?: string
    exchangeRate?: number
    customsDeclaration?: string
    shippingTerms?: string
    incoterms?: string
  }
  
  notes?: string
  tags?: string[]
  companyId: string
  createdBy: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export interface OrderStats {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  inProductionOrders: number
  qualityCheckOrders: number
  packedOrders: number
  dispatchedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  returnedOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByPriority: {
    [priority: string]: number
  }
  ordersByType: {
    export: number
    local: number
    domestic: number
  }
  productionEfficiency: number
  deliveryOnTime: number
}

export interface CreateEnhancedOrderRequest {
  orderType: 'export' | 'local' | 'domestic'
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  priority: 'low' | 'medium' | 'high' | 'urgent'
  productionPriority: 'low' | 'medium' | 'high' | 'urgent'
  orderDate: string
  expectedDeliveryDate?: string
  items: Omit<EnhancedOrderItem, '_id'>[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  shippingAmount: number
  totalAmount: number
  paymentMethod?: string
  shippingMethod?: string
  notes?: string
  tags?: string[]
  exportDetails?: {
    isExport: boolean
    countryOfDestination?: string
    currency?: string
    exchangeRate?: number
    customsDeclaration?: string
    shippingTerms?: string
    incoterms?: string
  }
}

export interface UpdateEnhancedOrderRequest {
  customerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  status?: EnhancedOrder['status']
  priority?: EnhancedOrder['priority']
  productionPriority?: EnhancedOrder['productionPriority']
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  items?: Omit<EnhancedOrderItem, '_id'>[]
  subtotal?: number
  taxAmount?: number
  discountAmount?: number
  shippingAmount?: number
  totalAmount?: number
  paymentStatus?: EnhancedOrder['paymentStatus']
  paymentMethod?: string
  shippingMethod?: string
  trackingNumber?: string
  assignedTo?: string
  notes?: string
  tags?: string[]
}

export interface DispatchDetailsRequest {
  dispatchDate: string
  courierName: string
  courierTrackingNumber?: string
  awbNumber?: string
  lrNumber?: string
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string
  estimatedDeliveryDate: string
  deliveryNotes?: string
}

export interface RTORequest {
  rtoDate: string
  rtoReason: string
  rtoAmount?: number
  returnTrackingNumber?: string
  returnNotes?: string
}

export interface PackingDetailsRequest {
  billNumber: string
  lrNumber: string
  packageCount: number
  packageWeight: number
  packageDimensions?: {
    length: number
    width: number
    height: number
  }
  packingMaterial?: string[]
  specialInstructions?: string
  packingDate: string
  packedBy: string
}

export const enhancedOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all enhanced orders with filtering and pagination
    getEnhancedOrders: builder.query<
      {
        success: boolean
        data: EnhancedOrder[]
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
        productionPriority?: string
        orderType?: string
        customerId?: string
        assignedTo?: string
        paymentStatus?: string
        productionStatus?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        dateFrom?: string
        dateTo?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/enhanced-orders',
        method: 'GET',
        params,
      }),
      providesTags: ['EnhancedOrder'],
    }),

    // Get enhanced order statistics
    getEnhancedOrderStats: builder.query<
      { success: boolean; data: OrderStats },
      { 
        dateFrom?: string
        dateTo?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/enhanced-orders/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['EnhancedOrderStats'],
    }),

    // Get enhanced order by ID
    getEnhancedOrderById: builder.query<
      { success: boolean; data: EnhancedOrder },
      string
    >({
      query: (orderId) => ({
        url: `/enhanced-orders/${orderId}`,
        method: 'GET',
      }),
      providesTags: ['EnhancedOrder'],
    }),

    // Create new enhanced order
    createEnhancedOrder: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      CreateEnhancedOrderRequest
    >({
      query: (orderData) => ({
        url: '/enhanced-orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Update enhanced order
    updateEnhancedOrder: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; orderData: UpdateEnhancedOrderRequest }
    >({
      query: ({ orderId, orderData }) => ({
        url: `/enhanced-orders/${orderId}`,
        method: 'PUT',
        body: orderData,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Update order status
    updateOrderStatus: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; status: EnhancedOrder['status']; notes?: string }
    >({
      query: ({ orderId, status, notes }) => ({
        url: `/enhanced-orders/${orderId}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Update production status
    updateProductionStatus: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; productionStatus: string; progress?: number; notes?: string }
    >({
      query: ({ orderId, productionStatus, progress, notes }) => ({
        url: `/enhanced-orders/${orderId}/production-status`,
        method: 'PATCH',
        body: { productionStatus, progress, notes },
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Update payment status
    updatePaymentStatus: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; paymentStatus: string; notes?: string }
    >({
      query: ({ orderId, paymentStatus, notes }) => ({
        url: `/enhanced-orders/${orderId}/payment-status`,
        method: 'PATCH',
        body: { paymentStatus, notes },
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Assign order
    assignOrder: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; assignedTo: string }
    >({
      query: ({ orderId, assignedTo }) => ({
        url: `/enhanced-orders/${orderId}/assign`,
        method: 'PATCH',
        body: { assignedTo },
      }),
      invalidatesTags: ['EnhancedOrder'],
    }),

    // Add dispatch details
    addDispatchDetails: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; dispatchDetails: DispatchDetailsRequest }
    >({
      query: ({ orderId, dispatchDetails }) => ({
        url: `/enhanced-orders/${orderId}/dispatch`,
        method: 'POST',
        body: dispatchDetails,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Update dispatch details
    updateDispatchDetails: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; dispatchDetails: Partial<DispatchDetailsRequest> }
    >({
      query: ({ orderId, dispatchDetails }) => ({
        url: `/enhanced-orders/${orderId}/dispatch`,
        method: 'PUT',
        body: dispatchDetails,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Add RTO details
    addRTODetails: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; rtoDetails: RTORequest }
    >({
      query: ({ orderId, rtoDetails }) => ({
        url: `/enhanced-orders/${orderId}/rto`,
        method: 'POST',
        body: rtoDetails,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Update RTO details
    updateRTODetails: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; rtoDetails: Partial<RTORequest> }
    >({
      query: ({ orderId, rtoDetails }) => ({
        url: `/enhanced-orders/${orderId}/rto`,
        method: 'PUT',
        body: rtoDetails,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Add packing details
    addPackingDetails: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; packingDetails: PackingDetailsRequest }
    >({
      query: ({ orderId, packingDetails }) => ({
        url: `/enhanced-orders/${orderId}/packing`,
        method: 'POST',
        body: packingDetails,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Update packing details
    updatePackingDetails: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      { orderId: string; packingDetails: Partial<PackingDetailsRequest> }
    >({
      query: ({ orderId, packingDetails }) => ({
        url: `/enhanced-orders/${orderId}/packing`,
        method: 'PUT',
        body: packingDetails,
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Delete enhanced order
    deleteEnhancedOrder: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (orderId) => ({
        url: `/enhanced-orders/${orderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Duplicate enhanced order
    duplicateEnhancedOrder: builder.mutation<
      { success: boolean; data: EnhancedOrder; message: string },
      string
    >({
      query: (orderId) => ({
        url: `/enhanced-orders/${orderId}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['EnhancedOrder', 'EnhancedOrderStats'],
    }),

    // Export enhanced orders
    exportEnhancedOrders: builder.mutation<
      { success: boolean; data: { downloadUrl: string }; message: string },
      {
        format: 'csv' | 'excel' | 'pdf'
        filters?: {
          status?: string
          priority?: string
          orderType?: string
          dateFrom?: string
          dateTo?: string
        }
      }
    >({
      query: ({ format, filters }) => ({
        url: `/enhanced-orders/export/${format}`,
        method: 'POST',
        body: { filters },
      }),
    }),

    // Get orders by customer
    getOrdersByCustomer: builder.query<
      {
        success: boolean
        data: EnhancedOrder[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        customerId: string
        page?: number
        limit?: number
        status?: string
      }
    >({
      query: ({ customerId, ...params }) => ({
        url: `/enhanced-orders/customer/${customerId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['EnhancedOrder'],
    }),

    // Get orders by production status
    getOrdersByProductionStatus: builder.query<
      {
        success: boolean
        data: EnhancedOrder[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        productionStatus: string
        page?: number
        limit?: number
      }
    >({
      query: ({ productionStatus, ...params }) => ({
        url: `/enhanced-orders/production-status/${productionStatus}`,
        method: 'GET',
        params,
      }),
      providesTags: ['EnhancedOrder'],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetEnhancedOrdersQuery,
  useGetEnhancedOrderStatsQuery,
  useGetEnhancedOrderByIdQuery,
  useCreateEnhancedOrderMutation,
  useUpdateEnhancedOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateProductionStatusMutation,
  useUpdatePaymentStatusMutation,
  useAssignOrderMutation,
  useAddDispatchDetailsMutation,
  useUpdateDispatchDetailsMutation,
  useAddRTODetailsMutation,
  useUpdateRTODetailsMutation,
  useAddPackingDetailsMutation,
  useUpdatePackingDetailsMutation,
  useDeleteEnhancedOrderMutation,
  useDuplicateEnhancedOrderMutation,
  useExportEnhancedOrdersMutation,
  useGetOrdersByCustomerQuery,
  useGetOrdersByProductionStatusQuery,
} = enhancedOrdersApi

