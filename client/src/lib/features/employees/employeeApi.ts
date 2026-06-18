import { baseApi } from '@/lib/api/baseApi';
import { IEmployee, IEmployeeFormData } from '@/types/employees';

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all employees
    getAllEmployees: builder.query<{
      success: boolean;
      data: IEmployee[];
      total: number;
    }, {
      companyId?: string;
      department?: string;
      designation?: string;
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: (params) => ({
        url: '/v1/employees',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Employee' as const, id: _id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    // Get employee by ID
    getEmployeeById: builder.query<{
      success: boolean;
      data: IEmployee;
    }, string>({
      query: (id) => `/v1/employees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),

    // Get employees by department
    getEmployeesByDepartment: builder.query<{
      success: boolean;
      data: IEmployee[];
      total: number;
    }, {
      companyId: string;
      department: string;
    }>({
      query: ({ companyId, department }) => ({
        url: `/v1/employees/department/${department}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Employee' as const, id: _id })),
              { type: 'Employee', id: 'DEPARTMENT' },
            ]
          : [{ type: 'Employee', id: 'DEPARTMENT' }],
    }),

    // Get employees by designation
    getEmployeesByDesignation: builder.query<{
      success: boolean;
      data: IEmployee[];
      total: number;
    }, {
      companyId: string;
      designation: string;
    }>({
      query: ({ companyId, designation }) => ({
        url: `/v1/employees/designation/${designation}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Employee' as const, id: _id })),
              { type: 'Employee', id: 'DESIGNATION' },
            ]
          : [{ type: 'Employee', id: 'DESIGNATION' }],
    }),

    // Get active employees
    getActiveEmployees: builder.query<{
      success: boolean;
      data: IEmployee[];
      total: number;
    }, {
      companyId: string;
    }>({
      query: ({ companyId }) => ({
        url: '/v1/employees/active',
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Employee' as const, id: _id })),
              { type: 'Employee', id: 'ACTIVE' },
            ]
          : [{ type: 'Employee', id: 'ACTIVE' }],
    }),

    // Get employees by shift
    getEmployeesByShift: builder.query<{
      success: boolean;
      data: IEmployee[];
      total: number;
    }, {
      companyId: string;
      shiftId: string;
    }>({
      query: ({ companyId, shiftId }) => ({
        url: `/v1/employees/shift/${shiftId}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Employee' as const, id: _id })),
              { type: 'Employee', id: 'SHIFT' },
            ]
          : [{ type: 'Employee', id: 'SHIFT' }],
    }),

    // Create new employee
    createEmployee: builder.mutation<{
      success: boolean;
      message: string;
      data: IEmployee;
    }, IEmployeeFormData>({
      query: (employeeData) => ({
        url: '/v1/employees',
        method: 'POST',
        body: employeeData,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    // Update employee
    updateEmployee: builder.mutation<{
      success: boolean;
      message: string;
      data: IEmployee;
    }, {
      id: string;
      data: Partial<IEmployeeFormData>;
    }>({
      query: ({ id, data }) => ({
        url: `/v1/employees/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    // Delete employee
    deleteEmployee: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/v1/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    // Update employee status
    updateEmployeeStatus: builder.mutation<{
      success: boolean;
      message: string;
      data: IEmployee;
    }, {
      id: string;
      status: 'active' | 'inactive' | 'terminated' | 'resigned' | 'retired';
      reason?: string;
      effectiveDate?: string;
    }>({
      query: ({ id, ...statusData }) => ({
        url: `/v1/employees/${id}/status`,
        method: 'PATCH',
        body: statusData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'ACTIVE' },
      ],
    }),

    // Add salary record
    addSalaryRecord: builder.mutation<{
      success: boolean;
      message: string;
      data: IEmployee;
    }, {
      id: string;
      salaryData: {
        basicSalary: number;
        hra: number;
        da: number;
        otherAllowances: number;
        pfDeduction: number;
        esiDeduction: number;
        otherDeductions: number;
        effectiveDate: string;
      };
    }>({
      query: ({ id, salaryData }) => ({
        url: `/v1/employees/${id}/salary`,
        method: 'POST',
        body: salaryData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Employee', id }],
    }),

    // Add performance record
    addPerformanceRecord: builder.mutation<{
      success: boolean;
      message: string;
      data: IEmployee;
    }, {
      id: string;
      performanceData: {
        reviewPeriod: string;
        reviewDate: string;
        performanceRating: number;
        strengths: string[];
        areasOfImprovement: string[];
        goals: string[];
        achievements: string[];
        reviewNotes?: string;
        nextReviewDate?: string;
      };
    }>({
      query: ({ id, performanceData }) => ({
        url: `/v1/employees/${id}/performance`,
        method: 'POST',
        body: performanceData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Employee', id }],
    }),

    // Search employees
    searchEmployees: builder.query<{
      success: boolean;
      data: IEmployee[];
      total: number;
    }, {
      companyId: string;
      searchTerm: string;
      filters?: {
        department?: string;
        designation?: string;
        status?: string;
        joiningDateFrom?: string;
        joiningDateTo?: string;
      };
    }>({
      query: (params) => ({
        url: '/v1/employees/search',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Employee' as const, id: _id })),
              { type: 'Employee', id: 'SEARCH' },
            ]
          : [{ type: 'Employee', id: 'SEARCH' }],
    }),
  }),
});

export const {
  useGetAllEmployeesQuery,
  useGetEmployeeByIdQuery,
  useGetEmployeesByDepartmentQuery,
  useGetEmployeesByDesignationQuery,
  useGetActiveEmployeesQuery,
  useGetEmployeesByShiftQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useUpdateEmployeeStatusMutation,
  useAddSalaryRecordMutation,
  useAddPerformanceRecordMutation,
  useSearchEmployeesQuery,
} = employeeApi;
