import { baseApi } from './baseApi';

export interface PreProcessingBatch {
  _id: string;
  batchNumber: string;
  productionOrderId?: string;
  productionOrderNumber?: string;
  greyFabricInwardId?: string;
  grnNumber?: string;
  processType: 'desizing' | 'bleaching' | 'scouring' | 'mercerizing' | 'combined';
  processName: string;
  processDescription?: string;
  inputMaterials: Array<{
    fabricType: string;
    fabricGrade: string;
    gsm: number;
    width: number;
    color: string;
    quantity: number;
    unit: 'meters' | 'yards' | 'pieces';
    weight: number;
    inventoryItemId?: string;
  }>;
  chemicalRecipe: {
    recipeName: string;
    recipeVersion: string;
    chemicals: Array<{
      chemicalId: string;
      chemicalName: string;
      quantity: number;
      unit: 'kg' | 'liters' | 'grams' | 'ml';
      concentration: number;
      temperature: number;
      ph: number;
    }>;
    totalRecipeCost: number;
  };
  processParameters: {
    temperature: {
      min: number;
      max: number;
      actual: number;
      unit: 'celsius' | 'fahrenheit';
    };
    pressure: {
      min: number;
      max: number;
      actual: number;
      unit: 'bar' | 'psi';
    };
    ph: {
      min: number;
      max: number;
      actual: number;
    };
    time: {
      planned: number;
      actual?: number;
      unit: 'minutes' | 'hours';
    };
    speed: {
      planned: number;
      actual?: number;
      unit: 'm/min' | 'yards/min';
    };
  };
  machineAssignment: {
    machineId: string;
    machineName: string;
    machineType: string;
    capacity: number;
    efficiency: number;
  };
  workerAssignment: {
    workers: Array<{
      workerId: string;
      workerName: string;
      role: 'operator' | 'supervisor' | 'helper';
      shift: 'morning' | 'evening' | 'night';
      hoursWorked: number;
    }>;
    supervisorId: string;
    supervisorName: string;
  };
  timing: {
    plannedStartTime: string;
    actualStartTime?: string;
    plannedEndTime: string;
    actualEndTime?: string;
    plannedDuration: number;
    actualDuration?: number;
    setupTime: number;
    cleaningTime: number;
    downtime: number;
    reasonForDelay?: string;
  };
  qualityControl: {
    preProcessCheck: {
      fabricCondition: 'good' | 'fair' | 'poor';
      defects: string[];
      notes: string;
      checkedBy: string;
      checkedByName: string;
      checkDate: string;
    };
    inProcessCheck: {
      temperature: number;
      ph: number;
      color: string;
      consistency: 'good' | 'fair' | 'poor';
      notes: string;
      checkedBy: string;
      checkedByName: string;
      checkTime: string;
    };
    postProcessCheck: {
      whiteness: number;
      absorbency: 'excellent' | 'good' | 'fair' | 'poor';
      strength: number;
      shrinkage: number;
      defects: string[];
      qualityGrade: 'A' | 'B' | 'C' | 'D';
      notes: string;
      checkedBy: string;
      checkedByName: string;
      checkDate: string;
    };
  };
  outputMaterial: {
    quantity: number;
    unit: 'meters' | 'yards' | 'pieces';
    weight: number;
    gsm: number;
    width: number;
    color: string;
    quality: 'A' | 'B' | 'C' | 'D';
    defects: string[];
    location: {
      warehouseId: string;
      warehouseName: string;
      rackNumber?: string;
      shelfNumber?: string;
    };
  };
  wasteManagement: {
    wasteGenerated: Array<{
      quantity: number;
      unit: 'kg' | 'liters';
      type: 'chemical' | 'fabric' | 'water' | 'other';
      disposalMethod: 'recycle' | 'dispose' | 'reuse';
      cost: number;
    }>;
    totalWasteCost: number;
    environmentalCompliance: boolean;
    complianceNotes?: string;
  };
  costs: {
    chemicalCost: number;
    laborCost: number;
    machineCost: number;
    utilityCost: number;
    wasteDisposalCost: number;
    totalCost: number;
    costPerUnit: number;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_hold';
  progress: number;
  notes?: string;
  specialInstructions?: string;
  images: string[];
  documents: string[];
  tags: string[];
  approvedBy?: string;
  approvedByName?: string;
  approvalDate?: string;
  approvalNotes?: string;
  statusChangeLog?: Array<{
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    changedByName: string;
    changeDate: string;
    notes: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface PreProcessingAnalytics {
  totalBatches: number;
  completedBatches: number;
  inProgressBatches: number;
  completionRate: number;
  statusBreakdown: Array<{
    _id: string;
    count: number;
    avgEfficiency: number;
    avgProgress: number;
    avgCost: number;
  }>;
}

export interface CreatePreProcessingBatchRequest {
  productionOrderId?: string;
  productionOrderNumber?: string;
  greyFabricInwardId?: string;
  grnNumber?: string;
  processType: 'desizing' | 'bleaching' | 'scouring' | 'mercerizing' | 'combined';
  processName: string;
  processDescription?: string;
  inputMaterials: PreProcessingBatch['inputMaterials'];
  chemicalRecipe: PreProcessingBatch['chemicalRecipe'];
  processParameters: PreProcessingBatch['processParameters'];
  machineAssignment: PreProcessingBatch['machineAssignment'];
  workerAssignment: PreProcessingBatch['workerAssignment'];
  timing: PreProcessingBatch['timing'];
  qualityControl: PreProcessingBatch['qualityControl'];
  outputMaterial: PreProcessingBatch['outputMaterial'];
  wasteManagement: PreProcessingBatch['wasteManagement'];
  costs: PreProcessingBatch['costs'];
  notes?: string;
  specialInstructions?: string;
  images?: string[];
  documents?: string[];
  tags?: string[];
}

export interface UpdatePreProcessingStatusRequest {
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_hold';
  notes?: string;
  changeReason?: string;
  processData?: any;
}

export interface PreProcessingQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  processType?: string;
  startDate?: string;
  endDate?: string;
}

export const preProcessingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all pre-processing batches
    getPreProcessingBatches: builder.query<{
      success: boolean;
      data: PreProcessingBatch[];
      pagination: {
        current: number;
        pages: number;
        total: number;
      };
    }, PreProcessingQueryParams | void>({
      query: (params) => ({
        url: '/pre-processing',
        params,
      }),
      providesTags: ['PreProcessingBatch'],
    }),

    // Get single pre-processing batch
    getPreProcessingBatch: builder.query<{
      success: boolean;
      data: PreProcessingBatch;
    }, string>({
      query: (id) => `/pre-processing/${id}`,
      providesTags: (result, error, id) => [
        { type: 'PreProcessingBatch', id },
      ],
    }),

    // Create new pre-processing batch
    createPreProcessingBatch: builder.mutation<{
      success: boolean;
      data: PreProcessingBatch;
      message: string;
    }, CreatePreProcessingBatchRequest>({
      query: (data) => ({
        url: '/pre-processing',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PreProcessingBatch'],
    }),

    // Update pre-processing batch
    updatePreProcessingBatch: builder.mutation<{
      success: boolean;
      data: PreProcessingBatch;
      message: string;
    }, {
      id: string;
      data: Partial<CreatePreProcessingBatchRequest>;
    }>({
      query: ({ id, data }) => ({
        url: `/pre-processing/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PreProcessingBatch', id },
      ],
    }),

    // Update pre-processing batch status
    updatePreProcessingStatus: builder.mutation<{
      success: boolean;
      data: PreProcessingBatch;
      message: string;
    }, {
      id: string;
      data: UpdatePreProcessingStatusRequest;
    }>({
      query: ({ id, data }) => ({
        url: `/pre-processing/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PreProcessingBatch', id },
      ],
    }),

    // Delete pre-processing batch
    deletePreProcessingBatch: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/pre-processing/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PreProcessingBatch'],
    }),

    // Get pre-processing analytics
    getPreProcessingAnalytics: builder.query<{
      success: boolean;
      data: PreProcessingAnalytics;
    }, { startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: '/pre-processing/analytics',
        params,
      }),
      providesTags: ['PreProcessingAnalytics'],
    }),
  }),
});

export const {
  useGetPreProcessingBatchesQuery,
  useGetPreProcessingBatchQuery,
  useCreatePreProcessingBatchMutation,
  useUpdatePreProcessingBatchMutation,
  useUpdatePreProcessingStatusMutation,
  useDeletePreProcessingBatchMutation,
  useGetPreProcessingAnalyticsQuery,
} = preProcessingApi;
