import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'

export interface DashboardPermissions {
  canViewFinancials: boolean
  canViewProduction: boolean
  canViewInventory: boolean
  canViewOrders: boolean
  canViewCustomers: boolean
  canViewSuppliers: boolean
  canViewUsers: boolean
  canViewReports: boolean
  canViewAnalytics: boolean
  canViewQuality: boolean
  canViewMaintenance: boolean
  canViewSecurity: boolean
  canViewHR: boolean
  canManageSystem: boolean
}

export const useDashboardPermissions = (): DashboardPermissions => {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)

  if (!user) {
    return {
      canViewFinancials: false,
      canViewProduction: false,
      canViewInventory: false,
      canViewOrders: false,
      canViewCustomers: false,
      canViewSuppliers: false,
      canViewUsers: false,
      canViewReports: false,
      canViewAnalytics: false,
      canViewQuality: false,
      canViewMaintenance: false,
      canViewSecurity: false,
      canViewHR: false,
      canManageSystem: false,
    }
  }

  // Super Admin has all permissions
  if (isSuperAdmin) {
    return {
      canViewFinancials: true,
      canViewProduction: true,
      canViewInventory: true,
      canViewOrders: true,
      canViewCustomers: true,
      canViewSuppliers: true,
      canViewUsers: true,
      canViewReports: true,
      canViewAnalytics: true,
      canViewQuality: true,
      canViewMaintenance: true,
      canViewSecurity: true,
      canViewHR: true,
      canManageSystem: true,
    }
  }

  // Get current company access
  const currentCompanyAccess = user.companyAccess?.find(access => access.isActive)
  const permissions = currentCompanyAccess?.permissions as Record<string, any> | undefined

  // Helper to support both shapes:
  // 1) Object of booleans: permissions.module.action => boolean
  // 2) Array of strings: permissions.module => string[] of allowed actions
  const has = (moduleKey: string, action: string): boolean => {
    if (!permissions) return false
    const mod = (permissions as any)[moduleKey]
    if (!mod) return false
    if (Array.isArray(mod)) {
      return mod.includes(action)
    }
    if (typeof mod === 'object') {
      return Boolean(mod[action])
    }
    return false
  }

  if (!permissions) {
    return {
      canViewFinancials: false,
      canViewProduction: false,
      canViewInventory: false,
      canViewOrders: false,
      canViewCustomers: false,
      canViewSuppliers: false,
      canViewUsers: false,
      canViewReports: false,
      canViewAnalytics: false,
      canViewQuality: false,
      canViewMaintenance: false,
      canViewSecurity: false,
      canViewHR: false,
      canManageSystem: false,
    }
  }

  return {
    canViewFinancials: has('financial', 'view'),
    canViewProduction: has('production', 'view'),
    canViewInventory: has('inventory', 'view'),
    canViewOrders: has('orders', 'view'),
    // Map customers/suppliers to relevant modules if not explicitly present
    canViewCustomers: has('customers', 'view') || has('orders', 'view'),
    canViewSuppliers: has('suppliers', 'view') || has('inventory', 'view'),
    canViewUsers: has('users', 'view') || has('admin', 'userManagement'),
    canViewReports: has('financial', 'viewReports') || has('production', 'viewReports') || has('inventory', 'viewReports') || has('orders', 'viewReports'),
    canViewAnalytics: has('analytics', 'businessAnalytics') || false,
    canViewQuality: has('quality', 'qualityControl') || has('production', 'qualityCheck'),
    canViewMaintenance: has('maintenance', 'equipmentManagement') || false,
    canViewSecurity: has('security', 'gateManagement') || false,
    canViewHR: has('hr', 'viewEmployees') || false,
    canManageSystem: has('admin', 'systemSettings') || has('admin', 'userManagement'),
  }
}
