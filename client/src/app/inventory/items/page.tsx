'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Box
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { InventoryHeader } from '@/components/ui/PageHeader'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetInventoryItemsQuery,
  useGetInventoryStatsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation
} from '@/lib/api/inventoryApi'
import { DataTable } from '@/components/ui/DataTable'
import { StatsCards } from '@/components/ui/StatsCards'
import { DetailViewModal } from '@/components/modals/DetailViewModal'
import { CreateEditModal } from '@/components/modals/CreateEditModal'
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/LoadingSpinner'
import clsx from 'clsx'

export default function InventoryItemsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<any>(null)

  // Fetch inventory data from API
  const { data: inventoryData, isLoading, error } = useGetInventoryItemsQuery({
    page,
    limit: 20,
    search: searchTerm,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  })

  // Fetch inventory statistics
  const { data: inventoryStats } = useGetInventoryStatsQuery({})

  // Mutations
  const [createItem] = useCreateInventoryItemMutation()
  const [updateItem] = useUpdateInventoryItemMutation()
  const [deleteItem] = useDeleteInventoryItemMutation()

  const items = inventoryData?.data?.data || []
  const rawPagination = inventoryData?.data?.pagination
  
  // Convert pagination structure to match DataTable expectations
  const pagination = rawPagination ? {
    page: rawPagination.page,
    limit: rawPagination.limit,
    total: rawPagination.total,
    pages: rawPagination.totalPages
  } : undefined

  // Form fields for create/edit
  const itemFields = [
    { name: 'itemName', label: 'Item Name', type: 'text' as const, required: true },
    { name: 'itemCode', label: 'Item Code', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const },
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'raw_materials', label: 'Raw Materials' },
        { value: 'finished_goods', label: 'Finished Goods' },
        { value: 'consumables', label: 'Consumables' },
        { value: 'spare_parts', label: 'Spare Parts' },
        { value: 'tools', label: 'Tools & Equipment' }
      ]
    },
    { name: 'unitPrice', label: 'Unit Price', type: 'number' as const, required: true },
    { name: 'currentStock', label: 'Current Stock', type: 'number' as const, required: true },
    { name: 'minimumStock', label: 'Minimum Stock', type: 'number' as const, required: true },
    { name: 'maximumStock', label: 'Maximum Stock', type: 'number' as const },
    { name: 'unit', label: 'Unit of Measure', type: 'text' as const, required: true },
    { name: 'supplier', label: 'Supplier', type: 'text' as const },
    { name: 'location', label: 'Storage Location', type: 'text' as const }
  ]

  // CRUD Handlers
  const handleView = (item: any) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const handleEdit = (item: any) => {
    setItemToEdit(item)
    setShowEditModal(true)
  }

  const handleDelete = async (item: any) => {
    if (window.confirm(`Are you sure you want to delete ${item.itemName}?`)) {
      try {
        await deleteItem(item._id).unwrap()
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await createItem({
        ...data,
        companyId: user?.companyId,
      }).unwrap()
    } catch (error) {
      console.error('Failed to create item:', error)
      throw error
    }
  }

  const handleUpdate = async (data: any) => {
    try {
      await updateItem({
        itemId: itemToEdit._id,
        itemData: data,
      }).unwrap()
    } catch (error) {
      console.error('Failed to update item:', error)
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Items',
      value: inventoryStats?.data?.totalItems || 0,
      change: {
        value: inventoryStats?.data?.itemsGrowth || 0,
        type: (inventoryStats?.data?.itemsGrowth || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        label: 'vs last month'
      },
      icon: <Package className="h-6 w-6" />,
      color: 'blue' as const
    },
    {
      title: 'Low Stock Items',
      value: inventoryStats?.data?.lowStockItems || 0,
      change: {
        value: inventoryStats?.data?.lowStockChange || 0,
        type: (inventoryStats?.data?.lowStockChange || 0) <= 0 ? 'increase' as const : 'decrease' as const,
        label: 'need attention'
      },
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'yellow' as const
    },
    {
      title: 'Total Value',
      value: formatCurrency(inventoryStats?.data?.totalValue || 0),
      change: {
        value: inventoryStats?.data?.valueGrowth || 0,
        type: (inventoryStats?.data?.valueGrowth || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        label: 'portfolio growth'
      },
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'green' as const
    },
    {
      title: 'Categories',
      value: inventoryStats?.data?.totalCategories || 0,
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'purple' as const
    }
  ]

  // Table columns
  const columns = [
    {
      key: 'itemCode',
      label: 'Item Code',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'itemName',
      label: 'Item Name',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.category?.replace('_', ' ')}</div>
        </div>
      )
    },
    {
      key: 'currentStock',
      label: 'Stock',
      sortable: true,
      render: (value: number, row: any) => (
        <div className="text-center">
          <div className={clsx(
            'font-medium',
            value <= row.minimumStock ? 'text-red-600' : 'text-gray-900'
          )}>
            {value} {row.unit}
          </div>
          {value <= row.minimumStock && (
            <div className="text-xs text-red-500">Low Stock</div>
          )}
        </div>
      )
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      sortable: true,
      render: (value: number, row: any) => formatCurrency(row.currentStock * row.unitPrice)
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (value: string) => value || '-'
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      render: (value: string) => formatDate(value)
    }
  ]

  // Detail view sections
  const getDetailSections = (item: any) => [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Item Name', value: item?.itemName, type: 'text' as const },
        { label: 'Item Code', value: item?.itemCode, type: 'text' as const },
        { label: 'Description', value: item?.description, type: 'text' as const },
        { label: 'Category', value: item?.category?.replace('_', ' '), type: 'badge' as const },
        { label: 'Unit of Measure', value: item?.unit, type: 'text' as const },
        { label: 'Supplier', value: item?.supplier, type: 'text' as const }
      ]
    },
    {
      title: 'Stock Information',
      fields: [
        { label: 'Current Stock', value: `${item?.currentStock || 0} ${item?.unit || ''}`, type: 'text' as const },
        { label: 'Minimum Stock', value: `${item?.minimumStock || 0} ${item?.unit || ''}`, type: 'text' as const },
        { label: 'Maximum Stock', value: `${item?.maximumStock || 0} ${item?.unit || ''}`, type: 'text' as const },
        { label: 'Stock Status', value: (item?.currentStock || 0) <= (item?.minimumStock || 0) ? 'Low Stock' : 'Normal', type: 'badge' as const }
      ]
    },
    {
      title: 'Financial Information',
      fields: [
        { label: 'Unit Price', value: item?.unitPrice, type: 'currency' as const },
        { label: 'Total Value', value: (item?.currentStock || 0) * (item?.unitPrice || 0), type: 'currency' as const },
        { label: 'Last Purchase Price', value: item?.lastPurchasePrice, type: 'currency' as const },
        { label: 'Average Cost', value: item?.averageCost, type: 'currency' as const }
      ]
    },
    {
      title: 'Additional Details',
      fields: [
        { label: 'Storage Location', value: item?.location, type: 'text' as const },
        { label: 'Created Date', value: item?.createdAt, type: 'date' as const },
        { label: 'Last Updated', value: item?.updatedAt, type: 'date' as const },
        { label: 'Created By', value: item?.createdBy, type: 'text' as const }
      ]
    }
  ]

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1"
    switch (status) {
      case 'in_stock':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'low_stock':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      case 'out_of_stock':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'discontinued':
        return `${baseClasses} bg-gray-100 text-gray-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="h-3 w-3" />
      case 'low_stock':
        return <AlertTriangle className="h-3 w-3" />
      case 'out_of_stock':
        return <Clock className="h-3 w-3" />
      default:
        return <Box className="h-3 w-3" />
    }
  }

  const getStockLevel = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100
    if (current === 0) return { level: 'empty', color: 'bg-red-500', percentage: 0 }
    if (current <= min) return { level: 'low', color: 'bg-yellow-500', percentage }
    if (percentage >= 80) return { level: 'high', color: 'bg-green-500', percentage }
    return { level: 'normal', color: 'bg-blue-500', percentage }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
          <LoadingSpinner size="lg" text="Loading inventory items..." />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
          <ErrorState
            title="Error Loading Inventory"
            message="Failed to load inventory items. Please try again."
            icon={<Package className="h-12 w-12 text-red-500" />}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* New Header */}
        <InventoryHeader
          title="Inventory Items"
          description={`Manage and track all inventory items (${items?.length || 0} items)`}
          icon={<Package className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={() => window.location.reload()}
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 border border-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </button>
        </InventoryHeader>

        {/* Stats Cards */}
        <StatsCards cards={statsCards} />

        {/* Data Table */}
        <DataTable
          data={items}
          columns={columns}
          loading={isLoading}
          error={error ? 'Failed to load inventory items' : undefined}
          searchable={true}
          filterable={false}
          pagination={pagination}
          onPageChange={setPage}
          onSearch={setSearchTerm}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={true}
        />

        {/* Modals */}
        <DetailViewModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`${selectedItem?.itemName || 'Item'} Details`}
          sections={getDetailSections(selectedItem)}
          actions={{
            onEdit: () => {
              setShowDetailModal(false)
              handleEdit(selectedItem)
            },
            onDelete: () => {
              setShowDetailModal(false)
              handleDelete(selectedItem)
            }
          }}
        />

        <CreateEditModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          title="Add New Item"
          fields={itemFields}
          submitText="Create Item"
        />

        <CreateEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setItemToEdit(null)
          }}
          onSubmit={handleUpdate}
          title="Edit Item"
          fields={itemFields}
          initialData={itemToEdit}
          submitText="Update Item"
        />
      </div>
    </AppLayout>
  )
}
