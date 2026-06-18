import React from 'react'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { OrderStats as OrderStatsType } from '@/lib/features/orders/ordersApi'

interface OrderStatsProps {
  stats: OrderStatsType | undefined
  isLoading: boolean
}

export default function OrderStats({ stats, isLoading }: OrderStatsProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const statsData = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-600',
      change: '+5%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Processing',
      value: stats?.processingOrders || 0,
      icon: Package,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      change: '+8%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Shipped',
      value: stats?.shippedOrders || 0,
      icon: Truck,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-600',
      change: '+15%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Delivered',
      value: stats?.deliveredOrders || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      change: '+18%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Cancelled',
      value: stats?.cancelledOrders || 0,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      change: '-3%',
      changeColor: 'text-red-600'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-600',
      change: '+22%',
      changeColor: 'text-green-600'
    },
    {
      title: 'This Month',
      value: stats?.ordersThisMonth || 0,
      icon: Calendar,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-600',
      change: '+25%',
      changeColor: 'text-green-600'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className={`bg-white rounded-2xl shadow-lg ${stat.borderColor} border p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div className="flex items-center">
                <TrendingUp className={`w-4 h-4 ${stat.changeColor} mr-1`} />
                <span className={`text-sm font-semibold ${stat.changeColor}`}>
                  {stat.change}
                </span>
              </div>
            </div>
            
            <div className="mb-2">
              <p className="text-2xl font-bold text-black">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
            </div>
            
            <p className="text-sm font-medium text-gray-600">
              {stat.title}
            </p>
          </div>
        )
      })}
    </div>
  )
}
