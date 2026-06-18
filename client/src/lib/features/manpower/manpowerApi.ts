import { baseApi } from '@/lib/api/baseApi';
import { IManpower, IAttendance } from '../../../types/manpower';

export const manpowerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all manpower with pagination and filters
    getManpower: builder.query<{
      success: boolean;
      data: IManpower[];
      total: number;
      page: number;
      limit: number;
    }, {
      page?: number;
      limit?: number;
      search?: string;
      department?: string;
      status?: string;
      companyId?: string;
    }>({
      query: (params) => ({
        url: '/manpower',
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search,
          department: params.department,
          status: params.status,
          companyId: params.companyId,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Manpower' as const, id: _id })),
              { type: 'Manpower', id: 'LIST' },
            ]
          : [{ type: 'Manpower', id: 'LIST' }],
    }),

    // Get manpower by ID
    getManpowerById: builder.query<{
      success: boolean;
      data: IManpower;
    }, string>({
      query: (id) => `/manpower/${id}`,
      providesTags: (result, error, id) => [{ type: 'Manpower', id }],
    }),

    // Get manpower by company
    getManpowerByCompany: builder.query<{
      success: boolean;
      data: IManpower[];
      total: number;
    }, string>({
      query: (companyId) => `/manpower/company/${companyId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Manpower' as const, id: _id })),
              { type: 'Manpower', id: 'COMPANY' },
            ]
          : [{ type: 'Manpower', id: 'COMPANY' }],
    }),

    // Get manpower by department
    getManpowerByDepartment: builder.query<{
      success: boolean;
      data: IManpower[];
      total: number;
    }, {
      department: string;
      companyId?: string;
    }>({
      query: ({ department, companyId }) => ({
        url: `/manpower/department/${department}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Manpower' as const, id: _id })),
              { type: 'Manpower', id: 'DEPARTMENT' },
            ]
          : [{ type: 'Manpower', id: 'DEPARTMENT' }],
    }),

    // Get manpower by status
    getManpowerByStatus: builder.query<{
      success: boolean;
      data: IManpower[];
      total: number;
    }, {
      status: string;
      companyId?: string;
    }>({
      query: ({ status, companyId }) => ({
        url: `/manpower/status/${status}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Manpower' as const, id: _id })),
              { type: 'Manpower', id: 'STATUS' },
            ]
          : [{ type: 'Manpower', id: 'STATUS' }],
    }),

    // Create new manpower
    createManpower: builder.mutation<{
      success: boolean;
      message: string;
      data: IManpower;
    }, Partial<IManpower>>({
      query: (manpower) => ({
        url: '/manpower',
        method: 'POST',
        body: manpower,
      }),
      invalidatesTags: [
        { type: 'Manpower', id: 'LIST' },
        { type: 'Manpower', id: 'COMPANY' },
        { type: 'Manpower', id: 'DEPARTMENT' },
        { type: 'Manpower', id: 'STATUS' },
      ],
    }),

    // Update manpower
    updateManpower: builder.mutation<{
      success: boolean;
      message: string;
      data: IManpower;
    }, {
      id: string;
      data: Partial<IManpower>;
    }>({
      query: ({ id, data }) => ({
        url: `/manpower/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Manpower', id },
        { type: 'Manpower', id: 'LIST' },
        { type: 'Manpower', id: 'COMPANY' },
        { type: 'Manpower', id: 'DEPARTMENT' },
        { type: 'Manpower', id: 'STATUS' },
      ],
    }),

    // Delete manpower
    deleteManpower: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/manpower/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Manpower', id: 'LIST' },
        { type: 'Manpower', id: 'COMPANY' },
        { type: 'Manpower', id: 'DEPARTMENT' },
        { type: 'Manpower', id: 'STATUS' },
      ],
    }),

    // Get my profile
    getMyProfile: builder.query<{
      success: boolean;
      data: any;
    }, void>({
      query: () => '/manpower/profile/me',
      providesTags: [{ type: 'Manpower', id: 'PROFILE' }],
    }),

    // Update my profile
    updateMyProfile: builder.mutation<{
      success: boolean;
      message: string;
    }, Partial<any>>({
      query: (data) => ({
        url: '/manpower/profile/me',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [{ type: 'Manpower', id: 'PROFILE' }],
    }),
  }),
});

export const {
  useGetManpowerQuery,
  useGetManpowerByIdQuery,
  useGetManpowerByCompanyQuery,
  useGetManpowerByDepartmentQuery,
  useGetManpowerByStatusQuery,
  useCreateManpowerMutation,
  useUpdateManpowerMutation,
  useDeleteManpowerMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} = manpowerApi;
