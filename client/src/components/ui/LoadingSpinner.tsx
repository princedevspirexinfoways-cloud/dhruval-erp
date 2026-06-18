'use client'

import { Loader2, Building2, Zap, Shield, BarChart3 } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/ui/Logo'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={clsx('flex flex-col items-center justify-center space-y-2', className)}>
      <Loader2 className={clsx('animate-spin text-blue-600', sizeClasses[size])} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )
}

// Modern Professional App Loader
interface AppLoaderProps {
  message?: string
  showLogo?: boolean
  showFeatures?: boolean
  className?: string
  variant?: 'default' | 'minimal' | 'corporate'
}

export function AppLoader({
  message = "Loading...",
  showLogo = true,
  className,
  variant = 'default'
}: AppLoaderProps) {
  if (variant === 'minimal') {
    return (
      <div className={clsx('min-h-screen bg-gray-50 flex items-center justify-center', className)}>
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-300 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    )
  }

  if (variant === 'corporate') {
    return (
      <div className={clsx('min-h-screen bg-slate-900 flex items-center justify-center', className)}>
        <div className="text-center max-w-sm mx-auto px-6">
          {showLogo && (
            <div className="mb-8">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Logo width={48} height={48} className="rounded-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">Enterprise ERP</h2>
              <p className="text-sm text-slate-400">Business Management System</p>
            </div>
          )}

          <div className="mb-6">
            <div className="relative w-10 h-10 mx-auto mb-4">
              <div className="absolute inset-0 border-3 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-3 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-300">{message}</p>
          </div>
        </div>
      </div>
    )
  }

  // Default modern loader
  return (
    <div className={clsx('min-h-screen bg-white flex items-center justify-center', className)}>
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Logo Section */}
        {showLogo && (
          <div className="mb-10">
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Logo Container with subtle shadow */}
              <div className="w-24 h-24 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
                <Logo width={72} height={72} className="rounded-xl relative z-10" />
              </div>
            </div>

            {/* Company Name */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enterprise ERP</h1>
            <p className="text-sm text-gray-500 font-medium">Business Management System</p>
          </div>
        )}

        {/* Loading Animation */}
        <div className="mb-8">
          {/* Modern Spinner */}
          <div className="relative w-14 h-14 mx-auto mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            {/* Animated ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
            {/* Inner dot */}
            <div className="absolute inset-4 bg-blue-600 rounded-full opacity-20"></div>
          </div>

          {/* Loading Message */}
          <p className="text-base font-semibold text-gray-700 mb-2">{message}</p>

          {/* Progress Indicator */}
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-100"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-200"></div>
        </div>

        {/* Subtle Footer */}
        <div className="mt-12">
          <p className="text-xs text-gray-400">Powered by Next.js & React</p>
        </div>
      </div>
    </div>
  )
}

// Compact Loader for smaller spaces
interface CompactLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'dots' | 'pulse'
}

export function CompactLoader({
  message = "Loading...",
  size = 'md',
  className,
  variant = 'default'
}: CompactLoaderProps) {
  const sizeClasses = {
    sm: { spinner: 'w-6 h-6', text: 'text-sm', dots: 'w-1 h-1' },
    md: { spinner: 'w-8 h-8', text: 'text-base', dots: 'w-2 h-2' },
    lg: { spinner: 'w-12 h-12', text: 'text-lg', dots: 'w-3 h-3' }
  }

  if (variant === 'dots') {
    return (
      <div className={clsx('flex flex-col items-center justify-center space-y-4 p-8', className)}>
        <div className="flex items-center space-x-1">
          <div className={clsx('bg-blue-600 rounded-full animate-bounce', sizeClasses[size].dots)}></div>
          <div className={clsx('bg-blue-500 rounded-full animate-bounce animation-delay-100', sizeClasses[size].dots)}></div>
          <div className={clsx('bg-blue-400 rounded-full animate-bounce animation-delay-200', sizeClasses[size].dots)}></div>
        </div>
        <p className={clsx('font-medium text-gray-700 text-center', sizeClasses[size].text)}>
          {message}
        </p>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={clsx('flex flex-col items-center justify-center space-y-4 p-8', className)}>
        <div className={clsx('bg-blue-600 rounded-full animate-pulse', sizeClasses[size].spinner)}></div>
        <p className={clsx('font-medium text-gray-700 text-center', sizeClasses[size].text)}>
          {message}
        </p>
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col items-center justify-center space-y-4 p-8', className)}>
      {/* Elegant Spinner */}
      <div className={clsx('relative', sizeClasses[size].spinner)}>
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
      </div>

      {/* Message */}
      <p className={clsx('font-medium text-gray-700 text-center', sizeClasses[size].text)}>
        {message}
      </p>
    </div>
  )
}

// Page Loading Component
interface PageLoaderProps {
  title?: string
  message?: string
  className?: string
}

export function PageLoader({
  title = "Loading Page",
  message = "Please wait while we load your content...",
  className
}: PageLoaderProps) {
  return (
    <div className={clsx('min-h-[60vh] flex items-center justify-center', className)}>
      <div className="text-center max-w-md mx-auto px-6">
        {/* Loading Animation */}
        <div className="mb-6">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-gray-100 rounded-full"></div>
            <div className="absolute inset-2 border-2 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '45%' }}></div>
        </div>
      </div>
    </div>
  )
}

interface SkeletonLoaderProps {
  rows?: number
  className?: string
}

export function SkeletonLoader({ rows = 6, className }: SkeletonLoaderProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-lg p-6', className)}>
      <div className="animate-pulse space-y-4">
        {[...Array(rows)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ErrorStateProps {
  title: string
  message: string
  icon?: React.ReactNode
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title, message, icon, onRetry, className }: ErrorStateProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-red-500 shadow-lg p-6 text-center', className)}>
      {icon && <div className="mx-auto mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  message: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ title, message, icon, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-lg p-6 text-center', className)}>
      {icon && <div className="mx-auto mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
