import React, { useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calendar,
  Filter,
  Download,
  Eye,
  Users,
  Car,
  Hotel,
  Utensils,
  Gift,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CustomerVisit } from '@/lib/features/hospitality/hospitalityApi'
import { format } from 'date-fns'

interface ExpenseTrackingProps {
  visits: CustomerVisit[]
  isLoading: boolean
  onExport?: () => void
}

interface ExpenseBreakdown {
  accommodation: number
  food: number
  transportation: number
  gifts: number
  other: number
  total: number
}

interface ExpenseAnalytics {
  totalVisits: number
  totalExpenses: number
  avgExpensePerVisit: number
  highestExpense: number
  lowestExpense: number
  expenseTrend: 'up' | 'down' | 'stable'
  categoryBreakdown: {
    accommodation: { total: number; percentage: number }
    food: { total: number; percentage: number }
    transportation: { total: number; percentage: number }
    gifts: { total: number; percentage: number }
    other: { total: number; percentage: number }
  }
  monthlyBreakdown: Array<{
    month: string
    total: number
    visits: number
    avgPerVisit: number
  }>
  statusBreakdown: {
    pending: number
    approved: number
    rejected: number
    reimbursed: number
  }
}

export default function ExpenseTracking({ visits, isLoading, onExport }: ExpenseTrackingProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateAnalytics = (): ExpenseAnalytics => {
    if (!visits.length) {
      return {
        totalVisits: 0,
        totalExpenses: 0,
        avgExpensePerVisit: 0,
        highestExpense: 0,
        lowestExpense: 0,
        expenseTrend: 'stable',
        categoryBreakdown: {
          accommodation: { total: 0, percentage: 0 },
          food: { total: 0, percentage: 0 },
          transportation: { total: 0, percentage: 0 },
          gifts: { total: 0, percentage: 0 },
          other: { total: 0, percentage: 0 }
        },
        monthlyBreakdown: [],
        statusBreakdown: {
          pending: 0,
          approved: 0,
          rejected: 0,
          reimbursed: 0
        }
      }
    }

    // Calculate totals
    const totalExpenses = visits.reduce((sum, visit) => {
      const visitTotal = visit.totalExpenses?.total || visit.travelExpenses?.total || 0
      return sum + visitTotal
    }, 0)

    const expenses = visits.map(visit => visit.totalExpenses?.total || visit.travelExpenses?.total || 0)
    const highestExpense = Math.max(...expenses)
    const lowestExpense = Math.min(...expenses)

    // Category breakdown
    const categoryTotals = visits.reduce((acc, visit) => {
      const expenses = visit.totalExpenses || visit.travelExpenses || {}
      acc.accommodation += expenses.accommodation || 0
      acc.food += expenses.food || 0
      acc.transportation += expenses.transportation || expenses.transport || 0
      acc.gifts += expenses.gifts || 0
      acc.other += expenses.other || 0
      return acc
    }, {
      accommodation: 0,
      food: 0,
      transportation: 0,
      gifts: 0,
      other: 0
    })

    const categoryBreakdown = {
      accommodation: { 
        total: categoryTotals.accommodation, 
        percentage: totalExpenses > 0 ? (categoryTotals.accommodation / totalExpenses) * 100 : 0 
      },
      food: { 
        total: categoryTotals.food, 
        percentage: totalExpenses > 0 ? (categoryTotals.food / totalExpenses) * 100 : 0 
      },
      transportation: { 
        total: categoryTotals.transportation, 
        percentage: totalExpenses > 0 ? (categoryTotals.transportation / totalExpenses) * 100 : 0 
      },
      gifts: { 
        total: categoryTotals.gifts, 
        percentage: totalExpenses > 0 ? (categoryTotals.gifts / totalExpenses) * 100 : 0 
      },
      other: { 
        total: categoryTotals.other, 
        percentage: totalExpenses > 0 ? (categoryTotals.other / totalExpenses) * 100 : 0 
      }
    }

    // Monthly breakdown
    const monthlyData = visits.reduce((acc, visit) => {
      const month = format(new Date(visit.visitDate), 'MMM yyyy')
      const visitTotal = visit.totalExpenses?.total || visit.travelExpenses?.total || 0
      
      if (!acc[month]) {
        acc[month] = { total: 0, visits: 0 }
      }
      acc[month].total += visitTotal
      acc[month].visits += 1
      return acc
    }, {} as Record<string, { total: number; visits: number }>)

    const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      total: data.total,
      visits: data.visits,
      avgPerVisit: data.visits > 0 ? data.total / data.visits : 0
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Status breakdown
    const statusBreakdown = visits.reduce((acc, visit) => {
      acc[visit.approvalStatus] = (acc[visit.approvalStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Determine trend
    let expenseTrend: 'up' | 'down' | 'stable' = 'stable'
    if (monthlyBreakdown.length >= 2) {
      const lastMonth = monthlyBreakdown[monthlyBreakdown.length - 1]
      const secondLastMonth = monthlyBreakdown[monthlyBreakdown.length - 2]
      if (lastMonth.avgPerVisit > secondLastMonth.avgPerVisit) {
        expenseTrend = 'up'
      } else if (lastMonth.avgPerVisit < secondLastMonth.avgPerVisit) {
        expenseTrend = 'down'
      }
    }

    return {
      totalVisits: visits.length,
      totalExpenses,
      avgExpensePerVisit: visits.length > 0 ? totalExpenses / visits.length : 0,
      highestExpense,
      lowestExpense,
      expenseTrend,
      categoryBreakdown,
      monthlyBreakdown,
      statusBreakdown: {
        pending: statusBreakdown.pending || 0,
        approved: statusBreakdown.approved || 0,
        rejected: statusBreakdown.rejected || 0,
        reimbursed: statusBreakdown.reimbursed || 0
      }
    }
  }

  const analytics = calculateAnalytics()

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
              Expense Tracking & Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive expense analysis and tracking for customer visits
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={onExport}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Expenses</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(analytics.totalExpenses)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Avg Per Visit</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(analytics.avgExpensePerVisit)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Visits</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analytics.totalVisits}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Expense Trend</p>
                <div className="flex items-center">
                  {analytics.expenseTrend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400 mr-1" />
                  ) : analytics.expenseTrend === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400 mr-1" />
                  ) : (
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded mr-1" />
                  )}
                  <span className="text-lg font-semibold text-orange-900 dark:text-orange-100 capitalize">
                    {analytics.expenseTrend}
                  </span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Expense Category Breakdown
            </h3>
            
            <div className="space-y-3">
              {Object.entries(analytics.categoryBreakdown).map(([category, data]) => (
                <div key={category} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center">
                    {category === 'accommodation' && <Hotel className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />}
                    {category === 'food' && <Utensils className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />}
                    {category === 'transportation' && <Car className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />}
                    {category === 'gifts' && <Gift className="w-4 h-4 mr-2 text-pink-600 dark:text-pink-400" />}
                    {category === 'other' && <AlertTriangle className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{category}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.total)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{data.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Approval Status Breakdown
            </h3>
            
            <div className="space-y-3">
              {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center">
                    {status === 'pending' && <Clock className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />}
                    {status === 'approved' && <CheckCircle className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />}
                    {status === 'rejected' && <AlertTriangle className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />}
                    {status === 'reimbursed' && <DollarSign className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{status}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{count}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {analytics.totalVisits > 0 ? ((count / analytics.totalVisits) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        {analytics.monthlyBreakdown.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Monthly Expense Breakdown
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Month</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Total Expenses</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Visits</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Avg Per Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.monthlyBreakdown.map((month, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 text-sm text-gray-900 dark:text-white">{month.month}</td>
                      <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-medium">
                        {formatCurrency(month.total)}
                      </td>
                      <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{month.visits}</td>
                      <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-medium">
                        {formatCurrency(month.avgPerVisit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expense Range */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Range</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Highest Expense</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(analytics.highestExpense)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lowest Expense</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(analytics.lowestExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
