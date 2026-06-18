import { baseApi } from './baseApi';

export interface GoodsReturn {
  _id: string;
  returnNumber: string;
  returnDate: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  originalChallanNumber: string;
  originalChallanDate?: string;
  damagedQuantity: number;
  returnedQuantity: number;
  totalQuantity: number;
  unit: string;
  returnReason: 'damaged' | 'defective' | 'quality_issue' | 'wrong_item' | 'expired' | 'other';
  returnReasonDetails?: string;
  warehouseId?: string;
  warehouseName?: string;
  stockImpact: {
    inventoryStockBefore: number;
    inventoryStockAfter: number;
    damagedStockBefore: number;
    damagedStockAfter: number;
    returnedStockBefore: number;
    returnedStockAfter: number;
  };
  unitCost?: number;
  damagedValue?: number;
  returnedValue?: number;
  totalValue?: number;
  qualityGrade?: string;
  defectDetails?: string;
  batchNumber?: string;
  lotNumber?: string;
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  returnStatus: 'pending' | 'approved' | 'processed' | 'rejected' | 'cancelled';
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoodsReturnRequest {
  originalChallanNumber: string;
  originalChallanDate?: string;
  damagedQuantity: number;
  returnedQuantity: number;
  returnReason: 'damaged' | 'defective' | 'quality_issue' | 'wrong_item' | 'expired' | 'other';
  returnReasonDetails?: string;
  warehouseId?: string;
  warehouseName?: string;
  unitCost?: number;
  qualityGrade?: string;
  defectDetails?: string;
  batchNumber?: string;
  lotNumber?: string;
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  notes?: string;
  tags?: string[];
}

export interface ChallanReturnSummary {
  challanNumber: string;
  totalReturns: number;
  totalDamagedQuantity: number;
  totalReturnedQuantity: number;
  totalValue: number;
  returns: GoodsReturn[];
}

export const goodsReturnsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create goods return
    createGoodsReturn: builder.mutation<
      { data: GoodsReturn; message: string },
      { inventoryItemId: string; returnData: CreateGoodsReturnRequest }
    >({
      query: ({ inventoryItemId, returnData }) => ({
        url: '/goods-returns',
        method: 'POST',
        body: {
          inventoryItemId,
          returnData,
        },
      }),
      invalidatesTags: ['GoodsReturn', 'InventoryItem'],
    }),

    // Get all goods returns
    getGoodsReturns: builder.query<
      {
        success: boolean;
        data: GoodsReturn[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      },
      {
        page?: number;
        limit?: number;
        status?: 'active' | 'completed' | 'cancelled';
        returnStatus?: 'pending' | 'approved' | 'processed' | 'rejected' | 'cancelled';
        returnReason?: string;
        inventoryItemId?: string;
        challanNumber?: string;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        search?: string;
      }
    >({
      query: (params = {}) => ({
        url: '/goods-returns',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'GoodsReturn' as const, id: _id })),
              { type: 'GoodsReturn', id: 'LIST' },
            ]
          : [{ type: 'GoodsReturn', id: 'LIST' }],
    }),

    // Get goods return by ID
    getGoodsReturnById: builder.query<{ data: GoodsReturn }, string>({
      query: (id) => ({
        url: `/goods-returns/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'GoodsReturn', id }],
    }),

    // Get returns by challan number
    getReturnsByChallan: builder.query<{ data: GoodsReturn[] }, string>({
      query: (challanNumber) => ({
        url: `/goods-returns/challan/${challanNumber}`,
        method: 'GET',
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'GoodsReturn' as const, id: _id })),
              { type: 'GoodsReturn', id: 'LIST' },
            ]
          : [{ type: 'GoodsReturn', id: 'LIST' }],
    }),

    // Get challan return summary
    getChallanReturnSummary: builder.query<{ data: ChallanReturnSummary }, string>({
      query: (challanNumber) => ({
        url: `/goods-returns/challan/${challanNumber}/summary`,
        method: 'GET',
      }),
      providesTags: ['GoodsReturn'],
    }),
  }),
});

export const {
  useCreateGoodsReturnMutation,
  useGetGoodsReturnsQuery,
  useGetGoodsReturnByIdQuery,
  useGetReturnsByChallanQuery,
  useGetChallanReturnSummaryQuery,
} = goodsReturnsApi;

