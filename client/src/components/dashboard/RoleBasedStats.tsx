import React from 'react'
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Factory,
  Truck,
  AlertTriangle,
  TrendingUp,
  Building2,
  UserCheck,
  Settings,
  BarChart3
} from 'lucide-react'
import { useDashboardPermissions } from '@/lib/hooks/useDashboardPermissions'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ElementType
  color: 'sky' | 'black'
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-sky-200 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-8 bg-sky-200 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-4 bg-sky-200 dark:bg-gray-600 rounded w-20"></div>
          </div>
          <div className="h-12 w-12 bg-sky-200 dark:bg-gray-600 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-500 dark:border-sky-400 p-4 sm:p-6 hover:border-black dark:hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-black dark:text-white mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-black dark:text-white">{value}</p>
          {change && (
            <div className="flex items-center mt-1 sm:mt-2">
              <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${changeType === 'increase' ? 'text-sky-500 dark:text-sky-400' : 'text-black dark:text-white'}`} />
              <span className={`text-xs sm:text-sm font-medium ${changeType === 'increase' ? 'text-sky-500 dark:text-sky-400' : 'text-black dark:text-white'}`}>
                {change}
              </span>
              <span className="text-xs sm:text-sm text-black dark:text-white ml-1 hidden sm:inline">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${color === 'sky' ? 'bg-sky-500 dark:bg-sky-600' : 'bg-black dark:bg-gray-700'}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

interface RoleBasedStatsProps {
  stats?: {
    totalOrders?: number
    totalRevenue?: number
    totalCustomers?: number
    totalProducts?: number
    totalProduction?: number
    totalInventory?: number
    totalEmployees?: number
    totalSuppliers?: number
    pendingOrders?: number
    completedOrders?: number
    lowStockItems?: number
    activeProduction?: number
    totalCompanies?: number
    totalUsers?: number
    systemHealth?: number
    systemUptime?: string
    activeCompanies?: number
  }
  loading?: boolean
}

export const RoleBasedStats: React.FC<RoleBasedStatsProps> = ({ stats, loading = false }) => {
  const permissions = useDashboardPermissions()
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)

  // Debug logging
  console.log('RoleBasedStats Debug:', {
    stats,
    totalProduction: stats?.totalProduction,
    isSuperAdmin,
    user: user?.username
  })

  const getStatsForRole = () => {
    const roleStats = []

    // Super Admin - All stats
    if (isSuperAdmin) {
      roleStats.push(
        { title: 'Total Companies', value: stats?.totalCompanies || '0', change: undefined, changeType: undefined, icon: Building2, color: 'sky' as const },
        { title: 'Total Users', value: stats?.totalUsers || '0', change: undefined, changeType: undefined, icon: Users, color: 'black' as const },
        { title: 'Total Customers', value: stats?.totalCustomers || '0', change: undefined, changeType: undefined, icon: Users, color: 'sky' as const },
        { title: 'Total Orders', value: stats?.totalOrders || '0', change: undefined, changeType: undefined, icon: ShoppingCart, color: 'black' as const },
        { title: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, change: undefined, changeType: undefined, icon: DollarSign, color: 'sky' as const },
        { title: 'Total Inventory', value: stats?.totalInventory || '0', change: undefined, changeType: undefined, icon: Package, color: 'black' as const },
        { title: 'Total Production', value: stats?.totalProduction || '0', change: undefined, changeType: undefined, icon: Factory, color: 'sky' as const },
        { title: 'Active Companies', value: stats?.activeCompanies || '0', change: undefined, changeType: undefined, icon: Building2, color: 'black' as const }
      )
    }
    // Company Owner - Business overview
    else if (permissions.canViewFinancials && permissions.canViewOrders) {
      roleStats.push(
        { title: 'Total Orders', value: stats?.totalOrders || '0', change: undefined, changeType: undefined, icon: ShoppingCart, color: 'sky' as const },
        { title: 'Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, change: undefined, changeType: undefined, icon: DollarSign, color: 'black' as const },
        { title: 'Customers', value: stats?.totalCustomers || '0', change: undefined, changeType: undefined, icon: Users, color: 'sky' as const },
        { title: 'Inventory', value: stats?.totalInventory || '0', change: undefined, changeType: undefined, icon: Package, color: 'black' as const },
        { title: 'Production', value: stats?.totalProduction || '0', change: undefined, changeType: undefined, icon: Factory, color: 'sky' as const },
        { title: 'Pending Orders', value: stats?.pendingOrders || '0', change: undefined, changeType: undefined, icon: ShoppingCart, color: 'black' as const }
      )
    }
    // Production Manager - Production focused
    else if (permissions.canViewProduction) {
      roleStats.push(
        { title: 'Active Production', value: stats?.activeProduction || '0', change: undefined, changeType: undefined, icon: Factory, color: 'sky' as const },
        { title: 'Total Production', value: stats?.totalProduction || '0', change: undefined, changeType: undefined, icon: Factory, color: 'black' as const },
        { title: 'Inventory Items', value: stats?.totalInventory || '0', change: undefined, changeType: undefined, icon: Package, color: 'sky' as const },
        { title: 'Low Stock Alerts', value: stats?.lowStockItems || '0', change: undefined, changeType: undefined, icon: AlertTriangle, color: 'black' as const },
        { title: 'Completed Orders', value: stats?.completedOrders || '0', change: undefined, changeType: undefined, icon: UserCheck, color: 'sky' as const },
        { title: 'Pending Orders', value: stats?.pendingOrders || '0', change: undefined, changeType: undefined, icon: ShoppingCart, color: 'black' as const }
      )
    }
    // Operator - Basic operational stats
    else {
      roleStats.push(
        { title: 'My Tasks', value: stats?.pendingOrders || '0', change: undefined, changeType: undefined, icon: UserCheck, color: 'sky' as const },
        { title: 'Production Units', value: stats?.totalProduction || '0', change: undefined, changeType: undefined, icon: Factory, color: 'black' as const },
        { title: 'Quality Checks', value: stats?.completedOrders || '0', change: undefined, changeType: undefined, icon: BarChart3, color: 'sky' as const },
        { title: 'Inventory Items', value: stats?.totalInventory || '0', change: undefined, changeType: undefined, icon: Package, color: 'black' as const },
        { title: 'Low Stock Alerts', value: stats?.lowStockItems || '0', change: undefined, changeType: undefined, icon: AlertTriangle, color: 'sky' as const },
        { title: 'Active Production', value: stats?.activeProduction || '0', change: undefined, changeType: undefined, icon: Factory, color: 'black' as const }
      )
    }

    return roleStats
  }

  const statsToShow = getStatsForRole()

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6`}>
      {statsToShow.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          color={stat.color}
          loading={loading}
        />
      ))}
    </div>
  )
}
