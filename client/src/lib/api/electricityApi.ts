import { baseApi } from './baseApi'

export interface ElectricalPanel {
  _id: string
  panelName: string
  panelCode: string
  location: string
  status: 'operational' | 'warning' | 'critical' | 'maintenance' | 'offline'
  voltage: number
  current: number
  power: number
  frequency: number
  powerFactor: number
  load: number
  temperature: number
  lastMaintenance: string
  nextMaintenance: string
  operatingHours: number
  alerts: number
  technician: string
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface ElectricityStats {
  totalPanels: number
  activePanels: number
  totalPower: number
  averageVoltage: number
  totalAlerts: number
  averageLoad: number
  totalEnergyConsumption: number
  peakDemand: number
}

export interface ElectricityTrends {
  powerConsumptionData: Array<{
    time: string
    consumption: number
    demand: number
  }>
  voltageData: Array<{
    time: string
    voltage: number
    current: number
  }>
  loadDistributionData: Array<{
    panel: string
    load: number
  }>
}

export const electricityApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all electrical panels
    getElectricalPanels: builder.query<
      {
        success: boolean
        data: ElectricalPanel[]
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
        url: '/electrical-panels',
        method: 'GET',
        params,
      }),
      providesTags: ['ElectricalPanel'],
    }),

    // Get electricity statistics
    getElectricityStats: builder.query<
      { success: boolean; data: ElectricityStats },
      { companyId?: string; timeRange?: string }
    >({
      query: (params = {}) => ({
        url: '/electrical-panels/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['ElectricalPanel'],
    }),

    // Get electricity trends data
    getElectricityTrends: builder.query<
      { success: boolean; data: ElectricityTrends },
      { timeRange?: string; panelId?: string; companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/electrical-panels/trends',
        method: 'GET',
        params,
      }),
      providesTags: ['ElectricalPanel'],
    }),

    // Get electrical panel by ID
    getElectricalPanelById: builder.query<
      { success: boolean; data: ElectricalPanel },
      string
    >({
      query: (panelId) => ({
        url: `/electrical-panels/${panelId}`,
        method: 'GET',
      }),
      providesTags: ['ElectricalPanel'],
    }),

    // Create new electrical panel
    createElectricalPanel: builder.mutation<
      { success: boolean; data: ElectricalPanel; message: string },
      Partial<ElectricalPanel>
    >({
      query: (panelData) => ({
        url: '/electrical-panels',
        method: 'POST',
        body: panelData,
      }),
      invalidatesTags: ['ElectricalPanel'],
    }),

    // Update electrical panel
    updateElectricalPanel: builder.mutation<
      { success: boolean; data: ElectricalPanel; message: string },
      { panelId: string; panelData: Partial<ElectricalPanel> }
    >({
      query: ({ panelId, panelData }) => ({
        url: `/electrical-panels/${panelId}`,
        method: 'PUT',
        body: panelData,
      }),
      invalidatesTags: ['ElectricalPanel'],
    }),

    // Update electrical readings
    updateElectricalReadings: builder.mutation<
      { success: boolean; data: ElectricalPanel; message: string },
      {
        panelId: string
        readings: {
          voltage?: number
          current?: number
          power?: number
          frequency?: number
          powerFactor?: number
          load?: number
          temperature?: number
        }
      }
    >({
      query: ({ panelId, readings }) => ({
        url: `/electrical-panels/${panelId}/readings`,
        method: 'POST',
        body: readings,
      }),
      invalidatesTags: ['ElectricalPanel'],
    }),

    // Get electrical alerts
    getElectricalAlerts: builder.query<
      {
        success: boolean
        data: Array<{
          _id: string
          panelId: string
          panelName: string
          alertType: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          message: string
          timestamp: string
          acknowledged: boolean
        }>
      },
      { panelId?: string; severity?: string; acknowledged?: boolean }
    >({
      query: (params = {}) => ({
        url: '/electrical-panels/alerts',
        method: 'GET',
        params,
      }),
      providesTags: ['ElectricalPanel'],
    }),

    // Get energy consumption report
    getEnergyConsumptionReport: builder.query<
      {
        success: boolean
        data: {
          totalConsumption: number
          peakDemand: number
          averageLoad: number
          costAnalysis: {
            totalCost: number
            peakHourCost: number
            offPeakCost: number
          }
          hourlyData: Array<{
            hour: string
            consumption: number
            demand: number
            cost: number
          }>
        }
      },
      { startDate: string; endDate: string; companyId?: string }
    >({
      query: (params) => ({
        url: '/electrical-panels/energy-report',
        method: 'GET',
        params,
      }),
      providesTags: ['ElectricalPanel'],
    }),
  }),
})

export const {
  useGetElectricalPanelsQuery,
  useGetElectricityStatsQuery,
  useGetElectricityTrendsQuery,
  useGetElectricalPanelByIdQuery,
  useCreateElectricalPanelMutation,
  useUpdateElectricalPanelMutation,
  useUpdateElectricalReadingsMutation,
  useGetElectricalAlertsQuery,
  useGetEnergyConsumptionReportQuery,
} = electricityApi
