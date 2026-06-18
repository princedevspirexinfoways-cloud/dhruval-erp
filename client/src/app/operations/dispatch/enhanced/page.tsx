'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { DispatchList } from '@/components/dispatch/DispatchList';
import { DispatchCreateModal } from '@/components/dispatch/DispatchCreateModal';
import { DispatchViewModal } from '@/components/dispatch/DispatchViewModal';
import { DispatchEditModal } from '@/components/dispatch/DispatchEditModal';
import { QuickUpdateModal } from '@/components/dispatch/QuickUpdateModal';
import { DispatchFilters } from '@/components/dispatch/DispatchFilters';
import { Plus, Truck, TrendingUp } from 'lucide-react';
import { useGetDispatchesQuery, useDeleteDispatchMutation } from '@/lib/api/enhancedDispatchApi';
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi';
import { Dispatch } from '@/lib/api/enhancedDispatchApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import toast from 'react-hot-toast';

const EnhancedDispatchPage = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickUpdateModal, setShowQuickUpdateModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);

  // User data
  const user = useSelector((state: RootState) => state.auth.user);

  // RTK Query hooks
  const { data: dispatchesData, isLoading: dispatchesLoading, refetch } = useGetDispatchesQuery({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    companyId: user?.companyId,
    assignedTo: undefined
  });

  const { data: companiesData } = useGetAllCompaniesQuery();
  const [deleteDispatch] = useDeleteDispatchMutation();

  const dispatches = dispatchesData || [];
  const companies = companiesData?.data || [];

  // Filter dispatches based on search and filters
  const filteredDispatches = dispatches.filter((dispatch: Dispatch) => {
    const matchesSearch = searchTerm === '' || 
      dispatch.dispatchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.dispatchType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.sourceWarehouseId?.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.customerOrderId?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || dispatch.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || dispatch.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Event handlers
  const handleViewDispatch = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setShowViewModal(true);
  };

  const handleEditDispatch = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setShowEditModal(true);
  };

  const handleQuickUpdate = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setShowQuickUpdateModal(true);
  };

  const handleDeleteDispatch = async (dispatch: Dispatch) => {
    try {
      await deleteDispatch(dispatch._id).unwrap();
      toast.success('Dispatch deleted successfully');
      refetch();
    } catch (error) {
      console.error('Failed to delete dispatch:', error);
      toast.error('Failed to delete dispatch');
    }
  };

  const handleCreateSuccess = (dispatch: Dispatch) => {
    toast.success(`Dispatch ${dispatch.dispatchNumber} created successfully!`);
    refetch();
  };

  const handleEditSuccess = (dispatch: Dispatch) => {
    toast.success(`Dispatch ${dispatch.dispatchNumber} updated successfully!`);
    refetch();
  };

  const handleQuickUpdateSuccess = (dispatch: Dispatch) => {
    toast.success(`Dispatch ${dispatch.dispatchNumber} status updated!`);
    refetch();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Truck className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Enhanced Dispatch Operations
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Real-time monitoring active
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Streamlined dispatch management with intelligent tracking, automated workflows, and comprehensive analytics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {dispatches.length} Total Dispatches
                  </span>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 h-12 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  Create Dispatch
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Dispatches</p>
                  <p className="text-3xl font-bold">{dispatches.length}</p>
                  <p className="text-blue-200 text-xs mt-1">All records</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Truck className="h-8 w-8" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Dispatches</p>
                  <p className="text-3xl font-bold">
                    {dispatches.filter(d => d.status === 'pending' || d.status === 'in-progress').length}
                  </p>
                  <p className="text-green-200 text-xs mt-1">In progress</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">
                    {dispatches.filter(d => d.status === 'completed' || d.status === 'delivered').length}
                  </p>
                  <p className="text-purple-200 text-xs mt-1">Successfully done</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Urgent Priority</p>
                  <p className="text-3xl font-bold">
                    {dispatches.filter(d => d.priority === 'urgent' || d.priority === 'high').length}
                  </p>
                  <p className="text-orange-200 text-xs mt-1">Need attention</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="mb-8">
            <DispatchFilters
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              onSearchChange={setSearchTerm}
              onStatusFilterChange={setStatusFilter}
              onPriorityFilterChange={setPriorityFilter}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Enhanced Dispatch List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dispatch Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredDispatches.length} of {dispatches.length} dispatches
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Live Updates
                    </span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    <span>💡 Tips: Click</span>
                    <span className="px-1 bg-purple-200 dark:bg-purple-800 rounded text-purple-700 dark:text-purple-300">⚡</span>
                    <span>for quick update,</span>
                    <span className="px-1 bg-green-200 dark:bg-green-800 rounded text-green-700 dark:text-green-300">✏️</span>
                    <span>for full edit</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <DispatchList
                dispatches={filteredDispatches}
                onView={handleViewDispatch}
                onEdit={handleEditDispatch}
                onQuickUpdate={handleQuickUpdate}
                onDelete={handleDeleteDispatch}
                isLoading={dispatchesLoading}
              />
            </div>
          </div>

          {/* Create Modal */}
          <DispatchCreateModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
            userCompanyId={user?.companyId}
          />

          {/* View Modal */}
          <DispatchViewModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedDispatch(null);
            }}
            dispatch={selectedDispatch}
          />

          {/* Edit Modal */}
          <DispatchEditModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedDispatch(null);
            }}
            dispatch={selectedDispatch}
            onSuccess={handleEditSuccess}
            userCompanyId={user?.companyId}
          />

          {/* Quick Update Modal */}
          <QuickUpdateModal
            isOpen={showQuickUpdateModal}
            onClose={() => {
              setShowQuickUpdateModal(false);
              setSelectedDispatch(null);
            }}
            dispatch={selectedDispatch}
            onSuccess={handleQuickUpdateSuccess}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default EnhancedDispatchPage;
