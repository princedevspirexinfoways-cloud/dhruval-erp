'use client'

import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { RoleBasedStats } from '@/components/dashboard/RoleBasedStats'
import { RoleBasedActivity } from '@/components/dashboard/RoleBasedActivity'
import { RoleBasedQuickActions } from '@/components/dashboard/RoleBasedQuickActions'
import { useDashboardPermissions } from '@/lib/hooks/useDashboardPermissions'
import { useGetDashboardDataQuery } from '@/lib/api/dashboardApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer'
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import { DashboardHeader } from '@/components/ui/PageHeader'
import { AlertTriangle, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const permissions = useDashboardPermissions()

  // Fetch real dashboard data
  const { data: dashboardData, isLoading, error } = useGetDashboardDataQuery()



  const getWelcomeMessage = () => {
    if (isSuperAdmin) {
      return 'Super Admin Dashboard'
    }

    const role = user?.companyAccess?.[0]?.role
    switch (role) {
      case 'owner':
        return 'Company Owner Dashboard'
      case 'manager':
        return 'Manager Dashboard'
      case 'production_manager':
        return 'Production Manager Dashboard'
      case 'sales_executive':
        return 'Sales Executive Dashboard'
      case 'accountant':
        return 'Accountant Dashboard'
      case 'operator':
        return 'Operator Dashboard'
      case 'helper':
        return 'Helper Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const getRoleDescription = () => {
    if (isSuperAdmin) {
      return 'System-wide business overview and management'
    }

    const role = user?.companyAccess?.[0]?.role
    switch (role) {
      case 'owner':
        return 'Complete business overview and management'
      case 'production_manager':
        return 'Production operations and inventory management'
      case 'manager':
        return 'Department management and operations'
      case 'operator':
        return 'Daily tasks and production operations'
      default:
        return 'Your personalized business workspace'
    }
  }

  // Prepare real data for components
  const dashboardStats = dashboardData?.data?.overview || {}
  const recentActivities = dashboardData?.data?.recentActivity || []
  const systemAlerts = dashboardData?.data?.systemAlerts || []
  const companyAlerts = dashboardData?.data?.alerts || []
  const performanceMetrics = dashboardData?.data?.performanceMetrics || {}


  // Note: Performance metrics are now calculated from real data instead of dummy values
  const orderCompletion = (performanceMetrics as any)?.orderCompletion || 0
  const customerSatisfaction = (performanceMetrics as any)?.customerSatisfaction || 0
  const inventoryTurnover = (performanceMetrics as any)?.inventoryTurnover || 0
  const productionEfficiency = (performanceMetrics as any)?.productionEfficiency || 0

  // Format timestamp for better display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
      return `${Math.floor(diffInMinutes / 1440)} days ago`
    } catch {
      return timestamp
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        <ResponsiveContainer className="space-y-6">
          {/* New Header */}
          <DashboardHeader
            title={getWelcomeMessage()}
            description={`Welcome back, ${user?.username || 'User'}! ${getRoleDescription()} - All data shown is real from the database.`}
            icon={<BarChart3 className="h-6 w-6 text-white" />}
            showRefresh={true}
            onRefresh={() => window.location.reload()}
          />

          {/* Stats */}
          <RoleBasedStats stats={dashboardStats} loading={isLoading} />

          {/* Main Content Grid */}
          <ResponsiveGrid
            cols={{ default: 1, lg: 3 }}
            gap="lg"
          >
            {/* Quick Actions */}
            <ResponsiveCard className="lg:col-span-1">
              <RoleBasedQuickActions permissions={permissions} />
            </ResponsiveCard>

            {/* Recent Activity */}
            <ResponsiveCard className="lg:col-span-2">
              <RoleBasedActivity loading={isLoading} permissions={permissions} />
            </ResponsiveCard>
          </ResponsiveGrid>





          {/* Error State */}
          {error && (
            <ResponsiveCard className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Error Loading Dashboard
                </h3>
                <p className="text-red-600 dark:text-red-300">
                  There was an error loading the dashboard data. Please try refreshing the page.
                </p>
              </div>
            </ResponsiveCard>
          )}

          {/* No Data State */}
          {!isLoading && !error && !dashboardData && (
            <ResponsiveCard className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  No Dashboard Data Available
                </h3>
                <p className="text-yellow-600 dark:text-yellow-300">
                  Dashboard data is not available at the moment. This could be due to no data being present in the system.
                </p>
              </div>
            </ResponsiveCard>
          )}
        </ResponsiveContainer>
      </div>
    </AppLayout>
  )
}
