'use client'

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Package,
  TrendingDown,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ViewMode } from '@/components/ui/ViewToggle';
import { DataView } from '@/components/ui/DataView';
import { Spare, SpareFilters } from '@/lib/api/sparesApi';

interface SparesListProps {
  spares: Spare[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  filters: SpareFilters;
  onFiltersChange: (filters: SpareFilters) => void;
  onCreateSpare: () => void;
  onEditSpare: (spare: Spare) => void;
  onDeleteSpare: (spare: Spare) => void;
  onViewSpare: (spare: Spare) => void;
  onUpdateStock: (spare: Spare) => void;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
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

export const SparesList: React.FC<SparesListProps> = ({
  spares,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  filters,
  onFiltersChange,
  onCreateSpare,
  onEditSpare,
  onDeleteSpare,
  onViewSpare,
  onUpdateStock
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleFilterChange = (key: keyof SpareFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  // Ensure spares is an array and create safe copies
  const safeSpares = Array.isArray(spares) ? spares : [];
  
  // Additional safety check - ensure spares is not null/undefined
  if (!safeSpares || safeSpares.length === 0) {
    console.warn('No spares data provided or empty array');
  }

  // Validate and sanitize spare objects to ensure all required fields are present
  let validatedSpares: Spare[] = [];
  
  try {
    validatedSpares = safeSpares.map(spare => {
      try {
        // Ensure all required properties exist with safe defaults
        const safeSpare = {
          ...spare,
          spareCode: spare?.spareCode || 'N/A',
          spareName: spare?.spareName || 'Unnamed Spare',
          category: (spare?.category || 'other') as 'mechanical' | 'electrical' | 'electronic' | 'hydraulic' | 'pneumatic' | 'consumable' | 'tool' | 'safety' | 'other',
          manufacturer: spare?.manufacturer || 'Unknown',
          partNumber: spare?.partNumber || 'N/A',
          brand: spare?.brand || '',
          stock: {
            currentStock: Number(spare?.stock?.currentStock) || 0,
            reservedStock: Number(spare?.stock?.reservedStock) || 0,
            availableStock: Number(spare?.stock?.availableStock) || 0,
            inTransitStock: Number(spare?.stock?.inTransitStock) || 0,
            damagedStock: Number(spare?.stock?.damagedStock) || 0,
            unit: spare?.stock?.unit || 'pcs',
            reorderLevel: Number(spare?.stock?.reorderLevel) || 10,
            minStockLevel: Number(spare?.stock?.minStockLevel) || 5,
            maxStockLevel: Number(spare?.stock?.maxStockLevel) || 100,
            averageCost: Number(spare?.stock?.averageCost) || 0,
            totalValue: Number(spare?.stock?.totalValue) || 0
          },
          status: {
            isActive: Boolean(spare?.status?.isActive),
            isDiscontinued: Boolean(spare?.status?.isDiscontinued),
            isCritical: Boolean(spare?.status?.isCritical),
            isObsolete: Boolean(spare?.status?.isObsolete),
            requiresApproval: Boolean(spare?.status?.requiresApproval),
            isHazardous: Boolean(spare?.status?.isHazardous)
          },
          maintenance: {
            isConsumable: Boolean(spare?.maintenance?.isConsumable),
            criticality: (spare?.maintenance?.criticality || 'medium') as 'low' | 'medium' | 'high' | 'critical',
            expectedLifespan: spare?.maintenance?.expectedLifespan,
            failureRate: spare?.maintenance?.failureRate,
            mtbf: spare?.maintenance?.mtbf
          },
          pricing: {
            costPrice: spare?.pricing?.costPrice || 0,
            standardCost: spare?.pricing?.standardCost || 0,
            currency: spare?.pricing?.currency || 'INR'
          }
        };
        
        // Additional validation to ensure criticality is always set
        if (!safeSpare.maintenance.criticality) {
          safeSpare.maintenance.criticality = 'medium';
        }
        
        return safeSpare;
      } catch (error) {
        console.warn('Error processing spare object:', error, spare);
        // Skip this spare if processing fails
        return null;
      }
    }).filter(Boolean) as Spare[];
  } catch (error) {
    console.error('Error during validation process:', error);
    validatedSpares = [];
  }

  // Additional safety check - ensure all validated spares have the required structure
  let finalValidatedSpares: Spare[] = [];
  
  try {
    finalValidatedSpares = validatedSpares.filter(spare => {
      const isValid = spare && 
             spare.stock && 
             typeof spare.stock.currentStock === 'number' &&
             spare.maintenance && // Ensure maintenance object exists
             spare.maintenance.criticality && // Ensure criticality property exists
             spare.status && // Ensure status object exists
             spare.pricing; // Ensure pricing object exists
      
      if (!isValid) {
        console.warn('Invalid spare object filtered out:', spare);
      }
      
      return isValid;
    });
  } catch (error) {
    console.error('Error during final validation:', error);
    finalValidatedSpares = [];
  }
  
  // Debug logging
  console.log('Original spares count:', safeSpares.length);
  console.log('Validated spares count:', validatedSpares.length);
  console.log('Final validated spares count:', finalValidatedSpares.length);



  const getStockStatus = (spare: Spare) => {
    // Ensure we have a valid spare object
    if (!spare) {
      return { status: 'unknown', label: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
    
    // Ensure we have valid stock data
    if (!spare?.stock || typeof spare.stock.currentStock !== 'number') {
      return { status: 'unknown', label: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
    
    const currentStock = spare.stock.currentStock;
    const reorderLevel = spare.stock.reorderLevel ?? 10;
    const minStockLevel = spare.stock.minStockLevel ?? 5;
    
    if (currentStock === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    } else if (currentStock <= minStockLevel) {
      return { status: 'critical-low', label: 'Critical Low', color: 'text-orange-600 bg-orange-100' };
    } else if (currentStock <= reorderLevel) {
      return { status: 'low-stock', label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    }
    return { status: 'normal', label: 'Normal', color: 'text-green-600 bg-green-100' };
  };

  const getCriticalityColor = (criticality: string | undefined) => {
    if (!criticality) return 'text-gray-600 bg-gray-100';
    
    switch (criticality) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    {
      key: 'spareCode',
      label: 'Spare Code',
      sortable: true,
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return <div className="font-medium text-gray-900">N/A</div>;
        }
        // Use the spare directly since it's already validated
        return (
          <div className="font-medium text-gray-900">{spare.spareCode || 'N/A'}</div>
        );
      }
    },
    {
      key: 'spareName',
      label: 'Spare Name',
      sortable: true,
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return (
            <div>
              <div className="font-medium text-gray-900">Unnamed Spare</div>
              <div className="text-sm text-gray-500">N/A</div>
            </div>
          );
        }
        return (
          <div>
            <div className="font-medium text-gray-900">{spare.spareName || 'Unnamed Spare'}</div>
            <div className="text-sm text-gray-500">{spare.partNumber || 'N/A'}</div>
          </div>
        );
      }
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              other
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
            {spare.category || 'other'}
          </span>
        );
      }
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      sortable: true,
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return (
            <div>
              <div className="font-medium text-gray-900">Unknown</div>
            </div>
          );
        }
        return (
          <div>
            <div className="font-medium text-gray-900">{spare.manufacturer || 'Unknown'}</div>
            {spare.brand && <div className="text-sm text-gray-500">{spare.brand}</div>}
          </div>
        );
      }
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return (
            <div>
              <div className="font-medium text-gray-900">0 pcs</div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                Unknown
              </span>
            </div>
          );
        }
        
        // Ensure stock object exists
        if (!spare.stock) {
          return (
            <div>
              <div className="font-medium text-gray-900">0 pcs</div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                Unknown
              </span>
            </div>
          );
        }
        
        const stockStatus = getStockStatus(spare);
        return (
          <div>
            <div className="font-medium text-gray-900">
              {spare.stock.currentStock || 0} {spare.stock.unit || 'pcs'}
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
          </div>
        );
      }
    },
    {
      key: 'criticality',
      label: 'Criticality',
      sortable: true,
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
              MEDIUM
            </span>
          );
        }
        
        // Ensure maintenance object exists and has criticality
        if (!spare.maintenance) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
              MEDIUM
            </span>
          );
        }
        
        const criticality = spare.maintenance.criticality || 'medium';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(criticality)}`}>
            {criticality.toUpperCase()}
          </span>
        );
      }
    },
    {
      key: 'totalValue',
      label: 'Value',
      sortable: true,
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return (
            <div className="font-medium text-gray-900">
              INR 0
            </div>
          );
        }
        
        // Ensure pricing and stock objects exist
        if (!spare.pricing || !spare.stock) {
          return (
            <div className="font-medium text-gray-900">
              INR 0
            </div>
          );
        }
        
        return (
          <div className="font-medium text-gray-900">
            {spare.pricing.currency || 'INR'} {spare.stock.totalValue?.toLocaleString('en-IN') || '0'}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (spare: Spare) => {
        // Additional safety check
        if (!spare) {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">N/A</span>
            </div>
          );
        }
        
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewSpare(spare)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateStock(spare)}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              title="Update Stock"
            >
              <Package className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditSpare(spare)}
              className="text-yellow-400 hover:text-yellow-600 transition-colors"
              title="Edit Spare"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteSpare(spare)}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Delete Spare"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ];

  const cardRender = (spare: Spare) => {
    // Additional safety check
    if (!spare) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="text-center text-gray-500">
            <p>Invalid spare data</p>
          </div>
        </div>
      );
    }
    
    const stockStatus = getStockStatus(spare);
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{spare.spareName || 'Unnamed Spare'}</h3>
            <p className="text-sm text-gray-500">{spare.spareCode || 'N/A'}</p>
          </div>
          <div className="flex items-center space-x-2">
            {spare.status?.isCritical && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {(spare.stock?.currentStock || 0) <= (spare.stock?.reorderLevel || 0) && (
              <TrendingDown className="w-5 h-5 text-yellow-500" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {spare.category || 'other'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Manufacturer</p>
            <p className="text-sm font-medium text-gray-900">{spare.manufacturer || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stock</p>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {spare.stock?.currentStock || 0} {spare.stock?.unit || 'pcs'}
              </p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                {stockStatus.label}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Criticality</p>
            {spare.maintenance ? (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(spare.maintenance?.criticality || 'medium')}`}>
                {(spare.maintenance?.criticality || 'medium').toUpperCase()}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                MEDIUM
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-900">
            Value: {spare.pricing?.currency || 'INR'} {(spare.stock?.totalValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewSpare(spare)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateStock(spare)}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              title="Update Stock"
            >
              <Package className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditSpare(spare)}
              className="text-yellow-400 hover:text-yellow-600 transition-colors"
              title="Edit Spare"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteSpare(spare)}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Delete Spare"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading spares list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spares Management</h1>
          <p className="text-gray-600">Manage your spare parts inventory</p>
        </div>
        <Button onClick={onCreateSpare} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Spare</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search spares..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
          {/* Grid view only - removed list view toggle */}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Manufacturer
              </label>
              <Input
                type="text"
                placeholder="Filter by manufacturer"
                value={filters.manufacturer || ''}
                onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isLowStock || false}
                  onChange={(e) => handleFilterChange('isLowStock', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Low Stock</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isCritical || false}
                  onChange={(e) => handleFilterChange('isCritical', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Critical</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Data View */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : !finalValidatedSpares || finalValidatedSpares.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No spares found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first spare part.</p>
          <Button onClick={onCreateSpare}>Add Spare</Button>
        </div>
      ) : (
        <>
          {(() => {
            try {
              // Additional safety check before rendering
              if (!Array.isArray(finalValidatedSpares) || finalValidatedSpares.length === 0) {
                throw new Error('No valid spares data available');
              }
              
              return (
                <DataView
                  data={finalValidatedSpares}
                  columns={columns}
                  viewMode={viewMode}
                  renderGridCard={cardRender}
                  loading={isLoading}
                />
              );
            } catch (error) {
              console.error('Error rendering DataView:', error);
              return (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error rendering spares list</h3>
                  <p className="text-gray-500 mb-4">There was an error displaying the spares. Please try refreshing the page.</p>
                  <Button onClick={() => window.location.reload()}>Refresh Page</Button>
                </div>
              );
            }
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};