import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Car,
  Package,
  Wrench,
  AlertTriangle
} from 'lucide-react'
import { GatePassStats as GatePassStatsType } from '@/lib/features/gatepasses/gatepassesApi'

interface GatePassStatsProps {
  stats?: GatePassStatsType
  isLoading?: boolean
}

export default function GatePassStats({ stats, isLoading }: GatePassStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total',
      value: stats.totalGatePasses,
      icon: FileText,
      color: 'text-gray-600 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      iconColor: 'text-gray-400 dark:text-gray-500'
    },
    {
      title: 'Active',
      value: stats.activeGatePasses,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-400 dark:text-green-500'
    },
    {
      title: 'Completed',
      value: stats.completedGatePasses,
      icon: CheckCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-400 dark:text-blue-500'
    },
    {
      title: 'Expired',
      value: stats.expiredGatePasses,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-400 dark:text-red-500'
    },
    {
      title: 'Cancelled',
      value: stats.cancelledGatePasses,
      icon: XCircle,
      color: 'text-gray-600 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      iconColor: 'text-gray-400 dark:text-gray-500'
    }
  ]

  const purposeIcons = {
    delivery: Package,
    pickup: Car,
    maintenance: Wrench,
    other: AlertTriangle
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{stat.title}</p>
                    <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${stat.color} truncate`}>{stat.value || 0}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2 rounded-full ${stat.bgColor} flex-shrink-0 ml-2`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Today's Gate Passes</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.todayGatePasses || 0}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 flex-shrink-0 ml-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-400 dark:text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(stats.averageDuration || 0)} min
                </p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-purple-100 dark:bg-purple-900 flex-shrink-0 ml-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-400 dark:text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.totalGatePasses > 0 
                    ? Math.round((stats.completedGatePasses / stats.totalGatePasses) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 flex-shrink-0 ml-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-400 dark:text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purpose Breakdown */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Purpose Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(stats.purposeBreakdown || {}).map(([purpose, count]) => {
              const Icon = purposeIcons[purpose as keyof typeof purposeIcons]
              const percentage = stats.totalGatePasses > 0 
                ? Math.round((count / stats.totalGatePasses) * 100)
                : 0
              
              return (
                <div key={purpose} className="text-center p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex justify-center mb-2">
                    <div className="p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-600">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 capitalize truncate">{purpose}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{count || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
