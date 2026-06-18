import { baseApi } from './baseApi'

// Types
export interface PurchaseStats {
  totalPurchases: number
  monthlySpend: number
  totalSuppliers: number
  pendingOrders: number
  averageOrderValue: number
  topCategories: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

export interface PurchaseOrder {
  _id: string
  purchaseOrderId: string
  companyId: string
  supplierId: string
  supplier: {
    _id: string
    name: string
    email: string
    phone: string
    category: string
  }
  items: Array<{
    itemId: string
    itemName: string
    category: 'chemicals' | 'grey_fabric' | 'colors' | 'packing_material' | 'other'
    quantity: number
    unit: string
    price: number
    total: number
  }>
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial'
  orderDate: string
  expectedDelivery?: string
  actualDelivery?: string
  notes?: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface SupplierPurchaseReport {
  supplierId: string
  supplierName: string
  category: string
  totalPurchases: number
  totalOrders: number
  averageOrderValue: number
  lastOrderDate: string
  paymentStatus: 'good' | 'delayed' | 'defaulter'
  outstandingAmount: number
}

export interface CategoryWiseSpend {
  category: string
  amount: number
  percentage: number
  orders: number
  topSuppliers: Array<{
    supplierId: string
    supplierName: string
    amount: number
  }>
}

export interface CreatePurchaseOrderRequest {
  companyId?: string // Optional for super admin, required for regular users
  poNumber: string
  poDate: string
  expectedDeliveryDate: string
  financialYear: string
  poType: 'standard' | 'blanket' | 'contract' | 'planned' | 'emergency' | 'service' | 'capital'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'raw_material' | 'finished_goods' | 'consumables' | 'services' | 'capital_goods' | 'maintenance'
  supplier?: {
    supplierId?: string
    supplierCode?: string
    supplierName?: string
    gstin?: string
    pan?: string
    contactPerson?: string
    phone?: string
    email?: string
    address?: {
      addressLine1?: string
      addressLine2?: string
      city?: string
      state?: string
      pincode?: string
      country?: string
    }
  }
  deliveryInfo: {
    deliveryAddress: {
      addressLine1: string
      addressLine2: string
      city: string
      state: string
      pincode: string
      country: string
    }
    warehouseId: string
    warehouseName: string
    contactPerson: string
    contactPhone: string
    deliveryInstructions: string
    workingHours: string
    deliveryType: 'standard' | 'express' | 'scheduled'
  }
  items: Array<{
    itemId: string
    itemCode: string
    itemName: string
    description: string
    specifications: string
    hsnCode: string
    quantity: number
    unit: string
    rate: number
    discount: {
      type: 'percentage' | 'amount'
      value: number
    }
    discountAmount: number
    taxableAmount: number
    taxBreakup: Array<{
      taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS'
      rate: number
      amount: number
    }>
    totalTaxAmount: number
    lineTotal: number
    deliveryDate: string
    notes: string
  }>
  amounts: {
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
  taxDetails: {
    placeOfSupply: string
    isReverseCharge: boolean
    taxBreakup: Array<{
      taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS'
      rate: number
      taxableAmount: number
      taxAmount: number
    }>
    totalTaxAmount: number
  }
  paymentTerms: {
    termType: 'advance' | 'net' | 'cod' | 'credit' | 'milestone'
    days: number
    advancePercentage: number
  }
  terms: string
  notes: string
  paymentNotes?: string
  specialInstructions: string
}

export interface UpdatePurchaseOrderRequest {
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus?: 'pending' | 'paid' | 'overdue' | 'partial'
  notes?: string
  expectedDelivery?: string
  actualDelivery?: string
}

export interface PurchaseFilters {
  companyId?: string // For super admin to filter by company
  status?: string
  paymentStatus?: string
  supplierId?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}

export interface PurchaseAnalytics {
  dailyPurchases: Array<{ date: string; amount: number; orders: number }>
  monthlyPurchases: Array<{ month: string; amount: number; orders: number }>
  topSuppliers: Array<{ supplier: string; amount: number; orders: number }>
  purchasesByCategory: Array<{ category: string; amount: number; percentage: number }>
  purchaseTrends: Array<{ period: string; amount: number; growth: number }>
}

// API Endpoints
export const purchaseApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get Purchase Statistics
    getPurchaseStats: builder.query<
      { success: boolean; data: PurchaseStats }, 
      { companyId?: string }
    >({
      query: (params) => ({
        url: '/purchase/stats',
        params,
      }),
      providesTags: ['PurchaseStats'],
    }),

    // Get All Purchase Orders with Company ID support
    getPurchaseOrders: builder.query<
      { success: boolean; data: { data: PurchaseOrder[]; pagination: any } },
      PurchaseFilters
    >({
      query: (filters) => ({
        url: '/purchase/orders',
        params: filters,
      }),
      providesTags: ['Purchase'],
    }),

