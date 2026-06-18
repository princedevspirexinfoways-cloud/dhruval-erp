'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMoveToScrapMutation } from '@/lib/api/scrapApi';
import { toast } from 'react-hot-toast';

interface MoveToScrapModalProps {
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
    } | null;
    onSuccess?: () => void;
    theme?: 'light' | 'dark';
}

export function MoveToScrapModal({
    isOpen,
    onClose,
    inventoryItem,
    onSuccess,
    theme = 'light',
}: MoveToScrapModalProps) {
    const [quantity, setQuantity] = useState<number>(0);
    const [scrapReason, setScrapReason] = useState<'damaged' | 'defective' | 'expired' | 'obsolete' | 'production_waste' | 'quality_reject' | 'other'>('damaged');
    const [scrapReasonDetails, setScrapReasonDetails] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const [moveToScrap, { isLoading }] = useMoveToScrapMutation();

    useEffect(() => {
        if (isOpen && inventoryItem) {
            setQuantity(0);
            setScrapReason('damaged');
            setScrapReasonDetails('');
            setNotes('');
        }
    }, [isOpen, inventoryItem]);

    if (!isOpen || !inventoryItem) return null;

    const maxQuantity = inventoryItem.stock?.currentStock || 0;
    const unit = inventoryItem.stock?.unit || 'units';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!quantity || quantity <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (quantity > maxQuantity) {
            toast.error(`Quantity cannot exceed available stock (${maxQuantity} ${unit})`);
            return;
        }

        if (!scrapReason) {
            toast.error('Please select a scrap reason');
            return;
        }

        try {
            await moveToScrap({
                inventoryItemId: inventoryItem._id,
                scrapData: {
                    quantity,
                    scrapReason,
                    scrapReasonDetails: scrapReasonDetails || undefined,
                    notes: notes || undefined,
                },
            }).unwrap();

            toast.success('Inventory moved to scrap successfully');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to move inventory to scrap');
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-theme ${theme === 'dark'
                    ? 'bg-gray-900/80 backdrop-blur-sm'
                    : 'bg-gray-900/40 backdrop-blur-sm'
                }`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-md mx-4 rounded-xl shadow-2xl transition-theme border ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
                            }`}>
                            <AlertTriangle className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                                }`} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                Move to Scrap
                            </h2>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {inventoryItem.itemName} ({inventoryItem.itemCode})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Current Stock Info */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
                        }`}>
                        <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Current Stock
                        </p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-blue-900'
                            }`}>
                            {maxQuantity} {unit}
                        </p>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Quantity to Move to Scrap <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={maxQuantity}
                            step="0.01"
                            value={quantity || ''}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                }`}
                            placeholder={`Enter quantity (max: ${maxQuantity})`}
                            required
                        />
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            Available: {maxQuantity} {unit}
                        </p>
                    </div>

                    {/* Scrap Reason */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Scrap Reason <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={scrapReason}
                            onChange={(e) => setScrapReason(e.target.value as any)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-white'
                                    : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            required
                        >
                            <option value="damaged">Damaged</option>
                            <option value="defective">Defective</option>
                            <option value="expired">Expired</option>
                            <option value="obsolete">Obsolete</option>
                            <option value="production_waste">Production Waste</option>
                            <option value="quality_reject">Quality Reject</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Scrap Reason Details */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Reason Details
                        </label>
                        <textarea
                            value={scrapReasonDetails}
                            onChange={(e) => setScrapReasonDetails(e.target.value)}
                            rows={3}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                }`}
                            placeholder="Provide additional details about why this item is being scrapped..."
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Additional Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                }`}
                            placeholder="Any additional notes..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                            disabled={isLoading || !quantity || quantity <= 0 || quantity > maxQuantity}
                        >
                            {isLoading ? 'Moving...' : 'Move to Scrap'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

