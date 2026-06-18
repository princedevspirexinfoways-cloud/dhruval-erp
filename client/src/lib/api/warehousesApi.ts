import { baseApi } from './baseApi'

// Warehouse Types based on server model
export interface Warehouse {
  _id: string
  companyId: string
  
  // Warehouse Identification
  warehouseCode: string
  warehouseName: string
  displayName?: string
  description?: string
  
  // Location Information
  address: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
    landmark?: string
    gpsCoordinates?: {
      latitude: number
      longitude: number
    }
  }
  
  // Contact Information
  contactInfo: {
    primaryPhone: string
    alternatePhone?: string
    email?: string
    fax?: string
  }
  
  // Warehouse Details
  warehouseType: 'distribution' | 'manufacturing' | 'retail' | 'cold_storage' | 'hazardous' | 'bonded' | 'transit' | 'cross_dock'
  ownershipType: 'owned' | 'leased' | 'rented' | 'shared'
  operationType: 'automated' | 'semi_automated' | 'manual'
  
  // Physical Specifications
  specifications: {
    totalArea: number
    storageArea: number
    officeArea?: number
    yardArea?: number
    height: number
    dockDoors?: number
    floors?: number
    constructionType?: string
    roofType?: string
    floorType?: string
  }
  
  // Capacity Information
  capacity: {
    maxWeight: number
    maxVolume: number
    maxPallets?: number
    maxSKUs?: number
  }
  
  // Current Utilization
  currentUtilization: {
    currentWeight: number
    currentVolume: number
    currentPallets: number
    currentSKUs: number
    utilizationPercentage: number
    lastUpdated: string
  }
  
  // Management Information
  management: {
    warehouseManagerId?: string
    warehouseManagerName?: string
    assistantManagerId?: string
    assistantManagerName?: string
    supervisorIds?: string[]
    totalStaff: number
    workingShifts?: {
      shift1?: {
        startTime: string
        endTime: string
        staffCount: number
      }
      shift2?: {
        startTime: string
        endTime: string
        staffCount: number
      }
      shift3?: {
        startTime: string
        endTime: string
        staffCount: number
      }
    }
  }
  
  // Status and Metadata
  status: 'active' | 'inactive' | 'maintenance' | 'closed'
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface WarehouseZone {
  zoneCode: string
  zoneName: string
  zoneType: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'staging' | 'quarantine' | 'returns'
  description?: string
  area: number
  managerId?: string
  managerName?: string
  totalLocations: number
  occupiedLocations: number
  utilizationPercentage: number
  isActive: boolean
}

export interface WarehouseLocation {
  locationCode: string
  locationName: string
  locationType: 'rack' | 'bin' | 'shelf' | 'floor' | 'yard' | 'dock' | 'staging'
  coordinates: {
    x: number
    y: number
    z: number
  }
  dimensions: {
    length: number
    width: number
    height: number
  }
  capacity: {
    maxWeight: number
    maxVolume: number
    maxItems: number
  }
  currentUtilization: {
    currentWeight: number
    currentVolume: number
    currentItems: number
  }
  isActive: boolean
}

// API Request Types
export interface CreateWarehouseRequest {
  warehouseCode: string
  warehouseName: string
  displayName?: string
  description?: string
  address: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
    landmark?: string
    gpsCoordinates?: {
      latitude: number
      longitude: number
    }
  }
  contactInfo: {
    primaryPhone: string
    alternatePhone?: string
    email?: string
    fax?: string
  }
  warehouseType: 'distribution' | 'manufacturing' | 'retail' | 'cold_storage' | 'hazardous' | 'bonded' | 'transit' | 'cross_dock'
  ownershipType: 'owned' | 'leased' | 'rented' | 'shared'
  operationType?: 'automated' | 'semi_automated' | 'manual'
  specifications: {
    totalArea: number
    storageArea: number
    officeArea?: number
    yardArea?: number
    height: number
    dockDoors?: number
    floors?: number
    constructionType?: string
    roofType?: string
    floorType?: string
  }
  capacity: {
    maxWeight: number
    maxVolume: number
    maxPallets?: number
    maxSKUs?: number
  }
  management?: {
    warehouseManagerId?: string
    warehouseManagerName?: string
    assistantManagerId?: string
    assistantManagerName?: string
    supervisorIds?: string[]
    totalStaff?: number
  }
}

export interface UpdateWarehouseRequest extends Partial<CreateWarehouseRequest> {
  status?: 'active' | 'inactive' | 'maintenance' | 'closed'
}

export interface WarehouseFilters {
  page?: number
  limit?: number
  search?: string
  warehouseType?: string
  status?: string
  ownershipType?: string
  operationType?: string
  companyId?: string
}

export interface WarehouseStats {
  totalWarehouses: number
  activeWarehouses: number
  inactiveWarehouses: number
  maintenanceWarehouses: number
  closedWarehouses: number
  
