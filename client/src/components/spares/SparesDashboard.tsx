import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  BarChart3,
  DollarSign,
  Clock,
  Settings,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatsCards } from '@/components/ui/StatsCards';
import { Spare, SpareStats } from '@/lib/api/sparesApi';

interface SparesDashboardProps {
  stats: SpareStats | undefined;
  lowStockSpares: Spare[];
  criticalSpares: Spare[];
  isLoading: boolean;
  onViewSpare: (spare: Spare) => void;
  onUpdateStock: (spare: Spare) => void;
  onViewAllSpares: () => void;
}

export const SparesDashboard: React.FC<SparesDashboardProps> = ({
  stats,
  lowStockSpares,
  criticalSpares,
  isLoading,
  onViewSpare,
  onUpdateStock,
  onViewAllSpares
}) => {
  const statsCards = [
    {
      title: 'Total Spares',
      value: stats?.totalSpares || 0,
      icon: <Package className="w-6 h-6" />,
      color: 'blue' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Active Spares',
      value: stats?.activeSpares || 0,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'green' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockSpares || 0,
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'yellow' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Critical Spares',
      value: stats?.criticalSpares || 0,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'red' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Out of Stock',
      value: stats?.outOfStockSpares || 0,
      icon: <Package className="w-6 h-6" />,
      color: 'red' as const,
      change: { value: 0, type: 'neutral' as const }
    },
    {
      title: 'Total Value',
      value: `₹${(stats?.totalValue || 0).toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'green' as const,
      change: { value: 0, type: 'neutral' as const }
    }
  ];

  const getStockStatus = (spare: Spare) => {
    if (spare.stock.currentStock === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    } else if (spare.stock.currentStock <= spare.stock.reorderLevel) {
      return { status: 'low-stock', label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    } else if (spare.stock.currentStock <= spare.stock.minStockLevel) {
      return { status: 'critical-low', label: 'Critical Low', color: 'text-orange-600 bg-orange-100' };
    }
    return { status: 'normal', label: 'Normal', color: 'text-green-600 bg-green-100' };
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards cards={statsCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAllSpares}
            >
              View All
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : lowStockSpares.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {lowStockSpares.slice(0, 10).map((spare) => {
                const stockStatus = getStockStatus(spare);
                return (
                  <div key={spare._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{spare.spareName}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{spare.spareCode}</span>
                        <span>{spare.stock.currentStock} {spare.stock.unit} / {spare.stock.reorderLevel} {spare.stock.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No low stock alerts</p>
            </div>
          )}
        </div>

        {/* Critical Spares */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Critical Spares</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAllSpares}
            >
              View All
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : criticalSpares.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {criticalSpares.slice(0, 10).map((spare) => (
                <div key={spare._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{spare.spareName}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(spare.maintenance.criticality)}`}>
                        {spare.maintenance.criticality.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{spare.spareCode}</span>
                      <span>{spare.stock.currentStock} {spare.stock.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No critical spares</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {stats?.categoriesBreakdown && stats.categoriesBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.categoriesBreakdown.map((category, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{category.count}</div>
                <div className="text-sm text-gray-500 capitalize">{category.category}</div>
                <div className="text-xs text-gray-400">₹{category.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Criticality Breakdown */}
      {stats?.criticalityBreakdown && stats.criticalityBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Criticality Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.criticalityBreakdown.map((criticality, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{criticality.count}</div>
                <div className={`text-sm font-medium capitalize ${getCriticalityColor(criticality.criticality).split(' ')[0]}`}>
                  {criticality.criticality}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
