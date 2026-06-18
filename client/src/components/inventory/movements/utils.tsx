import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Package
} from 'lucide-react'

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getMovementIcon = (type: string, theme: 'light' | 'dark' = 'light') => {
  switch (type) {
    case 'inward':
      return <ArrowDown className={`h-4 w-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
    case 'outward':
      return <ArrowUp className={`h-4 w-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
    case 'transfer':
      return <RefreshCw className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
    case 'adjustment':
    case 'adjustment_note':
      return <ArrowUpDown className={`h-4 w-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
    default:
      return <Package className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
  }
}

export const getMovementBadge = (type: string, theme: 'light' | 'dark' = 'light') => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1"
  switch (type) {
    case 'inward':
      return `${baseClasses} ${theme === 'dark' ? 'bg-green-900/30 text-green-400 border border-green-700/50' : 'bg-green-100 text-green-700'}`
    case 'outward':
      return `${baseClasses} ${theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-700/50' : 'bg-red-100 text-red-700'}`
    case 'transfer':
      return `${baseClasses} ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' : 'bg-blue-100 text-blue-700'}`
    case 'adjustment':
    case 'adjustment_note':
      return `${baseClasses} ${theme === 'dark' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' : 'bg-purple-100 text-purple-700'}`
    default:
      return `${baseClasses} ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-600'}`
  }
}

export const getStatusBadge = (status: string, theme: 'light' | 'dark' = 'light') => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
  switch (status) {
    case 'completed':
      return `${baseClasses} ${theme === 'dark' ? 'bg-green-900/30 text-green-400 border border-green-700/50' : 'bg-green-100 text-green-700'}`
    case 'pending':
      return `${baseClasses} ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' : 'bg-yellow-100 text-yellow-700'}`
    case 'cancelled':
      return `${baseClasses} ${theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-700/50' : 'bg-red-100 text-red-700'}`
    default:
      return `${baseClasses} ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-600'}`
  }
}

export const getQuantityColor = (type: string, quantity: number, theme: 'light' | 'dark' = 'light') => {
  if (type === 'adjustment' || type === 'adjustment_note') {
    return quantity > 0
      ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
      : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
  }
  switch (type) {
    case 'inward':
      return theme === 'dark' ? 'text-green-400' : 'text-green-600'
    case 'outward':
      return theme === 'dark' ? 'text-red-400' : 'text-red-600'
    case 'transfer':
      return theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
    default:
      return theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
  }
}

export const getPriorityBadge = (priority: string, theme: 'light' | 'dark' = 'light') => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
  switch (priority) {
    case 'urgent':
      return `${baseClasses} ${theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-700/50' : 'bg-red-100 text-red-700 border border-red-200'}`
    case 'high':
      return `${baseClasses} ${theme === 'dark' ? 'bg-orange-900/30 text-orange-400 border border-orange-700/50' : 'bg-orange-100 text-orange-700 border border-orange-200'}`
    case 'normal':
      return `${baseClasses} ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' : 'bg-blue-100 text-blue-700 border border-blue-200'}`
    case 'low':
      return `${baseClasses} ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`
    default:
      return `${baseClasses} ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`
  }
}

