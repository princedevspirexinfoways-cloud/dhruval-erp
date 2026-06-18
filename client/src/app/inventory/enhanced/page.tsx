'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  useGetInventoryItemsQuery, 
  useGetInventoryStatsQuery, 
  useGetInventoryAlertsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation
} from '@/lib/api/inventoryApi';
import { AppLayout } from '@/components/layout/AppLayout';
import { Activity } from 'lucide-react';
import { selectTheme } from '@/lib/features/ui/uiSlice';
import { 
  InventoryHeader,
  InventoryFilters,
  InventoryAnalytics,
  InventoryGrid,
  InventoryList,
  CreateInventoryItemModal,
  InventoryDetailsModal,
  InventoryItemForm
} from '@/components/inventory';
import { ViewMode as FilterViewMode } from '@/components/ui/ViewToggle';

const EnhancedInventoryPage = () => {
  const theme = useSelector(selectTheme);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'analytics'>('list');
  const [isClient, setIsClient] = useState(false);
  const [viewDetails, setViewDetails] = useState<any>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug modal state
  useEffect(() => {
    console.log('Modal state changed:', { showCreateModal, selectedItem });
  }, [showCreateModal, selectedItem]);

  // RTK Query hooks
  const { data: inventoryData, isLoading, error, refetch } = useGetInventoryItemsQuery({
    search: searchTerm || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    page: currentPage,
    limit: pageSize
  });

  const { data: inventoryStats } = useGetInventoryStatsQuery({});
  const { data: inventoryAlerts } = useGetInventoryAlertsQuery({});

  const [createInventoryItem] = useCreateInventoryItemMutation();
  const [updateInventoryItem] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem] = useDeleteInventoryItemMutation();

  const items = inventoryData?.data?.data || [];
  const stats = inventoryStats?.data;
  const alerts = inventoryAlerts?.data || [];
  
  // Pagination data
  const pagination = inventoryData?.data?.pagination;
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const hasNextPage = pagination?.hasNext || false;
  const hasPrevPage = pagination?.hasPrev || false;

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Debug: Log the alerts data
  console.log('Inventory Alerts Data:', inventoryAlerts);
  console.log('Processed Alerts:', alerts);

  // Ensure items is always an array before filtering
  const safeItems = Array.isArray(items) ? items : [];
  
  const filteredItems = safeItems.filter((item: any) => {
    const matchesSearch = !searchTerm || 
      (item.itemName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.itemCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.itemDescription?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category?.primary === categoryFilter;
    const matchesStatus = !statusFilter || getStockStatus(item) === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateItem = async (formData: any) => {
    try {
      await createInventoryItem(formData).unwrap();
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to create inventory item:', error);
    }
  };

  const handleUpdateItem = async (formData: any) => {
    if (!selectedItem) {
      console.error('No selected item for update');
      return;
    }
    
    console.log('Updating item:', selectedItem._id);
    console.log('Update data:', formData);
    
    try {
      const result = await updateInventoryItem({ itemId: selectedItem._id, itemData: formData }).unwrap();
      console.log('Item updated successfully:', result);
      setSelectedItem(null);
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    console.log('Delete item clicked for ID:', id);
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        console.log('Attempting to delete item with ID:', id);
        await deleteInventoryItem(id).unwrap();
        console.log('Item deleted successfully');
        refetch();
      } catch (error) {
        console.error('Failed to delete inventory item:', error);
      }
    }
  };

  const handleViewDetails = (item: any) => {
    setViewDetails(item);
  };

  const handleEditItem = (item: any) => {
    console.log('Edit item clicked:', item);
    setSelectedItem(item);
    setShowCreateModal(true);
  };

  const handleFormClose = () => {
    setShowCreateModal(false);
    setSelectedItem(null);
  };

  const handleFormSubmit = (formData: any) => {
    // Transform flat form data to nested structure that API expects
    // Only include fields that the working API format accepts
    const transformedData = {
      itemName: formData.itemName,
      category: {
        primary: formData.category || 'raw_material',
        secondary: '',
        tertiary: ''
      },
      warehouseId: formData.warehouseId,
      reorderPoint: Number(formData.reorderPoint) || 0,
      reorderQuantity: Number(formData.reorderQuantity) || 0,
      stockingMethod: formData.stockingMethod || 'fifo',
      currentStock: Number(formData.currentStock) || 0,
      costPrice: Number(formData.costPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      stock: {
        unit: formData.unit, // This is the key field that was missing
        currentStock: Number(formData.currentStock) || 0,
        availableStock: Number(formData.currentStock) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        minStockLevel: Number(formData.minStockLevel) || 0,
        maxStockLevel: Number(formData.maxStockLevel) || 0,
        economicOrderQuantity: Number(formData.reorderQuantity) || 0,
        valuationMethod: formData.valuationMethod || 'FIFO',
        averageCost: Number(formData.costPrice) || 0,
        totalValue: (Number(formData.currentStock) || 0) * (Number(formData.costPrice) || 0)
      },
      pricing: {
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        currency: 'INR'
      },
      locations: [
        {
          warehouseId: formData.warehouseId,
          warehouseName: "Main Warehouse",
          quantity: Number(formData.currentStock) || 0,
          lastUpdated: new Date().toISOString(),
          isActive: true
        }
      ]
    };

    console.log('Original form data:', formData);
    console.log('Transformed data:', transformedData);

    if (selectedItem) {
      handleUpdateItem(transformedData);
    } else {
      handleCreateItem(transformedData);
    }
  };

  // Helper function for stock status
  const getStockStatus = (item: any) => {
    const currentStock = item.stock?.currentStock || 0;
    const reorderLevel = item.stock?.reorderLevel || 0;
    
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= reorderLevel) return 'low_stock';
    if (currentStock > reorderLevel * 2) return 'overstocked';
    return 'normal_stock';
  };

  // Calculate low stock count for header
  const lowStockCount = safeItems.filter((item: any) => getStockStatus(item) === 'low_stock').length;

  if (!isClient) {
    return null;
  }

  return (
    <AppLayout>
      <div className={`space-y-6 transition-theme ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <InventoryHeader
          totalItems={totalItems}
          lowStockCount={lowStockCount}
          onAddItem={() => setShowCreateModal(true)}
          onRefresh={() => refetch()}
          onExport={() => console.log('Export clicked')}
          onImport={() => console.log('Import clicked')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          theme={theme}
        />

        {/* Filters */}
          <InventoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            viewMode={viewMode === 'analytics' ? 'list' : (viewMode as FilterViewMode)}
            onViewModeChange={(mode: FilterViewMode) => setViewMode(mode)}
          />

          {/* Alerts Section - Show on all views */}
          {alerts && alerts.length > 0 && (
            <div className={`rounded-lg p-4 transition-theme ${
              theme === 'dark' 
                ? 'bg-orange-900/20 border border-orange-800' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold flex items-center ${
                  theme === 'dark' ? 'text-orange-200' : 'text-orange-800'
                }`}>
                  <Activity className="w-5 h-5 mr-2" />
                  Inventory Alerts ({alerts.length})
                </h3>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                }`}>
                  {viewMode === 'analytics' ? 'Viewing in Analytics' : 'Switch to Analytics for detailed view'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {alerts.slice(0, 3).map((alert: any, index: number) => (
                  <div key={alert.id || index} className={`p-3 rounded-lg border transition-theme ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-orange-700' 
                      : 'bg-white border-orange-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-500' : 
                            alert.severity === 'warning' ? 'bg-orange-500' : 
                            'bg-blue-500'
                          }`}></div>
                          <span className={`text-xs font-medium uppercase ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {alert.type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className={`text-sm font-medium mb-1 ${
                          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                        }`}>{alert.message}</p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Item: {alert.itemCode}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
                    )}

          {/* View Mode Toggle */}
        <div className="flex justify-center">
            <div className={`flex rounded-lg p-1 transition-theme ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
            <button
                onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List View
            </button>
            <button
                onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid View
            </button>
            <button
                onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'analytics' 
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              >
                Analytics
            </button>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'analytics' ? (
          <InventoryAnalytics stats={stats} alerts={alerts} theme={theme} />
        ) : viewMode === 'grid' ? (
          <InventoryGrid
            items={filteredItems}
            onViewDetails={handleViewDetails}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            theme={theme}
          />
        ) : (
          <InventoryList
            items={filteredItems}
            onViewDetails={handleViewDetails}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            theme={theme}
          />
        )}

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className={`rounded-lg border p-4 transition-theme ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className={`px-3 py-1 border rounded-md text-sm transition-theme ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className={`px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-theme ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md transition-theme ${
                          currentPage === pageNum
                            ? theme === 'dark'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-blue-500 text-white border-blue-500'
                            : theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
                              : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className={`px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-theme ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-[9999] transition-theme">
            <div className={`rounded-lg p-6 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto border-4 border-red-500 transition-theme ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {selectedItem ? 'Edit Inventory Item' : 'Create New Inventory Item'}
                </h2>
                <button
                  onClick={handleFormClose}
                  className={`text-2xl transition-colors ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ✕
                </button>
              </div>
              <div className={`p-4 mb-4 rounded transition-theme ${
                theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-100'
              }`}>
                <p className={`${
                  theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'
                }`}>Modal is open! showCreateModal: {showCreateModal.toString()}</p>
              </div>
              <InventoryItemForm
                key={selectedItem?._id || 'new'}
                item={selectedItem}
                onSubmit={handleFormSubmit}
                onCancel={handleFormClose}
                theme={theme}
              />
            </div>
          </div>
        )}

      {/* View Details Modal */}
      {viewDetails && (
          <InventoryDetailsModal
            item={viewDetails}
            onClose={() => setViewDetails(null)}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            theme={theme}
          />
      )}
      </div>
    </AppLayout>
  );
};

export default EnhancedInventoryPage;
