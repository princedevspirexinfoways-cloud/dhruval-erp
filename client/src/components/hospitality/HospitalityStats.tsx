import React from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plane,
  Car,
  Gift
} from 'lucide-react'
import { HospitalityStats as HospitalityStatsData } from '@/lib/features/hospitality/hospitalityApi'

interface HospitalityStatsProps {
  stats?: HospitalityStatsData
  isLoading: boolean
}

export default function HospitalityStats({ stats, isLoading }: HospitalityStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Visits',
      value: stats?.totalVisits || 0,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats?.totalExpenses || 0),
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      isString: true
    },
    {
      title: 'Avg Per Visit',
      value: formatCurrency(stats?.avgExpensePerVisit || 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      isString: true
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Approved Visits',
      value: stats?.approvedVisits || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Reimbursed',
      value: stats?.reimbursedVisits || 0,
      icon: XCircle,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    },
    {
      title: 'Accommodation',
      value: formatCurrency(stats?.accommodationTotal || 0),
      icon: Car,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      isString: true
    },
    {
      title: 'Food & Gifts',
      value: formatCurrency((stats?.foodTotal || 0) + (stats?.giftsTotal || 0)),
      icon: Gift,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.isString ? (card.value || '₹0') : (card.value || 0).toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor} dark:bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${card.textColor} dark:text-opacity-80`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
