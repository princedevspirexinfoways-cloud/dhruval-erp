import { baseApi } from '@/lib/api/baseApi';
import { IAttendance } from '@/types/manpower';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all attendance
    getAllAttendance: builder.query<{
      success: boolean;
      data: IAttendance[];
      total: number;
    }, {
      companyId?: string;
      date?: string;
      employeeId?: string;
    }>({
      query: (params) => ({
        url: '/manpower/attendance/all',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Attendance' as const, id: _id })),
              { type: 'Attendance', id: 'LIST' },
            ]
          : [{ type: 'Attendance', id: 'LIST' }],
    }),

    // Get attendance by employee
    getAttendanceByEmployee: builder.query<{
      success: boolean;
      data: IAttendance[];
      total: number;
    }, {
      employeeId: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ employeeId, startDate, endDate }) => ({
        url: `/manpower/attendance/employee/${employeeId}`,
        params: { startDate, endDate },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Attendance' as const, id: _id })),
              { type: 'Attendance', id: 'EMPLOYEE' },
            ]
          : [{ type: 'Attendance', id: 'EMPLOYEE' }],
    }),

    // Get attendance by date
    getAttendanceByDate: builder.query<{
      success: boolean;
      data: IAttendance[];
      total: number;
    }, {
      date: string;
      companyId?: string;
    }>({
      query: ({ date, companyId }) => ({
        url: `/manpower/attendance/date/${date}`,
        params: { companyId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Attendance' as const, id: _id })),
              { type: 'Attendance', id: 'DATE' },
            ]
          : [{ type: 'Attendance', id: 'DATE' }],
    }),

    // Get attendance by date range
    getAttendanceByDateRange: builder.query<{
      success: boolean;
      data: IAttendance[];
      total: number;
    }, {
      startDate: string;
      endDate: string;
      companyId?: string;
      employeeId?: string;
    }>({
      query: (params) => ({
        url: '/manpower/attendance/range',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Attendance' as const, id: _id })),
              { type: 'Attendance', id: 'RANGE' },
            ]
          : [{ type: 'Attendance', id: 'RANGE' }],
    }),

    // Check in
    checkIn: builder.mutation<{
      success: boolean;
      message: string;
      data: IAttendance;
    }, {
      employeeId: string;
      location?: string;
      method?: string;
    }>({
      query: (data) => ({
        url: '/manpower/attendance/checkin',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Attendance', id: 'LIST' },
        { type: 'Attendance', id: 'EMPLOYEE' },
        { type: 'Attendance', id: 'DATE' },
        { type: 'Attendance', id: 'RANGE' },
      ],
    }),

    // Check out
    checkOut: builder.mutation<{
      success: boolean;
      message: string;
      data: IAttendance;
    }, {
      employeeId: string;
      location?: string;
      method?: string;
    }>({
      query: (data) => ({
        url: '/manpower/attendance/checkout',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Attendance', id: 'LIST' },
        { type: 'Attendance', id: 'EMPLOYEE' },
        { type: 'Attendance', id: 'DATE' },
        { type: 'Attendance', id: 'RANGE' },
      ],
    }),

    // Record break
    recordBreak: builder.mutation<{
      success: boolean;
      message: string;
      data: IAttendance;
    }, {
      employeeId: string;
      breakType: string;
      startTime: string;
      endTime: string;
    }>({
      query: (data) => ({
        url: '/manpower/attendance/break',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Attendance', id: 'LIST' },
        { type: 'Attendance', id: 'EMPLOYEE' },
        { type: 'Attendance', id: 'DATE' },
        { type: 'Attendance', id: 'RANGE' },
      ],
    }),

    // Update attendance
    updateAttendance: builder.mutation<{
      success: boolean;
      message: string;
      data: IAttendance;
    }, {
      id: string;
      data: Partial<IAttendance>;
    }>({
      query: ({ id, data }) => ({
        url: `/manpower/attendance/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Attendance', id },
        { type: 'Attendance', id: 'LIST' },
        { type: 'Attendance', id: 'EMPLOYEE' },
        { type: 'Attendance', id: 'DATE' },
        { type: 'Attendance', id: 'RANGE' },
      ],
    }),

    // Bulk attendance entry
    bulkAttendanceEntry: builder.mutation<{
      success: boolean;
      message: string;
      results: any[];
    }, {
      attendanceData: Partial<IAttendance>[];
    }>({
      query: (data) => ({
        url: '/manpower/attendance/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Attendance', id: 'LIST' },
        { type: 'Attendance', id: 'EMPLOYEE' },
        { type: 'Attendance', id: 'DATE' },
        { type: 'Attendance', id: 'RANGE' },
      ],
    }),

    // Get attendance summary
    getAttendanceSummary: builder.query<{
      success: boolean;
      data: any;
    }, {
      startDate: string;
      endDate: string;
      companyId?: string;
    }>({
      query: (params) => ({
        url: '/manpower/attendance/reports/summary',
        params,
      }),
      providesTags: [{ type: 'Attendance', id: 'SUMMARY' }],
    }),

    // Get overtime report
    getOvertimeReport: builder.query<{
      success: boolean;
      data: any;
    }, {
      startDate: string;
      endDate: string;
      companyId?: string;
    }>({
      query: (params) => ({
        url: '/manpower/attendance/reports/overtime',
        params,
      }),
      providesTags: [{ type: 'Attendance', id: 'OVERTIME' }],
    }),

    // Get my attendance
    getMyAttendance: builder.query<{
      success: boolean;
      data: IAttendance[];
      total: number;
    }, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/manpower/attendance/me',
        params,
      }),
      providesTags: [{ type: 'Attendance', id: 'MY_ATTENDANCE' }],
    }),
  }),
});

export const {
  useGetAllAttendanceQuery,
  useGetAttendanceByEmployeeQuery,
  useGetAttendanceByDateQuery,
  useGetAttendanceByDateRangeQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useRecordBreakMutation,
  useUpdateAttendanceMutation,
  useBulkAttendanceEntryMutation,
  useGetAttendanceSummaryQuery,
  useGetOvertimeReportQuery,
  useGetMyAttendanceQuery,
} = attendanceApi;
