'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'

interface StatCard {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    label?: string
  }
  icon: React.ReactNode | React.ComponentType<any>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'pink' | 'gray'
  loading?: boolean
}

interface StatsCardsProps {
  cards: StatCard[]
  className?: string
}

export function StatsCards({ cards, className }: StatsCardsProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'from-blue-100 to-indigo-100',
        icon: 'text-blue-600',
        value: 'text-blue-600'
      },
      green: {
        bg: 'from-green-100 to-emerald-100',
        icon: 'text-green-600',
        value: 'text-green-600'
      },
      yellow: {
        bg: 'from-yellow-100 to-orange-100',
        icon: 'text-yellow-600',
        value: 'text-yellow-600'
      },
      red: {
        bg: 'from-red-100 to-pink-100',
        icon: 'text-red-600',
        value: 'text-red-600'
      },
      sky: {
        bg: 'from-sky-100 to-blue-100',
        icon: 'text-sky-600',
        value: 'text-sky-600'
      },
      indigo: {
        bg: 'from-indigo-100 to-blue-100',
        icon: 'text-indigo-600',
        value: 'text-indigo-600'
      },
      pink: {
        bg: 'from-pink-100 to-rose-100',
        icon: 'text-pink-600',
        value: 'text-pink-600'
      },
      gray: {
        bg: 'from-gray-100 to-slate-100',
        icon: 'text-gray-600',
        value: 'text-gray-600'
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toLocaleString()
    }
    return value
  }

  return (
    <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6', className)}>
      {cards.map((card, index) => {
        const colorClasses = getColorClasses(card.color)
        
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                
                {card.loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <>
                    <p className={clsx('text-3xl font-bold mb-1', colorClasses.value)}>
                      {formatValue(card.value)}
                    </p>
                    
                    {card.change && (
                      <div className={clsx(
                        'flex items-center text-sm',
                        getChangeColor(card.change.type)
                      )}>
                        {getChangeIcon(card.change.type)}
                        <span className="ml-1">
                          {Math.abs(card.change.value)}%
                          {card.change.label && ` ${card.change.label}`}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className={clsx(
                'h-12 w-12 bg-gradient-to-br rounded-xl flex items-center justify-center flex-shrink-0',
                colorClasses.bg
              )}>
                <div className={colorClasses.icon}>
                  {typeof card.icon === 'function' ? React.createElement(card.icon) : card.icon}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Skeleton loader for stats cards
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 shadow-lg p-6"
        >
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
