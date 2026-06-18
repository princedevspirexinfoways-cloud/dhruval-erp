import React, { useState, useEffect } from 'react';
import { X, Package, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spare, StockUpdateRequest } from '@/lib/api/sparesApi';

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stockUpdate: StockUpdateRequest) => void;
  spare: Spare | null;
  isLoading?: boolean;
}

const STOCK_UPDATE_TYPES = [
  { 
    value: 'inward', 
    label: 'Stock In', 
    description: 'Add stock (Purchase, Return, etc.)',
    icon: TrendingUp,
    color: 'text-green-600'
  },
  { 
    value: 'outward', 
    label: 'Stock Out', 
    description: 'Remove stock (Issue, Sale, etc.)',
    icon: TrendingDown,
    color: 'text-red-600'
  },
  { 
    value: 'adjustment', 
    label: 'Adjustment', 
    description: 'Adjust stock to specific quantity',
    icon: Settings,
    color: 'text-blue-600'
  }
];

const COMMON_REASONS = {
  inward: [
    'Purchase Receipt',
    'Return from Production',
    'Return from Maintenance',
    'Transfer In',
    'Opening Stock',
    'Other'
  ],
  outward: [
    'Production Issue',
    'Maintenance Issue',
    'Sale',
    'Transfer Out',
    'Damaged/Scrap',
    'Other'
  ],
  adjustment: [
    'Physical Count Adjustment',
    'System Correction',
    'Damage Write-off',
    'Expired Stock',
    'Other'
  ]
};

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  spare,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<StockUpdateRequest>({
    quantity: 0,
    type: 'inward',
    reason: '',
    warehouseId: ''
  });

  const [customReason, setCustomReason] = useState('');
  const [showCustomReason, setShowCustomReason] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        quantity: 0,
        type: 'inward',
        reason: '',
        warehouseId: ''
      });
      setCustomReason('');
      setShowCustomReason(false);
    }
  }, [isOpen]);

  if (!isOpen || !spare) return null;

  const handleInputChange = (field: keyof StockUpdateRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReasonChange = (reason: string) => {
    if (reason === 'Other') {
      setShowCustomReason(true);
      setFormData(prev => ({ ...prev, reason: customReason }));
    } else {
      setShowCustomReason(false);
      setFormData(prev => ({ ...prev, reason }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalReason = showCustomReason ? customReason : formData.reason;
    
    if (!finalReason.trim()) {
      alert('Please provide a reason for the stock update');
      return;
    }

    if (formData.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (formData.type === 'outward' && formData.quantity > spare.stock.availableStock) {
      alert('Insufficient available stock for this operation');
      return;
    }

    onSubmit({
      ...formData,
      reason: finalReason
    });
  };

  const getNewStockLevel = () => {
    switch (formData.type) {
      case 'inward':
        return spare.stock.currentStock + formData.quantity;
      case 'outward':
        return spare.stock.currentStock - formData.quantity;
      case 'adjustment':
        return formData.quantity;
      default:
        return spare.stock.currentStock;
    }
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= spare.stock.reorderLevel) return 'text-yellow-600';
    if (stock <= spare.stock.minStockLevel) return 'text-orange-600';
    return 'text-green-600';
  };

  const selectedType = STOCK_UPDATE_TYPES.find(type => type.value === formData.type);
  const newStockLevel = getNewStockLevel();

  return (
    <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Update Stock</h2>
            <p className="text-sm text-gray-500">{spare.spareName} ({spare.spareCode})</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Stock Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {spare.stock.currentStock}
              </div>
              <div className="text-sm text-gray-500">Current Stock</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {spare.stock.availableStock}
              </div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {spare.stock.reorderLevel}
              </div>
              <div className="text-sm text-gray-500">Reorder Level</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Update Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Update Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {STOCK_UPDATE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${type.color}`} />
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'adjustment' ? 'New Stock Quantity' : 'Quantity'} *
            </label>
            <div className="relative">
              <Input
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                placeholder="Enter quantity"
                min="0"
                step="0.01"
                required
                className="pr-16"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">{spare.stock.unit}</span>
              </div>
            </div>
            {formData.type === 'outward' && formData.quantity > spare.stock.availableStock && (
              <p className="mt-1 text-sm text-red-600">
                Insufficient available stock ({spare.stock.availableStock} {spare.stock.unit} available)
              </p>
            )}
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason *
            </label>
            <select
              value={showCustomReason ? 'Other' : formData.reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a reason</option>
              {COMMON_REASONS[formData.type as keyof typeof COMMON_REASONS].map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Input */}
          {showCustomReason && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Reason *
              </label>
              <Input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason"
                required
              />
            </div>
          )}

          {/* Stock Preview */}
          {formData.quantity > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Stock after update:
                </span>
                <div className="text-right">
                  <span className={`text-lg font-bold ${getStockStatusColor(newStockLevel)}`}>
                    {newStockLevel} {spare.stock.unit}
                  </span>
                  {newStockLevel <= spare.stock.reorderLevel && (
                    <div className="text-xs text-yellow-600">Below reorder level</div>
                  )}
                  {newStockLevel <= spare.stock.minStockLevel && (
                    <div className="text-xs text-orange-600">Below minimum level</div>
                  )}
                  {newStockLevel === 0 && (
                    <div className="text-xs text-red-600">Out of stock</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
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
              disabled={isLoading || !formData.reason || formData.quantity <= 0}
              className="flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>{isLoading ? 'Updating...' : 'Update Stock'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
