import { baseApi } from './baseApi';

// =============================================
// TYPES & INTERFACES
// =============================================

export interface SalesStats {
  totalSales: number;
  totalOrders: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyGrowth: number;
  averageOrderValue: number;
}

export interface SalesOrder {
  _id: string;
  orderNumber: string;
  orderDate: Date;
  customerId: string | {
    _id: string;
    customerCode: string;
    customerName: string;
  };
  customerName?: string;
  customerCode?: string;
  companyId?: string;
  status: string;
  priority?: string;
  specialInstructions?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerDetails?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  orderItems?: Array<{
    _id?: string;
    itemId?: string;
    productId?: string;
    itemName?: string;
    name?: string;
    productType?: string;
    quantity: number;
    unit?: string;
    rate?: number;
    unitPrice?: number;
    price?: number;
    discount?: number;
    discountAmount?: number;
    taxRate?: number;
    taxAmount?: number;
    totalAmount?: number;
    category?: string;
    description?: string;
    status?: string;
    productionStatus?: string;
    deliveryPriority?: string;
    specifications?: any;
    qualityRequirements?: any;
    materialSource?: 'own_stock' | 'client_provided' | 'job_work' | 'purchase_required';
    workAmount?: number;
  }>;
  payment: {
    paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial';
    balanceAmount: number;
    advanceReceived: number;
    totalAmount?: number;
    dueDate?: Date;
    paymentTerms?: string;
    paymentMethod?: string;
    creditDays?: number;
    advanceAmount?: number;
    paymentSummary?: {
      totalReceived: number;
      totalOverdue: number;
      overdueDays: number;
    };
    paymentAlerts?: {
      isOverdue: boolean;
      overdueAmount: number;
      overdueDays: number;
      alertFrequency: string;
    };
    collection?: {
      collectionNotes: any[];
      followUpRequired: boolean;
      collectionStatus: string;
    };
    paymentHistory?: any[];
  };
  delivery?: {
    deliveryType: string;
    expectedDeliveryDate?: Date;
    deliveryInstructions?: string;
    deliveryAddress?: {
      contactPerson?: string;
      phone?: string;
      email?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
      landmark?: string;
    };
  };
  orderSummary: {
    finalAmount: number;
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    shippingCharges?: number;
    packingCharges?: number;
    otherCharges?: number;
    roundOffAmount?: number;
    totalAmount?: number;
  };
  orderType?: string;
  orderSource?: string;
  referenceOrders?: any[];
  tags?: any[];
  attachments?: any[];
  createdBy?: string;
  approvals?: any[];
  communications?: any[];
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface SalesDashboard {
  stats: SalesStats;
  analytics: {
    dailySales: Array<{ _id: string; amount: number; orders: number }>;
    monthlySales: Array<{ _id: string; amount: number; orders: number }>;
    topProducts: Array<{ _id: string; quantity: number; revenue: number }>;
    salesByStatus: Array<{ _id: string; count: number; amount: number }>;
    customerSegmentation: Array<{ _id: string; count: number; totalValue: number }>;
  };
  recentOrders: SalesOrder[];
  topCustomers: Array<{ _id: string; customerName: string; totalOrders: number; totalAmount: number }>;
  topProducts: Array<{ _id: string; totalQuantity: number; totalRevenue: number }>;
  salesTrends: Array<{ _id: string; amount: number; orders: number }>;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    growthRate: number;
    pendingPayments: number;
    overduePayments: number;
  };
}

export interface SalesAnalytics {
  dailySales: Array<{ _id: string; amount: number; orders: number }>;
  monthlySales: Array<{ _id: string; amount: number; orders: number }>;
  topProducts: Array<{ _id: string; quantity: number; revenue: number }>;
  salesByStatus: Array<{ _id: string; count: number; amount: number }>;
  customerSegmentation: Array<{ _id: string; count: number; totalValue: number }>;
}

