'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  Tag,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Can } from '@/lib/casl/Can';

interface InventoryGridProps {
  items: any[];
  onViewDetails: (item: any) => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (id: string) => void;
  onMoveToScrap?: (item: any) => void;
  onGoodsReturn?: (item: any) => void;
  theme: 'light' | 'dark';
}

export function InventoryGrid({ items, onViewDetails, onEditItem, onDeleteItem, onMoveToScrap, onGoodsReturn, theme }: InventoryGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStockStatus = (item: any) => {
    const currentStock = item.stock?.currentStock || 0;
    const reorderLevel = item.stock?.reorderLevel || 0;
    
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= reorderLevel) return 'low_stock';
    if (currentStock > reorderLevel * 2) return 'overstocked';
    return 'normal_stock';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low_stock':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'overstocked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return <TrendingDown className="w-4 h-4" />;
      case 'low_stock':
        return <TrendingDown className="w-4 h-4" />;
      case 'overstocked':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
        <p className="text-gray-600">Get started by adding your first inventory item.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => {
        const stockStatus = getStockStatus(item);
        
        return (
          <Card key={item._id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium text-gray-900 truncate">
                    {item.itemName}
                  </CardTitle>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    {item.itemCode}
                  </p>
                </div>
                <Badge className={`${getStockStatusColor(stockStatus)} flex items-center gap-1 ml-2`}>
                  {getStockStatusIcon(stockStatus)}
                  <span className="text-xs">{getStockStatus(item).replace('_', ' ')}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-xs font-medium capitalize">
                    {item.category?.primary || 'N/A'}
                  </span>
                </div>

                {/* Current Stock */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Stock</span>
                  <span className="text-xs font-medium">
                    {item.stock?.currentStock || 0} {item.stock?.unit || 'units'}
                  </span>
                </div>

                {/* Value */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Value</span>
                  <span className="text-xs font-medium">
                    {formatCurrency(item.stock?.totalValue || 0)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Can I="read" a="InventoryItem">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(item)}
                      className="text-gray-600 hover:text-gray-900 p-1 h-8 w-8"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Can>
                  
                  <Can I="update" a="InventoryItem">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditItem(item)}
                      className="text-blue-600 hover:text-blue-900 p-1 h-8 w-8"
                      title="Edit Item"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Can>
                  
                  {onMoveToScrap && (item.stock?.currentStock || 0) > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveToScrap(item)}
                      className="text-orange-600 hover:text-orange-900 p-1 h-8 w-8"
                      title="Move to Scrap"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {onGoodsReturn && (item.stock?.currentStock || 0) > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onGoodsReturn(item)}
                      className="text-blue-600 hover:text-blue-900 p-1 h-8 w-8"
                      title="Goods Return"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Can I="delete" a="InventoryItem">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteItem(item._id)}
                      className="text-red-600 hover:text-red-900 p-1 h-8 w-8"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Can>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

