'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Warehouse as WarehouseIcon,
  Building2,
  MapPin,
  ChevronDown,
  Check,
  Plus,
  Loader2
} from 'lucide-react';
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice';
import { selectTheme } from '@/lib/features/ui/uiSlice';
import { RootState } from '@/lib/store';
import { Can } from '@/lib/casl/Can';
import { useGetWarehousesQuery, type Warehouse } from '@/lib/api/warehousesApi';

interface WarehouseSelectorProps {
  selectedWarehouse: string;
  onWarehouseChange: (warehouseId: string) => void;
  onAddWarehouse?: () => void;
}

export const WarehouseSelector: React.FC<WarehouseSelectorProps> = ({
  selectedWarehouse,
  onWarehouseChange,
  onAddWarehouse
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const theme = useSelector(selectTheme);

  // Use RTK Query to fetch warehouses
  const { data: warehousesResponse, isLoading, error, refetch } = useGetWarehousesQuery({});

  const allWarehouses = warehousesResponse?.data || [];
  const pagination = warehousesResponse?.pagination;

  // Filter warehouses based on user access
  const warehouses = isSuperAdmin
    ? allWarehouses
    : allWarehouses.filter(w => w.companyId === user?.companyId);

  const selectedWarehouseData = warehouses.find((w: Warehouse) => w._id === selectedWarehouse);

  const handleWarehouseSelect = (warehouseId: string) => {
    onWarehouseChange(warehouseId);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading warehouses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="text-center py-4">
          <div className="text-red-600 mb-2">⚠️ Error loading warehouses</div>
          <div className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Failed to fetch warehouses
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          Warehouse *
        </label>
        <Can I="create" a="Warehouse">
          {onAddWarehouse && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddWarehouse}
              className={`text-blue-600 hover:text-blue-700 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </Can>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            }`}
        >
          <div className="flex items-center gap-3">
            <WarehouseIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="text-left">
              <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {selectedWarehouseData?.warehouseName || 'Select Warehouse'}
              </div>
              {selectedWarehouseData && (
                <div className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <MapPin className="w-3 h-3" />
                  {selectedWarehouseData.address.city}, {selectedWarehouseData.address.state}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
        </button>

        {isOpen && (
          <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-2">
              {warehouses.length === 0 ? (
                <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isSuperAdmin ? 'No warehouses found' : 'No warehouses available for your company'}
                </div>
              ) : (
                warehouses.map((warehouse: Warehouse) => (
                  <div key={warehouse._id}>
                    <button
                      onClick={() => handleWarehouseSelect(warehouse._id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedWarehouse === warehouse._id
                        ? (theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200')
                        : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <WarehouseIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <div className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{warehouse.warehouseName}</div>
                            <div className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              <MapPin className="w-3 h-3" />
                              {warehouse.address.city}, {warehouse.address.state}
                            </div>
                            <div className="text-xs text-gray-400">
                              Capacity: {warehouse.currentUtilization.currentWeight}/{warehouse.capacity.maxWeight} kg
                            </div>
                            {isSuperAdmin && warehouse.companyId !== user?.companyId && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Company ID: {warehouse.companyId}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedWarehouse === warehouse._id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Company Access Info */}
      {!isSuperAdmin && (
        <div className={`mt-3 p-3 rounded-lg border ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
            <Building2 className="w-4 h-4" />
            <span>
              You can only access warehouses from your company: <strong>Company ID: {user?.companyId || 'Unknown'}</strong>
            </span>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className={`mt-3 p-3 rounded-lg border ${theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-800'}`}>
            <Building2 className="w-4 h-4" />
            <span>
              <strong>Super Admin:</strong> You can access warehouses from all companies
            </span>
          </div>
        </div>
      )}

      {/* Warehouse Count Info */}
      {pagination && (
        <div className={`mt-3 p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="font-medium mb-1">Warehouse Information:</div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {allWarehouses.length} of {pagination.total} warehouses
              {pagination.pages > 1 && ` (Page ${pagination.page} of ${pagination.pages})`}
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Details (if selected) */}
      {selectedWarehouseData && (
        <div className={`mt-3 p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="font-medium mb-2">Selected Warehouse Details:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="font-medium">Address:</span> {selectedWarehouseData.address.addressLine1}</div>
              <div><span className="font-medium">Contact:</span> {selectedWarehouseData.contactInfo.primaryPhone}</div>
              <div><span className="font-medium">Phone:</span> {selectedWarehouseData.contactInfo.primaryPhone}</div>
              <div><span className="font-medium">Email:</span> {selectedWarehouseData.contactInfo.email || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