export interface CreateSalesOrderRequest {
  customerId: string;
  orderItems: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    category?: string;
    materialSource?: 'own_stock' | 'client_provided' | 'job_work' | 'purchase_required';
    workAmount?: number;
  }>;
  orderSummary: {
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    finalAmount: number;
  };
  payment: {
    paymentTerms: string;
    paymentMethod: string;
    creditDays: number;
    advancePercentage: number;
    advanceAmount: number;
  };
  delivery: {
    deliveryType: string;
    expectedDeliveryDate: Date;
    deliveryInstructions?: string;
  };
  priority: string;
  status: string;
  specialInstructions?: string;
}

export interface UpdateSalesOrderRequest {
  status?: string;
  priority?: string;
  orderItems?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    category?: string;
    materialSource?: 'own_stock' | 'client_provided' | 'job_work' | 'purchase_required';
    workAmount?: number;
  }>;
  orderSummary?: {
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    finalAmount: number;
  };
  payment?: {
    paymentTerms?: string;
    paymentMethod?: string;
    creditDays?: number;
    advancePercentage?: number;
    advanceAmount?: number;
  };
  delivery?: {
    deliveryType?: string;
    expectedDeliveryDate?: Date;
    deliveryInstructions?: string;
  };
  specialInstructions?: string;
}

export interface SalesFilters {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  companyId?: string;
}

export interface CustomerSalesReport {
  _id: string;
  customerName: string;
  customerCode: string;
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  lastOrderDate: Date;
}

export interface ProductSalesPerformance {
  _id: string;
  category?: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface SalesTrends {
  _id: string;
  amount: number;
  orders: number;
}

export interface SalesTeamPerformance {
  _id: string;
  salesPersonName: string;
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  commission: number;
}

// =============================================
// API ENDPOINTS
// =============================================

export const salesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // =============================================
    // SALES DASHBOARD (Overview + Analytics Combined)
    // =============================================

    // Get comprehensive sales dashboard
    getSalesDashboard: builder.query<
      { success: boolean; data: SalesDashboard },
      { period?: string; dateFrom?: string; dateTo?: string }
    >({
      query: (params) => ({
        url: '/sales/dashboard',
        params,
      }),
      providesTags: ['SalesDashboard'],
    }),

    // Get sales statistics
    getSalesStats: builder.query<
      { success: boolean; data: SalesStats },
      { period?: string }
    >({
      query: (params) => ({
        url: '/sales/stats',
        params,
      }),
      providesTags: ['SalesStats'],
    }),

