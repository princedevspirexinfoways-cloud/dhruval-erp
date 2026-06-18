import { baseApi } from './baseApi';

export interface Scrap {
  _id: string;
  scrapNumber: string;
  scrapDate: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  unit: string;
  scrapReason: 'damaged' | 'defective' | 'expired' | 'obsolete' | 'production_waste' | 'quality_reject' | 'other';
  scrapReasonDetails?: string;
  warehouseId?: string;
  warehouseName?: string;
  stockImpact: {
    inventoryStockBefore: number;
    inventoryStockAfter: number;
    scrapStockBefore: number;
    scrapStockAfter: number;
  };
  unitCost?: number;
  totalValue?: number;
  qualityGrade?: string;
  defectDetails?: string;
  batchNumber?: string;
  lotNumber?: string;
  status: 'active' | 'disposed' | 'cancelled';
  notes?: string;
  tags: string[];
  disposal?: {
    disposed: boolean;
    disposalDate?: string;
    disposalMethod?: 'sold' | 'donated' | 'recycled' | 'destroyed' | 'other';
    disposalValue?: number;
    disposalNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MoveToScrapRequest {
  quantity: number;
  scrapReason: 'damaged' | 'defective' | 'expired' | 'obsolete' | 'production_waste' | 'quality_reject' | 'other';
  scrapReasonDetails?: string;
  warehouseId?: string;
  warehouseName?: string;
  unitCost?: number;
  qualityGrade?: string;
  defectDetails?: string;
  batchNumber?: string;
  lotNumber?: string;
  notes?: string;
  tags?: string[];
}

export interface ScrapSummary {
  totalScrapQuantity: number;
  totalScrapValue: number;
  byReason: Array<{
    reason: string;
    quantity: number;
    value: number;
    count: number;
  }>;
  byItem: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    value: number;
  }>;
}

export const scrapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Move inventory to scrap
    moveToScrap: builder.mutation<{ data: Scrap; message: string }, { inventoryItemId: string; scrapData: MoveToScrapRequest }>({
      query: ({ inventoryItemId, scrapData }) => ({
        url: `/scrap/inventory/${inventoryItemId}/move`,
        method: 'POST',
        body: scrapData,
      }),
      invalidatesTags: ['Scrap', 'InventoryItem'],
    }),

    // Get all scraps
    getScraps: builder.query<
      {
        data: {
          scraps: Scrap[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      {
        page?: number;
        limit?: number;
        status?: 'active' | 'disposed' | 'cancelled';
        scrapReason?: string;
        inventoryItemId?: string;
        dateFrom?: string;
        dateTo?: string;
        disposed?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      }
    >({
      query: (params = {}) => ({
        url: '/scrap',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.data?.scraps
          ? [
              ...result.data.scraps.map(({ _id }) => ({ type: 'Scrap' as const, id: _id })),
              { type: 'Scrap', id: 'LIST' },
            ]
          : [{ type: 'Scrap', id: 'LIST' }],
    }),

    // Get scrap by ID
    getScrapById: builder.query<{ data: Scrap }, string>({
      query: (id) => ({
        url: `/scrap/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Scrap', id }],
    }),

    // Get scrap summary
    getScrapSummary: builder.query<
      { data: ScrapSummary },
      { dateFrom?: string; dateTo?: string }
    >({
      query: (params = {}) => ({
        url: '/scrap/summary',
        method: 'GET',
        params,
      }),
      providesTags: ['Scrap'],
    }),

    // Get scraps by inventory item
    getScrapsByInventoryItem: builder.query<{ data: Scrap[] }, string>({
      query: (inventoryItemId) => ({
        url: `/scrap/inventory/${inventoryItemId}`,
        method: 'GET',
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Scrap' as const, id: _id })),
              { type: 'Scrap', id: 'LIST' },
            ]
          : [{ type: 'Scrap', id: 'LIST' }],
    }),

    // Mark scrap as disposed
    markAsDisposed: builder.mutation<
      { data: Scrap },
      {
        scrapId: string;
        disposalData: {
          disposalMethod: 'sold' | 'donated' | 'recycled' | 'destroyed' | 'other';
          disposalValue?: number;
          disposalNotes?: string;
        };
      }
    >({
      query: ({ scrapId, disposalData }) => ({
        url: `/scrap/${scrapId}/dispose`,
        method: 'POST',
        body: disposalData,
      }),
      invalidatesTags: ['Scrap'],
    }),

    // Delete/Cancel scrap
    deleteScrap: builder.mutation<{ data: Scrap; message: string }, string>({
      query: (id) => ({
        url: `/scrap/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Scrap', 'InventoryItem'],
    }),
  }),
});

export const {
  useMoveToScrapMutation,
  useGetScrapsQuery,
  useGetScrapByIdQuery,
  useGetScrapSummaryQuery,
  useGetScrapsByInventoryItemQuery,
  useMarkAsDisposedMutation,
  useDeleteScrapMutation,
} = scrapApi;


