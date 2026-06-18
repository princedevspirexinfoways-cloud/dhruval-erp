import React from 'react'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

export const formatCurrency = (amount: number, isClient: boolean = true) => {
  if (!isClient) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount)
}

export const getStatusBadge = (status: string) => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full flex items-center"
  switch (status) {
    case 'low_stock':
      return `${baseClasses} bg-red-100 text-red-600`
    case 'overstock':
      return `${baseClasses} bg-orange-100 text-orange-600`
    case 'normal':
      return `${baseClasses} bg-green-100 text-green-600`
    default:
      return `${baseClasses} bg-gray-100 text-gray-600`
  }
}

export const getStockIcon = (status: string): React.ReactElement | null => {
  switch (status) {
    case 'low_stock':
      return <TrendingDown className="h-3 w-3 mr-1" />
    case 'overstock':
      return <TrendingUp className="h-3 w-3 mr-1" />
    case 'normal':
      return <BarChart3 className="h-3 w-3 mr-1" />
    default:
      return null
  }
}

export const getStockStatus = (currentStock: number, reorderLevel: number): string => {
  return currentStock <= reorderLevel ? 'low_stock' : 'normal'
}
















