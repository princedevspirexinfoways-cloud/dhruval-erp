'use client';

import React from 'react';
import { X, Package, Tag, Warehouse, DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

interface InventoryItemDetailsModalProps {
    item: any;
    onClose: () => void;
    onEdit?: (item: any) => void;
    theme: 'light' | 'dark';
}

export const InventoryItemDetailsModal: React.FC<InventoryItemDetailsModalProps> = ({
    item,
    onClose,
    onEdit,
    theme
}) => {
    if (!item) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-[10000] ${theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-sm' : 'bg-gray-500/50 backdrop-blur-sm'}`}>
            <div className={`rounded-lg p-6 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl ${theme === 'dark' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-lg bg-indigo-500 flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {item.itemName}
                            </h2>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.itemCode || item.companyItemCode || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onEdit(item);
                                    onClose();
                                }}
                                className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                            >
                                Edit
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className={`text-2xl transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold mb-3 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            <FileText className="w-5 h-5 mr-2" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {item.category?.primary || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Product Type</p>
                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {item.productType || 'N/A'}
                                </p>
                            </div>
                            {item.itemDescription && (
                                <div className="md:col-span-2">
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Description</p>
                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {item.itemDescription}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock Information */}
                    <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold mb-3 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Stock Information
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Current Stock</p>
                                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {item.stock?.currentStock || 0} {item.stock?.unit || 'units'}
                                </p>
                            </div>
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Available</p>
                                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {item.stock?.availableStock || 0} {item.stock?.unit || 'units'}
                                </p>
                            </div>
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Reorder Level</p>
                                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {item.stock?.reorderLevel || 0}
                                </p>
                            </div>
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
                                <p className={`text-xl font-bold text-indigo-600`}>
                                    {formatCurrency(item.stock?.totalValue || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold mb-3 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            <DollarSign className="w-5 h-5 mr-2" />
                            Pricing Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cost Price</p>
                                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(item.pricing?.costPrice || 0)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Selling Price</p>
                                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(item.pricing?.sellingPrice || 0)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>MRP</p>
                                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(item.pricing?.mrp || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quality */}
                    {item.quality && (
                        <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className={`text-lg font-semibold mb-3 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <Tag className="w-5 h-5 mr-2" />
                                Quality Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quality Grade</p>
                                    <Badge
                                        className={
                                            item.quality.qualityGrade === 'A+' || item.quality.qualityGrade === 'A'
                                                ? 'bg-green-100 text-green-800'
                                                : item.quality.qualityGrade === 'B+' || item.quality.qualityGrade === 'B'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                        }
                                    >
                                        {item.quality.qualityGrade}
                                    </Badge>
                                </div>
                                <div>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Defect Percentage</p>
                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {item.quality.defectPercentage || 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Specifications */}
                    {item.specifications && (
                        <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Specifications
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {item.specifications.gsm && (
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>GSM</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.specifications.gsm}
                                        </p>
                                    </div>
                                )}
                                {item.specifications.width && (
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Width</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.specifications.width} inches
                                        </p>
                                    </div>
                                )}
                                {item.specifications.color && (
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Color</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.specifications.color}
                                        </p>
                                    </div>
                                )}
                                {item.specifications.batchNumber && (
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Batch Number</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.specifications.batchNumber}
                                        </p>
                                    </div>
                                )}
                                {item.specifications.lotNumber && (
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lot Number</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.specifications.lotNumber}
                                        </p>
                                    </div>
                                )}
                                {item.specifications.challan && (
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Challan Number</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.specifications.challan}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Locations */}
                    {item.locations && item.locations.length > 0 && (
                        <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className={`text-lg font-semibold mb-3 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <Warehouse className="w-5 h-5 mr-2" />
                                Warehouse Locations
                            </h3>
                            <div className="space-y-2">
                                {item.locations.map((location: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                                            {location.warehouseName || 'Warehouse'} - {location.quantity || 0} {item.stock?.unit || 'units'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

