import { baseApi } from '@/lib/api/baseApi';
import { ISticker } from '@/types/stickers';

export const stickerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all stickers
    getAllStickers: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, {
      companyId?: string;
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    }>({
      query: (params) => ({
        url: '/stickers',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Sticker' as const, id: _id })),
              { type: 'Sticker', id: 'LIST' },
            ]
          : [{ type: 'Sticker', id: 'LIST' }],
    }),

    // Get sticker by ID
    getStickerById: builder.query<{
      success: boolean;
      data: ISticker;
    }, string>({
      query: (id) => `/stickers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sticker', id }],
    }),

    // Create new sticker
    createSticker: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, Partial<ISticker>>({
      query: (sticker) => ({
        url: '/stickers',
        method: 'POST',
        body: sticker,
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'LIST' }],
    }),

    // Update sticker
    updateSticker: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, {
      id: string;
      data: Partial<ISticker>;
    }>({
      query: ({ id, data }) => ({
        url: `/stickers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sticker', id },
        { type: 'Sticker', id: 'LIST' },
      ],
    }),

    // Delete sticker
    deleteSticker: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/stickers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'LIST' }],
    }),

    // Generate sticker
    generateSticker: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, {
      designNumber: string;
      sku: string;
      batchNumber: string;
      color: string;
      quantity: number;
      type: string;
    }>({
      query: (data) => ({
        url: '/stickers/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'LIST' }],
    }),

    // Generate bulk stickers
    generateBulkStickers: builder.mutation<{
      success: boolean;
      message: string;
      results: any[];
    }, {
      stickers: Partial<ISticker>[];
    }>({
      query: (data) => ({
        url: '/stickers/generate-bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'LIST' }],
    }),

    // Generate batch stickers
    generateBatchStickers: builder.mutation<{
      success: boolean;
      message: string;
      results: any[];
    }, {
      batchNumber: string;
      items: Partial<ISticker>[];
    }>({
      query: (data) => ({
        url: '/stickers/generate-batch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'LIST' }],
    }),

    // Print sticker
    printSticker: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, {
      id: string;
      copies?: number;
      printerName?: string;
    }>({
      query: ({ id, copies, printerName }) => ({
        url: `/stickers/${id}/print`,
        method: 'POST',
        body: { copies, printerName },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sticker', id },
        { type: 'Sticker', id: 'LIST' },
      ],
    }),

    // Print multiple copies
    printMultipleCopies: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, {
      id: string;
      copies: number;
      printerName?: string;
    }>({
      query: ({ id, copies, printerName }) => ({
        url: `/stickers/${id}/print-multiple`,
        method: 'POST',
        body: { copies, printerName },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sticker', id },
        { type: 'Sticker', id: 'LIST' },
      ],
    }),

    // Bulk print stickers
    bulkPrintStickers: builder.mutation<{
      success: boolean;
      message: string;
      results: any[];
    }, {
      stickerIds: string[];
      copies?: number;
      printerName?: string;
    }>({
      query: (data) => ({
        url: '/stickers/bulk-print',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'LIST' }],
    }),

    // Get print history
    getPrintHistory: builder.query<{
      success: boolean;
      data: any[];
    }, string>({
      query: (id) => `/stickers/print-history/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sticker', id: 'PRINT_HISTORY' }],
    }),

    // Apply sticker
    applySticker: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, {
      id: string;
      itemType: string;
      itemId: string;
      location: string;
    }>({
      query: ({ id, itemType, itemId, location }) => ({
        url: `/stickers/${id}/apply`,
        method: 'POST',
        body: { itemType, itemId, location },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sticker', id },
        { type: 'Sticker', id: 'LIST' },
      ],
    }),

    // Update sticker status
    updateStickerStatus: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, {
      id: string;
      status: string;
      remarks?: string;
    }>({
      query: ({ id, status, remarks }) => ({
        url: `/stickers/${id}/status`,
        method: 'PUT',
        body: { status, remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sticker', id },
        { type: 'Sticker', id: 'LIST' },
      ],
    }),

    // Reprint sticker
    reprintSticker: builder.mutation<{
      success: boolean;
      message: string;
      data: ISticker;
    }, {
      id: string;
      reason: string;
      copies?: number;
      printerName?: string;
    }>({
      query: ({ id, reason, copies, printerName }) => ({
        url: `/stickers/${id}/reprint`,
        method: 'POST',
        body: { reason, copies, printerName },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Sticker', id },
        { type: 'Sticker', id: 'LIST' },
      ],
    }),

    // Search by design number
    searchByDesign: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, string>({
      query: (designNumber) => `/stickers/search/design/${designNumber}`,
      providesTags: [{ type: 'Sticker', id: 'SEARCH' }],
    }),

    // Search by SKU
    searchBySKU: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, string>({
      query: (sku) => `/stickers/search/sku/${sku}`,
      providesTags: [{ type: 'Sticker', id: 'SEARCH' }],
    }),

    // Search by batch number
    searchByBatch: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, string>({
      query: (batchNumber) => `/stickers/search/batch/${batchNumber}`,
      providesTags: [{ type: 'Sticker', id: 'SEARCH' }],
    }),

    // Search by barcode
    searchByBarcode: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, string>({
      query: (barcodeData) => `/stickers/search/barcode/${barcodeData}`,
      providesTags: [{ type: 'Sticker', id: 'SEARCH' }],
    }),

    // Search by QR code
    searchByQRCode: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, string>({
      query: (qrCodeData) => `/stickers/search/qr/${qrCodeData}`,
      providesTags: [{ type: 'Sticker', id: 'SEARCH' }],
    }),

    // Filter by type
    filterByType: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, string>({
      query: (type) => `/stickers/filter/type/${type}`,
      providesTags: [{ type: 'Sticker', id: 'FILTER' }],
    }),

    // Filter by status
    filterByStatus: builder.query<{
      success: boolean;
      data: ISticker[];
      total: number;
    }, string>({
      query: (status) => `/stickers/filter/status/${status}`,
      providesTags: [{ type: 'Sticker', id: 'FILTER' }],
    }),

    // Get all templates
    getAllTemplates: builder.query<{
      success: boolean;
      data: any[];
    }, void>({
      query: () => '/stickers/templates/all',
      providesTags: [{ type: 'Sticker', id: 'TEMPLATES' }],
    }),

    // Create template
    createTemplate: builder.mutation<{
      success: boolean;
      message: string;
    }, any>({
      query: (template) => ({
        url: '/stickers/templates/create',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'TEMPLATES' }],
    }),

    // Update template
    updateTemplate: builder.mutation<{
      success: boolean;
      message: string;
    }, {
      id: string;
      data: any;
    }>({
      query: ({ id, data }) => ({
        url: `/stickers/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'TEMPLATES' }],
    }),

    // Delete template
    deleteTemplate: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/stickers/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Sticker', id: 'TEMPLATES' }],
    }),

    // Get sticker summary
    getStickerSummary: builder.query<{
      success: boolean;
      data: any;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/stickers/reports/summary',
        params,
      }),
      providesTags: [{ type: 'Sticker', id: 'SUMMARY' }],
    }),

    // Get print status report
    getPrintStatusReport: builder.query<{
      success: boolean;
      data: any;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/stickers/reports/print-status',
        params,
      }),
      providesTags: [{ type: 'Sticker', id: 'PRINT_STATUS' }],
    }),

    // Get application status report
    getApplicationStatusReport: builder.query<{
      success: boolean;
      data: any;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/stickers/reports/application-status',
        params,
      }),
      providesTags: [{ type: 'Sticker', id: 'APPLICATION_STATUS' }],
    }),

    // Get reprint analysis
    getReprintAnalysis: builder.query<{
      success: boolean;
      data: any;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/stickers/reports/reprint-analysis',
        params,
      }),
      providesTags: [{ type: 'Sticker', id: 'REPRINT_ANALYSIS' }],
    }),

    // Export stickers to CSV
    exportStickersCSV: builder.query<{
      success: boolean;
      data: string;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/stickers/export/csv',
        params,
      }),
      providesTags: [{ type: 'Sticker', id: 'EXPORT' }],
    }),

    // Export stickers to PDF
    exportStickersPDF: builder.query<{
      success: boolean;
      message: string;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/stickers/export/pdf',
        params,
      }),
      providesTags: [{ type: 'Sticker', id: 'EXPORT' }],
    }),

    // Export stickers to Excel
    exportStickersExcel: builder.query<{
      success: boolean;
      message: string;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/stickers/export/excel',
        params,
      }),
      providesTags: [{ type: 'Sticker', id: 'EXPORT' }],
    }),
  }),
});

export const {
  useGetAllStickersQuery,
  useGetStickerByIdQuery,
  useCreateStickerMutation,
  useUpdateStickerMutation,
  useDeleteStickerMutation,
  useGenerateStickerMutation,
  useGenerateBulkStickersMutation,
  useGenerateBatchStickersMutation,
  usePrintStickerMutation,
  usePrintMultipleCopiesMutation,
  useBulkPrintStickersMutation,
  useGetPrintHistoryQuery,
  useApplyStickerMutation,
  useUpdateStickerStatusMutation,
  useReprintStickerMutation,
  useSearchByDesignQuery,
  useSearchBySKUQuery,
  useSearchByBatchQuery,
  useSearchByBarcodeQuery,
  useSearchByQRCodeQuery,
  useFilterByTypeQuery,
  useFilterByStatusQuery,
  useGetAllTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useGetStickerSummaryQuery,
  useGetPrintStatusReportQuery,
  useGetApplicationStatusReportQuery,
  useGetReprintAnalysisQuery,
  useExportStickersCSVQuery,
  useExportStickersPDFQuery,
  useExportStickersExcelQuery,
} = stickerApi;
