'use client';

import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateGoodsReturnMutation } from '@/lib/api/goodsReturnsApi';
import { toast } from 'react-hot-toast';

interface GoodsReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: {
    _id: string;
    itemName: string;
    itemCode: string;
    stock: {
      currentStock: number;
      unit: string;
    };
    specifications?: {
      challan?: string;
    };
  } | null;
  onSuccess?: () => void;
  theme?: 'light' | 'dark';
}

export function GoodsReturnModal({
  isOpen,
  onClose,
  inventoryItem,
  onSuccess,
  theme = 'light',
}: GoodsReturnModalProps) {
  const [originalChallanNumber, setOriginalChallanNumber] = useState<string>('');
  const [originalChallanDate, setOriginalChallanDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [returnedQuantity, setReturnedQuantity] = useState<number>(0);
  const [returnReason, setReturnReason] = useState<
    'damaged' | 'defective' | 'quality_issue' | 'wrong_item' | 'expired' | 'other'
  >('damaged');
  const [returnReasonDetails, setReturnReasonDetails] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [createGoodsReturn, { isLoading }] = useCreateGoodsReturnMutation();

  useEffect(() => {
    if (isOpen && inventoryItem) {
      // Pre-fill challan number from inventory item if available
      const challan = inventoryItem.specifications?.challan || '';
      setOriginalChallanNumber(challan);
      setOriginalChallanDate(new Date().toISOString().split('T')[0]);
      setReturnedQuantity(0);
      setReturnReason('damaged');
      setReturnReasonDetails('');
      setNotes('');
    }
  }, [isOpen, inventoryItem]);

  if (!isOpen || !inventoryItem) return null;

  const maxQuantity = inventoryItem.stock?.currentStock || 0;
  const unit = inventoryItem.stock?.unit || 'units';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!originalChallanNumber.trim()) {
      toast.error('Please enter the original challan number');
      return;
    }

    if (returnedQuantity <= 0) {
      toast.error('Returned quantity must be greater than 0');
      return;
    }

    if (returnedQuantity > maxQuantity) {
      toast.error(
        `Returned quantity cannot exceed available stock (${maxQuantity} ${unit})`
      );
      return;
    }

    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }

    try {
      await createGoodsReturn({
        inventoryItemId: inventoryItem._id,
        returnData: {
          originalChallanNumber: originalChallanNumber.trim(),
          originalChallanDate: originalChallanDate || undefined,
          damagedQuantity: 0, // Always 0, only returned quantity is tracked
          returnedQuantity,
          returnReason,
          returnReasonDetails: returnReasonDetails || undefined,
          notes: notes || undefined,
        },
      }).unwrap();

      toast.success('Goods return created successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create goods return');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-theme overflow-y-auto ${
        theme === 'dark'
          ? 'bg-gray-900/80 backdrop-blur-sm'
          : 'bg-gray-900/40 backdrop-blur-sm'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl my-auto rounded-lg sm:rounded-xl shadow-2xl transition-theme border ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-3 sm:p-4 md:p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div
              className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Package
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className={`text-base sm:text-lg md:text-xl font-semibold truncate ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Goods Return
              </h2>
              <p
                className={`text-xs sm:text-sm truncate ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {inventoryItem.itemName} ({inventoryItem.itemCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors flex-shrink-0 ml-2 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Current Stock Info */}
          <div
            className={`p-3 sm:p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
            }`}
          >
            <p
              className={`text-xs sm:text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Current Stock
            </p>
            <p
              className={`text-xl sm:text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-blue-900'
              }`}
            >
              {maxQuantity} {unit}
            </p>
          </div>

          {/* Original Challan Number */}
          <div>
            <label
              className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Original Challan Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={originalChallanNumber}
              onChange={(e) => setOriginalChallanNumber(e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter original challan number"
              required
            />
          </div>

          {/* Original Challan Date */}
          <div>
            <label
              className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Original Challan Date
            </label>
            <input
              type="date"
              value={originalChallanDate}
              onChange={(e) => setOriginalChallanDate(e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>

          {/* Returned Quantity */}
          <div>
            <label
              className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                <span>Returned Quantity <span className="text-red-500">*</span></span>
              </div>
            </label>
            <input
              type="number"
              min="0"
              max={maxQuantity}
              step="0.01"
              value={returnedQuantity || ''}
              onChange={(e) => setReturnedQuantity(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter returned quantity"
              required
            />
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Available: {maxQuantity} {unit}
            </p>
            {returnedQuantity > maxQuantity && (
              <p className="text-red-500 text-xs mt-1">
                Quantity exceeds available stock ({maxQuantity} {unit})
              </p>
            )}
          </div>

          {/* Return Reason */}
          <div>
            <label
              className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Return Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value as any)}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              required
            >
              <option value="damaged">Damaged</option>
              <option value="defective">Defective</option>
              <option value="quality_issue">Quality Issue</option>
              <option value="wrong_item">Wrong Item</option>
              <option value="expired">Expired</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Return Reason Details */}
          <div>
            <label
              className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Reason Details
            </label>
            <textarea
              value={returnReasonDetails}
              onChange={(e) => setReturnReasonDetails(e.target.value)}
              rows={3}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme resize-none ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Provide additional details about the return..."
            />
          </div>

          {/* Notes */}
          <div>
            <label
              className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme resize-none ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-2 sm:py-2.5"
              disabled={
                isLoading ||
                !originalChallanNumber.trim() ||
                returnedQuantity <= 0 ||
                returnedQuantity > maxQuantity
              }
            >
              {isLoading ? 'Creating...' : 'Create Goods Return'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

