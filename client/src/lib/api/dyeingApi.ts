import { baseApi } from './baseApi';

export interface DyeingProcess {
  _id: string;
  batchNumber: string;
  productionOrderId?: string;
  productionOrderNumber?: string;
  processType: 'dyeing';
  processName: string;
  processDescription?: string;
  inputMaterials: any[];
  chemicalRecipe: any;
  processParameters: any;
  machineAssignment: any;
  workerAssignment: any;
  timing: {
    plannedStartTime: string;
    actualStartTime?: string;
    plannedEndTime: string;
    actualEndTime?: string;
    plannedDuration: number;
    actualDuration?: number;
  };
  qualityChecks?: any[];
  outputMaterial?: any;
  wasteManagement?: any;
  costBreakdown?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_hold';
  progress: number;
  notes?: string;
  images: string[];
  documents: string[];
  tags: string[];
  statusChangeLog?: Array<{
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    changedByName: string;
    changeDate: string;
    notes?: string;
    processData?: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const dyeingApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get dyeing process by ID
    getDyeingProcess: builder.query<{ success: boolean; data: DyeingProcess }, string>({
      query: (dyeingId) => `/production-stages/dyeing/${dyeingId}`,
      providesTags: (result, error, id) => [{ type: 'Dyeing' as const, id }],
    }),

    // Get dyeing processes by production order
    getDyeingProcessesByOrder: builder.query<{ success: boolean; data: DyeingProcess[] }, string>({
      query: (productionOrderId) => `/production-stages/dyeing/order/${productionOrderId}`,
      providesTags: ['Dyeing'],
    }),

    // Create dyeing process for an order
    createDyeingProcess: builder.mutation<
      { success: boolean; message: string; data: DyeingProcess },
      { productionOrderId: string; data: Partial<DyeingProcess> }
    >({
      query: ({ productionOrderId, data }) => ({
        url: `/production-stages/dyeing/${productionOrderId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Dyeing'],
    }),

    // Update dyeing process
    updateDyeingProcess: builder.mutation<
      { success: boolean; message: string; data: DyeingProcess },
      { dyeingId: string; data: Partial<DyeingProcess> }
    >({
      query: ({ dyeingId, data }) => ({
        url: `/production-stages/dyeing/${dyeingId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (r, e, { dyeingId }) => [{ type: 'Dyeing', id: dyeingId }],
    }),

    // Start dyeing
    startDyeingProcess: builder.mutation<
      { success: boolean; message: string; data: DyeingProcess },
      { dyeingId: string }
    >({
      query: ({ dyeingId }) => ({
        url: `/production-stages/dyeing/${dyeingId}/start`,
        method: 'POST',
      }),
      invalidatesTags: (r, e, { dyeingId }) => [{ type: 'Dyeing', id: dyeingId }],
    }),

    // Complete dyeing
    completeDyeingProcess: builder.mutation<
      { success: boolean; message: string; data: DyeingProcess },
      { dyeingId: string; data?: any }
    >({
      query: ({ dyeingId, data }) => ({
        url: `/production-stages/dyeing/${dyeingId}/complete`,
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: (r, e, { dyeingId }) => [{ type: 'Dyeing', id: dyeingId }],
    }),

    // Add quality check
    addDyeingQualityCheck: builder.mutation<
      { success: boolean; message: string; data: DyeingProcess },
      { dyeingId: string; data: any }
    >({
      query: ({ dyeingId, data }) => ({
        url: `/production-stages/dyeing/${dyeingId}/quality-check`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (r, e, { dyeingId }) => [{ type: 'Dyeing', id: dyeingId }],
    }),

    // Analytics
    getDyeingAnalytics: builder.query<{ success: boolean; data: any }, { startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: '/production-stages/dyeing/analytics',
        params,
      }),
      providesTags: ['Dyeing'],
    }),
  }),
});

export const {
  useGetDyeingProcessQuery,
  useGetDyeingProcessesByOrderQuery,
  useCreateDyeingProcessMutation,
  useUpdateDyeingProcessMutation,
  useStartDyeingProcessMutation,
  useCompleteDyeingProcessMutation,
  useAddDyeingQualityCheckMutation,
  useGetDyeingAnalyticsQuery,
} = dyeingApi;


