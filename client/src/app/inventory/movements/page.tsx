'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ArrowUpDown, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import {
  useGetInventoryMovementsQuery,
  useCreateStockMovementMutation,
  useUpdateStockMovementMutation,
  useDeleteStockMovementMutation
} from '@/lib/api/inventoryApi'
import { toast } from 'sonner'
import { StockMovementForm } from '@/components/inventory/StockMovementForm'
import { StockMovementDetails } from '@/components/inventory/StockMovementDetails'
import {
  MovementsHeader,
  MovementsStatsCards,
  MovementsFilters,
  MovementsTable,
  MovementsPagination,
  DeleteMovementModal,
  type StockMovement,
  type Pagination
} from '@/components/inventory/movements'

export default function InventoryMovementsPage() {
  const theme = useSelector(selectTheme)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reset pagination when filters change
  const resetPagination = () => {
    setPage(1)
  }

  // Handle search change with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    resetPagination()
  }

  // Handle filter changes with pagination reset
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    resetPagination()
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    resetPagination()
  }

  // Fetch inventory movements data from API
  const { data: movementsData, isLoading } = useGetInventoryMovementsQuery({
    page,
    limit: pageSize,
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  })

  // Stock Movement CRUD mutations
  const [createStockMovement, { isLoading: createLoading }] = useCreateStockMovementMutation()
  const [updateStockMovement, { isLoading: updateLoading }] = useUpdateStockMovementMutation()
  const [deleteStockMovement, { isLoading: deleteLoading }] = useDeleteStockMovementMutation()

  // Handle different response structures safely
  const responseData = movementsData?.data as any

  // Prefer spares (new structure), then data array
  const movements = (responseData?.spares || responseData?.data || []) as StockMovement[]

  // Prefer nested pagination object, then top-level pagination fields
  const apiPagination = responseData?.pagination || responseData || {}

  // Derive total from API, but fall back to actual array length if inconsistent
  const totalFromApi = apiPagination.total ?? responseData?.total
  const effectiveTotal = typeof totalFromApi === 'number' && totalFromApi > 0
    ? Math.max(totalFromApi, movements.length)
    : movements.length

  const limitFromApi = apiPagination.limit || pageSize
  const pageFromApi = apiPagination.page || page

  // Convert to local Pagination type
  const pagination: Pagination | undefined = {
    page: pageFromApi,
    limit: limitFromApi,
    total: effectiveTotal,
    pages: apiPagination.totalPages || Math.ceil(effectiveTotal / limitFromApi)
  }

  // CRUD Handlers
  const handleCreateMovement = async (formData: any) => {
    try {
      await createStockMovement(formData).unwrap()
      toast.success('Stock movement created successfully!')
      setShowCreateModal(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create stock movement')
      console.error('Create movement error:', error)
    }
  }

  const handleEditMovement = async (formData: any) => {
    try {
      if (!selectedMovement) throw new Error('No movement selected')
      await updateStockMovement({ id: selectedMovement._id, data: formData }).unwrap()
      toast.success('Stock movement updated successfully!')
      setShowEditModal(false)
      setSelectedMovement(null)
      window.location.reload()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update stock movement')
      console.error('Update movement error:', error)
    }
  }

  const handleDeleteMovement = async () => {
    if (!selectedMovement) return

    try {
      await deleteStockMovement(selectedMovement._id).unwrap()
      toast.success('Stock movement deleted successfully!')
      setShowDeleteConfirm(false)
      setSelectedMovement(null)
      window.location.reload()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete stock movement')
      console.error('Delete movement error:', error)
    }
  }

  // Modal handlers
  const openCreateModal = () => {
    setShowCreateModal(true)
  }

  const openEditModal = (movement: StockMovement) => {
    setSelectedMovement(movement)
    setShowEditModal(true)
  }

  const openDetailsModal = (movement: StockMovement) => {
    setSelectedMovement(movement)
    setShowDetailsModal(true)
  }

  const openDeleteConfirm = (movement: StockMovement) => {
    setSelectedMovement(movement)
    setShowDeleteConfirm(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDetailsModal(false)
    setShowDeleteConfirm(false)
    setSelectedMovement(null)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  return (
    <AppLayout>
      {!isClient ? (
        // Show loading state during SSR to prevent hydration mismatch
        <div className={`p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-screen transition-theme ${theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
          }`}>
          <div className={`rounded-2xl border shadow-lg p-4 sm:p-6 transition-theme ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-sky-200'
            }`}>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <ArrowUpDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent ${theme === 'dark' ? 'text-gray-100' : ''
                  }`}>
                  Inventory Movements
                </h1>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Loading...</p>
              </div>
            </div>
          </div>
          <div className={`rounded-xl border shadow-lg p-8 transition-theme ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-sky-200'
            }`}>
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-4" />
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Loading movements...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-screen transition-theme ${theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
          }`}>
          {/* Header */}
          <MovementsHeader
            theme={theme}
            movementsCount={movements.length}
            onCreateClick={openCreateModal}
          />

          {/* Stats Cards */}
          <MovementsStatsCards
            theme={theme}
            movements={movements}
          />

          {/* Filters */}
          <MovementsFilters
            theme={theme}
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            onSearchChange={handleSearchChange}
            onTypeFilterChange={handleTypeFilterChange}
            onStatusFilterChange={handleStatusFilterChange}
          />

          {/* Movements Table */}
          <MovementsTable
            theme={theme}
            movements={movements}
            isLoading={isLoading}
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            onViewDetails={openDetailsModal}
            onEdit={openEditModal}
            onDelete={openDeleteConfirm}
            onCreateClick={openCreateModal}
          />

          {/* Pagination */}
          {pagination && (
            <MovementsPagination
              theme={theme}
              pagination={pagination}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}

          {/* Modals */}
          {/* Create Movement Modal */}
          {showCreateModal && (
            <StockMovementForm
              onClose={closeModals}
              onSubmit={handleCreateMovement}
              isLoading={createLoading}
              theme={theme}
            />
          )}

          {/* Edit Movement Modal */}
          {showEditModal && selectedMovement && (
            <StockMovementForm
              movement={selectedMovement}
              onClose={closeModals}
              onSubmit={handleEditMovement}
              isLoading={updateLoading}
              theme={theme}
            />
          )}

          {/* Movement Details Modal */}
          {showDetailsModal && selectedMovement && (
            <StockMovementDetails
              movement={selectedMovement}
              onClose={closeModals}
              onEdit={() => {
                setShowDetailsModal(false)
                setShowEditModal(true)
              }}
              onDelete={() => {
                setShowDetailsModal(false)
                openDeleteConfirm(selectedMovement)
              }}
              canEdit={true}
              canDelete={true}
              theme={theme}
            />
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && selectedMovement && (
            <DeleteMovementModal
              theme={theme}
              movement={selectedMovement}
              isLoading={deleteLoading}
              onConfirm={handleDeleteMovement}
              onCancel={closeModals}
            />
          )}
        </div>
      )}
    </AppLayout>
  )
}
