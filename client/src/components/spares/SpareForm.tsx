import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spare } from '@/lib/api/sparesApi';
import { FormMaintenanceManagement } from './FormMaintenanceManagement';
import { FormQualityManagement } from './FormQualityManagement';
import { FormCompatibilityManagement } from './FormCompatibilityManagement';
import { FormSuppliersManagement } from './FormSuppliersManagement';

interface SpareFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Spare>) => void;
  initialData?: Partial<Spare>;
  isLoading?: boolean;
  isEdit?: boolean;
}

const CATEGORIES = [
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'hydraulic', label: 'Hydraulic' },
  { value: 'pneumatic', label: 'Pneumatic' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'tool', label: 'Tool' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' }
];

const CRITICALITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const QUALITY_GRADES = [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'B+', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' }
];

export const SpareForm: React.FC<SpareFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<Partial<Spare>>({
    spareCode: '',
    spareName: '',
    spareDescription: '',
    category: 'mechanical',
    partNumber: '',
    manufacturer: '',
    brand: '',
    spareModel: '',
    stock: {
      currentStock: 0,
      reservedStock: 0,
      availableStock: 0,
      inTransitStock: 0,
      damagedStock: 0,
      unit: 'pcs',
      reorderLevel: 10,
      minStockLevel: 5,
      maxStockLevel: 100,
      averageCost: 0,
      totalValue: 0
    },
    pricing: {
      currency: 'INR'
    },
    maintenance: {
      isConsumable: false,
      criticality: 'medium'
    },
    quality: {
      qualityGrade: 'A',
      qualityCheckRequired: false,
      qualityParameters: [],
      certifications: [],
      complianceStandards: []
    },
    status: {
      isActive: true,
      isDiscontinued: false,
      isCritical: false,
      isObsolete: false,
      requiresApproval: false,
      isHazardous: false
    },
    compatibility: [],
    suppliers: [],
    locations: []
  });

  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleInputChange = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleArrayAdd = (path: string, item: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      if (!current[keys[keys.length - 1]]) {
        current[keys[keys.length - 1]] = [];
      }
      
      current[keys[keys.length - 1]] = [...current[keys[keys.length - 1]], item];
      return newData;
    });
  };

  const handleArrayRemove = (path: string, index: number) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = current[keys[keys.length - 1]].filter((_: any, i: number) => i !== index);
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'stock', label: 'Stock & Pricing' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'quality', label: 'Quality' },
    { id: 'compatibility', label: 'Compatibility' },
    { id: 'suppliers', label: 'Suppliers' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Spare' : 'Create New Spare'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spare Code *
                    </label>
                    <Input
                      type="text"
                      value={formData.spareCode || ''}
                      onChange={(e) => handleInputChange('spareCode', e.target.value.toUpperCase())}
                      placeholder="Enter spare code"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spare Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.spareName || ''}
                      onChange={(e) => handleInputChange('spareName', e.target.value)}
                      placeholder="Enter spare name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.spareDescription || ''}
                    onChange={(e) => handleInputChange('spareDescription', e.target.value)}
                    placeholder="Enter spare description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category || 'mechanical'}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub Category
                    </label>
                    <Input
                      type="text"
                      value={formData.subCategory || ''}
                      onChange={(e) => handleInputChange('subCategory', e.target.value)}
                      placeholder="Enter sub category"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Number *
                    </label>
                    <Input
                      type="text"
                      value={formData.partNumber || ''}
                      onChange={(e) => handleInputChange('partNumber', e.target.value)}
                      placeholder="Enter part number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer Part Number
                    </label>
                    <Input
                      type="text"
                      value={formData.manufacturerPartNumber || ''}
                      onChange={(e) => handleInputChange('manufacturerPartNumber', e.target.value)}
                      placeholder="Enter manufacturer part number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer *
                    </label>
                    <Input
                      type="text"
                      value={formData.manufacturer || ''}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      placeholder="Enter manufacturer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <Input
                      type="text"
                      value={formData.brand || ''}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Enter brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <Input
                      type="text"
                      value={formData.spareModel || ''}
                      onChange={(e) => handleInputChange('spareModel', e.target.value)}
                      placeholder="Enter model"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stock & Pricing Tab */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Stock Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock *
                    </label>
                    <Input
                      type="number"
                      value={formData.stock?.currentStock || 0}
                      onChange={(e) => handleInputChange('stock.currentStock', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit *
                    </label>
                    <Input
                      type="text"
                      value={formData.stock?.unit || ''}
                      onChange={(e) => handleInputChange('stock.unit', e.target.value)}
                      placeholder="pcs, kg, ltr, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average Cost
                    </label>
                    <Input
                      type="number"
                      value={formData.stock?.averageCost || 0}
                      onChange={(e) => handleInputChange('stock.averageCost', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Level *
                    </label>
                    <Input
                      type="number"
                      value={formData.stock?.reorderLevel || 0}
                      onChange={(e) => handleInputChange('stock.reorderLevel', parseFloat(e.target.value) || 0)}
                      placeholder="10"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Stock Level *
                    </label>
                    <Input
                      type="number"
                      value={formData.stock?.minStockLevel || 0}
                      onChange={(e) => handleInputChange('stock.minStockLevel', parseFloat(e.target.value) || 0)}
                      placeholder="5"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Stock Level *
                    </label>
                    <Input
                      type="number"
                      value={formData.stock?.maxStockLevel || 0}
                      onChange={(e) => handleInputChange('stock.maxStockLevel', parseFloat(e.target.value) || 0)}
                      placeholder="100"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-900 pt-6">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price
                    </label>
                    <Input
                      type="number"
                      value={formData.pricing?.costPrice || ''}
                      onChange={(e) => handleInputChange('pricing.costPrice', parseFloat(e.target.value) || undefined)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Standard Cost
                    </label>
                    <Input
                      type="number"
                      value={formData.pricing?.standardCost || ''}
                      onChange={(e) => handleInputChange('pricing.standardCost', parseFloat(e.target.value) || undefined)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.pricing?.currency || 'INR'}
                      onChange={(e) => handleInputChange('pricing.currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <FormMaintenanceManagement
                  spare={formData}
                  onUpdate={(updates) => {
                    setFormData(prev => ({ ...prev, ...updates }));
                  }}
                  isEditable={true}
                />
              </div>
            )}

            {/* Quality Tab */}
            {activeTab === 'quality' && (
              <div className="space-y-6">
                <FormQualityManagement
                  spare={formData}
                  onUpdate={(updates) => {
                    setFormData(prev => ({ ...prev, ...updates }));
                  }}
                  isEditable={true}
                />
              </div>
            )}

            {/* Compatibility Tab */}
            {activeTab === 'compatibility' && (
              <div className="space-y-6">
                <FormCompatibilityManagement
                  spare={formData}
                  onUpdate={(updates) => {
                    setFormData(prev => ({ ...prev, ...updates }));
                  }}
                  isEditable={true}
                />
              </div>
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="space-y-6">
                <FormSuppliersManagement
                  spare={formData}
                  onUpdate={(updates) => {
                    setFormData(prev => ({ ...prev, ...updates }));
                  }}
                  isEditable={true}
                />
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
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEdit ? 'Update Spare' : 'Create Spare'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
