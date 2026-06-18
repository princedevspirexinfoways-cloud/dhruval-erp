'use client'

import { Eye, Edit, Trash2, MapPin, User, Package, Plus, Loader2, FileText, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { StockMovement } from './types'
import { formatDate, getMovementIcon, getMovementBadge, getStatusBadge, getQuantityColor } from './utils'
import clsx from 'clsx'

interface MovementsTableProps {
  theme: 'light' | 'dark'
  movements: StockMovement[]
  isLoading: boolean
  searchTerm: string
  typeFilter: string
  statusFilter: string
  onViewDetails: (movement: StockMovement) => void
  onEdit: (movement: StockMovement) => void
  onDelete: (movement: StockMovement) => void
  onCreateClick: () => void
}

export function MovementsTable({
  theme,
  movements,
  isLoading,
  searchTerm,
  typeFilter,
  statusFilter,
  onViewDetails,
  onEdit,
  onDelete,
  onCreateClick
}: MovementsTableProps) {
  const router = useRouter()

  const handleViewDetails = (movement: StockMovement) => {
    router.push(`/inventory/movements/${movement._id}`)
  }
  if (isLoading) {
    return (
      <div className={`rounded-xl border shadow-lg p-8 transition-theme ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-sky-200'
      }`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-4" />
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Loading movements...</p>
        </div>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className={`rounded-xl border shadow-lg p-8 transition-theme ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-sky-200'
      }`}>
        <div className="text-center">
          <Package className={`h-16 w-16 mx-auto mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>No stock movements found</h3>
          <p className={`mb-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first stock movement.'
            }
          </p>
          {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
            <Button onClick={onCreateClick} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Movement
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border shadow-lg overflow-hidden transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-sky-200'
    }`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Movement #
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Type
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Item
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Quantity
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Locations
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Reference
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Status
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Date
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {movements.map((movement) => {
              const referenceDoc = (movement as any).referenceDocument
              const approval = (movement as any).approval
              const status = approval?.status || movement.status || 'completed'
              
              return (
                <tr key={movement._id} className={`transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}>
                  {/* Movement Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Hash className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {movement.movementNumber}
                      </span>
                    </div>
                  </td>
                  
                  {/* Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className={getMovementBadge(movement.movementType, theme)}>
                        {getMovementIcon(movement.movementType, theme)}
                        <span className="capitalize">{movement.movementType}</span>
                      </span>
                    </div>
                  </td>
                  
                  {/* Item */}
                  <td className="px-6 py-4">
                    <div>
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {typeof movement.itemId === 'object' && movement.itemId?.itemName ? movement.itemId.itemName : movement.itemName || 'Unknown Item'}
                      </div>
                      <div className={`text-xs capitalize mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {typeof movement.itemId === 'object' && movement.itemId?.category?.primary ? movement.itemId.category.primary : 'N/A'}
                        {typeof movement.itemId === 'object' && movement.itemId?.category?.secondary && ` • ${movement.itemId.category.secondary}`}
                      </div>
                    </div>
                  </td>
                  
                  {/* Quantity */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={clsx("text-sm font-bold", getQuantityColor(movement.movementType, movement.quantity, theme))}>
                      {movement.movementType === 'outward' ? '-' : movement.quantity > 0 ? '+' : ''}{Math.abs(movement.quantity)} {typeof movement.itemId === 'object' && movement.itemId?.stock?.unit ? movement.itemId.stock.unit : (movement as any).stock?.unit || movement.unit || 'PCS'}
                    </div>
                  </td>
                  
                  {/* Locations */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {movement.fromLocation && (
                        <div className="flex items-start space-x-1 mb-1">
                          <MapPin className={`h-3 w-3 mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                          <div>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>From: </span>
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {typeof movement.fromLocation === 'string'
                                ? movement.fromLocation
                                : movement.fromLocation?.warehouseName || 'N/A'
                              }
                            </span>
                            {typeof movement.fromLocation === 'object' && movement.fromLocation?.isExternal && (
                              <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                                (External)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {movement.toLocation && (
                        <div className="flex items-start space-x-1">
                          <MapPin className={`h-3 w-3 mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                          <div>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>To: </span>
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {typeof movement.toLocation === 'string'
                                ? movement.toLocation
                                : movement.toLocation?.warehouseName || 'N/A'
                              }
                            </span>
                            {typeof movement.toLocation === 'object' && movement.toLocation?.isExternal && (
                              <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                                (External)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Reference Document */}
                  <td className="px-6 py-4">
                    {referenceDoc ? (
                      <div className="flex items-center space-x-2">
                        <FileText className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <div>
                          <div className={`text-xs font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {referenceDoc.documentNumber || 'N/A'}
                          </div>
                          <div className={`text-xs capitalize ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {referenceDoc.documentType?.replace('_', ' ') || 'Manual'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        N/A
                      </span>
                    )}
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(status, theme)}>
                      {status}
                    </span>
                  </td>
                  
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatDate(movement.timestamp || movement.movementDate || movement.createdAt)}
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(movement)}
                        className={`${theme === 'dark' ? 'text-sky-400 hover:text-sky-300 hover:bg-sky-900/20' : 'text-sky-600 hover:text-sky-900 hover:bg-sky-50'} p-1.5 rounded-lg transition-colors`}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(movement)}
                        className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'} p-1.5 rounded-lg transition-colors`}
                        title="Edit Movement"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(movement)}
                        className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-900 hover:bg-red-50'} p-1.5 rounded-lg transition-colors`}
                        title="Delete Movement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

