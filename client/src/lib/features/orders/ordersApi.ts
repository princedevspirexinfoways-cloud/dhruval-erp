import { baseApi } from '@/lib/api/baseApi'

export interface OrderItem {
  _id: string
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
  tax?: number
}

export interface Order {
  _id: string
  orderNumber: string
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
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  orderDate: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  shippingAmount: number
  totalAmount: number
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded' | 'failed'
  paymentMethod?: string
  shippingMethod?: string
  trackingNumber?: string
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
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  returnedOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersThisMonth: number
  ordersThisWeek: number
  ordersToday: number
  revenueThisMonth: number
  revenueThisWeek: number
  revenueToday: number
}

export interface OrdersResponse {
  success: boolean
  data: Order[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface CreateOrderRequest {
  customerId: string
  items: Omit<OrderItem, '_id'>[]
  priority?: Order['priority']
  expectedDeliveryDate?: string
  shippingMethod?: string
  notes?: string
  tags?: string[]
}

export interface UpdateOrderRequest {
  customerId?: string
  items?: Omit<OrderItem, '_id'>[]
  status?: Order['status']
  priority?: Order['priority']
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  paymentStatus?: Order['paymentStatus']
  paymentMethod?: string
  shippingMethod?: string
  trackingNumber?: string
  assignedTo?: string
  notes?: string
  tags?: string[]
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query<OrdersResponse, {
      page?: number
      limit?: number
      search?: string
      status?: string
      priority?: string
      customerId?: string
      assignedTo?: string
      paymentStatus?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      dateFrom?: string
      dateTo?: string
    }>({
      query: (params) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    getOrderStats: builder.query<OrderStats, {
      dateFrom?: string
      dateTo?: string
      companyId?: string
    }>({
      query: (params) => ({
        url: '/orders/stats',
        params,
      }),
      providesTags: ['OrderStats'],
    }),
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (order) => ({
        url: '/orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: ['Order', 'OrderStats'],
    }),
    updateOrder: builder.mutation<Order, { id: string; order: UpdateOrderRequest }>({
      query: ({ id, order }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        body: order,
      }),
      invalidatesTags: ['Order', 'OrderStats'],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: Order['status'] }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Order', 'OrderStats'],
    }),
    updatePaymentStatus: builder.mutation<Order, { id: string; paymentStatus: Order['paymentStatus'] }>({
      query: ({ id, paymentStatus }) => ({
        url: `/orders/${id}/payment-status`,
        method: 'PATCH',
        body: { paymentStatus },
      }),
      invalidatesTags: ['Order', 'OrderStats'],
    }),
    assignOrder: builder.mutation<Order, { id: string; assignedTo: string }>({
      query: ({ id, assignedTo }) => ({
        url: `/orders/${id}/assign`,
        method: 'PATCH',
        body: { assignedTo },
      }),
      invalidatesTags: ['Order'],
    }),
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order', 'OrderStats'],
    }),
    duplicateOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['Order', 'OrderStats'],
    }),
    exportOrders: builder.query<Blob, {
      format: 'csv' | 'excel' | 'pdf'
      filters?: {
        status?: string
        priority?: string
        dateFrom?: string
        dateTo?: string
      }
    }>({
      query: ({ format, filters }) => ({
        url: `/orders/export/${format}`,
        params: filters,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderStatsQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
  useAssignOrderMutation,
  useDeleteOrderMutation,
  useDuplicateOrderMutation,
  useLazyExportOrdersQuery,
} = ordersApi
