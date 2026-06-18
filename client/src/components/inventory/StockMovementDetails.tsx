'use client'

import {
  X,
  Edit,
  Trash2,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'

interface StockMovementDetailsProps {
  movement: any
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  canEdit?: boolean
  canDelete?: boolean
  theme?: 'light' | 'dark'
}

export function StockMovementDetails({
  movement,
  onClose,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  theme = 'light'
}: StockMovementDetailsProps) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'inward':
        return <ArrowDown className="w-5 h-5 text-green-500" />
      case 'outward':
        return <ArrowUp className="w-5 h-5 text-red-500" />
      case 'transfer':
        return <RefreshCw className="w-5 h-5 text-blue-500" />
      case 'adjustment':
        return <ArrowUpDown className="w-5 h-5 text-purple-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getMovementBadge = (type: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full flex items-center space-x-2"
    switch (type) {
      case 'inward':
        return `${baseClasses} ${theme === 'dark' ? 'bg-green-900/30 text-green-400 border border-green-700/50' : 'bg-green-100 text-green-700 border border-green-200'}`
      case 'outward':
        return `${baseClasses} ${theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-700/50' : 'bg-red-100 text-red-700 border border-red-200'}`
      case 'transfer':
        return `${baseClasses} ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' : 'bg-blue-100 text-blue-700 border border-blue-200'}`
      case 'adjustment':
      case 'adjustment_note':
        return `${baseClasses} ${theme === 'dark' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' : 'bg-purple-100 text-purple-700 border border-purple-200'}`
      default:
        return `${baseClasses} ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`
    }
  }

  const getStatusBadge = (status?: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full flex items-center space-x-2"
    switch (status) {
      case 'completed':
        return `${baseClasses} ${theme === 'dark' ? 'bg-green-900/30 text-green-400 border border-green-700/50' : 'bg-green-100 text-green-700 border border-green-200'}`
      case 'pending':
        return `${baseClasses} ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`
      case 'cancelled':
        return `${baseClasses} ${theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-700/50' : 'bg-red-100 text-red-700 border border-red-200'}`
      case 'in_progress':
        return `${baseClasses} ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' : 'bg-blue-100 text-blue-700 border border-blue-200'}`
      default:
        return `${baseClasses} ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'in_progress':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
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

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-theme ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'
      }`}>
      <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-theme border ${theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
        }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-theme ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>Stock Movement Details</h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Movement #{movement.movementNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            )}
            {canDelete && (
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className={`flex items-center space-x-2 ${theme === 'dark'
                    ? 'text-red-400 border-red-700/50 hover:bg-red-900/20'
                    : 'text-red-600 border-red-200 hover:bg-red-50'
                  }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500'
                }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Movement Overview */}
          <div className={`rounded-xl p-6 border transition-theme ${theme === 'dark'
              ? 'bg-gradient-to-r from-sky-900/20 to-blue-900/20 border-sky-700/50'
              : 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200'
            }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                  }`}>
                  {getMovementIcon(movement.movementType)}
                </div>
                <div className={getMovementBadge(movement.movementType)}>
                  {getMovementIcon(movement.movementType)}
                  <span className="capitalize">{movement.movementType || 'Unknown'}</span>
                </div>
              </div>

              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                  {movement.quantity}
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  {movement.unit || 'PCS'} {movement.movementType === 'outward' ? 'Moved Out' : 'Moved In'}
                </p>
              </div>

              <div className="text-center">
                <div className={getStatusBadge(movement.status)}>
                  {getStatusIcon(movement.status)}
                  <span className="capitalize">{movement.status?.replace('_', ' ') || 'Unknown'}</span>
                </div>
                {movement.priority && (
                  <div className="mt-2">
                    <span className={getPriorityBadge(movement.priority)}>
                      {movement.priority} Priority
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Item Information */}
          <div className={`rounded-xl border p-6 transition-theme ${theme === 'dark'
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white border-gray-200'
            }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
              <Package className={`w-5 h-5 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`} />
              <span>Item Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Item Name</label>
                <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                  {movement.itemId?.itemName || movement.itemName || 'N/A'}
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Item Code</label>
                <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                  {movement.itemId?.itemCode || movement.companyItemCode || movement.itemCode || 'N/A'}
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Category</label>
                <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                  {movement.itemId?.category?.primary || movement.category?.primary || 'N/A'}
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Unit</label>
                <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                  {movement.itemId?.stock?.unit || movement.stock?.unit || movement.unit || 'PCS'}
                </p>
              </div>
              {movement.itemId?.pricing && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>Cost Price</label>
                    <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>₹{movement.itemId.pricing.costPrice || 0}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>Selling Price</label>
                    <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>₹{movement.itemId.pricing.sellingPrice || 0}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Movement Details */}
          <div className={`rounded-xl border p-6 transition-theme ${theme === 'dark'
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white border-gray-200'
            }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
              <ArrowUpDown className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <span>Movement Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>From Location</label>
                <div className="flex items-center space-x-2">
                  <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                    {typeof movement.fromLocation === 'string'
                      ? movement.fromLocation
                      : movement.fromLocation?.warehouseName || 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>To Location</label>
                <div className="flex items-center space-x-2">
                  <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                    {typeof movement.toLocation === 'string'
                      ? movement.toLocation
                      : movement.toLocation?.warehouseName || 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Movement Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{formatDate(movement.movementDate)}</p>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Created Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{formatDate(movement.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Document */}
          <div className={`rounded-xl border p-6 transition-theme ${theme === 'dark'
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white border-gray-200'
            }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
              <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
              <span>Reference Document</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Document Type</label>
                <p className={`capitalize ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                  {movement.referenceDocument?.documentType?.replace('_', ' ') || movement.referenceDocument?.type?.replace('_', ' ') || 'Manual Entry'}
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Reference Number</label>
                <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                  {movement.referenceDocument?.documentNumber || movement.referenceDocument?.number || 'N/A'}
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Document Date</label>
                <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                  {movement.referenceDocument?.date ? formatDate(movement.referenceDocument.date) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Approval & Status */}
          {(movement.requiresApproval || movement.approval) && (
            <div className={`rounded-xl border p-6 transition-theme ${theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white border-gray-200'
              }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                <CheckCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                <span>Approval & Status</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Approval Required</label>
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                    {movement.requiresApproval ? 'Yes' : 'No'}
                  </p>
                </div>
                {movement.approval && (
                  <>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Approval Status</label>
                      <div className={getStatusBadge(movement.approval.status)}>
                        {getStatusIcon(movement.approval.status)}
                        <span className="capitalize">{movement.approval.status?.replace('_', ' ') || 'Unknown'}</span>
                      </div>
                    </div>
                    {movement.approval.approvedBy && (
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Approved By</label>
                        <div className="flex items-center space-x-2">
                          <User className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{movement.approval.approvedBy}</p>
                        </div>
                      </div>
                    )}
                    {movement.approval.approvedAt && (
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Approved At</label>
                        <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{formatDate(movement.approval.approvedAt)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {movement.notes && (
            <div className={`rounded-xl border p-6 transition-theme ${theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white border-gray-200'
              }`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>Additional Notes</h3>
              <p className={`rounded-lg p-4 ${theme === 'dark'
                  ? 'text-gray-300 bg-gray-700/50'
                  : 'text-gray-700 bg-gray-50'
                }`}>{movement.notes}</p>
            </div>
          )}

          {/* Audit Information */}
          <div className={`rounded-xl p-6 transition-theme ${theme === 'dark'
              ? 'bg-gray-700/30 border border-gray-600'
              : 'bg-gray-50 border border-gray-200'
            }`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>Audit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Created By</label>
                <div className="flex items-center space-x-2">
                  <User className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                    {typeof movement.createdBy === 'object' && movement.createdBy?.personalInfo
                      ? `${movement.createdBy.personalInfo.firstName || ''} ${movement.createdBy.personalInfo.lastName || ''}`.trim() || movement.createdBy.username
                      : movement.createdBy || 'System'}
                  </p>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Last Updated</label>
                <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                  {movement.updatedAt ? formatDate(movement.updatedAt) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
