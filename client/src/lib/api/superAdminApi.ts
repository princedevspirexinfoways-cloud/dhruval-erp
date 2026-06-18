import { baseApi } from './baseApi'

export interface SuperAdminUser {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  isSuperAdmin: boolean
  primaryCompanyId?: {
    _id: string
    companyName: string
    companyCode: string
  }
  companyAccess: Array<{
    companyId: {
      _id: string
      companyName: string
      companyCode: string
    }
    role: string
    department?: string
    designation?: string
    employeeId?: string
    isActive: boolean
  }>
  createdAt: string
  updatedAt: string
}

export interface Company {
  _id: string
  companyName: string
  companyCode: string
  email?: string
  phone?: string
  website?: string
  address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  companyId: string
  role: string
  department?: string
  designation?: string
  employeeId?: string
}

export interface CreateCompanyRequest {
  companyName: string
  companyCode: string
  email?: string
  phone?: string
  website?: string
  address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
  isActive?: boolean
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalCompanies: number
  activeCompanies: number
  superAdmins: number
  recentUsers: Array<{
    _id: string
    firstName: string
    lastName: string
    email: string
    createdAt: string
  }>
  recentCompanies: Array<{
    _id: string
    companyName: string
    companyCode: string
    createdAt: string
  }>
}

export const superAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard Stats
    getDashboardStats: builder.query<
      { success: boolean; data: DashboardStats },
      void
    >({
      query: () => ({
        url: '/admin/dashboard/stats',
        method: 'GET',
      }),
      providesTags: ['SuperAdmin'],
    }),

    // User Management
    getAllUsers: builder.query<
      {
        success: boolean
        data: {
          users: SuperAdminUser[]
          pagination: {
            page: number
            limit: number
            total: number
            pages: number
          }
        }
      },
      {
        page?: number
        limit?: number
        search?: string
        role?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/admin/users',
        method: 'GET',
        params,
      }),
      providesTags: ['SuperAdmin', 'User'],
    }),

    createUser: builder.mutation<
      { success: boolean; data: SuperAdminUser; message: string },
      CreateUserRequest
    >({
      query: (userData) => ({
        url: '/admin/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['SuperAdmin', 'User'],
    }),

    updateUser: builder.mutation<
      { success: boolean; data: SuperAdminUser; message: string },
      { userId: string; userData: Partial<CreateUserRequest> }
    >({
      query: ({ userId, userData }) => ({
        url: `/admin/users/${userId}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['SuperAdmin', 'User'],
    }),

    deleteUser: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SuperAdmin', 'User'],
    }),

    getUserById: builder.query<
      { success: boolean; data: SuperAdminUser },
      string
    >({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: 'GET',
      }),
      providesTags: ['SuperAdmin', 'User'],
    }),

    // Company Management
    getAllCompanies: builder.query<
      {
        success: boolean
        data: Company[]
        pagination?: {
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
      }
    >({
      query: (params = {}) => ({
        url: '/companies',
        method: 'GET',
        params,
      }),
      providesTags: ['SuperAdmin', 'Company'],
    }),

    createCompany: builder.mutation<
      { success: boolean; data: Company; message: string },
      CreateCompanyRequest
    >({
      query: (companyData) => ({
        url: '/companies',
        method: 'POST',
        body: companyData,
      }),
      invalidatesTags: ['SuperAdmin', 'Company'],
    }),

    updateCompany: builder.mutation<
      { success: boolean; data: Company; message: string },
      { companyId: string; companyData: Partial<CreateCompanyRequest> }
    >({
      query: ({ companyId, companyData }) => ({
        url: `/companies/${companyId}`,
        method: 'PUT',
        body: companyData,
      }),
      invalidatesTags: ['SuperAdmin', 'Company'],
    }),

    deleteCompany: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (companyId) => ({
        url: `/companies/${companyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SuperAdmin', 'Company'],
    }),

    getCompanyById: builder.query<
      { success: boolean; data: Company },
      string
    >({
      query: (companyId) => ({
        url: `/companies/${companyId}`,
        method: 'GET',
      }),
      providesTags: ['SuperAdmin', 'Company'],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetDashboardStatsQuery,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserByIdQuery,
  useGetAllCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useGetCompanyByIdQuery,
} = superAdminApi
