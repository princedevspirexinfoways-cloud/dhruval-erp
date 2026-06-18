import React from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Printer,
  Download,
  RefreshCw
} from 'lucide-react'
import { GatePass } from '@/lib/features/gatepasses/gatepassesApi'
import { generateGatePassPDF, GatePassPDFData } from '@/utils/gatePassPDFSimple'

interface GatePassTableProps {
  gatePasses: GatePass[]
  selectedGatePasses: string[]
  onSelectGatePass: (id: string) => void
  onSelectAll: () => void
  onView: (gatePass: GatePass) => void
  onEdit: (gatePass: GatePass) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
  onPrint: (id: string) => void
  isLoading: boolean
  isCompleting: boolean
  isCancelling: boolean
  isDeleting: boolean
  isPrinting: boolean
}

export default function GatePassTable({
  gatePasses,
  selectedGatePasses,
  onSelectGatePass,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
  onPrint,
  isLoading,
  isCompleting,
  isCancelling,
  isDeleting,
  isPrinting
}: GatePassTableProps) {
  // Debug logging
  console.log('GatePassTable - gatePasses:', gatePasses)
  console.log('GatePassTable - gatePasses length:', gatePasses?.length)
  console.log('GatePassTable - isLoading:', isLoading)
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircle },
      expired: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPurposeBadge = (purpose: string) => {
    const purposeConfig = {
      delivery: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      pickup: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      other: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }
    }
    
    const config = purposeConfig[purpose as keyof typeof purposeConfig] || purposeConfig.other
    
    return (
      <Badge className={config.color}>
        {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading gate passes...</span>
      </div>
    )
  }

  // Additional debugging
  if (!gatePasses || gatePasses.length === 0) {
    console.log('GatePassTable: No gate passes data available')
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="mb-4">
          <Car className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-gray-900 dark:text-gray-100">No gate passes found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          {isLoading ? 'Loading...' : 'Try adjusting your filters or create a new gate pass'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {gatePasses.map((gatePass) => (
          <div key={gatePass._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            {/* Header with checkbox and gate pass number */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedGatePasses.includes(gatePass._id)}
                  onChange={() => onSelectGatePass(gatePass._id)}
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{gatePass.gatePassNumber}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{getStatusBadge(gatePass.status)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(gatePass)}
                  title="View Details"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 p-2"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(gatePass)}
                  title="Edit"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 p-2"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Vehicle and Driver Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-900 dark:text-gray-100">{gatePass.vehicleNumber}</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{gatePass.driverName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{gatePass.driverPhone}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Purpose:</span>
                {getPurposeBadge(gatePass.purpose)}
              </div>
            </div>

            {/* Time Information */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">In:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date(gatePass.timeIn).toLocaleString()}
                </span>
              </div>
              {gatePass.timeOut && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Out:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {new Date(gatePass.timeOut).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {gatePass.status === 'active' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onComplete(gatePass._id)}
                    disabled={isCompleting}
                    title="Complete"
                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(gatePass._id)}
                    disabled={isCancelling}
                    title="Cancel"
                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-xs"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPrint(gatePass._id)}
                disabled={isPrinting}
                title="Print"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
              >
                <Printer className="w-3 h-3 mr-1" />
                Print
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(gatePass._id)}
                disabled={isDeleting}
                title="Delete"
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 w-12">
              <input
                type="checkbox"
                checked={selectedGatePasses.length === gatePasses.length && gatePasses.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Gate Pass #</th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Vehicle</th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Driver</th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Purpose</th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Status</th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Time In</th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Time Out</th>
            <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Actions</th>
          </tr>
        </thead>
        <tbody>
          {gatePasses.map((gatePass) => {
            console.log('GatePassTable: Rendering gate pass:', gatePass)
            return (
              <tr key={gatePass._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedGatePasses.includes(gatePass._id)}
                  onChange={() => onSelectGatePass(gatePass._id)}
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">{gatePass.gatePassNumber}</div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-900 dark:text-gray-100">{gatePass.vehicleNumber}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{gatePass.driverName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{gatePass.driverPhone}</div>
                </div>
              </td>
              <td className="py-3 px-4">
                {getPurposeBadge(gatePass.purpose)}
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(gatePass.status)}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(gatePass.timeIn).toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                {gatePass.timeOut ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(gatePass.timeOut).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(gatePass)}
                    title="View Details"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(gatePass)}
                    title="Edit"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {gatePass.status === 'active' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComplete(gatePass._id)}
                        disabled={isCompleting}
                        title="Complete"
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(gatePass._id)}
                        disabled={isCancelling}
                        title="Cancel"
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPrint(gatePass._id)}
                    disabled={isPrinting}
                    title="Print"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      try {
                        generateGatePassPDF(gatePass as GatePassPDFData, 'Dhruval Exim Pvt. Ltd.');
                        // You can add a toast notification here if needed
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                      }
                    }}
                    title="Download PDF"
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(gatePass._id)}
                    disabled={isDeleting}
                    title="Delete"
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
      
      {gatePasses.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No gate passes found
        </div>
      )}
    </div>
  )
}
