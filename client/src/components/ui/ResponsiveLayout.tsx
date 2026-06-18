import React from 'react'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function ResponsiveContainer({ 
  children, 
  className = '', 
  maxWidth = '2xl' 
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1 }, 
  gap = 'md',
  className = '' 
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  const getGridCols = (num: number) => {
    const colsMap: { [key: number]: string } = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12'
    }
    return colsMap[num] || 'grid-cols-1'
  }

  const gridClasses = [
    'grid',
    gapClasses[gap],
    cols.default ? getGridCols(cols.default) : 'grid-cols-1',
    cols.sm ? `sm:${getGridCols(cols.sm)}` : '',
    cols.md ? `md:${getGridCols(cols.md)}` : '',
    cols.lg ? `lg:${getGridCols(cols.lg)}` : '',
    cols.xl ? `xl:${getGridCols(cols.xl)}` : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

interface ResponsiveFlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col'
  wrap?: boolean
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'center' | 'end' | 'stretch'
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ResponsiveFlex({
  children,
  direction = 'row',
  wrap = false,
  justify = 'start',
  align = 'start',
  gap = 'md',
  className = ''
}: ResponsiveFlexProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const flexClasses = [
    'flex',
    direction === 'col' ? 'flex-col' : 'flex-row',
    wrap ? 'flex-wrap' : '',
    justifyClasses[justify],
    alignClasses[align],
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={flexClasses}>
      {children}
    </div>
  )
}
