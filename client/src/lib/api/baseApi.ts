import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  credentials: 'include', // This ensures cookies are sent with requests
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState
    let token = null
    const currentCompanyId = state.auth.currentCompanyId
    const user = state.auth.user

    // First try to get token from localStorage (client-side storage)
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token')
    }

    // Fallback to Redux state if localStorage doesn't have token
    if (!token) {
      token = state.auth.token
    }

    // If we have a token, set it in Authorization header
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
      console.log('baseApi: Token found and set in headers:', token.substring(0, 20) + '...')
    } else {
      console.log('baseApi: No token found - relying on HTTP-only cookies for authentication')
      // Don't set Authorization header - let the server use HTTP-only cookies
    }

    // Add company ID header - super admin can switch companies, others use their company
    let companyId = null

    if (currentCompanyId) {
      companyId = currentCompanyId
    } else if (user?.companyAccess?.[0]?.companyId) {
      companyId = user.companyAccess[0].companyId
    } else if ((user as any)?.currentCompanyId) {
      companyId = (user as any).currentCompanyId
    } else if ((user as any)?.companyId) {
      companyId = (user as any).companyId
    } else if (state.auth.companies?.[0]?._id) {
      // Fall back to the first available company for any authenticated user
      companyId = state.auth.companies[0]._id
    } else if (user?.isSuperAdmin) {
      // For super admin, try to recover a company ID from the URL
      const urlCompanyId = window?.location?.pathname?.match(/\/companies\/([^\/]+)/)?.[1]
      if (urlCompanyId) {
        companyId = urlCompanyId
      }
    }

    // Last-resort fallback to persisted company id from localStorage
    if (!companyId && typeof window !== 'undefined') {
      companyId = localStorage.getItem('currentCompanyId')
    }

    if (companyId) {
      headers.set('X-Company-ID', companyId)
      console.log('baseApi: Company ID set in headers:', companyId)
    } else {
      console.log('baseApi: No company ID found - this might cause 401 errors')
    }

    // Log all headers for debugging
    console.log('baseApi: Request headers:', {
      authorization: !!headers.get('authorization'),
      'x-company-id': headers.get('x-company-id'),
      'content-type': headers.get('content-type'),
      credentials: 'include'
    })

    // Log cookies for debugging (if available)
    if (typeof document !== 'undefined') {
      console.log('baseApi: Available cookies:', document.cookie);
    }

    headers.set('Content-Type', 'application/json')
    return headers
  },
})

