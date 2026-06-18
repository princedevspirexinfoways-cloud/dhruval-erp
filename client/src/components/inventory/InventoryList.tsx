import { Package, Tag, Warehouse, Eye, Edit, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { DataView } from '@/components/ui/DataView'
import { ViewMode } from '@/components/ui/ViewToggle'
import { InventoryPagination } from './InventoryPagination'
import { formatCurrency, getStatusBadge, getStockIcon, getStockStatus } from './inventoryUtils'
import clsx from 'clsx'

interface InventoryItem {
  _id: string
  itemName: string
  itemCode: string
  category?: {
    primary?: string
  }
  stock?: {
    currentStock: number
    availableStock: number
    unit: string
    reorderLevel: number
  }
  pricing?: {
    costPrice: number
    mrp: number
  }
  quality?: {
    qualityGrade: string
  }
  locations?: string[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface InventoryListProps {
  items: InventoryItem[]
  viewMode?: ViewMode
  isLoading?: boolean
  searchTerm?: string
  categoryFilter?: string
  statusFilter?: string
  isClient?: boolean
  pagination?: Pagination
  currentPage?: number
  onPageChange?: (page: number) => void
  onViewItem?: (item: InventoryItem) => void
  onViewDetails?: (item: InventoryItem) => void
  onEditItem: (item: InventoryItem) => void
  onDeleteItem?: (id: string) => void
  onMoveToScrap?: (item: InventoryItem) => void
  onGoodsReturn?: (item: InventoryItem) => void
  theme?: 'light' | 'dark'
}

export function InventoryList({
  items,
  viewMode = 'list',
  isLoading = false,
  searchTerm = '',
  categoryFilter = 'all',
  statusFilter = 'all',
  isClient = true,
  pagination,
  currentPage = 1,
  onPageChange,
  onViewItem,
  onViewDetails,
  onEditItem,
  onDeleteItem,
  onMoveToScrap,
  onGoodsReturn,
  theme = 'light'
}: InventoryListProps) {
  const handleViewItem = onViewItem || onViewDetails
  const columns = [
    {
      key: 'itemName',
      label: 'Item',
      render: (itemName: string, item: InventoryItem) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-blue-600' : 'bg-sky-500'
              }`}>
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-black'
              }`}>{itemName}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-black opacity-60'
              }`}>{item.itemCode}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (category: InventoryItem['category']) => (
        <div className="flex items-center">
          <Tag className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-sky-500'
            }`} />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-black'
            }`}>{category?.primary || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (stock: InventoryItem['stock']) => (
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
          <div className="font-medium">
            {stock?.currentStock || 0} {stock?.unit || 'units'}
          </div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'opacity-60'
            }`}>Available: {stock?.availableStock || 0}</div>
        </div>
      )
    },
    {
      key: 'pricing',
      label: 'Value',
      render: (pricing: InventoryItem['pricing']) => (
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
          <div className="font-medium">{formatCurrency(pricing?.costPrice || 0, isClient)}</div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'opacity-60'
            }`}>MRP: {formatCurrency(pricing?.mrp || 0, isClient)}</div>
        </div>
      )
    },
    {
      key: 'quality',
      label: 'Quality',
      render: (quality: InventoryItem['quality']) => (
        <div className="flex items-center">
          <Badge
            variant={quality?.qualityGrade === 'A' ? 'default' : 'secondary'}
            className={clsx(
              quality?.qualityGrade === 'A'
                ? theme === 'dark'
                  ? 'bg-green-900/30 text-green-400 border-green-700'
                  : 'bg-green-100 text-green-800'
                : theme === 'dark'
                  ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
                  : 'bg-yellow-100 text-yellow-800'
            )}
          >
            {quality?.qualityGrade || 'N/A'}
          </Badge>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, item: InventoryItem) => (
        <div className="flex items-center space-x-2 flex-wrap gap-1">
          {handleViewItem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewItem(item)}
              title="View Details"
              className={clsx(
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditItem(item)}
            title="Edit Item"
            className={clsx(
              theme === 'dark'
                ? 'border-blue-600 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                : 'border-blue-300 bg-white text-blue-600 hover:bg-blue-50'
            )}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {onMoveToScrap && (item.stock?.currentStock || 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMoveToScrap(item)}
              title="Move to Scrap"
              className={clsx(
                theme === 'dark'
                  ? 'border-orange-600 bg-orange-900/20 text-orange-400 hover:bg-orange-900/30'
                  : 'text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50'
              )}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          {onGoodsReturn && (item.stock?.currentStock || 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoodsReturn(item)}
              title="Goods Return"
              className={clsx(
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                  : 'text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50'
              )}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  const renderGridCard = (item: InventoryItem) => {
    const stockStatus = getStockStatus(
      item.stock?.currentStock || 0,
      item.stock?.reorderLevel || 0
    )

    return (
      <div className={`rounded-lg border p-4 hover:shadow-md transition-shadow ${theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-sky-200'
        }`}>
        <div className="flex items-center mb-3">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center mr-3 ${theme === 'dark' ? 'bg-blue-600' : 'bg-sky-500'
            }`}>
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className={`font-medium text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-black'
              }`}>{item.itemName}</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-black opacity-60'
              }`}>{item.itemCode}</p>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center">
            <Tag className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-sky-500'
              }`} />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-black'
              }`}>{item.category?.primary || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <Warehouse className={`w-4 h-4 mr-3 ${theme === 'dark' ? 'text-blue-400' : 'text-sky-500'
              }`} />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-black'
              }`}>
              {item.locations && item.locations.length > 0 ? item.locations[0] : 'No Location'}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-4 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-sky-200'
          }`}>
          <div>
            <div className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-black opacity-60'
              }`}>Stock</div>
            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-black'
              }`}>
              {item.stock?.currentStock || 0} {item.stock?.unit || 'units'}
            </div>
          </div>
          <div>
            <div className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-black opacity-60'
              }`}>Value</div>
            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-black'
              }`}>
              {formatCurrency(item.pricing?.costPrice || 0, isClient)}
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-between pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-sky-200'
          }`}>
          <span className={getStatusBadge(stockStatus)}>
            {getStockIcon(stockStatus)}
            {stockStatus === 'low_stock' ? 'Low Stock' : 'Normal'}
          </span>
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-black opacity-60'
            }`}>
            @ {formatCurrency(item.pricing?.costPrice || 0, isClient)}/{item.stock?.unit || 'unit'}
          </span>
        </div>

        <div className={`flex items-center space-x-2 pt-3 border-t mt-3 ${theme === 'dark' ? 'border-gray-700' : 'border-sky-200'
          }`}>
          {handleViewItem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewItem(item)}
              className={clsx(
                "flex-1",
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditItem(item)}
            className={clsx(
              "flex-1",
              theme === 'dark'
                ? 'border-blue-600 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                : 'border-blue-300 bg-white text-blue-600 hover:bg-blue-50'
            )}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {onMoveToScrap && (item.stock?.currentStock || 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMoveToScrap(item)}
              title="Move to Scrap"
              className={clsx(
                theme === 'dark'
                  ? 'border-orange-600 bg-orange-900/20 text-orange-400 hover:bg-orange-900/30'
                  : 'border-orange-300 text-orange-600 hover:bg-orange-50'
              )}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          {onGoodsReturn && (item.stock?.currentStock || 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoodsReturn(item)}
              title="Goods Return"
              className={clsx(
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                  : 'border-blue-300 text-blue-600 hover:bg-blue-50'
              )}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const emptyMessage =
    searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
      ? 'No items match your search criteria.'
      : 'No inventory items have been added yet.'

  return (
    <div className={`rounded-xl border-2 ${theme === 'dark'
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-sky-500'
      }`}>
      <DataView
        data={items}
        viewMode={viewMode}
        loading={isLoading}
        emptyMessage={emptyMessage}
        columns={columns}
        renderGridCard={renderGridCard}
        theme={theme}
        tableClassName={clsx(
          "min-w-full divide-y",
          theme === 'dark' ? 'divide-gray-700' : 'divide-sky-200'
        )}
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6"
      />
      {pagination && onPageChange && (
        <InventoryPagination
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={onPageChange}
          theme={theme}
        />
      )}
    </div>
  )
}