    // Get Single Purchase Order
    getPurchaseOrder: builder.query<{ success: boolean; data: PurchaseOrder }, string>({
      query: (id) => `/purchase/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Purchase', id }],
    }),

    // Create Purchase Order with Company ID handling
    createPurchaseOrder: builder.mutation<
      { success: boolean; data: PurchaseOrder },
      CreatePurchaseOrderRequest
    >({
      query: (orderData) => ({
        url: '/purchase/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Purchase', 'PurchaseStats'],
    }),

    // Update Purchase Order
    updatePurchaseOrder: builder.mutation<
      { success: boolean; data: PurchaseOrder },
      { id: string; data: UpdatePurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Purchase', id },
        'Purchase',
        'PurchaseStats',
      ],
    }),

    // Delete Purchase Order
    deletePurchaseOrder: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/purchase/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Purchase', 'PurchaseStats'],
    }),

    // Get Supplier Purchase Report
    getSupplierPurchaseReport: builder.query<
      { success: boolean; data: SupplierPurchaseReport[] },
      { dateFrom?: string; dateTo?: string; companyId?: string }
    >({
      query: (params) => ({
        url: '/purchase/supplier-report',
        params,
      }),
      providesTags: ['Purchase'],
    }),

    // Get Category-wise Spend
    getCategoryWiseSpend: builder.query<
      { success: boolean; data: CategoryWiseSpend[] },
      { dateFrom?: string; dateTo?: string; companyId?: string }
    >({
      query: (params) => ({
        url: '/purchase/category-spend',
        params,
      }),
      providesTags: ['PurchaseStats'],
    }),

    // Get Purchase Analytics (Combined Overview + Analytics)
    getPurchaseAnalytics: builder.query<
      {
        success: boolean
        data: PurchaseAnalytics
      },
      { period?: 'week' | 'month' | 'quarter' | 'year'; companyId?: string }
    >({
      query: (params) => ({
        url: '/purchase/analytics',
        params,
      }),
      providesTags: ['PurchaseStats'],
    }),

    // Update Payment Status
    updatePurchasePaymentStatus: builder.mutation<
      { success: boolean; data: PurchaseOrder },
      { id: string; paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial'; amount?: number }
    >({
      query: ({ id, paymentStatus, amount }) => ({
        url: `/purchase/orders/${id}/payment`,
        method: 'PUT',
        body: { paymentStatus, amount },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Purchase', id },
        'Purchase',
        'PurchaseStats',
      ],
    }),

    // Bulk Update Orders
    bulkUpdatePurchaseOrders: builder.mutation<
      { success: boolean; data: PurchaseOrder[] },
      { orderIds: string[]; updates: Partial<UpdatePurchaseOrderRequest> }
    >({
      query: ({ orderIds, updates }) => ({
        url: '/purchase/orders/bulk-update',
        method: 'PUT',
        body: { orderIds, updates },
      }),
      invalidatesTags: ['Purchase', 'PurchaseStats'],
    }),

    // Export Purchase Data
    exportPurchaseData: builder.mutation<
      { success: boolean; data: { downloadUrl: string } },
      { format: 'csv' | 'excel'; filters: PurchaseFilters }
    >({
      query: ({ format, filters }) => ({
        url: `/purchase/export/${format}`,
        method: 'POST',
        body: filters,
      }),
    }),

    // Get Purchase Order by Status
    getPurchaseOrdersByStatus: builder.query<
      { success: boolean; data: PurchaseOrder[]; pagination: any },
      { status: string; companyId?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: `/purchase/orders/status/${params.status}`,
        params: { companyId: params.companyId, page: params.page, limit: params.limit },
      }),
      providesTags: ['Purchase'],
    }),

    // Get Purchase Orders by Supplier
    getPurchaseOrdersBySupplier: builder.query<
      { success: boolean; data: PurchaseOrder[]; pagination: any },
      { supplierId: string; companyId?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: `/purchase/orders/supplier/${params.supplierId}`,
        params: { companyId: params.companyId, page: params.page, limit: params.limit },
      }),
      providesTags: ['Purchase'],
    }),
  }),
})

export const {
  useGetPurchaseStatsQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useGetSupplierPurchaseReportQuery,
  useGetCategoryWiseSpendQuery,
  useGetPurchaseAnalyticsQuery,
  useUpdatePurchasePaymentStatusMutation,
  useBulkUpdatePurchaseOrdersMutation,
  useExportPurchaseDataMutation,
  useGetPurchaseOrdersByStatusQuery,
  useGetPurchaseOrdersBySupplierQuery,
} = purchaseApi
