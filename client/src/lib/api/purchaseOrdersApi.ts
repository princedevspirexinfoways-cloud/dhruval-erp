import { baseApi } from './baseApi'

export interface PurchaseOrder {
  _id: string
  // Support both poNumber (from API) and orderNumber (legacy)
  poNumber?: string
  orderNumber?: string
  supplierId?: string
  supplier?: {
    supplierName?: string
    supplierCode?: string
    address?: {
      country?: string
    }
    contactInfo?: {
      email: string
      phone: string
    }
  }
  agent?: {
    agentId: string
    agentName: string
  }
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled'
  // Support both poDate (from API) and orderDate (legacy)
  poDate?: string
  orderDate?: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  financialYear?: string
  poType?: string
  priority?: string
  category?: string
  items: Array<{
    itemId: string
    itemName: string
    itemCode: string
    quantity: number
    unitPrice?: number
    rate?: number
    totalPrice?: number
    lineTotal?: number
    receivedQuantity?: number
    pendingQuantity?: number
    rejectedQuantity?: number
    specifications?: string
    description?: string
    hsnCode?: string
    unit?: string
    discount?: {
      type: string
      value: number
    }
    discountAmount?: number
    taxableAmount?: number
    taxBreakup?: Array<{
      taxType: string
      rate: number
      amount: number
    }>
    totalTaxAmount?: number
    deliveryDate?: string
    notes?: string
  }>
  subtotal?: number
  taxAmount?: number
  discountAmount?: number
  totalAmount?: number
  amounts?: {
    subtotal: number
    totalDiscount: number
    taxableAmount: number
    totalTaxAmount: number
    freightCharges: number
    packingCharges: number
    otherCharges: number
    roundingAdjustment: number
    grandTotal: number
  }
  taxDetails?: {
    placeOfSupply: string
    isReverseCharge: boolean
    taxBreakup: Array<{
      taxType: string
      rate: number
      taxableAmount: number
      taxAmount: number
      _id: string
    }>
    totalTaxAmount: number
  }
  paymentTerms?: string | {
    termType: string
    days: number
    advancePercentage: number
    description: string
    milestones: any[]
  }
  deliveryInfo?: {
    deliveryAddress: {
      addressLine1: string
      addressLine2?: string
      city: string
      state: string
      pincode: string
      country: string
    }
    warehouseId: string
    warehouseName: string
    contactPerson: string
    contactPhone: string
    deliveryInstructions?: string
    workingHours?: string
    deliveryType: string
  }
  deliveryAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  notes?: string
  paymentNotes?: string
  specialInstructions?: string
  tags?: string[]
  attachments?: Array<{
    fileName: string
    fileUrl: string
    uploadedAt: string
  }>
  approvedBy?: string
  approvedAt?: string
  receivedBy?: string
  receivedAt?: string
  paymentStatus?: string
  lastPaymentAmount?: number
  approvalStatus?: string
  receivingStatus?: string
  totalReceived?: number
  totalPending?: number
  terms?: string
  qualityRequirements?: {
    inspectionRequired: boolean
    qualityParameters: any[]
    qualityCertificates: any[]
    testReports: any[]
  }
  performance?: {
    issues: any[]
    improvements: any[]
  }
  deliverySchedules?: any[]
  approvalWorkflow?: any[]
  companyId: string
  createdBy: string
  buyerId?: string
  buyerName?: string
  lastModifiedBy?: string
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderStats {
  totalOrders: number
  pendingOrders: number
  approvedOrders: number
  receivedOrders: number
  cancelledOrders: number
  totalValue: number
  thisMonthOrders: number
  thisMonthValue: number
  ordersByStatus: {
    [status: string]: number
  }
  ordersBySupplier: Array<{
    supplierId: string
    supplierName: string
    orderCount: number
    totalValue: number
  }>
  recentOrders: PurchaseOrder[]
  topSuppliers: Array<{
    supplierId: string
    supplierName: string
    orderCount: number
    totalValue: number
  }>
}

export interface CreatePurchaseOrderRequest {
  supplierId: string
  expectedDeliveryDate?: string
  items: Array<{
    itemId: string
    quantity: number
    unitPrice: number
    specifications?: string
  }>
  paymentTerms?: string
  deliveryAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  notes?: string
  paymentNotes?: string
}

export const purchaseOrdersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all purchase orders with filtering and pagination
    // NOTE: API returns { success, message, data: { data: [...], pagination: {...} } }
    getPurchaseOrders: builder.query<
      {
        success: boolean
        message: string
        data: {
          data: PurchaseOrder[]
          pagination: {
            page: number
            limit: number
            total: number
            pages: number
          }
        }
        timestamp?: string
      },
      {
        page?: number
        limit?: number
        search?: string
        status?: string
        supplierId?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/purchase-orders',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseOrder'],
    }),

    // Get purchase order statistics
    getPurchaseOrderStats: builder.query<
      { success: boolean; data: PurchaseOrderStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/purchase-orders/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseOrder'],
    }),

    // Get purchase order by ID
    getPurchaseOrderById: builder.query<
      { success: boolean; data: PurchaseOrder },
      string
    >({
      query: (orderId) => ({
        url: `/purchase-orders/${orderId}`,
        method: 'GET',
      }),
      providesTags: ['PurchaseOrder'],
    }),

    // Create new purchase order
    createPurchaseOrder: builder.mutation<
      { success: boolean; data: PurchaseOrder; message: string },
      CreatePurchaseOrderRequest
    >({
      query: (orderData) => ({
        url: '/purchase-orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Update purchase order
    updatePurchaseOrder: builder.mutation<
      { success: boolean; data: PurchaseOrder; message: string },
      { orderId: string; orderData: Partial<CreatePurchaseOrderRequest & { status?: string }> }
    >({
      query: ({ orderId, orderData }) => ({
        url: `/purchase-orders/${orderId}`,
        method: 'PUT',
        body: orderData,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Delete purchase order
    deletePurchaseOrder: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (orderId) => ({
        url: `/purchase-orders/${orderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Approve purchase order
    approvePurchaseOrder: builder.mutation<
      { success: boolean; data: PurchaseOrder; message: string },
      { orderId: string; notes?: string }
    >({
      query: ({ orderId, notes }) => ({
        url: `/purchase-orders/${orderId}/approve`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Receive purchase order items
    receivePurchaseOrder: builder.mutation<
      { success: boolean; data: PurchaseOrder; message: string },
      {
        orderId: string
        receivedItems: Array<{
          itemId: string
          receivedQuantity: number
          notes?: string
        }>
        notes?: string
      }
    >({
      query: ({ orderId, receivedItems, notes }) => ({
        url: `/purchase-orders/${orderId}/receive`,
        method: 'POST',
        body: { receivedItems, notes },
      }),
      invalidatesTags: ['PurchaseOrder', 'InventoryItem', 'StockMovement'],
    }),

    // Cancel purchase order
    cancelPurchaseOrder: builder.mutation<
      { success: boolean; data: PurchaseOrder; message: string },
      { orderId: string; reason?: string }
    >({
      query: ({ orderId, reason }) => ({
        url: `/purchase-orders/${orderId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Update purchase order status
    updatePurchaseOrderStatus: builder.mutation<
      { success: boolean; data: PurchaseOrder; message: string },
      { orderId: string; status: string; notes?: string }
    >({
      query: ({ orderId, status, notes }) => ({
        url: `/purchase-orders/${orderId}/status`,
        method: 'PUT',
        body: { status, notes },
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Get purchase orders by supplier
    getPurchaseOrdersBySupplier: builder.query<
      {
        success: boolean
        data: PurchaseOrder[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        supplierId: string
        page?: number
        limit?: number
        status?: string
      }
    >({
      query: ({ supplierId, ...params }) => ({
        url: `/purchase-orders/supplier/${supplierId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['PurchaseOrder'],
    }),
  }),
})

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderStatsQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useGetPurchaseOrdersBySupplierQuery,
} = purchaseOrdersApi
