import { baseApi } from './baseApi'

export interface Role {
  _id: string
  roleCode: string
  roleName: string
  description?: string
  roleType: 'system' | 'custom'
  level: 'executive' | 'manager' | 'supervisor' | 'operator' | 'admin'
  department?: string
  status: 'active' | 'inactive'
  permissions: {
    [module: string]: string[]
  }
  userCount?: number
  isSystemRole: boolean
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface RoleStats {
  totalRoles: number
  activeRoles: number
  inactiveRoles: number
  systemRoles: number
  customRoles: number
  totalUsersAssigned: number
  rolesByDepartment: {
    [department: string]: number
  }
  rolesByLevel: {
    [level: string]: number
  }
}

export interface CreateRoleRequest {
  roleName: string
  description?: string
  roleType: 'system' | 'custom'
  level: 'executive' | 'manager' | 'supervisor' | 'operator' | 'admin'
  department?: string
  permissions: {
    [module: string]: string[]
  }
}

export const rolesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all roles with filtering and pagination
    getRoles: builder.query<
      {
        success: boolean
        data: Role[]
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
        roleType?: string
        level?: string
        department?: string
        companyId?: string
      }
    >({
      query: (params = {}) => ({
        url: '/roles',
        method: 'GET',
        params,
      }),
      providesTags: ['Role'],
    }),

    // Get role statistics
    getRoleStats: builder.query<
      { success: boolean; data: RoleStats },
      { companyId?: string }
    >({
      query: (params = {}) => ({
        url: '/roles/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['Role'],
    }),

    // Get role by ID
    getRoleById: builder.query<
      { success: boolean; data: Role },
      string
    >({
      query: (roleId) => ({
        url: `/roles/${roleId}`,
        method: 'GET',
      }),
      providesTags: ['Role'],
    }),

    // Create new role
    createRole: builder.mutation<
      { success: boolean; data: Role; message: string },
      CreateRoleRequest
    >({
      query: (roleData) => ({
        url: '/roles',
        method: 'POST',
        body: roleData,
      }),
      invalidatesTags: ['Role'],
    }),

    // Update role
    updateRole: builder.mutation<
      { success: boolean; data: Role; message: string },
      { roleId: string; roleData: Partial<CreateRoleRequest> }
    >({
      query: ({ roleId, roleData }) => ({
        url: `/roles/${roleId}`,
        method: 'PUT',
        body: roleData,
      }),
      invalidatesTags: ['Role'],
    }),

    // Delete role
    deleteRole: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (roleId) => ({
        url: `/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),

    // Get role permissions
    getRolePermissions: builder.query<
      { success: boolean; data: { [module: string]: string[] } },
      string
    >({
      query: (roleId) => ({
        url: `/roles/${roleId}/permissions`,
        method: 'GET',
      }),
      providesTags: ['Role'],
    }),

    // Update role permissions
    updateRolePermissions: builder.mutation<
      { success: boolean; data: Role; message: string },
      { roleId: string; permissions: { [module: string]: string[] } }
    >({
      query: ({ roleId, permissions }) => ({
        url: `/roles/${roleId}/permissions`,
        method: 'PUT',
        body: { permissions },
      }),
      invalidatesTags: ['Role'],
    }),

    // Get users assigned to role
    getRoleUsers: builder.query<
      {
        success: boolean
        data: any[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      },
      {
        roleId: string
        page?: number
        limit?: number
      }
    >({
      query: ({ roleId, ...params }) => ({
        url: `/roles/${roleId}/users`,
        method: 'GET',
        params,
      }),
      providesTags: ['Role', 'User'],
    }),

    // Update role status
    updateRoleStatus: builder.mutation<
      { success: boolean; data: Role; message: string },
      { roleId: string; status: 'active' | 'inactive' }
    >({
      query: ({ roleId, status }) => ({
        url: `/roles/${roleId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Role'],
    }),

    // Clone role
    cloneRole: builder.mutation<
      { success: boolean; data: Role; message: string },
      { roleId: string; newRoleName: string; description?: string }
    >({
      query: ({ roleId, newRoleName, description }) => ({
        url: `/roles/${roleId}/clone`,
        method: 'POST',
        body: { newRoleName, description },
      }),
      invalidatesTags: ['Role'],
    }),
  }),
})

export const {
  useGetRolesQuery,
  useGetRoleStatsQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
  useGetRoleUsersQuery,
  useUpdateRoleStatusMutation,
  useCloneRoleMutation,
} = rolesApi
