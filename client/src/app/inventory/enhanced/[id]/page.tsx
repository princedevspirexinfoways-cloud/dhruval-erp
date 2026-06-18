'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
    useGetInventoryItemByIdQuery,
    useUpdateInventoryItemMutation,
    useDeleteInventoryItemMutation
} from '@/lib/api/inventoryApi';
import { AppLayout } from '@/components/layout/AppLayout';
import { selectTheme } from '@/lib/features/ui/uiSlice';
import { Button } from '@/components/ui/Button';
import {
    ArrowLeft,
    Package,
    Tag,
    Warehouse,
    DollarSign,
    TrendingUp,
    Calendar,
    FileText,
    Edit,
    Trash2,
    AlertCircle,
    CheckCircle,
    XCircle,
    BarChart3,
    Layers,
    MapPin,
    Users,
    Clock,
    Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { CreateInventoryItemModal } from '@/components/inventory';

const InventoryDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const theme = useSelector(selectTheme);
    const itemId = params.id as string;
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const { data, isLoading, error, refetch } = useGetInventoryItemByIdQuery(itemId);
    const [updateInventoryItem] = useUpdateInventoryItemMutation();
    const [deleteInventoryItem] = useDeleteInventoryItemMutation();

    const item = data?.data;

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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStockStatus = () => {
        if (!item?.stock) return { status: 'unknown', color: 'gray', label: 'Unknown' };
        const currentStock = item.stock.currentStock || 0;
        const reorderLevel = item.stock.reorderLevel || 0;

        if (currentStock === 0) {
            return { status: 'out_of_stock', color: 'red', label: 'Out of Stock' };
        }
        if (currentStock <= reorderLevel) {
            return { status: 'low_stock', color: 'orange', label: 'Low Stock' };
        }
        if (currentStock > reorderLevel * 2) {
            return { status: 'overstocked', color: 'blue', label: 'Overstocked' };
        }
        return { status: 'normal', color: 'green', label: 'Normal Stock' };
    };

    const stockStatus = getStockStatus();

    const handleEdit = () => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            await deleteInventoryItem(itemId).unwrap();
            toast.success('Item deleted successfully');
            router.push('/inventory/enhanced');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to delete item');
        }
    };

    const handleFormSubmit = async (formData: any) => {
        try {
            await updateInventoryItem({ itemId: itemId, itemData: formData }).unwrap();
            toast.success('Item updated successfully');
            setShowEditModal(false);
            setSelectedItem(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to update item');
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading item details...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !item) {
        return (
            <AppLayout>
                <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="text-center">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Item not found
                        </p>
                        <Button
                            onClick={() => router.push('/inventory/enhanced')}
                            className="mt-4"
                        >
                            Back to Inventory
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className={`min-h-screen transition-theme ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
                    {/* Header */}
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className={`mb-4 ${theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>

                        <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`h-16 w-16 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'}`}>
                                        <Package className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.itemName}
                                        </h1>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {item.itemCode || item.companyItemCode || 'N/A'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge
                                                variant={stockStatus.color === 'red' ? 'destructive' : stockStatus.color === 'orange' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {stockStatus.label}
                                            </Badge>
                                            {item.status?.isActive ? (
                                                <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs border-red-500 text-red-600 dark:text-red-400">
                                                    Inactive
                                                </Badge>
                                            )}
                                            {item.category?.primary && (
                                                <Badge variant="outline" className="text-xs">
                                                    {item.category.primary}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleEdit}
                                        className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleDelete}
                                        className={`${theme === 'dark' ? 'border-red-600 text-red-400 hover:bg-red-900/20' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    <FileText className="w-5 h-5 mr-2" />
                                    Basic Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Item Code</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.itemCode || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Company Item Code</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.companyItemCode || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.category?.primary || 'N/A'}
                                            {(item.category as any)?.secondary && ` / ${(item.category as any).secondary}`}
                                            {(item.category as any)?.tertiary && ` / ${(item.category as any).tertiary}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Product Type</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.productType || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Description</p>
                                        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {item.itemDescription || 'No description available'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Information */}
                            <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    <Layers className="w-5 h-5 mr-2" />
                                    Stock Information
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                                        <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Current Stock</p>
                                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>
                                            {item.stock?.currentStock?.toLocaleString() || 0}
                                        </p>
                                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                            {item.stock?.unit || 'units'}
                                        </p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                                        <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Available Stock</p>
                                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-green-900'}`}>
                                            {item.stock?.availableStock?.toLocaleString() || 0}
                                        </p>
                                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                            {item.stock?.unit || 'units'}
                                        </p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-orange-50'}`}>
                                        <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Reserved Stock</p>
                                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-orange-900'}`}>
                                            {item.stock?.reservedStock?.toLocaleString() || 0}
                                        </p>
                                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                            {item.stock?.unit || 'units'}
                                        </p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-yellow-50'}`}>
                                        <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Reorder Level</p>
                                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-yellow-900'}`}>
                                            {item.stock?.reorderLevel?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
                                        <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Min Stock Level</p>
                                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-purple-900'}`}>
                                            {item.stock?.minStockLevel?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-pink-50'}`}>
                                        <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Max Stock Level</p>
                                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-pink-900'}`}>
                                            {item.stock?.maxStockLevel?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Valuation Method</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.stock?.valuationMethod || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Average Cost</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(item.stock?.averageCost || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
                                        <p className={`font-medium text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(item.stock?.totalValue || 0)}
                                        </p>
                                    </div>
                                    {(item.stock as any)?.netQuantity && (
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Net Quantity</p>
                                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {(item.stock as any).netQuantity.toLocaleString()} {item.stock?.unit || 'units'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Specifications */}
                            {item.specifications && (
                                <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        <Tag className="w-5 h-5 mr-2" />
                                        Specifications
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {item.specifications.color && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Color</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.specifications.color}
                                                </p>
                                            </div>
                                        )}
                                        {item.specifications.design && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Design</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.specifications.design}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).hsnCode && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>HSN Code</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).hsnCode}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).grossQuantity && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Gross Quantity</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).grossQuantity.toLocaleString()} {item.stock?.unit || 'units'}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).tareWeight && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tare Weight</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).tareWeight}%
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).fold && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Fold</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).fold}%
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).challan && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Challan Number</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).challan}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).lrNumber && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>LR Number</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).lrNumber}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).transportNumber && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Transport Number</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).transportNumber}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).lotNumber && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lot Number</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {(item.specifications as any).lotNumber}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).date && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Date</p>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatDate((item.specifications as any).date)}
                                                </p>
                                            </div>
                                        )}
                                        {(item.specifications as any).additionalDetails && (
                                            <div className="md:col-span-2">
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Additional Details</p>
                                                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {(item.specifications as any).additionalDetails}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Locations */}
                            {item.locations && item.locations.length > 0 && (
                                <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        <MapPin className="w-5 h-5 mr-2" />
                                        Locations
                                    </h2>
                                    <div className="space-y-3">
                                        {item.locations.map((location: any, index: number) => (
                                            <div key={index} className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                            {location.warehouseName || 'Unknown Warehouse'}
                                                        </p>
                                                        {location.zone && (
                                                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                Zone: {location.zone}
                                                            </p>
                                                        )}
                                                        {location.rack && (
                                                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                Rack: {location.rack}
                                                            </p>
                                                        )}
                                                        {location.bin && (
                                                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                Bin: {location.bin}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                            {location.quantity?.toLocaleString() || 0}
                                                        </p>
                                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {item.stock?.unit || 'units'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Pricing Information */}
                            <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Pricing
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cost Price</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(item.pricing?.costPrice || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Selling Price</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(item.pricing?.sellingPrice || 0)}
                                        </p>
                                    </div>
                                    {item.pricing?.mrp && (
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>MRP</p>
                                            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {formatCurrency(item.pricing.mrp)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Currency</p>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {item.pricing?.currency || 'INR'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quality Information */}
                            {item.quality && (
                                <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <h2 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Quality
                                    </h2>
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quality Grade</p>
                                            <Badge variant="outline" className="text-sm">
                                                {item.quality.qualityGrade || 'N/A'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Defect Percentage</p>
                                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {item.quality.defectPercentage || 0}%
                                            </p>
                                        </div>
                                        {item.quality.qualityCheckRequired !== undefined && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quality Check Required</p>
                                                <Badge variant={item.quality.qualityCheckRequired ? 'default' : 'outline'}>
                                                    {item.quality.qualityCheckRequired ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tracking Information */}
                            {item.tracking && (
                                <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <h2 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        <Activity className="w-5 h-5 mr-2" />
                                        Tracking
                                    </h2>
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Inward</p>
                                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {item.tracking.totalInward?.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Outward</p>
                                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {item.tracking.totalOutward?.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Adjustments</p>
                                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {item.tracking.totalAdjustments?.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        {item.tracking.lastStockUpdate && (
                                            <div>
                                                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Last Stock Update</p>
                                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {formatDate(item.tracking.lastStockUpdate)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    <Clock className="w-5 h-5 mr-2" />
                                    Timestamps
                                </h2>
                                <div className="space-y-3">
                                    {item.createdAt && (
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Created At</p>
                                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {formatDate(item.createdAt)}
                                            </p>
                                        </div>
                                    )}
                                    {item.updatedAt && (
                                        <div>
                                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Updated At</p>
                                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {formatDate(item.updatedAt)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedItem && (
                <CreateInventoryItemModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedItem(null);
                    }}
                    onSubmit={handleFormSubmit}
                />
            )}
        </AppLayout>
    );
};

export default InventoryDetailPage;

