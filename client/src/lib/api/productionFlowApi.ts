import { baseApi } from './baseApi';

// Types
export interface ProductionFlowData {
  totalOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  delayedOrders: number;
  stageWiseCount: Record<string, number>;
  recentActivities: any[];
}

export interface ProductionOrder {
  _id: string;
  productionOrderNumber: string;
  customerName: string;
  product: {
    productType: string;
    design: string;
    color: string;
    gsm: number;
  };
  orderQuantity: number;
  completedQuantity: number;
  status: string;
  productionStages: ProductionStage[];
  schedule: {
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
  };
}

export interface ProductionStage {
  stageId: string;
  stageNumber: number;
  stageName: string;
  processType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'rejected' | 'rework';
  timing: {
    plannedStartTime?: string;
    actualStartTime?: string;
    plannedEndTime?: string;
    actualEndTime?: string;
    plannedDuration?: number;
    actualDuration?: number;
  };
  progress: number;
  output: {
    producedQuantity?: number;
    defectQuantity?: number;
    outputImages: string[];
  };
  qualityControl: {
    finalQuality: {
      qualityGrade?: string;
      qualityNotes?: string;
    };
  };
  notes?: string;
}

export interface ProductionFlowStatus {
  order: ProductionOrder;
  currentStage: ProductionStage | null;
  nextStage: ProductionStage | null;
  completedStages: number;
  totalStages: number;
  progressPercentage: number;
}

export interface StageActionRequest {
  actualQuantity?: number;
  qualityNotes?: string;
  defectQuantity?: number;
  completedBy?: string;
  qualityGrade?: 'A' | 'B' | 'C' | 'D';
  images?: string[];
  notes?: string;
  reason?: string;
  heldBy?: string;
  resumedBy?: string;
  startedBy?: string;
}

export interface StageSummary {
  stageType: string;
  dateRange: {
    from?: string;
    to?: string;
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    onHoldOrders: number;
    averageCompletionTime: number;
    efficiency: number;
  };
}

export interface FlowAnalytics {
  period: string;
  analytics: {
    totalProduction: number;
    averageCycleTime: number;
    qualityMetrics: {
      passRate: number;
      defectRate: number;
      reworkRate: number;
    };
    efficiencyMetrics: {
      machineUtilization: number;
      laborEfficiency: number;
      overallEfficiency: number;
    };
    costMetrics: {
      materialCost: number;
      laborCost: number;
      overheadCost: number;
      totalCost: number;
    };
  };
}

// API Slice
export const productionFlowApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get production flow dashboard data
    getProductionFlowDashboard: builder.query<{
      success: boolean;
      message: string;
      data: ProductionFlowData;
    }, void>({
      query: () => '/production-flow/dashboard',
      providesTags: ['ProductionFlow'],
    }),

    // Initialize production flow for an order
    initializeFlow: builder.mutation<{
      success: boolean;
      message: string;
      data: ProductionOrder;
    }, string>({
      query: (productionOrderId) => ({
        url: `/production-flow/${productionOrderId}/initialize`,
        method: 'POST',
      }),
      invalidatesTags: ['ProductionFlow', 'ProductionOrder'],
    }),

    // Get production flow status for an order
    getFlowStatus: builder.query<{
      success: boolean;
      message: string;
      data: ProductionFlowStatus;
    }, string>({
      query: (productionOrderId) => `/production-flow/${productionOrderId}/status`,
      providesTags: (result, error, productionOrderId) => [
        { type: 'ProductionFlow', id: productionOrderId },
      ],
    }),

    // Start a production stage
    startStage: builder.mutation<{
      success: boolean;
      message: string;
      data: ProductionOrder;
    }, { productionOrderId: string; stageNumber: number; data?: StageActionRequest }>({
      query: ({ productionOrderId, stageNumber, data }) => ({
        url: `/production-flow/${productionOrderId}/stages/${stageNumber}/start`,
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: ['ProductionFlow', 'ProductionOrder'],
    }),

    // Complete a production stage
    completeStage: builder.mutation<{
      success: boolean;
      message: string;
      data: ProductionOrder;
    }, { productionOrderId: string; stageNumber: number; data: StageActionRequest }>({
      query: ({ productionOrderId, stageNumber, data }) => ({
        url: `/production-flow/${productionOrderId}/stages/${stageNumber}/complete`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProductionFlow', 'ProductionOrder'],
    }),

    // Hold a production stage
    holdStage: builder.mutation<{
      success: boolean;
      message: string;
      data: ProductionOrder;
    }, { productionOrderId: string; stageNumber: number; data: StageActionRequest }>({
      query: ({ productionOrderId, stageNumber, data }) => ({
        url: `/production-flow/${productionOrderId}/stages/${stageNumber}/hold`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProductionFlow', 'ProductionOrder'],
    }),

    // Resume a held production stage
    resumeStage: builder.mutation<{
      success: boolean;
      message: string;
      data: ProductionOrder;
    }, { productionOrderId: string; stageNumber: number; data?: StageActionRequest }>({
      query: ({ productionOrderId, stageNumber, data }) => ({
        url: `/production-flow/${productionOrderId}/stages/${stageNumber}/resume`,
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: ['ProductionFlow', 'ProductionOrder'],
    }),

    // Get stage-wise production summary
    getStageSummary: builder.query<{
      success: boolean;
      message: string;
      data: StageSummary;
    }, { stageType?: string; dateFrom?: string; dateTo?: string }>({
      query: (params) => ({
        url: '/production-flow/summary',
        params,
      }),
      providesTags: ['ProductionFlow'],
    }),

    // Get production flow analytics
    getFlowAnalytics: builder.query<{
      success: boolean;
      message: string;
      data: FlowAnalytics;
    }, { period?: string }>({
      query: (params) => ({
        url: '/production-flow/analytics',
        params,
      }),
      providesTags: ['ProductionFlow'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetProductionFlowDashboardQuery,
  useInitializeFlowMutation,
  useGetFlowStatusQuery,
  useStartStageMutation,
  useCompleteStageMutation,
  useHoldStageMutation,
  useResumeStageMutation,
  useGetStageSummaryQuery,
  useGetFlowAnalyticsQuery,
} = productionFlowApi;
