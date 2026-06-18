import { baseApi } from './baseApi'

export interface Boiler {
  _id: string
  boilerName: string
  boilerCode: string
  location: string
  status: 'operational' | 'warning' | 'critical' | 'maintenance' | 'offline'
  temperature: number
  pressure: number
  fuelConsumption: number
  efficiency: number
  waterLevel: number
  steamOutput: number
  lastMaintenance: string
  nextMaintenance: string
  operatingHours: number
  alerts: number
  operator: string
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface BoilerStats {
  totalBoilers: number
  activeBoilers: number
  averageTemperature: number
  totalAlerts: number
  averageEfficiency: number
  totalFuelConsumption: number
  totalSteamOutput: number
  maintenanceDue: number
}

export interface BoilerTrends {
  temperatureData: Array<{
    time: string
    temp: number
    pressure: number
  }>
  efficiencyData: Array<{
    time: string
    efficiency: number
  }>
  fuelConsumptionData: Array<{
    time: string
    consumption: number
  }>
}

export const boilerApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all boilers
    getBoilers: builder.query<
      {
        success: boolean
        data: Boiler[]
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
        location?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/boilers',
        method: 'GET',
        params,
      }),
      providesTags: ['Boiler'],
    }),

    // Get boiler statistics
    getBoilerStats: builder.query<
      { success: boolean; data: BoilerStats },
      { companyId?: string; timeRange?: string }
    >({
      query: (params = {}) => ({
        url: '/boilers/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Boiler'],
    }),

    // Get boiler trends data
    getBoilerTrends: builder.query<
      { success: boolean; data: BoilerTrends },
      { timeRange?: string; boilerId?: string; companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/boilers/trends',
        method: 'GET',
        params,
      }),
      providesTags: ['Boiler'],
    }),

    // Get boiler by ID
    getBoilerById: builder.query<
      { success: boolean; data: Boiler },
      string
    >({
      query: (boilerId) => ({
        url: `/boilers/${boilerId}`,
        method: 'GET',
      }),
      providesTags: ['Boiler'],
    }),

    // Create new boiler
    createBoiler: builder.mutation<
      { success: boolean; data: Boiler; message: string },
      Partial<Boiler>
    >({
      query: (boilerData) => ({
        url: '/boilers',
        method: 'POST',
        body: boilerData,
      }),
      invalidatesTags: ['Boiler'],
    }),

    // Update boiler
    updateBoiler: builder.mutation<
      { success: boolean; data: Boiler; message: string },
      { boilerId: string; boilerData: Partial<Boiler> }
    >({
      query: ({ boilerId, boilerData }) => ({
        url: `/boilers/${boilerId}`,
        method: 'PUT',
        body: boilerData,
      }),
      invalidatesTags: ['Boiler'],
    }),

    // Update boiler readings
    updateBoilerReadings: builder.mutation<
      { success: boolean; data: Boiler; message: string },
      {
        boilerId: string
        readings: {
          temperature?: number
          pressure?: number
          fuelConsumption?: number
          efficiency?: number
          waterLevel?: number
          steamOutput?: number
        }
      }
    >({
      query: ({ boilerId, readings }) => ({
        url: `/boilers/${boilerId}/readings`,
        method: 'POST',
        body: readings,
      }),
      invalidatesTags: ['Boiler'],
    }),

    // Get boiler alerts
    getBoilerAlerts: builder.query<
      {
        success: boolean
        data: Array<{
          _id: string
          boilerId: string
          boilerName: string
          alertType: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          message: string
          timestamp: string
          acknowledged: boolean
        }>
      },
      { boilerId?: string; severity?: string; acknowledged?: boolean }
    >({
      query: (params = {}) => ({
        url: '/boilers/alerts',
        method: 'GET',
        params,
      }),
      providesTags: ['Boiler'],
    }),
  }),
})

export const {
  useGetBoilersQuery,
  useGetBoilerStatsQuery,
  useGetBoilerTrendsQuery,
  useGetBoilerByIdQuery,
  useCreateBoilerMutation,
  useUpdateBoilerMutation,
  useUpdateBoilerReadingsMutation,
  useGetBoilerAlertsQuery,
} = boilerApi
