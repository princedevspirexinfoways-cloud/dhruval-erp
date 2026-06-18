'use client'

import { useState, Suspense, lazy } from 'react'
import { Download, Maximize2, Filter } from 'lucide-react'
import clsx from 'clsx'

// Lazy load chart components for better performance
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
const AreaChart = lazy(() => import('recharts').then(module => ({ default: module.AreaChart })))
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })))

interface ChartContainerProps {
  title: string
  subtitle?: string
  data: any[]
  loading?: boolean
  error?: string
  height?: number
  children: React.ReactNode
  actions?: {
    onDownload?: () => void
    onFullscreen?: () => void
    onFilter?: () => void
    customActions?: Array<{
      label: string
      onClick: () => void
      icon?: React.ReactNode
    }>
  }
  filters?: React.ReactNode
  className?: string
}

export function ChartContainer({
  title,
  subtitle,
  data,
  loading = false,
  error,
  height = 300,
  children,
  actions,
  filters,
  className
}: ChartContainerProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleDownload = async () => {
    // Convert chart data to CSV and download
    if (data && data.length > 0) {
      try {
        // Import download utility dynamically to avoid SSR issues
        const { downloadCSV } = await import('@/utils/downloadUtils')

        const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_data.csv`
        const success = await downloadCSV(data, filename)

        if (!success) {
          // Fallback to original method
          const headers = Object.keys(data[0]).join(',')
          const rows = data.map(row => Object.values(row).join(',')).join('\n')
          const csv = `${headers}\n${rows}`

          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error('Chart download failed:', error)
        // Fallback to original method
        const headers = Object.keys(data[0]).join(',')
        const rows = data.map(row => Object.values(row).join(',')).join('\n')
        const csv = `${headers}\n${rows}`

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_data.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    }

    actions?.onDownload?.()
  }

  if (loading) {
    return (
      <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-lg p-6', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          {subtitle && <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>}
          <div className={`bg-gray-200 rounded`} style={{ height: `${height}px` }}></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={clsx('bg-white rounded-xl border border-red-500 shadow-lg p-6 text-center', className)}>
        <p className="text-red-600 mb-2">Failed to load chart</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-lg p-6 text-center', className)}>
        <div style={{ height: `${height}px` }} className="flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            {filters && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  showFilters 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                title="Toggle Filters"
              >
                <Filter className="h-4 w-4" />
              </button>
            )}
            
            {actions?.customActions?.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
            
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download Data"
            >
              <Download className="h-4 w-4" />
            </button>
            
            {actions?.onFullscreen && (
              <button
                onClick={actions.onFullscreen}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        {filters && showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {filters}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <div style={{ height: `${height}px` }}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// Chart skeleton loader
export function ChartSkeleton({ height = 300, className }: { height?: number; className?: string }) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-lg p-6', className)}>
      <div className="animate-pulse">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className={`bg-gray-200 rounded`} style={{ height: `${height}px` }}></div>
      </div>
    </div>
  )
}

// Pre-configured chart components
export function LineChartContainer(props: Omit<ChartContainerProps, 'children'> & { 
  lines: Array<{ dataKey: string; stroke: string; name?: string }> 
}) {
  return (
    <ChartContainer {...props}>
      <Suspense fallback={<div>Loading chart...</div>}>
        {/* Chart implementation would go here */}
      </Suspense>
    </ChartContainer>
  )
}

export function BarChartContainer(props: Omit<ChartContainerProps, 'children'> & { 
  bars: Array<{ dataKey: string; fill: string; name?: string }> 
}) {
  return (
    <ChartContainer {...props}>
      <Suspense fallback={<div>Loading chart...</div>}>
        {/* Chart implementation would go here */}
      </Suspense>
    </ChartContainer>
  )
}
