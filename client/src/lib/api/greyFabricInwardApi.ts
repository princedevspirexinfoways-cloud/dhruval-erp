import { baseApi } from './baseApi';

export interface GreyFabricInward {
  _id: string;
  grnNumber: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  productionOrderNumber?: string;
  customerName?: string;
  supplierName?: string;
  supplierId?: string;
  entryType: 'purchase_order' | 'direct_stock_entry' | 'transfer_in' | 'adjustment';
  
  // Material Source - New field
  materialSource?: 'own_material' | 'client_provided' | 'job_work_material';
  
  // Client Material Information - New section
  clientMaterialInfo?: {
    clientId: string;
    clientName: string;
    clientOrderId?: string;
    clientOrderNumber?: string;
    clientMaterialCode?: string;
    clientBatchNumber?: string;
    clientLotNumber?: string;
    clientProvidedDate?: string;
    clientInstructions?: string;
    clientQualitySpecs?: string;
    returnRequired: boolean;
    returnDeadline?: string;
    clientContactPerson?: string;
    clientContactPhone?: string;
    clientContactEmail?: string;
    // Sales Order Integration
    salesOrderId?: string;
    salesOrderNumber?: string;
    salesOrderDate?: string;
    salesOrderStatus?: string;
  };
  
  fabricType: string;
  fabricColor: string;
  fabricWeight: number;
  fabricWidth: number;
  quantity: {
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    shortQuantity: number;
    excessQuantity: number;
  };
  unit: string;
  quality: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  status: 'pending' | 'approved' | 'rejected' | 'partially_approved' | 'received' | 'stock_created';
  inspectionStatus: 'pending' | 'in_progress' | 'completed' | 'not_required';
  qualityStatus: 'passed' | 'failed' | 'conditional';
  stockStatus: 'not_created' | 'active' | 'low_stock' | 'out_of_stock' | 'consumed';
  greyStockLots?: Array<{
    lotNumber: string;
    lotQuantity: number;
    lotUnit: string;
    lotStatus: 'active' | 'consumed' | 'damaged' | 'reserved';
    receivedDate: string;
    expiryDate?: string;
    qualityGrade: string;
    storageLocation: {
      warehouseId: string;
      warehouseName: string;
      rackNumber?: string;
      shelfNumber?: string;
      binNumber?: string;
    };
    costPerUnit: number;
    totalCost: number;
    remarks?: string;
  }>;
  stockBalance?: {
    totalMeters: number;
    totalYards: number;
    totalPieces: number;
    availableMeters: number;
    availableYards: number;
    availablePieces: number;
    reservedMeters: number;
    reservedYards: number;
    reservedPieces: number;
    damagedMeters: number;
    damagedYards: number;
    damagedPieces: number;
    lastUpdated: string;
  };
  receivedAt?: string;
  expectedAt?: string;
  remarks?: string;
  images?: string[];
  qualityChecks?: {
    checkedBy: string;
    checkedAt: string;
    parameters: {
      colorFastness: number;
      tensileStrength: number;
      tearStrength: number;
      shrinkage: number;
    };
    defects?: string[];
    notes?: string;
  }[];
  costBreakdown: {
    fabricCost: number;
    transportationCost: number;
    inspectionCost: number;
    totalCost: number;
  };
  companyId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGreyFabricInwardRequest {
  purchaseOrderId?: string;
  companyId: string;
  entryType: 'purchase_order' | 'direct_stock_entry' | 'transfer_in' | 'adjustment';
  fabricType: 'cotton' | 'polyester' | 'viscose' | 'blend' | 'other';
  fabricColor: string;
  fabricWeight: number;
  fabricWidth: number;
  quantity: number;
  unit: string;
  quality: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  expectedAt?: string;
  remarks?: string;
  images?: string[];
  costBreakdown: {
    fabricCost: number;
    transportationCost: number;
    inspectionCost: number;
  };
  
  // Material Source - New field
  materialSource: 'own_material' | 'client_provided' | 'job_work_material';
  
  // Client Material Information - New section
  clientMaterialInfo?: {
    clientId: string;
    clientName: string;
    clientOrderId?: string;
    clientOrderNumber?: string;
    clientMaterialCode?: string;
    clientBatchNumber?: string;
    clientLotNumber?: string;
    clientProvidedDate?: string;
    clientInstructions?: string;
    clientQualitySpecs?: string;
    returnRequired: boolean;
    returnDeadline?: string;
    clientContactPerson?: string;
    clientContactPhone?: string;
    clientContactEmail?: string;
    // Sales Order Integration
    salesOrderId?: string;
    salesOrderNumber?: string;
    salesOrderDate?: string;
    salesOrderStatus?: string;
  };
  
  greyStockLots?: Array<{
    lotNumber: string;
    lotQuantity: number;
    lotUnit: string;
    qualityGrade: string;
    costPerUnit: number;
    warehouseId?: string;
    warehouseName?: string;
    rackNumber?: string;
    shelfNumber?: string;
    binNumber?: string;
    expiryDate?: string;
    remarks?: string;
  }>;
}

export interface UpdateGreyFabricInwardRequest {
  fabricType?: 'cotton' | 'polyester' | 'viscose' | 'blend' | 'other';
  fabricColor?: string;
  fabricWeight?: number;
  fabricWidth?: number;
  quantity?: number;
  unit?: string;
  quality?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  status?: 'pending' | 'in_transit' | 'received' | 'rejected';
  receivedAt?: string;
  expectedAt?: string;
  remarks?: string;
  images?: string[];
  costBreakdown?: {
    fabricCost: number;
    transportationCost: number;
    inspectionCost: number;
  };
}

export interface GreyFabricInwardFilters {
  status?: string;
  quality?: string;
  fabricType?: string;
  supplierId?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface GreyFabricInwardAnalytics {
  totalGrns: number;
  receivedGrns: number;
  pendingGrns: number;
  rejectedGrns: number;
  totalFabricQuantity: number;
  averageQuality: string;
  totalValue: number;
  topSuppliers: Array<{
    supplierName: string;
    count: number;
    totalValue: number;
  }>;
  qualityDistribution: Array<{
    quality: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    value: number;
  }>;
}

export const greyFabricInwardApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    
    // Get all grey fabric inward entries with filters
    getGreyFabricInwards: builder.query<{
      data: GreyFabricInward[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }, {
      page?: number;
      limit?: number;
      filters?: GreyFabricInwardFilters;
    }>({
      query: ({ page = 1, limit = 10, filters = {} }) => ({
        url: '/grey-fabric-inward',
        params: {
          page,
          limit,
          ...filters
        }
      }),
      providesTags: ['GreyFabricInward']
    }),

    // Get single grey fabric inward entry
    getGreyFabricInward: builder.query<GreyFabricInward, string>({
      query: (id) => `/grey-fabric-inward/${id}`,
      providesTags: (result, error, id) => [{ type: 'GreyFabricInward', id }]
    }),

    // Create new grey fabric inward entry
    createGreyFabricInward: builder.mutation<GreyFabricInward, CreateGreyFabricInwardRequest>({
      query: (data) => ({
        url: '/grey-fabric-inward',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['GreyFabricInward']
    }),

    // Update grey fabric inward entry
    updateGreyFabricInward: builder.mutation<GreyFabricInward, {
      id: string;
      data: UpdateGreyFabricInwardRequest;
    }>({
      query: ({ id, data }) => ({
        url: `/grey-fabric-inward/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'GreyFabricInward', id },
        'GreyFabricInward'
      ]
    }),

    // Delete grey fabric inward entry
    deleteGreyFabricInward: builder.mutation<void, string>({
      query: (id) => ({
        url: `/grey-fabric-inward/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['GreyFabricInward']
    }),

    // Mark as received
    markAsReceived: builder.mutation<GreyFabricInward, {
      id: string;
      receivedAt: string;
      qualityChecks?: any[];
    }>({
      query: ({ id, receivedAt, qualityChecks }) => ({
        url: `/grey-fabric-inward/${id}/receive`,
        method: 'POST',
        body: { receivedAt, qualityChecks }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'GreyFabricInward', id },
        'GreyFabricInward'
      ]
    }),

    // Add quality check
    addQualityCheck: builder.mutation<GreyFabricInward, {
      id: string;
      qualityCheck: any;
    }>({
      query: ({ id, qualityCheck }) => ({
        url: `/grey-fabric-inward/${id}/quality-check`,
        method: 'POST',
        body: qualityCheck
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'GreyFabricInward', id },
        'GreyFabricInward'
      ]
    }),

    // Get analytics
    getGreyFabricInwardAnalytics: builder.query<GreyFabricInwardAnalytics, {
      period?: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ period = '30d', startDate, endDate } = {}) => ({
        url: '/grey-fabric-inward/analytics',
        params: { period, startDate, endDate }
      }),
      providesTags: ['GreyFabricInwardAnalytics']
    }),

    // Get suppliers for dropdown
    getSuppliers: builder.query<Array<{
      _id: string;
      name: string;
      supplierName: string;
      contactPerson: string;
      email: string;
      phone: string;
    }>, void>({
      query: () => '/suppliers',
      transformResponse: (response: any) => {
        // Transform the response to match expected format
        if (response.success && response.data && response.data.data) {
          return response.data.data.map((supplier: any) => ({
            _id: supplier._id,
            name: supplier.supplierName || supplier.displayName,
            supplierName: supplier.supplierName || supplier.displayName,
            contactPerson: supplier.contactPersons?.[0]?.name || 'N/A',
            email: supplier.contactInfo?.primaryEmail || 'N/A',
            phone: supplier.contactInfo?.primaryPhone || 'N/A'
          }));
        }
        return [];
      },
      providesTags: ['Supplier']
    }),

    // Get production orders for dropdown (using different name to avoid conflict)
    getProductionOrdersForDropdown: builder.query<Array<{
      _id: string;
      productionOrderNumber: string;
      customerName: string;
      status: string;
    }>, void>({
      query: () => '/production',
      transformResponse: (response: any) => {
        // Transform the response to match expected format
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : response.data.data || [];
          return data.map((order: any) => ({
            _id: order._id,
            productionOrderNumber: order.productionOrderNumber || order.orderNumber,
            customerName: order.customerName || order.customer?.name || 'N/A',
            status: order.status || 'pending'
          }));
        }
        return [];
      },
      providesTags: ['ProductionOrder']
    }),

    // Get companies for dropdown
    getCompanies: builder.query<Array<{
      _id: string;
      name: string;
      companyName: string;
      companyCode: string;
    }>, void>({
      query: () => '/companies',
      transformResponse: (response: any) => {
        // Transform the response to match expected format
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : response.data.data || [];
          return data.map((company: any) => ({
            _id: company._id,
            name: company.companyName || company.name,
            companyName: company.companyName || company.name,
            companyCode: company.companyCode || company.code
          }));
        }
        return [];
      },
      providesTags: ['Company']
    })
  })
});

export const {
  useGetGreyFabricInwardsQuery,
  useGetGreyFabricInwardQuery,
  useCreateGreyFabricInwardMutation,
  useUpdateGreyFabricInwardMutation,
  useDeleteGreyFabricInwardMutation,
  useMarkAsReceivedMutation,
  useAddQualityCheckMutation,
  useGetGreyFabricInwardAnalyticsQuery,
  useGetSuppliersQuery,
  useGetProductionOrdersForDropdownQuery,
  useGetCompaniesQuery
} = greyFabricInwardApi;
