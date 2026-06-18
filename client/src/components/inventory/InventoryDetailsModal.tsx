'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';

interface InventoryDetailsModalProps {
  item: any;
  onClose: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  theme: 'light' | 'dark';
}

export function InventoryDetailsModal({ item, onClose, onEdit, onDelete, theme }: InventoryDetailsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (!item) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 transition-theme ${
      theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-sm' : 'bg-gray-500/50 backdrop-blur-sm'
    }`}>
      <div className={`p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-theme ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>Item Details: {item.itemName}</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClose}
            className={`transition-theme ${
              theme === 'dark' 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✕
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Item Code:</span>
                <span className="text-sm font-medium font-mono">{item.itemCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium capitalize">{item.category?.primary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Product Type:</span>
                <span className="text-sm font-medium">{item.productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Description:</span>
                <span className="text-sm font-medium max-w-xs text-right">{item.itemDescription}</span>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Stock Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Stock:</span>
                <span className="text-sm font-medium">{item.stock?.currentStock} {item.stock?.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available Stock:</span>
                <span className="text-sm font-medium">{item.stock?.availableStock} {item.stock?.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reserved Stock:</span>
                <span className="text-sm font-medium">{item.stock?.reservedStock} {item.stock?.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reorder Level:</span>
                <span className="text-sm font-medium">{item.stock?.reorderLevel} {item.stock?.unit}</span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Specifications</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">GSM:</span>
                <span className="text-sm font-medium">{item.specifications?.gsm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Width:</span>
                <span className="text-sm font-medium">{item.specifications?.width} inches</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Color:</span>
                <span className="text-sm font-medium capitalize">{item.specifications?.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Design:</span>
                <span className="text-sm font-medium">{item.specifications?.design}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Quality */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Pricing & Quality</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cost Price:</span>
                <span className="text-sm font-medium">{formatCurrency(item.pricing?.costPrice || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selling Price:</span>
                <span className="text-sm font-medium">{formatCurrency(item.pricing?.sellingPrice || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quality Grade:</span>
                <span className="text-sm font-medium">{item.quality?.qualityGrade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Value:</span>
                <span className="text-sm font-medium">{formatCurrency(item.stock?.totalValue || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={() => {
              onEdit(item);
              onClose();
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Item
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this item?')) {
                onDelete(item._id);
                onClose();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Item
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

