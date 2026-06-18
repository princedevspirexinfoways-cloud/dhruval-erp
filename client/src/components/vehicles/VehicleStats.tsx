import React from 'react'
import {
  Car,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { VehicleStats as VehicleStatsData } from '@/lib/features/vehicles/vehiclesApi'

interface VehicleStatsProps {
  stats?: VehicleStatsData
  isLoading: boolean
}

export default function VehicleStats({ stats, isLoading }: VehicleStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.totalVehicles || 0,
      icon: Car,
      borderColor: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Vehicles In',
      value: stats?.vehiclesIn || 0,
      icon: CheckCircle,
      borderColor: 'border-l-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Vehicles Out',
      value: stats?.vehiclesOut || 0,
      icon: XCircle,
      borderColor: 'border-l-gray-500',
      iconBg: 'bg-gray-100 dark:bg-gray-700',
      iconColor: 'text-gray-600 dark:text-gray-400'
    },
    {
      title: 'Pending',
      value: stats?.pendingVehicles || 0,
      icon: AlertTriangle,
      borderColor: 'border-l-yellow-500',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Deliveries',
      value: stats?.deliveryVehicles || 0,
      icon: TrendingUp,
      borderColor: 'border-l-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Pickups',
      value: stats?.pickupVehicles || 0,
      icon: TrendingUp,
      borderColor: 'border-l-indigo-500',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Today Entries',
      value: stats?.todayEntries || 0,
      icon: TrendingUp,
      borderColor: 'border-l-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Avg Stay Time',
      value: formatDuration(stats?.averageStayTime || 0),
      icon: Clock,
      borderColor: 'border-l-orange-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
      isString: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 ${card.borderColor || 'border-l-gray-500'}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {card.isString ? (card.value || '0') : (card.value || 0).toLocaleString()}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
