import { baseApi } from './baseApi'

export interface HospitalityService {
  _id: string
  serviceName: string
  serviceType: 'accommodation' | 'dining' | 'meeting' | 'transport' | 'recreation'
  location: string
  capacity: number
  currentOccupancy: number
  status: 'active' | 'available' | 'occupied' | 'maintenance'
  rating: number
  amenities: string[]
  manager: string
  phone: string
  email: string
  bookings: number
  revenue: number
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface HospitalityStats {
  totalServices: number
  totalBookings: number
  totalRevenue: number
  averageRating: number
  occupancyRate: number
  revenueGrowth: number
  customerSatisfaction: number
  servicesByType: {
    [type: string]: number
  }
}

export interface HospitalityTrends {
  occupancyData: Array<{
    time: string
    accommodation: number
    dining: number
    meeting: number
    transport: number
  }>
  revenueData: Array<{
    month: string
    revenue: number
    bookings: number
  }>
}

export const hospitalityApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all hospitality services
    getHospitalityServices: builder.query<
      {
        success: boolean
        data: HospitalityService[]
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
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/hospitality/services',
        method: 'GET',
        params,
      }),
      providesTags: ['HospitalityService'],
    }),

    // Get hospitality statistics
    getHospitalityStats: builder.query<
      { success: boolean; data: HospitalityStats },
      { companyId?: string; timeRange?: string }
    >({
      query: (params = {}) => ({
        url: '/hospitality/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['HospitalityService'],
    }),

    // Get hospitality trends
    getHospitalityTrends: builder.query<
      { success: boolean; data: HospitalityTrends },
      { timeRange?: string; serviceType?: string; companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/hospitality/trends',
        method: 'GET',
        params,
      }),
      providesTags: ['HospitalityService'],
    }),

    // Get hospitality service by ID
    getHospitalityServiceById: builder.query<
      { success: boolean; data: HospitalityService },
      string
    >({
      query: (serviceId) => ({
        url: `/hospitality/services/${serviceId}`,
        method: 'GET',
      }),
      providesTags: ['HospitalityService'],
    }),

    // Create new hospitality service
    createHospitalityService: builder.mutation<
      { success: boolean; data: HospitalityService; message: string },
      Partial<HospitalityService>
    >({
      query: (serviceData) => ({
        url: '/hospitality/services',
        method: 'POST',
        body: serviceData,
      }),
      invalidatesTags: ['HospitalityService'],
    }),

    // Update hospitality service
    updateHospitalityService: builder.mutation<
      { success: boolean; data: HospitalityService; message: string },
      { serviceId: string; serviceData: Partial<HospitalityService> }
    >({
      query: ({ serviceId, serviceData }) => ({
        url: `/hospitality/services/${serviceId}`,
        method: 'PUT',
        body: serviceData,
      }),
      invalidatesTags: ['HospitalityService'],
    }),

    // Create booking
    createBooking: builder.mutation<
      { success: boolean; data: any; message: string },
      {
        serviceId: string
        guestName: string
        guestEmail: string
        guestPhone: string
        checkIn: string
        checkOut: string
        guests: number
        specialRequests?: string
      }
    >({
      query: (bookingData) => ({
        url: '/hospitality/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['HospitalityService'],
    }),

    // Get bookings
    getBookings: builder.query<
      {
        success: boolean
        data: Array<{
          _id: string
          serviceId: string
          serviceName: string
          guestName: string
          guestEmail: string
          guestPhone: string
          checkIn: string
          checkOut: string
          guests: number
          status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
          totalAmount: number
          specialRequests?: string
        }>
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
        serviceId?: string
        status?: string
        startDate?: string
        endDate?: string
      }
    >({
      query: (params = {}) => ({
        url: '/hospitality/bookings',
        method: 'GET',
        params,
      }),
      providesTags: ['HospitalityService'],
    }),

    // Update service occupancy
    updateServiceOccupancy: builder.mutation<
      { success: boolean; data: HospitalityService; message: string },
      { serviceId: string; occupancy: number }
    >({
      query: ({ serviceId, occupancy }) => ({
        url: `/hospitality/services/${serviceId}/occupancy`,
        method: 'PUT',
        body: { occupancy },
      }),
      invalidatesTags: ['HospitalityService'],
    }),

    // Get service reviews
    getServiceReviews: builder.query<
      {
        success: boolean
        data: Array<{
          _id: string
          serviceId: string
          guestName: string
          rating: number
          review: string
          timestamp: string
        }>
      },
      { serviceId: string }
    >({
      query: ({ serviceId }) => ({
        url: `/hospitality/services/${serviceId}/reviews`,
        method: 'GET',
      }),
      providesTags: ['HospitalityService'],
    }),
  }),
})

export const {
  useGetHospitalityServicesQuery,
  useGetHospitalityStatsQuery,
  useGetHospitalityTrendsQuery,
  useGetHospitalityServiceByIdQuery,
  useCreateHospitalityServiceMutation,
  useUpdateHospitalityServiceMutation,
  useCreateBookingMutation,
  useGetBookingsQuery,
  useUpdateServiceOccupancyMutation,
  useGetServiceReviewsQuery,
} = hospitalityApi
