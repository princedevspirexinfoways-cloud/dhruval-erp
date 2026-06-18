'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import { useGetStockMovementByIdQuery, useDeleteStockMovementMutation, useUpdateStockMovementMutation, useGetInventoryItemByIdQuery } from '@/lib/api/inventoryApi'
import { toast } from 'sonner'
import { Loader2, ArrowUpDown } from 'lucide-react'
import { StockMovementForm } from '@/components/inventory/StockMovementForm'
import { DeleteMovementModal } from '@/components/inventory/movements'
import { StockMovement } from '@/components/inventory/movements/types'
import {
  MovementDetailsHeader,
  MovementOverviewCard,
  MovementItemInfo,
  MovementLocationInfo,
  MovementReferenceInfo,
  MovementApprovalInfo,
  MovementAuditInfo,
  MovementNotes,
  MovementJobWorkReturn
} from '@/components/inventory/movements/details'

export default function MovementDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const theme = useSelector(selectTheme)
  const movementId = params.id as string
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch movement details
  const { data: movementData, isLoading, error, refetch } = useGetStockMovementByIdQuery(movementId)
  const [deleteStockMovement, { isLoading: deleteLoading }] = useDeleteStockMovementMutation()
  const [updateStockMovement, { isLoading: updateLoading }] = useUpdateStockMovementMutation()

  const movement = movementData?.data as any

  // Fetch item details if itemId is just a string
  const itemId = typeof movement?.itemId === 'string' ? movement.itemId : (movement?.itemId as any)?._id
  const { data: itemData } = useGetInventoryItemByIdQuery(itemId || '', {
    skip: !itemId || typeof movement?.itemId === 'object'
  })

  // Combine movement with fetched item data
  const movementWithItem: StockMovement | null = movement ? {
    ...movement,
    movementNumber: movement.movementNumber || movement._id || '',
    movementType: movement.movementType || movement.type || 'inward',
    createdAt: movement.createdAt || movement.timestamp || new Date().toISOString(),
    itemId: typeof movement.itemId === 'string' 
      ? itemData?.data 
      : movement.itemId
  } as StockMovement : null

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!movement) return

    try {
      await deleteStockMovement(movementId).unwrap()
      toast.success('Stock movement deleted successfully!')
      router.push('/inventory/movements')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete stock movement')
      console.error('Delete movement error:', error)
    }
  }

  const handleEditSubmit = async (formData: any) => {
    try {
      if (!movement) throw new Error('No movement selected')
      await updateStockMovement({ id: movementId, data: formData }).unwrap()
      toast.success('Stock movement updated successfully!')
      setShowEditModal(false)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update stock movement')
      console.error('Update movement error:', error)
    }
  }

  if (!isClient) {
    return (
      <AppLayout>
        <div className={`p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-screen transition-theme ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
        }`}>
          <div className={`rounded-2xl border shadow-lg p-4 sm:p-6 transition-theme ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-sky-200'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <ArrowUpDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Loading...
                </h1>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className={`p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-screen transition-theme ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
        }`}>
          <div className={`rounded-xl border shadow-lg p-8 transition-theme ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-sky-200'
          }`}>
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-4" />
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Loading movement details...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !movement) {
    return (
      <AppLayout>
        <div className={`p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-screen transition-theme ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
        }`}>
          <div className={`rounded-xl border shadow-lg p-8 transition-theme ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-sky-200'
          }`}>
            <div className="text-center">
              <h3 className={`text-lg font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>Movement Not Found</h3>
              <p className={`mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                The requested stock movement could not be found.
              </p>
              <button
                onClick={() => router.push('/inventory/movements')}
                className={`px-4 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                }`}
              >
                Back to Movements
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className={`p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-screen transition-theme ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
      }`}>
        {/* Header */}
        <MovementDetailsHeader
          theme={theme}
          movement={movementWithItem || movement}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Overview Card */}
        <MovementOverviewCard
          theme={theme}
          movement={movementWithItem || movement}
        />

        {/* Job Work Return Information - Show if it's a return from job work */}
        {(movement as any)?.referenceDocument?.documentType === 'return_note' && (
          <MovementJobWorkReturn
            theme={theme}
            referenceDocument={(movement as any).referenceDocument}
          />
        )}

        {/* Item Information */}
        <MovementItemInfo
          theme={theme}
          movement={movementWithItem || movement}
        />

        {/* Location Information */}
        <MovementLocationInfo
          theme={theme}
          movement={movementWithItem || movement}
        />

        {/* Reference Document */}
        <MovementReferenceInfo
          theme={theme}
          movement={movementWithItem || movement}
        />

        {/* Approval Information */}
        <MovementApprovalInfo
          theme={theme}
          movement={movementWithItem || movement}
        />

        {/* Notes */}
        <MovementNotes
          theme={theme}
          movement={movementWithItem || movement}
        />

        {/* Audit Information */}
        <MovementAuditInfo
          theme={theme}
          movement={movementWithItem || movement}
        />

        {/* Modals */}
        {/* Edit Modal */}
        {showEditModal && movement && (
          <StockMovementForm
            movement={movement}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEditSubmit}
            isLoading={updateLoading}
            theme={theme}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && movement && (
          <DeleteMovementModal
            theme={theme}
            movement={{
              ...movement,
              movementNumber: movement.movementNumber || movement._id || '',
              movementType: movement.movementType || movement.type || 'inward',
              createdAt: movement.createdAt || movement.timestamp || new Date().toISOString()
            } as StockMovement}
            isLoading={deleteLoading}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </AppLayout>
  )
}