    // Get sales analytics
    getSalesAnalytics: builder.query<
      { success: boolean; data: SalesAnalytics },
      { period?: string; dateFrom?: string; dateTo?: string }
    >({
      query: (params) => ({
        url: '/sales/analytics',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),

    // =============================================
    // SALES ORDERS CRUD OPERATIONS
    // =============================================

    // Get all sales orders
    getSalesOrders: builder.query<
      { success: boolean; data: { orders: SalesOrder[]; pagination: any } },
      SalesFilters
    >({
      query: (filters) => ({
        url: '/sales/orders',
        params: filters,
      }),
      providesTags: ['Sales'],
    }),

    // Get single sales order
    getSalesOrder: builder.query<
      { success: boolean; data: SalesOrder },
      string
    >({
      query: (id) => `/sales/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sales', id }],
    }),

    // Get sales order with full details (including customer, items, etc.)
    getSalesOrderDetails: builder.query<
      { success: boolean; data: SalesOrder & { 
        customerDetails?: any; 
        orderItems?: any[];
        delivery?: any;
        payment?: any;
      } },
      string
    >({
      query: (id) => `/sales/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sales', id }],
    }),

    // Create sales order
    createSalesOrder: builder.mutation<
      { success: boolean; data: SalesOrder },
      CreateSalesOrderRequest
    >({
      query: (orderData) => ({
        url: '/sales/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Sales', 'SalesStats', 'SalesDashboard'],
    }),

    // Update sales order
    updateSalesOrder: builder.mutation<
      { success: boolean; data: SalesOrder },
      { id: string; data: UpdateSalesOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/sales/orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sales', id },
        'Sales',
        'SalesStats',
        'SalesDashboard',
      ],
    }),

    // Delete sales order
    deleteSalesOrder: builder.mutation<
      { success: boolean },
      string
    >({
      query: (id) => ({
        url: `/sales/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sales', 'SalesStats', 'SalesDashboard'],
    }),

    // Update payment status
    updatePaymentStatus: builder.mutation<
      { success: boolean; data: SalesOrder },
      { id: string; paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial'; amount?: number }
    >({
      query: ({ id, paymentStatus, amount }) => ({
        url: `/sales/orders/${id}/payment`,
        method: 'PUT',
        body: { paymentStatus, amount },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sales', id },
        'Sales',
        'SalesStats',
        'SalesDashboard',
      ],
    }),

    // Bulk update orders
    bulkUpdateSalesOrders: builder.mutation<
      { success: boolean; data: { updated: number } },
      { ids: string[]; updates: Partial<UpdateSalesOrderRequest> }
    >({
      query: ({ ids, updates }) => ({
        url: '/sales/orders/bulk-update',
        method: 'PUT',
        body: { orderIds: ids, updates },
      }),
      invalidatesTags: ['Sales', 'SalesStats', 'SalesDashboard'],
    }),

    // =============================================
    // SALES REPORTS & ANALYTICS
    // =============================================

    // Get customer sales report
    getCustomerSalesReport: builder.query<
      { success: boolean; data: CustomerSalesReport[] },
      { dateFrom?: string; dateTo?: string }
    >({
      query: (params) => ({
        url: '/sales/reports/customer',
        params,
      }),
      providesTags: ['Sales'],
    }),

    // Get product sales performance
    getProductSalesPerformance: builder.query<
      { success: boolean; data: ProductSalesPerformance[] },
      { dateFrom?: string; dateTo?: string; category?: string }
    >({
      query: (params) => ({
        url: '/sales/reports/products',
        params,
      }),
      providesTags: ['Sales'],
    }),

    // Get sales trends
    getSalesTrends: builder.query<
      { success: boolean; data: SalesTrends[] },
      { period?: string; granularity?: string }
    >({
      query: (params) => ({
        url: '/sales/trends',
        params,
      }),
      providesTags: ['SalesAnalytics'],
    }),

    // Get sales team performance
    getSalesTeamPerformance: builder.query<
      { success: boolean; data: SalesTeamPerformance[] },
      { dateFrom?: string; dateTo?: string; teamMemberId?: string }
    >({
      query: (params) => ({
        url: '/sales/team-performance',
        params,
      }),
      providesTags: ['Sales'],
    }),

    // =============================================
    // EXPORT FUNCTIONALITY
    // =============================================

    // Export sales data
    exportSalesData: builder.mutation<
      { success: boolean; data: { downloadUrl: string } },
      { format: 'csv' | 'excel' | 'pdf'; filters: any }
    >({
      query: ({ format, filters }) => ({
        url: `/sales/export/${format}`,
        method: 'POST',
        body: filters,
      }),
    }),
  }),
});

// =============================================
// EXPORTED HOOKS
// =============================================

export const {
  // Dashboard hooks
  useGetSalesDashboardQuery,
  useGetSalesStatsQuery,
  useGetSalesAnalyticsQuery,

  // Orders CRUD hooks
  useGetSalesOrdersQuery,
  useGetSalesOrderQuery,
  useGetSalesOrderDetailsQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation,
  useUpdatePaymentStatusMutation,
  useBulkUpdateSalesOrdersMutation,

  // Reports & Analytics hooks
  useGetCustomerSalesReportQuery,
  useGetProductSalesPerformanceQuery,
  useGetSalesTrendsQuery,
  useGetSalesTeamPerformanceQuery,

  // Export hooks
  useExportSalesDataMutation,
} = salesApi;
