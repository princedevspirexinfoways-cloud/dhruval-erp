import { baseApi } from '@/lib/api/baseApi';
import { IShift, IShiftFormData } from '@/types/shifts';

export const shiftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all shifts
    getAllShifts: builder.query<{
      success: boolean;
      data: IShift[];
      total: number;
    }, {
      companyId?: string;
      shiftType?: string;
      shiftCategory?: string;
      isNightShift?: boolean;
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: (params) => ({
        url: '/v1/shifts',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shift' as const, id: _id })),
              { type: 'Shift', id: 'LIST' },
            ]
          : [{ type: 'Shift', id: 'LIST' }],
    }),

    // Get shift by ID
    getShiftById: builder.query<{
      success: boolean;
      data: IShift;
    }, string>({
      query: (id) => `/v1/shifts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Shift', id }],
    }),

    // Get shifts by type
    getShiftsByType: builder.query<{
      success: boolean;
      data: IShift[];
      total: number;
    }, {
      companyId: string;
      shiftType: string;
    }>({
      query: ({ companyId, shiftType }) => ({
        url: `/v1/shifts/type/${shiftType}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shift' as const, id: _id })),
              { type: 'Shift', id: 'TYPE' },
            ]
          : [{ type: 'Shift', id: 'TYPE' }],
    }),

    // Get shifts by category
    getShiftsByCategory: builder.query<{
      success: boolean;
      data: IShift[];
      total: number;
    }, {
      companyId: string;
      shiftCategory: string;
    }>({
      query: ({ companyId, shiftCategory }) => ({
        url: `/v1/shifts/category/${shiftCategory}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shift' as const, id: _id })),
              { type: 'Shift', id: 'CATEGORY' },
            ]
          : [{ type: 'Shift', id: 'CATEGORY' }],
    }),

    // Get night shifts
    getNightShifts: builder.query<{
      success: boolean;
      data: IShift[];
      total: number;
    }, {
      companyId: string;
    }>({
      query: ({ companyId }) => ({
        url: '/v1/shifts/night',
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shift' as const, id: _id })),
              { type: 'Shift', id: 'NIGHT' },
            ]
          : [{ type: 'Shift', id: 'NIGHT' }],
    }),

    // Get shifts by department
    getShiftsByDepartment: builder.query<{
      success: boolean;
      data: IShift[];
      total: number;
    }, {
      companyId: string;
      department: string;
    }>({
      query: ({ companyId, department }) => ({
        url: `/v1/shifts/department/${department}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shift' as const, id: _id })),
              { type: 'Shift', id: 'DEPARTMENT' },
            ]
          : [{ type: 'Shift', id: 'DEPARTMENT' }],
    }),

    // Create new shift
    createShift: builder.mutation<{
      success: boolean;
      message: string;
      data: IShift;
    }, IShiftFormData>({
      query: (shiftData) => ({
        url: '/v1/shifts',
        method: 'POST',
        body: shiftData,
      }),
      invalidatesTags: [{ type: 'Shift', id: 'LIST' }],
    }),

    // Update shift
    updateShift: builder.mutation<{
      success: boolean;
      message: string;
      data: IShift;
    }, {
      id: string;
      data: Partial<IShiftFormData>;
    }>({
      query: ({ id, data }) => ({
        url: `/v1/shifts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Shift', id },
        { type: 'Shift', id: 'LIST' },
      ],
    }),

    // Delete shift
    deleteShift: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/v1/shifts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Shift', id },
        { type: 'Shift', id: 'LIST' },
      ],
    }),

    // Set default shift
    setDefaultShift: builder.mutation<{
      success: boolean;
      message: string;
      data: IShift;
    }, string>({
      query: (id) => ({
        url: `/v1/shifts/${id}/default`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Shift', id: 'LIST' }],
    }),

    // Get shift cost analysis
    getShiftCostAnalysis: builder.query<{
      success: boolean;
      data: {
        shiftId: string;
        shiftName: string;
        totalHours: number;
        hourlyCost: number;
        totalCost: number;
        overtimeCost: number;
        additionalCosts: number;
        costPerEmployee: number;
      };
    }, {
      shiftId: string;
      hours: number;
      employeeCount: number;
    }>({
      query: (params) => ({
        url: `/v1/shifts/${params.shiftId}/cost-analysis`,
        params: { hours: params.hours, employeeCount: params.employeeCount },
      }),
      providesTags: (result, error, { shiftId }) => [{ type: 'Shift', id: shiftId }],
    }),

    // Search shifts
    searchShifts: builder.query<{
      success: boolean;
      data: IShift[];
      total: number;
    }, {
      companyId: string;
      searchTerm: string;
      filters?: {
        shiftType?: string;
        shiftCategory?: string;
        isNightShift?: boolean;
        minHours?: number;
        maxHours?: number;
      };
    }>({
      query: (params) => ({
        url: '/v1/shifts/search',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shift' as const, id: _id })),
              { type: 'Shift', id: 'SEARCH' },
            ]
          : [{ type: 'Shift', id: 'SEARCH' }],
    }),
  }),
});

export const {
  useGetAllShiftsQuery,
  useGetShiftByIdQuery,
  useGetShiftsByTypeQuery,
  useGetShiftsByCategoryQuery,
  useGetNightShiftsQuery,
  useGetShiftsByDepartmentQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useSetDefaultShiftMutation,
  useGetShiftCostAnalysisQuery,
  useSearchShiftsQuery,
} = shiftApi;
