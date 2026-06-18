import { baseApi } from './baseApi'

export interface Order {
  _id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  orderDate: string
  deliveryDate: string
  totalAmount: number
  items: number
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface OrderStats {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  completedOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersThisMonth: number
  revenueThisMonth: number
  highPriorityOrders: number
  overdueOrders: number
  ordersGrowth: number
  pendingChange: number
  revenueGrowth: number
  completionRate: number
}

export interface CreateOrderRequest {
  customerName: string
  customerEmail: string
  customerPhone: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deliveryDate: string
  items: Array<{
    productName: string
    sku: string
    quantity: number
    unitPrice: number
  }>
  shippingAddress: {
    street: string
    city: string
    state: string
    pincode: string
    country: string
  }
  notes?: string
}

export const ordersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all orders with filtering and pagination
    getOrders: builder.query<
      {
        success: boolean
        data: Order[]
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
        dateFrom?: string
        dateTo?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/orders',
        method: 'GET',
        params,
      }),
      providesTags: ['Order'],
    }),

    // Get order statistics
    getOrderStats: builder.query<
      { success: boolean; data: OrderStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/orders/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Order'],
    }),

    // Get order by ID
    getOrderById: builder.query<
      { success: boolean; data: Order },
      string
    >({
      query: (orderId) => ({
        url: `/orders/${orderId}`,
        method: 'GET',
      }),
      providesTags: ['Order'],
    }),

    // Create new order
    createOrder: builder.mutation<
      { success: boolean; data: Order; message: string },
      CreateOrderRequest
    >({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order'],
    }),

    // Update order status
    updateOrderStatus: builder.mutation<
      { success: boolean; data: any; message: string },
      { orderId: string; status: string; notes?: string }
    >({
      query: ({ orderId, status, notes }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: ['Order'],
    }),

    // Update order
    updateOrder: builder.mutation<
      { success: boolean; data: Order; message: string },
      { orderId: string; orderData: Partial<CreateOrderRequest> }
    >({
      query: ({ orderId, orderData }) => ({
        url: `/orders/${orderId}`,
        method: 'PUT',
        body: orderData,
      }),
      invalidatesTags: ['Order'],
    }),

    // Delete order
    deleteOrder: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (orderId) => ({
        url: `/orders/${orderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useGetOrderStatsQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi
