import React from 'react';
import { 
  X, 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Calendar,
  MapPin,
  User,
  FileText,
  Settings,
  Shield,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spare } from '@/lib/api/sparesApi';

interface SpareDetailsProps {
  spare: Spare;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onUpdateStock: () => void;
}

export const SpareDetails: React.FC<SpareDetailsProps> = ({
  spare,
  isOpen,
  onClose,
  onEdit,
  onUpdateStock
}) => {
  if (!isOpen) return null;

  const getStockStatus = () => {
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

  const stockStatus = getStockStatus();

  return (
    <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{spare.spareName}</h2>
            <p className="text-sm text-gray-500">{spare.spareCode}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onUpdateStock} className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Update Stock</span>
            </Button>
            <Button onClick={onEdit} className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-8">
            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              {spare.status.isCritical && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Critical Spare</span>
                </div>
              )}
              {spare.stock.currentStock <= spare.stock.reorderLevel && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Low Stock Alert</span>
                </div>
              )}
              {spare.status.isHazardous && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Hazardous Material</span>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Part Number:</span>
                      <span className="text-sm font-medium text-gray-900">{spare.partNumber}</span>
                    </div>
                    {spare.manufacturerPartNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Manufacturer Part No:</span>
                        <span className="text-sm font-medium text-gray-900">{spare.manufacturerPartNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Category:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {spare.category}
                      </span>
                    </div>
                    {spare.subCategory && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Sub Category:</span>
                        <span className="text-sm font-medium text-gray-900">{spare.subCategory}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Manufacturer:</span>
                      <span className="text-sm font-medium text-gray-900">{spare.manufacturer}</span>
                    </div>
                    {spare.brand && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Brand:</span>
                        <span className="text-sm font-medium text-gray-900">{spare.brand}</span>
                      </div>
                    )}
                    {spare.spareModel && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Model:</span>
                        <span className="text-sm font-medium text-gray-900">{spare.spareModel}</span>
                      </div>
                    )}
                  </div>
                </div>

                {spare.spareDescription && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{spare.spareDescription}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Stock Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Current Stock:</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {spare.stock.currentStock} {spare.stock.unit}
                        </span>
                        <div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Available Stock:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {spare.stock.availableStock} {spare.stock.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Reserved Stock:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {spare.stock.reservedStock} {spare.stock.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Reorder Level:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {spare.stock.reorderLevel} {spare.stock.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Min Stock Level:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {spare.stock.minStockLevel} {spare.stock.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Max Stock Level:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {spare.stock.maxStockLevel} {spare.stock.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Value:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{spare.stock.totalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Maintenance Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Criticality:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(spare.maintenance.criticality)}`}>
                        {spare.maintenance.criticality.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Consumable:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {spare.maintenance.isConsumable ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {spare.maintenance.expectedLifespan && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Expected Lifespan:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {spare.maintenance.expectedLifespan} months
                        </span>
                      </div>
                    )}
                    {spare.maintenance.mtbf && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">MTBF:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {spare.maintenance.mtbf} hours
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            {(spare.pricing.costPrice || spare.pricing.standardCost || spare.pricing.lastPurchasePrice) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {spare.pricing.costPrice && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{spare.pricing.costPrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Cost Price</div>
                    </div>
                  )}
                  {spare.pricing.standardCost && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{spare.pricing.standardCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Standard Cost</div>
                    </div>
                  )}
                  {spare.pricing.lastPurchasePrice && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{spare.pricing.lastPurchasePrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Last Purchase Price</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suppliers */}
            {spare.suppliers && spare.suppliers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Suppliers</h3>
                <div className="space-y-4">
                  {spare.suppliers.map((supplier, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{supplier.supplierName}</div>
                        {supplier.isPrimary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Code:</span>
                          <div className="font-medium">{supplier.supplierCode}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Part Number:</span>
                          <div className="font-medium">{supplier.partNumber}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Lead Time:</span>
                          <div className="font-medium">{supplier.leadTime} days</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Min Order Qty:</span>
                          <div className="font-medium">{supplier.minOrderQuantity}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locations */}
            {spare.locations && spare.locations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Locations</h3>
                <div className="space-y-4">
                  {spare.locations.map((location, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Warehouse:</span>
                          <div className="font-medium">{location.warehouseName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Zone:</span>
                          <div className="font-medium">{location.zone || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Rack:</span>
                          <div className="font-medium">{location.rack || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Quantity:</span>
                          <div className="font-medium">{location.quantity} {spare.stock.unit}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Quality Grade:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {spare.quality.qualityGrade}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Quality Check Required:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {spare.quality.qualityCheckRequired ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {spare.quality.certifications && spare.quality.certifications.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Certifications:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {spare.quality.certifications.map((cert, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(spare.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated: {new Date(spare.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
