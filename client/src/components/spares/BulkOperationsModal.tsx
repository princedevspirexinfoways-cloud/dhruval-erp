import React, { useState } from 'react';
import { X, Upload, Download, Trash2, Edit, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spare } from '@/lib/api/sparesApi';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpares: Spare[];
  onBulkUpdate: (updates: any) => void;
  onBulkDelete: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isLoading?: boolean;
}

type BulkOperation = 'update' | 'delete' | 'export' | 'import';

export const BulkOperationsModal: React.FC<BulkOperationsModalProps> = ({
  isOpen,
  onClose,
  selectedSpares,
  onBulkUpdate,
  onBulkDelete,
  onExport,
  onImport,
  isLoading = false
}) => {
  const [activeOperation, setActiveOperation] = useState<BulkOperation>('update');
  const [updateData, setUpdateData] = useState({
    category: '',
    manufacturer: '',
    criticality: '',
    isActive: '',
    reorderLevel: '',
    minStockLevel: '',
    maxStockLevel: ''
  });

  if (!isOpen) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleBulkUpdate = () => {
    const updates: any = {};
    
    // Only include non-empty fields
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== '') {
        if (key === 'isActive') {
          updates[`status.${key}`] = value === 'true';
        } else if (['reorderLevel', 'minStockLevel', 'maxStockLevel'].includes(key)) {
          updates[`stock.${key}`] = parseFloat(value);
        } else if (key === 'criticality') {
          updates[`maintenance.${key}`] = value;
        } else {
          updates[key] = value;
        }
      }
    });

    onBulkUpdate(updates);
  };

  const operations = [
    {
      id: 'update' as BulkOperation,
      name: 'Bulk Update',
      icon: Edit,
      description: 'Update multiple spares at once',
      color: 'text-blue-600'
    },
    {
      id: 'delete' as BulkOperation,
      name: 'Bulk Delete',
      icon: Trash2,
      description: 'Delete selected spares',
      color: 'text-red-600'
    },
    {
      id: 'export' as BulkOperation,
      name: 'Export Data',
      icon: Download,
      description: 'Export spares to CSV/Excel',
      color: 'text-green-600'
    },
    {
      id: 'import' as BulkOperation,
      name: 'Import Data',
      icon: Upload,
      description: 'Import spares from CSV/Excel',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Operations</h2>
            <p className="text-sm text-gray-500">
              {selectedSpares.length > 0 
                ? `${selectedSpares.length} spares selected`
                : 'Perform bulk operations on spares'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Operation Selection */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 gap-3">
            {operations.map((operation) => {
              const Icon = operation.icon;
              return (
                <button
                  key={operation.id}
                  onClick={() => setActiveOperation(operation.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    activeOperation === operation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${operation.color}`} />
                    <div>
                      <div className="font-medium text-gray-900">{operation.name}</div>
                      <div className="text-xs text-gray-500">{operation.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operation Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeOperation === 'update' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Update Fields</h3>
              <p className="text-sm text-gray-500">
                Only fill in the fields you want to update. Empty fields will be ignored.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={updateData.category}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No change</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="electrical">Electrical</option>
                    <option value="electronic">Electronic</option>
                    <option value="hydraulic">Hydraulic</option>
                    <option value="pneumatic">Pneumatic</option>
                    <option value="consumable">Consumable</option>
                    <option value="tool">Tool</option>
                    <option value="safety">Safety</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer
                  </label>
                  <Input
                    type="text"
                    value={updateData.manufacturer}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Leave empty for no change"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Criticality
                  </label>
                  <select
                    value={updateData.criticality}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, criticality: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No change</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={updateData.isActive}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, isActive: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No change</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Level
                  </label>
                  <Input
                    type="number"
                    value={updateData.reorderLevel}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, reorderLevel: e.target.value }))}
                    placeholder="Leave empty for no change"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Stock Level
                  </label>
                  <Input
                    type="number"
                    value={updateData.minStockLevel}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, minStockLevel: e.target.value }))}
                    placeholder="Leave empty for no change"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          {activeOperation === 'delete' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-medium text-red-900">Delete Selected Spares</h3>
                  <p className="text-sm text-red-700">
                    This action will permanently delete {selectedSpares.length} selected spares. 
                    This cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Spares to be deleted:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedSpares.map((spare) => (
                    <div key={spare._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{spare.spareName}</span>
                      <span className="text-xs text-gray-500">{spare.spareCode}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeOperation === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Download className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-medium text-green-900">Export Spares Data</h3>
                  <p className="text-sm text-green-700">
                    Export {selectedSpares.length > 0 ? `${selectedSpares.length} selected` : 'all'} spares to CSV format.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeOperation === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <Upload className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="text-lg font-medium text-purple-900">Import Spares Data</h3>
                  <p className="text-sm text-purple-700">
                    Upload a CSV file to import spares data. Make sure the format matches the template.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="text-sm text-gray-500">
                <p>CSV should include columns: spareCode, spareName, category, manufacturer, partNumber, etc.</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Download Template
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          {activeOperation === 'update' && (
            <Button
              onClick={handleBulkUpdate}
              disabled={isLoading || selectedSpares.length === 0}
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>{isLoading ? 'Updating...' : 'Update Spares'}</span>
            </Button>
          )}

          {activeOperation === 'delete' && (
            <Button
              onClick={onBulkDelete}
              disabled={isLoading || selectedSpares.length === 0}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isLoading ? 'Deleting...' : 'Delete Spares'}</span>
            </Button>
          )}

          {activeOperation === 'export' && (
            <Button
              onClick={onExport}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isLoading ? 'Exporting...' : 'Export Data'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
