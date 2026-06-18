'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Package, Plus, Search } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetInventoryItemsQuery,
  useGetInventoryStatsQuery,
  useGetInventoryAlertsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useGetInventoryItemByIdQuery,
  useDeleteInventoryItemMutation
} from '@/lib/api/inventoryApi'
import { ViewMode } from '@/components/ui/ViewToggle'
import { Button } from '@/components/ui/Button'
import { InventoryItemForm } from '@/components/inventory/InventoryItemForm'
import { InventoryItemDetailsModal } from '@/components/inventory/InventoryItemDetailsModal'
import { InventoryStatsCards } from '@/components/inventory/InventoryStatsCards'
import { InventoryAlerts } from '@/components/inventory/InventoryAlerts'
import { InventoryFilters } from '@/components/inventory/InventoryFilters'
import { InventoryList } from '@/components/inventory/InventoryList'

export default function InventoryPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [viewingItemId, setViewingItemId] = useState<string | null>(null)

  // Add client-side state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false)

  // Set client-side state after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch inventory data
  const { data: inventoryData, isLoading, error } = useGetInventoryItemsQuery({
    page,
    limit: 10,
    search: searchTerm,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  })

  // Fetch inventory statistics
  const { data: inventoryStats } = useGetInventoryStatsQuery({})

  // Fetch inventory alerts
  const { data: inventoryAlerts } = useGetInventoryAlertsQuery({})

  // Create inventory item mutation
  const [createInventoryItem, { isLoading: isCreating }] = useCreateInventoryItemMutation()

  // Update inventory item mutation
  const [updateInventoryItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation()

  // Delete inventory item mutation
  const [deleteInventoryItem, { isLoading: isDeleting }] = useDeleteInventoryItemMutation()

  // Get item by ID for viewing
  const { data: itemDetails } = useGetInventoryItemByIdQuery(viewingItemId || '', {
    skip: !viewingItemId
  })

  const items = inventoryData?.data?.data || []
  const pagination = inventoryData?.data?.pagination
  // Ensure alerts is always an array
  const alerts = Array.isArray(inventoryAlerts?.data) ? inventoryAlerts.data : []

  const handleCreateOrUpdateItem = async (formData: any) => {
    try {
      if (selectedItem?._id) {
        // Update existing item
        await updateInventoryItem({
          itemId: selectedItem._id,
          itemData: formData
        }).unwrap()
      } else {
        // Create new item
        await createInventoryItem(formData).unwrap()
      }
      setShowCreateModal(false)
      setSelectedItem(null)
      // Refetch inventory data
      window.location.reload()
    } catch (error) {
      console.error('Failed to save inventory item:', error)
      alert('Failed to save inventory item. Please try again.')
    }
  }

  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setShowCreateModal(true)
  }

  const handleViewItem = (item: any) => {
    setViewingItemId(item._id)
    setShowViewModal(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventoryItem(itemId).unwrap()
        window.location.reload()
      } catch (error) {
        console.error('Failed to delete inventory item:', error)
        alert('Failed to delete inventory item. Please try again.')
      }
    }
  }

  const handleFormClose = () => {
    setShowCreateModal(false)
    setSelectedItem(null)
  }

  const handleViewModalClose = () => {
    setShowViewModal(false)
    setViewingItemId(null)
  }

  const theme = useSelector((state: any) => state.ui?.theme || 'light')

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Theme Colors */}
        <PageHeader
          title="Inventory Management"
          description={`Track stock levels and manage inventory (${items.length} items)`}
          icon={<Package className="h-6 w-6" />}
          variant="indigo"
        >
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => window.location.reload()}
            >
              <Search className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              className="bg-white text-indigo-600 hover:bg-gray-50"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <InventoryStatsCards stats={inventoryStats?.data} isClient={isClient} />

        {/* Alerts Section */}
        <InventoryAlerts alerts={alerts} />

        {/* Filters */}
        <InventoryFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Inventory List */}
        <InventoryList
          items={items}
          viewMode={viewMode}
          isLoading={isLoading}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          isClient={isClient}
          pagination={pagination}
          currentPage={page}
          onPageChange={setPage}
          onViewItem={handleViewItem}
          onEditItem={handleEditItem}
        />

        {/* Create Inventory Item Modal */}
        {showCreateModal && (
          <div className={`fixed inset-0 flex items-center justify-center z-[9999] ${theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-sm' : 'bg-gray-500/50 backdrop-blur-sm'
            }`}>
            <div className={`rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl ${theme === 'dark' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
              }`}>
              <div className={`flex items-center justify-between mb-6 pb-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  {selectedItem ? 'Edit Inventory Item' : 'Create New Inventory Item'}
                </h2>
                <button
                  onClick={handleFormClose}
                  className={`text-2xl leading-none transition-colors rounded-full p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  ✕
                </button>
              </div>
              <InventoryItemForm
                item={selectedItem}
                onSubmit={handleCreateOrUpdateItem}
                onCancel={handleFormClose}
                isSubmitting={isCreating || isUpdating}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewModal && itemDetails?.data && (
          <InventoryItemDetailsModal
            item={itemDetails.data}
            onClose={handleViewModalClose}
            onEdit={handleEditItem}
            theme={theme}
          />
        )}
      </div>
    </AppLayout>
  )
}
