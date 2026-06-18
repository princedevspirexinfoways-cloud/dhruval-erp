'use client'

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  TrendingDown, 
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCards } from '@/components/ui/StatsCards';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import {
  useGetSparesQuery,
  useGetSpareStatsQuery,
  useGetLowStockSparesQuery,
  useCreateSpareMutation,
  useUpdateSpareMutation,
  useDeleteSpareMutation,
  useUpdateSpareStockMutation,
  Spare,
  SpareFilters
} from '@/lib/api/sparesApi';
import {
  SparesList,
  SpareForm,
  SpareDetails,
  StockUpdateModal
} from '@/components/spares';
import { ClientOnly } from '@/components/ui/ClientOnly';

export default function SparesPage() {
  const user = useSelector(selectCurrentUser);
  
  // State management
  const [filters, setFilters] = useState<SpareFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [modals, setModals] = useState({
    createSpare: false,
    editSpare: false,
    viewSpare: false,
    updateStock: false,
    deleteSpare: false
  });
  
  const [selectedSpare, setSelectedSpare] = useState<Spare | null>(null);

  // API hooks
  const { data: sparesData, isLoading: sparesLoading } = useGetSparesQuery(filters);
  const { data: statsData, isLoading: statsLoading } = useGetSpareStatsQuery();
  const { data: lowStockData } = useGetLowStockSparesQuery();
  
  const [createSpare, { isLoading: createLoading }] = useCreateSpareMutation();
  const [updateSpare, { isLoading: updateLoading }] = useUpdateSpareMutation();
  const [deleteSpare, { isLoading: deleteLoading }] = useDeleteSpareMutation();
  const [updateStock, { isLoading: stockUpdateLoading }] = useUpdateSpareStockMutation();

  // Modal handlers
  const openModal = (modalName: keyof typeof modals, spare?: Spare) => {
    if (spare) setSelectedSpare(spare);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    if (modalName !== 'viewSpare') {
      setSelectedSpare(null);
    }
  };

  const closeAllModals = () => {
    setModals({
      createSpare: false,
      editSpare: false,
      viewSpare: false,
      updateStock: false,
      deleteSpare: false
    });
    setSelectedSpare(null);
  };

  // CRUD handlers
  const handleCreateSpare = async (spareData: Partial<Spare>) => {
    try {
      await createSpare(spareData).unwrap();
      toast.success('Spare created successfully');
      closeModal('createSpare');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create spare');
    }
  };

  const handleUpdateSpare = async (spareData: Partial<Spare>) => {
    if (!selectedSpare) return;
    
    try {
      await updateSpare({ 
        id: selectedSpare._id, 
        data: spareData 
      }).unwrap();
      toast.success('Spare updated successfully');
      closeModal('editSpare');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update spare');
    }
  };

  const handleDeleteSpare = async () => {
    if (!selectedSpare) return;
    
    try {
      await deleteSpare(selectedSpare._id).unwrap();
      toast.success('Spare deleted successfully');
      closeModal('deleteSpare');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete spare');
    }
  };

  const handleStockUpdate = async (stockUpdate: any) => {
    if (!selectedSpare) return;
    
    try {
      await updateStock({
        spareId: selectedSpare._id,
        stockUpdate
      }).unwrap();
      toast.success('Stock updated successfully');
      closeModal('updateStock');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update stock');
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Spares',
      value: statsData?.data?.totalSpares || 0,
      icon: <Package className="w-6 h-6" />,
      color: 'blue' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Active Spares',
      value: statsData?.data?.activeSpares || 0,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'green' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Low Stock Alerts',
      value: statsData?.data?.lowStockSpares || 0,
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'yellow' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Critical Spares',
      value: statsData?.data?.criticalSpares || 0,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'red' as const,
      change: { value: 0, type: 'neutral' as const }
    }
  ];



  return (
    <AppLayout>
      <ClientOnly>
        <div className="space-y-6">
          {/* Page Header */}
          <PageHeader
            title="Spares Management"
            description="Manage your spare parts inventory and stock levels"
          >
            <Button onClick={() => openModal('createSpare')} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Spare</span>
            </Button>
          </PageHeader>

          {/* Stats Cards */}
          <StatsCards
            cards={statsCards}
          />

          {/* Spares List */}
          <SparesList
            spares={sparesData?.data?.spares || []}
            total={sparesData?.data?.total || 0}
            page={sparesData?.data?.page || 1}
            limit={sparesData?.data?.limit || 20}
            totalPages={sparesData?.data?.totalPages || 1}
            isLoading={sparesLoading}
            filters={filters}
            onFiltersChange={setFilters}
            onCreateSpare={() => openModal('createSpare')}
            onEditSpare={(spare) => openModal('editSpare', spare)}
            onDeleteSpare={(spare) => openModal('deleteSpare', spare)}
            onViewSpare={(spare) => openModal('viewSpare', spare)}
            onUpdateStock={(spare) => openModal('updateStock', spare)}
          />

                  {/* Modals */}
          <SpareForm
            isOpen={modals.createSpare}
            onClose={() => closeModal('createSpare')}
            onSubmit={handleCreateSpare}
            isLoading={createLoading}
            isEdit={false}
          />

          <SpareForm
            isOpen={modals.editSpare}
            onClose={() => closeModal('editSpare')}
            onSubmit={handleUpdateSpare}
            initialData={selectedSpare || undefined}
            isLoading={updateLoading}
            isEdit={true}
          />

          {selectedSpare && (
            <SpareDetails
              spare={selectedSpare}
              isOpen={modals.viewSpare}
              onClose={() => closeModal('viewSpare')}
              onEdit={() => {
                closeModal('viewSpare');
                openModal('editSpare', selectedSpare);
              }}
              onUpdateStock={() => {
                closeModal('viewSpare');
                openModal('updateStock', selectedSpare);
              }}
            />
          )}

          <StockUpdateModal
            isOpen={modals.updateStock}
            onClose={() => closeModal('updateStock')}
            onSubmit={handleStockUpdate}
            spare={selectedSpare}
            isLoading={stockUpdateLoading}
          />

          <ConfirmModal
            isOpen={modals.deleteSpare}
            onClose={() => closeModal('deleteSpare')}
            onConfirm={handleDeleteSpare}
            title="Delete Spare"
            message={`Are you sure you want to delete "${selectedSpare?.spareName}"? This action cannot be undone.`}
            confirmText="Delete"
            isLoading={deleteLoading}
            type="danger"
          />
        </div>
        </ClientOnly>
      </AppLayout>
    );
}
