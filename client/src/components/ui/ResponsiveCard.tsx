'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
  border?: boolean
  shadow?: 'sm' | 'md' | 'lg' | 'none'
}

export function ResponsiveCard({ 
  children, 
  className,
  padding = 'md',
  hover = true,
  border = true,
  shadow = 'sm'
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5 lg:p-6',
    lg: 'p-5 sm:p-6 lg:p-8'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl',
      paddingClasses[padding],
      border && 'border border-gray-100 dark:border-gray-700',
      shadowClasses[shadow],
      hover && 'hover:shadow-md transition-shadow duration-200',
      className
    )}>
      {children}
    </div>
  )
}
