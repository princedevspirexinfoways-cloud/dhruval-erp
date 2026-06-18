import { Package, AlertTriangle, TrendingUp, Warehouse } from 'lucide-react'
import { formatCurrency } from './inventoryUtils'

interface InventoryStats {
  totalItems?: number
  lowStockItems?: number
  totalValue?: number
  recentMovements?: number
}

interface InventoryStatsCardsProps {
  stats?: InventoryStats
  isClient: boolean
}

export function InventoryStatsCards({ stats, isClient }: InventoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-black">Total Items</p>
            <p className="text-2xl font-bold text-black">{stats?.totalItems || 0}</p>
          </div>
          <Package className="h-8 w-8 text-sky-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-black">Low Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats?.lowStockItems || 0}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-black">Total Value</p>
            <p className="text-2xl font-bold text-sky-600">
              {stats?.totalValue ? formatCurrency(stats.totalValue, isClient) : '₹0'}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-sky-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-black">Movements</p>
            <p className="text-2xl font-bold text-green-600">{stats?.recentMovements || 0}</p>
          </div>
          <Warehouse className="h-8 w-8 text-green-500" />
        </div>
      </div>
    </div>
  )
}
















