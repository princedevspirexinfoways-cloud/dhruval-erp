import { baseApi } from './baseApi'
import type { User, Company } from '../features/auth/authSlice'

export interface LoginRequest {
  username: string  // Backend expects username field (can be email or username)
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  success: boolean
  data: {
    user: User & {
      companyAccess: Array<{
        companyId: string
        companyName: string
        companyCode: string
        role: string
        department: string
        designation: string
      }>
    }
    companies: Company[]
    currentCompany?: {
      id: string
      name: string
      code: string
      role: string
      permissions: string[]
    }
    tokens: {
      accessToken: string
      expiresIn: string
    }
    permissions?: { [module: string]: string[] }
    // 2FA fields
    requiresTwoFactor?: boolean
    tempToken?: string
  }
  // 2FA fields at root level for backward compatibility
  requiresTwoFactor?: boolean
  tempToken?: string
  message: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  companyId: string
  roleId: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
}

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Register
    register: builder.mutation<LoginResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // Logout
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Refresh token
    refreshToken: builder.mutation<LoginResponse, void>({
      query: () => ({
        url: '/auth/refresh-token',
        method: 'POST',
      }),
    }),

    // Forgot password
    forgotPassword: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Verify reset token
    verifyResetToken: builder.query<{ success: boolean; message: string }, string>({
      query: (token) => ({
        url: `/auth/reset-password/${token}`,
        method: 'GET',
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<{ success: boolean; message: string }, { token: string; password: string; confirmPassword: string }>({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Health check
    healthCheck: builder.query<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/health',
        method: 'GET',
      }),
    }),

    // Get current user
    getCurrentUser: builder.query<{ success: boolean; data: User }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Update profile
    updateProfile: builder.mutation<{ success: boolean; data: User }, UpdateProfileRequest>({
      query: (profileData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),

    // Change password
    changePassword: builder.mutation<{ success: boolean; message: string }, ChangePasswordRequest>({
      query: (passwordData) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: passwordData,
      }),
    }),



    // Verify email
    verifyEmail: builder.mutation<{ success: boolean; message: string }, { token: string }>({
      query: ({ token }) => ({
        url: `/auth/verify-email/${token}`,
        method: 'POST',
      }),
    }),

    // Resend verification email
    resendVerification: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (emailData) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body: emailData,
      }),
    }),

    // Get user permissions
    getUserPermissions: builder.query<{ success: boolean; data: string[] }, void>({
      query: () => '/auth/permissions',
      providesTags: ['User'],
    }),

    // Check permission
    checkPermission: builder.query<{ success: boolean; data: { hasPermission: boolean } }, string>({
      query: (permission) => `/auth/check-permission/${permission}`,
      providesTags: ['User'],
    }),

    // Get user companies
    getUserCompanies: builder.query<{ success: boolean; data: Company[] }, void>({
      query: () => '/auth/companies',
      providesTags: ['Company'],
    }),

    // Get all companies (Super Admin only)
    getAllCompanies: builder.query<{ success: boolean; data: Company[] }, void>({
      query: () => ({
        url: '/companies',
        method: 'GET',
      }),
      providesTags: ['Company'],
    }),

    // Switch company
    switchCompany: builder.mutation<
      {
        success: boolean;
        data: {
          user: User;
          permissions: { [module: string]: string[] }
        };
        message: string
      },
      { companyId: string }
    >({
      query: ({ companyId }) => ({
        url: '/auth/switch-company',
        method: 'POST',
        body: { companyId },
      }),
      invalidatesTags: ['User', 'Company'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useGetUserPermissionsQuery,
  useCheckPermissionQuery,
  useGetUserCompaniesQuery,
  useGetAllCompaniesQuery,
  useSwitchCompanyMutation,
  useVerifyResetTokenQuery,
  useHealthCheckQuery,
} = authApi
