import { baseApi } from './baseApi';

export interface ProductionBatch {
  _id: string;
  companyId: string;
  batchNumber: string;
  productionOrderId?: string;
  customerOrderId?: string;
  productSpecifications: {
    productType: string;
    fabricType: string;
    gsm?: number;
    width?: number;
    length?: number;
    color?: string;
    colorCode?: string;
    design?: string;
    pattern?: string;
    fabricComposition?: string;
    shrinkage?: number;
    colorFastness?: number;
    tensileStrength?: number;
  };
  plannedQuantity: number;
  actualQuantity?: number;
  unit: string;
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'quality_hold' | 'rework';
  currentStage: number;
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  stages: Array<{
    stageNumber: number;
    stageName: string;
    stageType: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'quality_hold' | 'failed' | 'skipped';
    progress: number;
    plannedStartTime?: Date;
    actualStartTime?: Date;
    plannedEndTime?: Date;
    actualEndTime?: Date;
    inputMaterials: Array<any>;
    outputMaterials: Array<any>;
    qualityChecks: Array<any>;
    qualityGate: {
      required: boolean;
      passed: boolean;
      passedBy?: string;
      passedDate?: Date;
      notes?: string;
    };
    issues: Array<any>;
    notes: Array<any>;
  }>;
  qualityGrade?: string;
  qualityScore?: number;
  qualityIssues: string[];
  totalCost?: number;
  costPerUnit?: number;
  plannedStartDate: Date;
  actualStartDate?: Date;
  plannedEndDate: Date;
  actualEndDate?: Date;
  totalPlannedDuration: number;
  totalActualDuration?: number;
  statusChangeLogs: Array<any>;
  materialConsumptionLogs: Array<any>;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBatchRequest {
  companyId: string;
  productionOrderId?: string;
  customerOrderId?: string;
  productSpecifications: {
    productType: string;
    fabricType: string;
    gsm?: number;
    width?: number;
    length?: number;
    color?: string;
    colorCode?: string;
    design?: string;
    pattern?: string;
    fabricComposition?: string;
    shrinkage?: number;
    colorFastness?: number;
    tensileStrength?: number;
  };
  plannedQuantity: number;
  unit: string;
  plannedStartDate: string;
  plannedEndDate: string;
  totalPlannedDuration: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateStageStatusRequest {
  newStatus: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'quality_hold' | 'failed' | 'skipped';
  reason: string;
  notes?: string;
}

export interface MaterialConsumptionRequest {
  materialId: string;
  consumedQuantity: number;
  wasteQuantity?: number;
  returnedQuantity?: number;
  notes?: string;
  qualityGrade?: string;
}

export interface MaterialOutputRequest {
  itemName: string;
  category: 'finished_goods' | 'semi_finished' | 'by_product' | 'waste' | 'scrap';
  quantity: number;
  unit: string;
  qualityGrade?: string;
  defects?: string[];
  warehouseLocation?: {
    warehouseId?: string;
    warehouseName?: string;
    zone?: string;
    rack?: string;
    bin?: string;
  };
  costPerUnit?: number;
  notes?: string;
}

export interface QualityCheckRequest {
  checkType: string;
  parameters: Array<{
    name: string;
    expectedValue?: string;
    actualValue: string;
    unit?: string;
    status: 'pass' | 'fail' | 'warning';
    notes?: string;
  }>;
  overallResult: 'pass' | 'fail' | 'conditional';
  grade?: string;
  score?: number;
  defects?: string[];
  correctiveActions?: string[];
  notes?: string;
  images?: string[];
}

export interface AddCostRequest {
  costType: 'material' | 'labor' | 'machine' | 'overhead' | 'utility' | 'chemical' | 'dye' | 'auxiliary' | 'packaging' | 'transport' | 'quality_control' | 'waste_disposal' | 'maintenance' | 'other';
  category: 'direct_material' | 'direct_labor' | 'manufacturing_overhead' | 'indirect_material' | 'indirect_labor' | 'variable_overhead' | 'fixed_overhead' | 'quality_cost' | 'waste_cost';
  description: string;
  amount: number;
  stageNumber?: number;
  unitCost?: number;
  quantity?: number;
  unit?: string;
  supplier?: string;
  invoiceNumber?: string;
  costCenter?: string;
  accountCode?: string;
  notes?: string;
}

// Production Batch API endpoints
export const productionBatchApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all batches for a company
    getBatches: builder.query<{
      data: ProductionBatch[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }, { companyId: string; params?: {
      status?: string;
      currentStage?: number;
      priority?: string;
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }}>({
      query: ({ companyId, params }) => ({
        url: companyId === 'all' ? '/batches' : `/batches/company/${companyId}`,
        params
      }),
      transformResponse: (response: { data: ProductionBatch[]; pagination: any }) => response,
      // providesTags: ['ProductionBatch']
    }),

    // Get a single batch by ID
    getBatchById: builder.query<ProductionBatch, string>({
      query: (batchId) => `/batches/${batchId}`,
      transformResponse: (response: any) => {
        // Handle both nested and direct response structures
        if (response.data) {
          return response.data;
        }
        return response;
      },
      // providesTags: (result, error, batchId) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Create a new production batch
    createBatch: builder.mutation<ProductionBatch, CreateBatchRequest>({
      query: (data) => ({
        url: '/batches',
        method: 'POST',
        body: data
      }),
      transformResponse: (response: { data: ProductionBatch }) => response.data,
      // invalidatesTags: ['ProductionBatch']
    }),

    // Update batch basic information
    updateBatch: builder.mutation<ProductionBatch, { batchId: string; data: Partial<ProductionBatch> }>({
      query: ({ batchId, data }) => ({
        url: `/batches/${batchId}`,
        method: 'PUT',
        body: data
      }),
      transformResponse: (response: { data: ProductionBatch }) => response.data,
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Update stage status
    updateStageStatus: builder.mutation<ProductionBatch, { batchId: string; stageNumber: number; data: UpdateStageStatusRequest }>({
      query: ({ batchId, stageNumber, data }) => ({
        url: `/batches/${batchId}/stages/${stageNumber}/status`,
        method: 'PATCH',
        body: data
      }),
      transformResponse: (response: { data: ProductionBatch }) => response.data,
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Record material consumption
    consumeMaterial: builder.mutation<ProductionBatch, { batchId: string; stageNumber: number; data: { materials: any[] } }>({
      query: ({ batchId, stageNumber, data }) => ({
        url: `/batches/${batchId}/stages/${stageNumber}/consume-materials`,
        method: 'POST',
        body: data
      }),
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Add material output
    addMaterialOutput: builder.mutation<ProductionBatch, { batchId: string; stageNumber: number; data: { outputs: any[] } }>({
      query: ({ batchId, stageNumber, data }) => ({
        url: `/batches/${batchId}/stages/${stageNumber}/add-output`,
        method: 'POST',
        body: data
      }),
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Add quality check
    addQualityCheck: builder.mutation<ProductionBatch, { batchId: string; stageNumber: number; data: QualityCheckRequest }>({
      query: ({ batchId, stageNumber, data }) => ({
        url: `/production-batches/${batchId}/stages/${stageNumber}/quality-check`,
        method: 'POST',
        body: data
      }),
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Pass quality gate
    passQualityGate: builder.mutation<ProductionBatch, { batchId: string; stageNumber: number; notes?: string }>({
      query: ({ batchId, stageNumber, notes }) => ({
        url: `/production-batches/${batchId}/stages/${stageNumber}/pass-quality`,
        method: 'POST',
        body: { notes }
      }),
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Fail quality gate
    failQualityGate: builder.mutation<ProductionBatch, { batchId: string; stageNumber: number; rejectionReason: string; retestRequired?: boolean }>({
      query: ({ batchId, stageNumber, rejectionReason, retestRequired = true }) => ({
        url: `/production-batches/${batchId}/stages/${stageNumber}/fail-quality`,
        method: 'POST',
        body: { rejectionReason, retestRequired }
      }),
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Add cost
    addCost: builder.mutation<ProductionBatch, { batchId: string; data: AddCostRequest }>({
      query: ({ batchId, data }) => ({
        url: `/production-batches/${batchId}/cost`,
        method: 'POST',
        body: data
      }),
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Get batch metrics
    getBatchMetrics: builder.query<{
      metrics: any;
      costSummary: any;
      materialSummary: any;
      statusHistory: any[];
    }, string>({
      query: (batchId) => `/production-batches/${batchId}/metrics`,
      // providesTags: (result, error, batchId) => [{ type: 'ProductionBatch', id: `${batchId}-metrics` }]
    }),

    // Get batch dashboard data
    getBatchDashboard: builder.query<{
      summary: {
        total: number;
        inProgress: number;
        completed: number;
        onHold: number;
        qualityHold: number;
      };
      recentBatches: ProductionBatch[];
    }, string>({
      query: (companyId) => `/production-batches/company/${companyId}/dashboard`,
      // providesTags: ['ProductionBatch']
    }),

    // Transfer materials to working inventory
    transferToWorkingInventory: builder.mutation<{ workingInventoryItemIds: string[] }, {
      batchId: string;
      data: { materialInputs: Array<{ itemId: string; quantity: number; unit: string }> }
    }>({
      query: ({ batchId, data }) => ({
        url: `/batches/${batchId}/transfer-to-working-inventory`,
        method: 'POST',
        body: data
      }),
      // invalidatesTags: (result, error, { batchId }) => [{ type: 'ProductionBatch', id: batchId }]
    }),

    // Transfer material category
    transferMaterialCategory: builder.mutation<void, {
      itemId: string;
      data: { fromCategory: string; toCategory: string; notes?: string }
    }>({
      query: ({ itemId, data }) => ({
        url: `/batches/materials/${itemId}/transfer-category`,
        method: 'POST',
        body: data
      }),
    }),

    // Delete batch
    deleteBatch: builder.mutation<void, string>({
      query: (batchId) => ({
        url: `/batches/${batchId}`,
        method: 'DELETE'
      }),
      // invalidatesTags: ['ProductionBatch']
    })
  })
});

// Export hooks for usage in functional components
export const {
  useGetBatchesQuery,
  useGetBatchByIdQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useUpdateStageStatusMutation,
  useConsumeMaterialMutation,
  useAddMaterialOutputMutation,
  useAddQualityCheckMutation,
  usePassQualityGateMutation,
  useFailQualityGateMutation,
  useAddCostMutation,
  useGetBatchMetricsQuery,
  useGetBatchDashboardQuery,
  useTransferToWorkingInventoryMutation,
  useTransferMaterialCategoryMutation,
  useDeleteBatchMutation
} = productionBatchApi;