  // Capacity Stats
  totalCapacity: {
    weight: number
    volume: number
    area: number
  }
  averageUtilization: number
  
  // Type Distribution
  warehousesByType: Record<string, number>
  warehousesByStatus: Record<string, number>
  warehousesByOwnership: Record<string, number>
  
  // Top Warehouses
  topWarehouses: Array<{
    _id: string
    warehouseName: string
    utilizationPercentage: number
    currentWeight: number
    maxWeight: number
  }>
}

export interface WarehouseResponse {
  success: boolean
  data: Warehouse
  message: string
}

export interface WarehousesResponse {
  success: boolean
  data: Warehouse[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  message: string
}

export interface WarehouseStatsResponse {
  success: boolean
  data: WarehouseStats
  message: string
}

// RTK Query API
export const warehousesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all warehouses with filtering and pagination
    getWarehouses: builder.query<WarehousesResponse, WarehouseFilters>({
      query: (filters) => ({
        url: '/warehouses',
        method: 'GET',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Warehouse' as const, id: _id })),
              { type: 'Warehouse', id: 'LIST' },
            ]
          : [{ type: 'Warehouse', id: 'LIST' }],
    }),

    // Get warehouse statistics
    getWarehouseStats: builder.query<WarehouseStatsResponse, void>({
      query: () => ({
        url: '/warehouses/stats',
        method: 'GET',
      }),
      providesTags: ['WarehouseStats'],
    }),

    // Get warehouse by ID
    getWarehouseById: builder.query<WarehouseResponse, string>({
      query: (warehouseId) => ({
        url: `/warehouses/${warehouseId}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Warehouse', id }],
    }),

    // Get warehouse by code
    getWarehouseByCode: builder.query<WarehouseResponse, string>({
      query: (warehouseCode) => ({
        url: `/warehouses/code/${warehouseCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, code) => [{ type: 'Warehouse', id: code }],
    }),

    // Search warehouses
    searchWarehouses: builder.query<WarehousesResponse, { search: string; filters?: WarehouseFilters }>({
      query: ({ search, filters }) => ({
        url: '/warehouses/search',
        method: 'GET',
        params: { search, ...filters },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Warehouse' as const, id: _id })),
              { type: 'Warehouse', id: 'LIST' },
            ]
          : [{ type: 'Warehouse', id: 'LIST' }],
    }),

    // Create new warehouse
    createWarehouse: builder.mutation<WarehouseResponse, CreateWarehouseRequest>({
      query: (warehouseData) => ({
        url: '/warehouses',
        method: 'POST',
        body: warehouseData,
      }),
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }, 'WarehouseStats'],
    }),

    // Update warehouse
    updateWarehouse: builder.mutation<WarehouseResponse, { warehouseId: string; warehouseData: UpdateWarehouseRequest }>({
      query: ({ warehouseId, warehouseData }) => ({
        url: `/warehouses/${warehouseId}`,
        method: 'PUT',
        body: warehouseData,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: 'Warehouse', id: warehouseId },
        { type: 'Warehouse', id: 'LIST' },
        'WarehouseStats',
      ],
    }),

    // Delete warehouse
    deleteWarehouse: builder.mutation<{ success: boolean; message: string }, string>({
      query: (warehouseId) => ({
        url: `/warehouses/${warehouseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }, 'WarehouseStats'],
    }),

    // Update warehouse capacity
    updateWarehouseCapacity: builder.mutation<WarehouseResponse, { warehouseId: string; capacity: Partial<Warehouse['capacity']> }>({
      query: ({ warehouseId, capacity }) => ({
        url: `/warehouses/${warehouseId}/capacity`,
        method: 'PUT',
        body: capacity,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: 'Warehouse', id: warehouseId },
        { type: 'Warehouse', id: 'LIST' },
        'WarehouseStats',
      ],
    }),

    // Get warehouse utilization
    getWarehouseUtilization: builder.query<{ success: boolean; data: any }, string>({
      query: (warehouseId) => ({
        url: `/warehouses/${warehouseId}/utilization`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Warehouse', id }],
    }),

    // Add storage zone
    addStorageZone: builder.mutation<WarehouseResponse, { warehouseId: string; zone: Partial<WarehouseZone> }>({
      query: ({ warehouseId, zone }) => ({
        url: `/warehouses/${warehouseId}/zones`,
        method: 'POST',
        body: zone,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: 'Warehouse', id: warehouseId },
        { type: 'Warehouse', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetWarehousesQuery,
  useGetWarehouseStatsQuery,
  useGetWarehouseByIdQuery,
  useGetWarehouseByCodeQuery,
  useSearchWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useUpdateWarehouseCapacityMutation,
  useGetWarehouseUtilizationQuery,
  useAddStorageZoneMutation,
} = warehousesApi
