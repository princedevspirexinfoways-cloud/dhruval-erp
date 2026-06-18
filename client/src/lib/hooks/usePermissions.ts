'use client'

import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../features/auth/authSlice'
import { useAbility } from '../casl/Can'
import { Actions, Subjects } from '../casl/ability'

interface NavigationItem {
  permission?: string
  role?: string
  roles?: string[]
  children?: NavigationItem[]
  [key: string]: unknown
}

export function usePermissions() {
  const user = useSelector(selectCurrentUser)
  const ability = useAbility()

  const can = (action: Actions, subject: Subjects, field?: string) => {
    return ability.can(action, subject, field)
  }

  const cannot = (action: Actions, subject: Subjects, field?: string) => {
    return ability.cannot(action, subject, field)
  }

  const hasRole = (roleName: string) => {
    return user?.roles?.[0]?.roleId?.toLowerCase() === roleName.toLowerCase()
  }

  const hasAnyRole = (roleNames: string[]) => {
    return roleNames.some(roleName => hasRole(roleName))
  }

  const hasPermission = (permission: string) => {
    return user?.permissions?.[permission] || false
  }

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission))
  }

  const isAdmin = () => {
    return hasAnyRole(['super_admin', 'admin'])
  }

  const isSuperAdmin = () => {
    return hasRole('super_admin')
  }

  const canManage = (subject: Subjects) => {
    return can('manage', subject)
  }

  const canRead = (subject: Subjects) => {
    return can('read', subject)
  }

  const canCreate = (subject: Subjects) => {
    return can('create', subject)
  }

  const canUpdate = (subject: Subjects) => {
    return can('update', subject)
  }

  const canDelete = (subject: Subjects) => {
    return can('delete', subject)
  }

  const canExport = (subject: Subjects) => {
    return can('export', subject)
  }

  const canImport = (subject: Subjects) => {
    return can('import', subject)
  }

  const canApprove = (subject: Subjects) => {
    return can('approve', subject)
  }

  const canReject = (subject: Subjects) => {
    return can('reject', subject)
  }

  return {
    // Core CASL methods
    can,
    cannot,
    
    // Role checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    
    // Common action checks
    canManage,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    canImport,
    canApprove,
    canReject,
    
    // User info
    user,
    role: user?.roles?.[0],
    permissions: user?.permissions || {},
  }
}

// Hook for checking specific permissions with loading state
export function usePermissionCheck(action: Actions, subject: Subjects) {
  const { can } = usePermissions()
  return can(action, subject)
}

// Hook for multiple permission checks
export function useMultiplePermissions(checks: Array<{ action: Actions; subject: Subjects }>) {
  const { can } = usePermissions()
  
  return checks.map(({ action, subject }) => ({
    action,
    subject,
    allowed: can(action, subject)
  }))
}

// Hook for role-based navigation filtering
export function useNavigationPermissions() {
  const permissions = usePermissions()

  const getFilteredNavigation = (navigationItems: NavigationItem[]): NavigationItem[] => {
    return navigationItems.filter(item => {
      if (item.permission) {
        const [action, subject] = item.permission.split(':')
        return permissions.can(action as Actions, subject as Subjects)
      }
      if (item.role) {
        return permissions.hasRole(item.role)
      }
      if (item.roles) {
        return permissions.hasAnyRole(item.roles)
      }
      return true // Show item if no permission specified
    }).map(item => ({
      ...item,
      children: item.children ? getFilteredNavigation(item.children) : undefined
    }))
  }

  return { getFilteredNavigation }
}
