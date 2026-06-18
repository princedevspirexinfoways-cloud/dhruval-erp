'use client'

import { ReactNode } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { ResponsiveCard } from './ResponsiveCard'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
  showBack?: boolean
  onBack?: () => void
  showRefresh?: boolean
  onRefresh?: () => void
  refreshing?: boolean
  className?: string
  variant?: 'emerald' | 'purple' | 'indigo' | 'rose' | 'amber' | 'sky'
}

export function PageHeader({
  title,
  description,
  icon,
  children,
  showBack = false,
  onBack,
  showRefresh = false,
  onRefresh,
  refreshing = false,
  className = '',
  variant = 'emerald'
}: PageHeaderProps) {
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'emerald':
        return {
          gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          icon: 'text-emerald-600',
          accent: 'text-emerald-100'
        }
      case 'purple':
        return {
          gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
          icon: 'text-purple-600',
          accent: 'text-purple-100'
        }
      case 'indigo':
        return {
          gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
          icon: 'text-indigo-600',
          accent: 'text-indigo-100'
        }
      case 'rose':
        return {
          gradient: 'bg-gradient-to-r from-rose-500 to-rose-600',
          icon: 'text-rose-600',
          accent: 'text-rose-100'
        }
      case 'amber':
        return {
          gradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
          icon: 'text-amber-600',
          accent: 'text-amber-100'
        }
      case 'sky':
        return {
          gradient: 'bg-gradient-to-r from-sky-500 to-sky-600',
          icon: 'text-sky-600',
          accent: 'text-sky-100'
        }
      default:
        return {
          gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          icon: 'text-emerald-600',
          accent: 'text-emerald-100'
        }
    }
  }

  const variantClasses = getVariantClasses()

  return (
    <div className={`mb-6 ${className}`}>
      {/* Main Header */}
      <ResponsiveCard className={`${variantClasses.gradient} text-white shadow-lg`} padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {showBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 border-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {description && (
                  <p className={`text-sm ${variantClasses.accent} mt-1`}>
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {showRefresh && (
              <Button
                onClick={onRefresh}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 border-white/30"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            {children}
          </div>
        </div>
      </ResponsiveCard>

      {/* Decorative Bottom Border */}
      <div className={`h-1 ${variantClasses.gradient} rounded-b-lg shadow-sm`}></div>
    </div>
  )
}

// All preset variants use Emerald Green for consistency
export const DashboardHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const UserManagementHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const CompanyManagementHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const InventoryHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const FinancialHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const SecurityHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const ReportsHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const OperationsHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const SalesHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)

export const PurchaseHeader = (props: Omit<PageHeaderProps, 'variant'>) => (
  <PageHeader {...props} variant="emerald" />
)