// Create a separate base query for refresh endpoint that doesn't send Authorization header
const baseQueryWithoutAuth = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  credentials: 'include', // Still include cookies for refresh token
  prepareHeaders: (headers) => {
    // For refresh endpoint, do NOT send Authorization header or company ID, rely only on HTTP-only cookie
    headers.set('Content-Type', 'application/json')

    // No additional headers - just rely on the refresh token cookie
    return headers
  },
})

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    console.log('baseApi: 401 error detected, attempting token refresh...')

    try {
      // Try to get a new token using baseQueryWithoutAuth (no Authorization header)
      const refreshResult = await baseQueryWithoutAuth({
        url: '/auth/refresh-token',
        method: 'POST'
      }, api, extraOptions)

      if (refreshResult?.data) {
        console.log('baseApi: Token refresh successful, retrying original request...')

        // Extract the new access token from the response
        const newAccessToken = (refreshResult.data as any)?.accessToken

        if (newAccessToken) {
          // Store the new token in localStorage and Redux state
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', newAccessToken)
            console.log('baseApi: New token stored in localStorage')
          }

          // Update Redux state with new token
          api.dispatch({
            type: 'auth/setCredentials',
            payload: {
              user: api.getState().auth.user,
              token: newAccessToken,
              companies: api.getState().auth.companies,
              permissions: api.getState().auth.permissions
            }
          })

          // Retry the original query with new token
          result = await baseQuery(args, api, extraOptions)
        } else {
          console.log('baseApi: No access token in refresh response')
          api.dispatch({ type: 'auth/logout' })
        }
      } else {
        console.log('baseApi: Token refresh failed, logging out user...')
        console.log('baseApi: Refresh result details:', {
          data: refreshResult?.data,
          error: refreshResult?.error,
          status: refreshResult?.error?.status,
          message: (refreshResult?.error?.data as any)?.message || 'No error message'
        })
        // Refresh failed, logout user
        api.dispatch({ type: 'auth/logout' })
      }
    } catch (error) {
      console.error('baseApi: Error during token refresh:', error)
      // Refresh failed, logout user
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    // Core Business Models
    'Company',
    'User',
    'Role',
    'Customer',
    'Supplier',
    'Agent',
    'InventoryItem',
    'StockMovement',
    'Scrap',
    'GoodsReturn',
    'Warehouse',
    'WarehouseStats',
    'Batch',
    'ProductionOrder',
    'JobWork',
    'JobWorker',
    'JobWorkerAssignment',
    'CustomerOrder',
    'PurchaseOrder',
    'PurchaseReport',
    'Order',
    'OrderStats',
    'Vehicle',
    'VehicleStats',
    'GatePass',
    'GatePassStats',
    'Invoice',
    'Quotation',
    'FinancialTransaction',

    // Security & Management Models
    'SuperAdmin',
    'Visitor',
    'Vehicle',
    'SecurityLog',
    'AuditLog',

    // Advanced Operational Models
    'BusinessAnalytics',
    'Analytics',
    'BoilerMonitoring',
    'Boiler',
    'ElectricityMonitoring',
    'ElectricalPanel',
    'Hospitality',
    'HospitalityService',
    'CustomerVisit',
    'HospitalityStats',
    'Dispatch',
    'Report',
    'Spare',

    // Human Resources Models
    'Manpower',
    'Attendance',

    // Sticker & Label Models
    'Sticker',

    // Additional Tags
    'Order',
    'Inventory',
    'Quotation',
    'ProductionOrder',
    'FinancialTransaction',
    'AuditLog',

    // Additional
    'Permission',
    'Dashboard',
    'File',
    'List',
    'Detail',
    'Stats',

    // Enhanced Features
    'Sales',
    'SalesStats',
    'SalesAnalytics',
    'SalesReports',
    'Purchase',
    'PurchaseStats',
    'PurchaseAnalytics',
    'PurchaseReports',
    'AdvancedInventory',
    'FentInventory',
    'ProcessTracking',
    'AgingStock',
    'EnhancedProduction',
    'ProductionTracking',
    'JobWork',
    'EnhancedDispatch',
    'PackingList',
    'RTOTracking',
    'TwoFactor',
    'PrintingStatus',
    'JobWorkTracking',
    'ProductionSummary',
    'MachineSummary',
    'ProductionAlerts',
    'ProductionEfficiency',
    'RealTimeProduction',

    // Additional Missing Tag Types
    'Employee',
    'Shift',
    'AutomatedReport',
    'ProductionDashboard',
    'AdvancedReport',
    'Document',
    'EnhancedOrder',
    'EnhancedOrderStats',
    'SalesDashboard',
    "ProductionFlow",
    "GreyFabricInward",
    "GreyFabricInwardAnalytics",
    "PreProcessingBatch",
    "PreProcessingAnalytics",
    "Dyeing",

    // Feature-based modules
    "Categories",
    "Subcategories",
    "Units",
    "JobWorkType"

  ],
  endpoints: (builder) => ({
    // =============================================
    // PRODUCTION ORDER ENDPOINTS
    // =============================================

    // Get all production orders
    getProductionOrders: builder.query<{
      success: boolean;
      message: string;
      data: Array<{
        _id: string;
        productionOrderNumber: string;
        customerName: string;
        product: {
          productType: string;
          design: string;
          color: string;
          gsm: number;
        };
        orderQuantity: number;
        completedQuantity: number;
        status: string;
        productionStages: Array<{
          stageId: string;
          stageNumber: number;
          stageName: string;
          processType: string;
          status: string;
          timing: {
            plannedStartTime?: string;
            actualStartTime?: string;
            plannedEndTime?: string;
            actualEndTime?: string;
            plannedDuration?: number;
            actualDuration?: number;
          };
          progress: number;
          output: {
            producedQuantity?: number;
            defectQuantity?: number;
            outputImages: string[];
          };
          qualityControl: {
            finalQuality: {
              qualityGrade?: string;
              qualityNotes?: string;
            };
          };
          notes?: string;
        }>;
        schedule: {
          plannedStartDate: string;
          plannedEndDate: string;
          actualStartDate?: string;
          actualEndDate?: string;
        };
      }>;
    }, {
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: (params) => ({
        url: '/production-orders',
        params,
      }),
      providesTags: ['ProductionOrder'],
    }),

    // Get single production order
    getProductionOrder: builder.query<{
      success: boolean;
      message: string;
      data: any;
    }, string>({
      query: (id) => `/production-orders/${id}`,
      providesTags: (result, error, id) => [
        { type: 'ProductionOrder', id },
      ],
    }),

    // Create production order
    createProductionOrder: builder.mutation<{
      success: boolean;
      message: string;
      data: any;
    }, any>({
      query: (data) => ({
        url: '/production-orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Update production order
    updateProductionOrder: builder.mutation<{
      success: boolean;
      message: string;
      data: any;
    }, {
      id: string;
      data: any;
    }>({
      query: ({ id, data }) => ({
        url: `/production-orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Delete production order
    deleteProductionOrder: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `/production-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProductionOrder'],
    }),

    // Get all companies
    getCompanies: builder.query<{
      success: boolean;
      data: Array<{
        _id: string;
        companyName: string;
        companyCode: string;
        email?: string;
        phone?: string;
        website?: string;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          pincode?: string;
          country?: string;
        };
        isActive: boolean;
      }>;
    }, void>({
      query: () => ({
        url: '/companies',
      }),
      providesTags: ['Company'],
    }),
  }),
})

export const {
  useGetCompaniesQuery,
} = baseApi;

export default baseApi
