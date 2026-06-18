'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  BarChart3,
  Package,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Can } from '@/lib/casl/Can';

interface InventoryHeaderProps {
  totalItems: number;
  lowStockCount: number;
  onAddItem: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onImport: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  theme: 'light' | 'dark';
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  totalItems,
  lowStockCount,
  onAddItem,
  onRefresh,
  onExport,
  onImport,
  searchTerm,
  onSearchChange,
  theme
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-xl p-4 sm:p-6 shadow-lg border transition-theme ${
        isDark
          ? 'bg-gray-900 border-gray-800 text-gray-50'
          : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            Inventory Management
          </h1>
          <p
            className={`text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Manage your textile inventory with precision and efficiency
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold">{totalItems}</div>
            <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Items
            </div>
          </div>
          {lowStockCount > 0 && (
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-amber-500">
                {lowStockCount}
              </div>
              <div className={`text-xs sm:text-sm ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                Low Stock
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div
          className={`rounded-lg p-3 sm:p-4 border transition-theme ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-sky-50 border-sky-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Package
              className={`w-7 h-7 ${
                isDark ? 'text-sky-300' : 'text-sky-500'
              }`}
            />
            <div>
              <div className="text-lg sm:text-xl font-bold">{totalItems}</div>
              <div
                className={`text-xs sm:text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Items
              </div>
            </div>
          </div>
        </div>
        
        <div
          className={`rounded-lg p-3 sm:p-4 border transition-theme ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-emerald-50 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <TrendingUp
              className={`w-7 h-7 ${
                isDark ? 'text-emerald-300' : 'text-emerald-600'
              }`}
            />
            <div>
              <div className="text-lg sm:text-xl font-bold">
                {totalItems - lowStockCount}
              </div>
              <div
                className={`text-xs sm:text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                In Stock
              </div>
            </div>
          </div>
        </div>
        
        <div
          className={`rounded-lg p-3 sm:p-4 border transition-theme ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`w-7 h-7 ${
                isDark ? 'text-amber-300' : 'text-amber-600'
              }`}
            />
            <div>
              <div className="text-lg sm:text-xl font-bold">{lowStockCount}</div>
              <div
                className={`text-xs sm:text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Low Stock
              </div>
            </div>
          </div>
        </div>
        
        <div
          className={`rounded-lg p-3 sm:p-4 border transition-theme ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-indigo-50 border-indigo-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <BarChart3
              className={`w-7 h-7 ${
                isDark ? 'text-indigo-300' : 'text-indigo-600'
              }`}
            />
            <div>
              <div className="text-lg sm:text-xl font-bold">₹0</div>
              <div
                className={`text-xs sm:text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Total Value
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Search Bar */}
        <div className="flex-1 w-full lg:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items by name, code, or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm sm:text-base focus:outline-none focus:ring-2 transition-theme ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-sky-500 focus:border-sky-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-sky-500 focus:border-sky-500'
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Can I="create" a="InventoryItem">
            <Button
              onClick={() => {
                console.log('Add Item button clicked');
                onAddItem();
                console.log('onAddItem function called');
              }}
              className={`font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg ${
                isDark
                  ? 'bg-sky-500 hover:bg-sky-400 text-white'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Item
            </Button>
          </Can>
          
          <Button
            variant="outline"
            onClick={onRefresh}
            className={`px-3 sm:px-4 py-2 rounded-lg border text-sm transition-theme ${
              isDark
                ? 'border-gray-700 text-gray-100 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};
