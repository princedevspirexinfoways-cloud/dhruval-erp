import { baseApi } from './baseApi'

export interface Visitor {
  _id: string
  visitorName: string
  company?: string
  phone: string
  email?: string
  purpose: string
  hostEmployee: string
  department: string
  checkInTime: string
  checkOutTime?: string
  expectedDuration: number
  status: 'checked_in' | 'checked_out' | 'overstayed' | 'pending'
  visitorType: 'business' | 'contractor' | 'official' | 'personal'
  idProof: string
  vehicleNumber?: string
  location: string
  securityNotes?: string
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface VisitorStats {
  totalVisitors: number
  todayVisitors: number
  currentlyInside: number
  checkedOut: number
  overstayed: number
  pendingApprovals: number
  visitorsGrowth: number
  todayGrowth: number
  visitorsByType: {
    [type: string]: number
  }
  visitorsByStatus: {
    [status: string]: number
  }
  averageVisitDuration: number
  peakHours: Array<{
    hour: number
    count: number
  }>
  departmentVisits: Array<{
    department: string
    count: number
  }>
}

export interface CreateVisitorRequest {
  visitorName: string
  company?: string
  phone: string
  email?: string
  purpose: string
  hostEmployee: string
  department: string
  expectedDuration: number
  visitorType: 'business' | 'contractor' | 'official' | 'personal'
  idProof: string
  vehicleNumber?: string
  location: string
  securityNotes?: string
}

export const visitorsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all visitors with filtering and pagination
    getVisitors: builder.query<
      {
        success: boolean
        data: Visitor[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        page?: number
        limit?: number
        search?: string
        status?: string
        type?: string
        department?: string
        startDate?: string
        endDate?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/visitors',
        method: 'GET',
        params,
      }),
      providesTags: ['Visitor'],
    }),

    // Get visitor statistics
    getVisitorStats: builder.query<
      { success: boolean; data: VisitorStats },
      { companyId?: string; startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({
        url: '/visitors/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Visitor'],
    }),

    // Get visitor by ID
    getVisitorById: builder.query<
      { success: boolean; data: Visitor },
      string
    >({
      query: (visitorId) => ({
        url: `/visitors/${visitorId}`,
        method: 'GET',
      }),
      providesTags: ['Visitor'],
    }),

    // Create new visitor
    createVisitor: builder.mutation<
      { success: boolean; data: Visitor; message: string },
      CreateVisitorRequest
    >({
      query: (visitorData) => ({
        url: '/visitors',
        method: 'POST',
        body: visitorData,
      }),
      invalidatesTags: ['Visitor'],
    }),

    // Update visitor
    updateVisitor: builder.mutation<
      { success: boolean; data: Visitor; message: string },
      { visitorId: string; visitorData: Partial<CreateVisitorRequest> }
    >({
      query: ({ visitorId, visitorData }) => ({
        url: `/visitors/${visitorId}`,
        method: 'PUT',
        body: visitorData,
      }),
      invalidatesTags: ['Visitor'],
    }),

    // Check in visitor
    checkInVisitor: builder.mutation<
      { success: boolean; data: Visitor; message: string },
      { visitorId: string; location?: string; notes?: string }
    >({
      query: ({ visitorId, location, notes }) => ({
        url: `/visitors/${visitorId}/checkin`,
        method: 'POST',
        body: { location, notes },
      }),
      invalidatesTags: ['Visitor'],
    }),

    // Check out visitor
    checkOutVisitor: builder.mutation<
      { success: boolean; data: Visitor; message: string },
      { visitorId: string; notes?: string }
    >({
      query: ({ visitorId, notes }) => ({
        url: `/visitors/${visitorId}/checkout`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Visitor'],
    }),

    // Get visitors by status
    getVisitorsByStatus: builder.query<
      {
        success: boolean
        data: Visitor[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        status: string
        page?: number
        limit?: number
      }
    >({
      query: ({ status, ...params }) => ({
        url: `/visitors/status/${status}`,
        method: 'GET',
        params,
      }),
      providesTags: ['Visitor'],
    }),

    // Get visitors by department
    getVisitorsByDepartment: builder.query<
      {
        success: boolean
        data: Visitor[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        department: string
        page?: number
        limit?: number
        startDate?: string
        endDate?: string
      }
    >({
      query: ({ department, ...params }) => ({
        url: `/visitors/department/${department}`,
        method: 'GET',
        params,
      }),
      providesTags: ['Visitor'],
    }),

    // Delete visitor
    deleteVisitor: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (visitorId) => ({
        url: `/visitors/${visitorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Visitor'],
    }),

    // Get visitor activity report
    getVisitorActivityReport: builder.query<
      {
        success: boolean
        data: {
          summary: {
            totalVisitors: number
            averageDuration: number
            peakDay: string
            mostVisitedDepartment: string
          }
          dailyActivity: Array<{
            date: string
            visitors: number
            checkIns: number
            checkOuts: number
          }>
          departmentActivity: Array<{
            department: string
            visitors: number
            averageDuration: number
          }>
        }
      },
      { startDate: string; endDate: string; companyId?: string }
    >({
      query: (params) => ({
        url: '/visitors/activity-report',
        method: 'GET',
        params,
      }),
      providesTags: ['Visitor'],
    }),
  }),
})

export const {
  useGetVisitorsQuery,
  useGetVisitorStatsQuery,
  useGetVisitorByIdQuery,
  useCreateVisitorMutation,
  useUpdateVisitorMutation,
  useDeleteVisitorMutation,
  useCheckInVisitorMutation,
  useCheckOutVisitorMutation,
  useGetVisitorsByStatusQuery,
  useGetVisitorsByDepartmentQuery,
  useGetVisitorActivityReportQuery,
} = visitorsApi
