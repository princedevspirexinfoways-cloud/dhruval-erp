import { baseApi } from '@/lib/api/baseApi';
import { IBatch, IBatchFormData, IBatchProgress } from '@/types/batches';

export const batchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all batches
    getAllBatches: builder.query<{
      success: boolean;
      data: IBatch[];
      total: number;
    }, {
      companyId?: string;
      status?: string;
      priority?: string;
      productId?: string;
      machineId?: string;
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: (params) => ({
        url: '/v1/batches',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Batch' as const, id: _id })),
              { type: 'Batch', id: 'LIST' },
            ]
          : [{ type: 'Batch', id: 'LIST' }],
    }),

    // Get batch by ID
    getBatchById: builder.query<{
      success: boolean;
      data: IBatch;
    }, string>({
      query: (id) => `/v1/batches/${id}`,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),

    // Get batches by status
    getBatchesByStatus: builder.query<{
      success: boolean;
      data: IBatch[];
      total: number;
    }, {
      companyId: string;
      status: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ companyId, status, page, limit }) => ({
        url: `/v1/batches/status/${status}`,
        params: { companyId, page, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Batch' as const, id: _id })),
              { type: 'Batch', id: 'STATUS' },
            ]
          : [{ type: 'Batch', id: 'STATUS' }],
    }),

    // Get batches by date range
    getBatchesByDateRange: builder.query<{
      success: boolean;
      data: IBatch[];
      total: number;
    }, {
      companyId: string;
      startDate: string;
      endDate: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ companyId, startDate, endDate, page, limit }) => ({
        url: '/v1/batches/date-range',
        params: { companyId, startDate, endDate, page, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Batch' as const, id: _id })),
              { type: 'Batch', id: 'DATE_RANGE' },
            ]
          : [{ type: 'Batch', id: 'DATE_RANGE' }],
    }),

    // Get batches by product
    getBatchesByProduct: builder.query<{
      success: boolean;
      data: IBatch[];
      total: number;
    }, {
      companyId: string;
      productId: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ companyId, productId, page, limit }) => ({
        url: `/v1/batches/product/${productId}`,
        params: { companyId, page, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Batch' as const, id: _id })),
              { type: 'Batch', id: 'PRODUCT' },
            ]
          : [{ type: 'Batch', id: 'PRODUCT' }],
    }),

    // Get batches by machine
    getBatchesByMachine: builder.query<{
      success: boolean;
      data: IBatch[];
      total: number;
    }, {
      companyId: string;
      machineId: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ companyId, machineId, page, limit }) => ({
        url: `/v1/batches/machine/${machineId}`,
        params: { companyId, page, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Batch' as const, id: _id })),
              { type: 'Batch', id: 'MACHINE' },
            ]
          : [{ type: 'Batch', id: 'MACHINE' }],
    }),

    // Create new batch
    createBatch: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, IBatchFormData>({
      query: (batchData) => ({
        url: '/v1/batches',
        method: 'POST',
        body: batchData,
      }),
      invalidatesTags: [{ type: 'Batch', id: 'LIST' }],
    }),

    // Update batch
    updateBatch: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, {
      id: string;
      data: Partial<IBatchFormData>;
    }>({
      query: ({ id, data }) => ({
        url: `/v1/batches/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Batch', id },
        { type: 'Batch', id: 'LIST' },
      ],
    }),

    // Delete batch
    deleteBatch: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/v1/batches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Batch', id },
        { type: 'Batch', id: 'LIST' },
      ],
    }),

    // Start production
    startProduction: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, string>({
      query: (id) => ({
        url: `/v1/batches/${id}/start-production`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Batch', id },
        { type: 'Batch', id: 'LIST' },
      ],
    }),

    // Complete production
    completeProduction: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, string>({
      query: (id) => ({
        url: `/v1/batches/${id}/complete-production`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Batch', id },
        { type: 'Batch', id: 'LIST' },
      ],
    }),

    // Quality check
    qualityCheck: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, {
      id: string;
      qualityData: {
        qualityScore: number;
        defects: string[];
        notes?: string;
      };
    }>({
      query: ({ id, qualityData }) => ({
        url: `/v1/batches/${id}/quality-check`,
        method: 'POST',
        body: qualityData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Batch', id }],
    }),

    // Approve batch
    approveBatch: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, {
      id: string;
      approvalData: {
        approvedBy: string;
        approvalNotes?: string;
      };
    }>({
      query: ({ id, approvalData }) => ({
        url: `/v1/batches/${id}/approve`,
        method: 'POST',
        body: approvalData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Batch', id }],
    }),

    // Reject batch
    rejectBatch: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, {
      id: string;
      rejectionData: {
        rejectedBy: string;
        rejectionReason: string;
      };
    }>({
      query: ({ id, rejectionData }) => ({
        url: `/v1/batches/${id}/reject`,
        method: 'POST',
        body: rejectionData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Batch', id }],
    }),

    // Hold batch
    holdBatch: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, {
      id: string;
      holdData: {
        heldBy: string;
        holdReason: string;
      };
    }>({
      query: ({ id, holdData }) => ({
        url: `/v1/batches/${id}/hold`,
        method: 'POST',
        body: holdData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Batch', id }],
    }),

    // Resume batch
    resumeBatch: builder.mutation<{
      success: boolean;
      message: string;
      data: IBatch;
    }, {
      id: string;
      resumeData: {
        resumedBy: string;
        resumeNotes?: string;
      };
    }>({
      query: ({ id, resumeData }) => ({
        url: `/v1/batches/${id}/resume`,
        method: 'POST',
        body: resumeData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Batch', id }],
    }),

    // Get batch progress
    getBatchProgress: builder.query<{
      success: boolean;
      data: IBatchProgress;
    }, string>({
      query: (id) => `/v1/batches/${id}/progress`,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),

    // Get batch timeline
    getBatchTimeline: builder.query<{
      success: boolean;
      data: {
        batchId: string;
        timeline: Array<{
          stage: string;
          timestamp: string;
        }>;
      };
    }, string>({
      query: (id) => `/v1/batches/${id}/timeline`,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),

    // Get quality records
    getQualityRecords: builder.query<{
      success: boolean;
      data: {
        batchId: string;
        qualityRecords: any[];
        averageScore: number;
        totalChecks: number;
      };
    }, string>({
      query: (id) => `/v1/batches/${id}/quality-records`,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),

    // Get cost analysis
    getCostAnalysis: builder.query<{
      success: boolean;
      data: {
        batchId: string;
        materialCost: number;
        laborCost: number;
        overheadCost: number;
        totalCost: number;
        costPerUnit: number;
      };
    }, string>({
      query: (id) => `/v1/batches/${id}/cost-analysis`,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),

    // Get performance metrics
    getPerformanceMetrics: builder.query<{
      success: boolean;
      data: {
        startDate: string;
        endDate: string;
        department?: string;
        totalBatches: number;
        completedBatches: number;
        averageCompletionTime: number;
        efficiency: number;
      };
    }, {
      startDate: string;
      endDate: string;
      department?: string;
    }>({
      query: (params) => ({
        url: '/v1/batches/performance/metrics',
        params,
      }),
      providesTags: [{ type: 'Batch', id: 'PERFORMANCE' }],
    }),

    // Get efficiency report
    getEfficiencyReport: builder.query<{
      success: boolean;
      data: {
        startDate: string;
        endDate: string;
        machineId?: string;
        operatorId?: string;
        totalBatches: number;
        averageEfficiency: number;
        downtime: number;
        utilization: number;
      };
    }, {
      startDate: string;
      endDate: string;
      machineId?: string;
      operatorId?: string;
    }>({
      query: (params) => ({
        url: '/v1/batches/efficiency/report',
        params,
      }),
      providesTags: [{ type: 'Batch', id: 'EFFICIENCY' }],
    }),

    // Search batches
    searchBatches: builder.query<{
      success: boolean;
      data: IBatch[];
      total: number;
    }, {
      companyId: string;
      searchTerm: string;
      filters?: {
        status?: string;
        priority?: string;
        productId?: string;
        machineId?: string;
        startDate?: string;
        endDate?: string;
      };
    }>({
      query: (params) => ({
        url: '/v1/batches/search',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Batch' as const, id: _id })),
              { type: 'Batch', id: 'SEARCH' },
            ]
          : [{ type: 'Batch', id: 'SEARCH' }],
    }),
  }),
});

export const {
  useGetAllBatchesQuery,
  useGetBatchByIdQuery,
  useGetBatchesByStatusQuery,
  useGetBatchesByDateRangeQuery,
  useGetBatchesByProductQuery,
  useGetBatchesByMachineQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
  useStartProductionMutation,
  useCompleteProductionMutation,
  useQualityCheckMutation,
  useApproveBatchMutation,
  useRejectBatchMutation,
  useHoldBatchMutation,
  useResumeBatchMutation,
  useGetBatchProgressQuery,
  useGetBatchTimelineQuery,
  useGetQualityRecordsQuery,
  useGetCostAnalysisQuery,
  useGetPerformanceMetricsQuery,
  useGetEfficiencyReportQuery,
  useSearchBatchesQuery,
} = batchApi;
