'use client'

import { useGetWarehouseStatsQuery } from '@/lib/api/warehousesApi'
import { 
  Warehouse, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface WarehouseStatsProps {
  companyId: string
}

export function WarehouseStats({ companyId }: WarehouseStatsProps) {
  const { data: statsData, isLoading, error } = useGetWarehouseStatsQuery()

  const stats = statsData?.data

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Statistics</h3>
        <p className="text-red-600">Failed to load warehouse statistics. Please try again.</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Statistics Available</h3>
        <p className="text-gray-600">No warehouse statistics found for this company.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Warehouses */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Warehouses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalWarehouses || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Warehouses */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Warehouses</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeWarehouses || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Capacity */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-3xl font-bold text-gray-900">
                {(stats.totalCapacity?.weight || 0).toLocaleString()} kg
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Average Utilization */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
              <p className="text-3xl font-bold text-orange-600">
                {stats.averageUtilization || 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Types Distribution */}
      {stats.warehousesByType && Object.keys(stats.warehousesByType).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.warehousesByType).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Warehouses by Utilization */}
      {stats.topWarehouses && stats.topWarehouses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Warehouses by Utilization</h3>
          <div className="space-y-4">
            {stats.topWarehouses.map((warehouse, index) => (
              <div key={warehouse._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-sky-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{warehouse.warehouseName}</h4>
                    <p className="text-xs text-gray-500">{warehouse.currentWeight} / {warehouse.maxWeight} kg</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {warehouse.utilizationPercentage}%
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(warehouse.utilizationPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:border-sky-300 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Warehouse className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Add Warehouse</h4>
                <p className="text-xs text-gray-500">Create new storage facility</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg hover:border-sky-300 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">View Inventory</h4>
                <p className="text-xs text-gray-500">Check stock levels</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg hover:border-sky-300 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Generate Report</h4>
                <p className="text-xs text-gray-500">Export warehouse data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
