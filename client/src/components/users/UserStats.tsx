import React from 'react'
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Clock,
  TrendingUp,
  UserPlus,
  Activity,
  Building2,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { useGetUserStatsQuery } from '@/lib/features/users/usersApi'
import clsx from 'clsx'

interface UserStatsProps {
  currentCompany?: string
  isSuperAdmin?: boolean
}

export default function UserStats({ currentCompany, isSuperAdmin }: UserStatsProps) {
  const { data: statsResponse, isLoading, error, refetch } = useGetUserStatsQuery({
    companyId: currentCompany !== 'all' ? currentCompany : undefined
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !statsResponse?.data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <UserX className="h-6 w-6 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Stats</h3>
            <p className="text-red-600 dark:text-red-300">Failed to load user statistics</p>
          </div>
          <button
            onClick={() => refetch()}
            className="ml-auto p-2 bg-red-100 dark:bg-red-800 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    )
  }

  const { overview, activity, percentages, roleDistribution, departmentDistribution, companyStats } = statsResponse.data

  const mainStats = [
    {
      title: isSuperAdmin ? 'Total Users' : 'Company Users',
      value: overview.totalUsers,
      icon: Users,
      color: 'bg-sky-500',
      bgColor: 'bg-sky-50 dark:bg-sky-900/20',
      borderColor: 'border-sky-200 dark:border-sky-700',
      textColor: 'text-sky-600 dark:text-sky-400',
      change: `${percentages.activePercentage}%`,
      changeLabel: 'Active',
      changeColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Active Users',
      value: overview.activeUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      textColor: 'text-green-600 dark:text-green-400',
      change: `${activity.recentActivityPercentage}%`,
      changeLabel: 'Recent Activity',
      changeColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: '2FA Enabled',
      value: overview.twoFactorEnabled,
      icon: Shield,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      textColor: 'text-purple-600 dark:text-purple-400',
      change: `${percentages.twoFactorPercentage}%`,
      changeLabel: 'Security',
      changeColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'New Users (30d)',
      value: overview.newUsers30d,
      icon: UserPlus,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-700',
      textColor: 'text-orange-600 dark:text-orange-400',
      change: `${Math.round((overview.newUsers30d / overview.totalUsers) * 100)}%`,
      changeLabel: 'Growth',
      changeColor: 'text-orange-600 dark:text-orange-400'
    }
  ]

  const activityStats = [
    {
      title: 'Last 24 Hours',
      value: activity.recentLogins24h,
      icon: Clock,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Last 7 Days',
      value: activity.recentLogins7d,
      icon: Activity,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-700',
      textColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Last 30 Days',
      value: activity.recentLogins30d,
      icon: Calendar,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      borderColor: 'border-teal-200 dark:border-teal-700',
      textColor: 'text-teal-600 dark:text-teal-400'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Company Info */}
      {companyStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {companyStats.companyName}
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                Company Code: {companyStats.companyCode}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <div
            key={index}
            className={clsx(
              'bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:scale-105',
              stat.bgColor,
              stat.borderColor
            )}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={clsx('p-3 rounded-lg', stat.bgColor)}>
                  <stat.icon className={clsx('h-6 w-6', stat.textColor)} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.changeLabel}
                  </p>
                  <p className={clsx('text-lg font-bold', stat.changeColor)}>
                    {stat.change}
                  </p>
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activityStats.map((stat, index) => (
          <div
            key={index}
            className={clsx(
              'bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg',
              stat.bgColor,
              stat.borderColor
            )}
          >
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className={clsx('p-3 rounded-lg', stat.bgColor)}>
                  <stat.icon className={clsx('h-8 w-8', stat.textColor)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribution Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Role Distribution</h3>
          </div>
          <div className="space-y-3">
            {roleDistribution.slice(0, 5).map((role, index) => (
              <div key={role._id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {role._id.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(role.count / overview.totalUsers) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">
                    {role.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Department Distribution</h3>
          </div>
          <div className="space-y-3">
            {departmentDistribution.slice(0, 5).map((dept, index) => (
              <div key={dept._id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {dept._id || 'Not Specified'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(dept.count / overview.totalUsers) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">
                    {dept.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Overview</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Super Admins</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {overview.superAdmins}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">2FA Enabled</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {overview.twoFactorEnabled}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Users</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {overview.inactiveUsers}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Last updated: {new Date(statsResponse.data.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}