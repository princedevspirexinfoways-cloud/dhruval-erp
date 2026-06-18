import { baseApi } from './baseApi'

export interface AdminUser {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  isSuperAdmin: boolean
  is2FAEnabled: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  companyAccess: Array<{
    companyId: string
    companyName: string
    role: string
    isActive: boolean
  }>
}

export interface AdminUserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  users2FAEnabled: number
  users2FADisabled: number
  twoFactorEnabled: number
  twoFactorDisabled: number
  adoptionRate: number
  superAdmins: number
}

export interface AdminUsersResponse {
  success: boolean
  data: {
    users: AdminUser[]
    stats: AdminUserStats
  }
  message: string
}

export interface ToggleUserStatusResponse {
  success: boolean
  message: string
  data?: AdminUser
}

export interface Toggle2FAResponse {
  success: boolean
  message: string
  data?: AdminUser
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

export interface UpdateUserRequest {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  companyId?: string
  role?: string
  department?: string
  designation?: string
  employeeId?: string
  isActive?: boolean
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

export interface UpdateCompanyRequest {
  companyName?: string
  companyCode?: string
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

export const adminApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get users with 2FA status
    getUsers2FAStatus: builder.query<AdminUsersResponse, void>({
      query: () => ({
        url: '/admin/users/2fa-status',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    // Toggle user status (active/inactive)
    toggleUserStatus: builder.mutation<ToggleUserStatusResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/toggle-status`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Enable 2FA for user
    enableUser2FA: builder.mutation<Toggle2FAResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/enable-2fa`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Disable 2FA for user
    disableUser2FA: builder.mutation<Toggle2FAResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/disable-2fa`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Force disable 2FA for user
    forceDisableUser2FA: builder.mutation<Toggle2FAResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/force-disable-2fa`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Get all companies
    getCompanies: builder.query<{ success: boolean; data: Company[] }, void>({
      query: () => ({
        url: '/admin/companies',
        method: 'GET',
      }),
      providesTags: ['Company'],
    }),

    // Create user
    createAdminUser: builder.mutation<{ success: boolean; data: AdminUser; message: string }, CreateUserRequest>({
      query: (userData) => ({
        url: '/admin/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Update user
    updateAdminUser: builder.mutation<{ success: boolean; data: AdminUser; message: string }, { userId: string; userData: UpdateUserRequest }>({
      query: ({ userId, userData }) => ({
        url: `/admin/users/${userId}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Delete user
    deleteAdminUser: builder.mutation<{ success: boolean; message: string }, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Create company
    createCompany: builder.mutation<{ success: boolean; data: Company; message: string }, CreateCompanyRequest>({
      query: (companyData) => ({
        url: '/admin/companies',
        method: 'POST',
        body: companyData,
      }),
      invalidatesTags: ['Company'],
    }),

    // Update company
    updateCompany: builder.mutation<{ success: boolean; data: Company; message: string }, { companyId: string; companyData: UpdateCompanyRequest }>({
      query: ({ companyId, companyData }) => ({
        url: `/admin/companies/${companyId}`,
        method: 'PUT',
        body: companyData,
      }),
      invalidatesTags: ['Company'],
    }),

    // Delete company
    deleteCompany: builder.mutation<{ success: boolean; message: string }, string>({
      query: (companyId) => ({
        url: `/admin/companies/${companyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Company'],
    }),
  }),
})

export const {
  useGetUsers2FAStatusQuery,
  useToggleUserStatusMutation,
  useEnableUser2FAMutation,
  useDisableUser2FAMutation,
  useForceDisableUser2FAMutation,
  useGetCompaniesQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = adminApi
