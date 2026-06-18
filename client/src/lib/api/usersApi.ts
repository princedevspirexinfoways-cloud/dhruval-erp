import { baseApi } from './baseApi'

export interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  companyId?: string
  designation?: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  isActive: boolean
  isSuperAdmin: boolean
  lastLoginAt?: string
  createdAt: string
  isOnline: boolean
  primaryCompany: {
    _id: string
    companyName: string
    companyCode: string
  }
  companyAccess: Array<{
    companyId: string
    role: string
    isActive: boolean
  }>
  roles?: Array<{
    roleId: string
    companyId: string
    assignedAt: string
    expiresAt?: string
  }>
  permissions?: { [module: string]: string[] }
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  onlineUsers: number
  inactiveUsers: number
  newUsersThisMonth: number
  superAdmins?: number
}

export interface CreateUserRequest {
  username: string
  password: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  companyAccess?: Array<{
    companyId: string
    role: string
    isActive: boolean
    permissions?: any
  }>
}

export const usersApi = baseApi.injectEndpoints({
    
  endpoints: (builder) => ({
    // Get all users with filtering and pagination
    getUsers: builder.query<
      {
        success: boolean
        data: User[]
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
        role?: string
        status?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/users',
        method: 'GET',
        params,
      }),
      providesTags: ['User'],
    }),

    // Get user statistics
    getUserStats: builder.query<
      { success: boolean; data: UserStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/users/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['User'],
    }),

    // Get user by ID
    getUserById: builder.query<
      { success: boolean; data: User },
      string
    >({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    // Create new user
    createUser: builder.mutation<
      { success: boolean; data: User; message: string },
      CreateUserRequest
    >({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Update user
    updateUser: builder.mutation<
      { success: boolean; data: User; message: string },
      { userId: string; userData: Partial<CreateUserRequest> }
    >({
      query: ({ userId, userData }) => ({
        url: `/users/${userId}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Delete user (deactivate)
    deleteUser: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetUsersQuery,
  useGetUserStatsQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi
