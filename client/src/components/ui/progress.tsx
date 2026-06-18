'use client'

import { HTMLAttributes } from 'react'
import clsx from 'clsx'

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
}

export function Progress({ 
  value, 
  max = 100, 
  className,
  size = 'md',
  color = 'blue',
  ...props 
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500'
  }

  return (
    <div 
      className={clsx(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div 
        className={clsx(
          'h-full rounded-full transition-all duration-300 ease-in-out',
          colorClasses[color]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
