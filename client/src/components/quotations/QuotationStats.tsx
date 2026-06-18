'use client'

import { 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react'
import { QuotationStats as StatsType } from '@/lib/api/quotationsApi'
import clsx from 'clsx'

interface QuotationStatsProps {
  stats: StatsType | undefined
  isLoading: boolean
}

export function QuotationStats({ stats, isLoading }: QuotationStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border-2 border-sky-500 p-6 animate-pulse">
            <div className="h-4 bg-sky-200 rounded mb-2"></div>
            <div className="h-8 bg-sky-200 rounded mb-2"></div>
            <div className="h-3 bg-sky-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl border-2 border-sky-500 p-6 mb-8">
        <p className="text-center text-sky-600">Unable to load quotation statistics</p>
      </div>
    )
  }

  const statusCards = [
    {
      title: 'Draft',
      count: stats?.draftQuotations || 0,
      icon: FileText,
      color: 'gray',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-800'
    },
    {
      title: 'Sent',
      count: stats?.sentQuotations || 0,
      icon: Send,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800'
    },
    {
      title: 'Accepted',
      count: stats?.acceptedQuotations || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-800'
    },
    {
      title: 'Rejected',
      count: stats?.rejectedQuotations || 0,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-800'
    }
  ]

  const valueCards = [
    {
      title: 'Total Value',
      value: formatCurrency(stats?.totalValue || 0),
      icon: DollarSign,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-800',
      subtitle: `${stats?.totalQuotations || 0} quotations`
    },
    {
      title: 'Accepted Value',
      value: formatCurrency(stats?.acceptedValue || 0),
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      subtitle: `${formatPercentage(stats?.conversionRate || 0)} conversion rate`
    },
    {
      title: 'Pending Value',
      value: formatCurrency((stats?.totalValue || 0) - (stats?.acceptedValue || 0)),
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-800',
      subtitle: `${stats?.pendingQuotations || 0} pending quotations`
    },
    {
      title: 'Expired',
      value: String(stats?.expiredQuotations || 0),
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
      subtitle: 'Need attention'
    }
  ]

  return (
    <div className="space-y-6 mb-8">
      {/* Status Overview */}
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={clsx(
                  "rounded-xl border-2 border-sky-500 p-4 transition-all hover:border-black",
                  card.bgColor
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={clsx("h-5 w-5", card.iconColor)} />
                  <span className={clsx("text-2xl font-bold", card.textColor)}>
                    {card.count}
                  </span>
                </div>
                <p className={clsx("text-sm font-medium", card.textColor)}>
                  {card.title}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Value Overview */}
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Value Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {valueCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={clsx(
                  "rounded-xl border-2 border-sky-500 p-4 transition-all hover:border-black",
                  card.bgColor
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={clsx("h-5 w-5", card.iconColor)} />
                </div>
                <div className="space-y-1">
                  <p className={clsx("text-lg font-bold", card.textColor)}>
                    {card.value}
                  </p>
                  <p className={clsx("text-xs", card.textColor)}>
                    {card.title}
                  </p>
                  {card.subtitle && (
                    <p className={clsx("text-xs opacity-75", card.textColor)}>
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Insights */}
      {stats?.conversionRate !== undefined && (
        <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-black">Conversion Rate</p>
                <p className="text-xs text-sky-600">
                  {stats?.acceptedQuotations || 0} of {stats?.totalQuotations || 0} quotations accepted
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-sky-600">
                {formatPercentage(stats?.conversionRate || 0)}
              </p>
              <p className="text-xs text-sky-500">
                {(stats?.conversionRate || 0) >= 50 ? 'Good' : (stats?.conversionRate || 0) >= 25 ? 'Average' : 'Needs Improvement'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
