'use client'

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Clock,
  Award,
  BarChart3,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spare } from '@/lib/api/sparesApi';
import { 
  useGetSuppliersForSpareQuery,
  useAddSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useAddPricingHistoryMutation,
  useGetSupplierAnalyticsQuery,
  Supplier as ApiSupplier
} from '@/lib/api/suppliersApi';

interface Supplier {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  partNumber: string;
  isPrimary: boolean;
  leadTime: number; // in days
  minOrderQuantity: number;
  lastSupplyDate?: string;
  lastSupplyRate?: number;
  qualityRating: number; // 1-5 stars
  warrantyPeriod?: number; // in months
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  status: 'active' | 'inactive' | 'blacklisted' | 'pending';
  performanceMetrics: {
    onTimeDeliveryRate: number;
    qualityRejectionRate: number;
    averageLeadTime: number;
    totalOrders: number;
    totalOrderValue: number;
    averageOrderValue: number;
  };
  pricingHistory: Array<{
    date: string;
    price: number;
    currency: string;
    quantity: number;
    orderNumber?: string;
  }>;
  notes?: string;
}

interface SuppliersManagementProps {
  spare: Spare;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const SuppliersManagement: React.FC<SuppliersManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Real API calls
  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliersForSpareQuery(spare._id);
  const { data: analyticsData, isLoading: analyticsLoading } = useGetSupplierAnalyticsQuery(spare._id);

  const [addSupplier] = useAddSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();
  const [addPricingHistory] = useAddPricingHistoryMutation();

  const analytics = analyticsData?.data;

  // Use API types instead of local interfaces
  type Supplier = ApiSupplier;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'blacklisted': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceColor = (rate: number, isDelivery: boolean = true) => {
    if (isDelivery) {
      if (rate >= 95) return 'text-green-600 bg-green-100';
      if (rate >= 85) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    } else {
      if (rate <= 2) return 'text-green-600 bg-green-100';
      if (rate <= 5) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    }
  };

  const getPrimarySupplier = () => {
    return suppliersData?.data?.find(s => s.isPrimary);
  };

  const getActiveSuppliers = () => {
    return suppliersData?.data?.filter(s => s.status === 'active').length || 0;
  };

  const getAverageLeadTime = () => {
    const leadTimes = suppliersData?.data?.map(s => s.leadTime) || [];
    return leadTimes.length > 0 ? 
      Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0;
  };

  const getAverageQualityRating = () => {
    const ratings = suppliersData?.data?.map(s => s.qualityRating) || [];
    return ratings.length > 0 ? 
      Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
  };

  const getTotalOrderValue = () => {
    return suppliersData?.data?.reduce((total, s) => total + s.performanceMetrics.totalOrderValue, 0) || 0;
  };

  const filteredSuppliers = suppliersData?.data?.filter(supplier => {
    const matchesSearch = supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || supplier.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  }) || [];

  const getPriceTrend = (supplier: Supplier) => {
    if (supplier.pricingHistory.length < 2) return 'stable';
    const recent = supplier.pricingHistory[0].price;
    const previous = supplier.pricingHistory[1].price;
    if (recent > previous) return 'increasing';
    if (recent < previous) return 'decreasing';
    return 'stable';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Suppliers Management</h2>
          <p className="text-gray-600">Manage supplier relationships and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="text-blue-600 bg-blue-100">
            {getActiveSuppliers()} ACTIVE SUPPLIERS
          </Badge>
          {getPrimarySupplier() && (
            <Badge className="text-green-600 bg-green-100">
              PRIMARY: {getPrimarySupplier()?.supplierName}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'suppliers', label: 'Suppliers', icon: Truck },
            { id: 'pricing', label: 'Pricing', icon: DollarSign },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">{suppliersData?.data?.length || 0}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge className={getStatusColor('active')}>
                {getActiveSuppliers()} Active
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Lead Time</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageLeadTime()} days</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Range: {suppliersData?.data && suppliersData.data.length > 0 ? `${Math.min(...suppliersData.data.map(s => s.leadTime))} - ${Math.max(...suppliersData.data.map(s => s.leadTime))}` : '0 - 0'} days
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quality Rating</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageQualityRating()}/5</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-3 h-3 rounded-full ${
                      star <= getAverageQualityRating() ? 'bg-yellow-400' : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${getTotalOrderValue().toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Avg: ${suppliersData?.data && suppliersData.data.length > 0 ? Math.round(getTotalOrderValue() / suppliersData.data.length).toLocaleString() : '0'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Supplier List</h3>
            {isEditable && (
              <Button onClick={() => setShowSupplierForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Supplier</span>
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{supplier.supplierName}</h4>
                    <p className="text-sm text-gray-500">
                      {supplier.supplierCode} • Part: {supplier.partNumber}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(supplier.status)}>
                      {supplier.status.toUpperCase()}
                    </Badge>
                    {supplier.isPrimary && (
                      <Badge className="text-green-600 bg-green-100">PRIMARY</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Lead Time</p>
                    <p className="text-sm font-medium text-gray-900">{supplier.leadTime} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Min Order Qty</p>
                    <p className="text-sm font-medium text-gray-900">{supplier.minOrderQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Supply Rate</p>
                    <p className="text-sm font-medium text-gray-900">
                      ${supplier.lastSupplyRate?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Quality Rating</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-3 h-3 rounded-full ${
                              star <= supplier.qualityRating ? 'bg-yellow-400' : 'bg-gray-300'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <Badge className={getQualityColor(supplier.qualityRating)}>
                        {supplier.qualityRating}/5
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">On-Time Delivery</p>
                    <Badge className={getPerformanceColor(supplier.performanceMetrics.onTimeDeliveryRate)}>
                      {supplier.performanceMetrics.onTimeDeliveryRate}%
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rejection Rate</p>
                    <Badge className={getPerformanceColor(supplier.performanceMetrics.qualityRejectionRate, false)}>
                      {supplier.performanceMetrics.qualityRejectionRate}%
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="text-sm font-medium text-gray-900">{supplier.contactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Supply Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {supplier.lastSupplyDate ? 
                        new Date(supplier.lastSupplyDate).toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>
                </div>

                {supplier.notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                    <p className="text-sm text-gray-600">{supplier.notes}</p>
                  </div>
                )}

                {isEditable && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setShowSupplierForm(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (supplier._id) {
                          const supplierIndex = suppliersData?.data?.findIndex(s => s._id === supplier._id) || 0;
                          deleteSupplier({ spareId: spare._id, supplierIndex });
                        }
                      }}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Pricing History</h3>

          <div className="space-y-4">
            {suppliersData?.data?.map((supplier) => (
              <Card key={supplier._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{supplier.supplierName}</h4>
                    <p className="text-sm text-gray-500">Part: {supplier.partNumber}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(supplier.status)}>
                      {supplier.status.toUpperCase()}
                    </Badge>
                    <Badge className={
                      getPriceTrend(supplier) === 'increasing' ? 'text-red-600 bg-red-100' :
                      getPriceTrend(supplier) === 'decreasing' ? 'text-green-600 bg-green-100' :
                      'text-yellow-600 bg-yellow-100'
                    }>
                      {getPriceTrend(supplier).toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Pricing History:</p>
                  <div className="space-y-2">
                    {supplier.pricingHistory.map((price, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${price.price.toLocaleString()} {price.currency}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(price.date).toLocaleDateString()} • Qty: {price.quantity}
                          </p>
                        </div>
                        {price.orderNumber && (
                          <Badge className="text-blue-600 bg-blue-100 text-xs">
                            {price.orderNumber}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="text-lg font-medium text-gray-900">
                      ${supplier.pricingHistory[0]?.price.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price Change</p>
                    <p className={`text-lg font-medium ${
                      getPriceTrend(supplier) === 'increasing' ? 'text-red-600' :
                      getPriceTrend(supplier) === 'decreasing' ? 'text-green-600' :
                      'text-gray-900'
                    }`}>
                      {supplier.pricingHistory.length >= 2 ? 
                        `${supplier.pricingHistory[0].price > supplier.pricingHistory[1].price ? '+' : ''}${(supplier.pricingHistory[0].price - supplier.pricingHistory[1].price).toFixed(2)}` : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Warranty Period</p>
                    <p className="text-lg font-medium text-gray-900">
                      {supplier.warrantyPeriod || 0} months
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Supplier Performance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliersData?.data?.map((supplier) => (
              <Card key={supplier._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{supplier.supplierName}</h4>
                    <p className="text-sm text-gray-500">{supplier.supplierCode}</p>
                  </div>
                  <Badge className={getStatusColor(supplier.status)}>
                    {supplier.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Delivery Performance</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">On-Time Delivery</span>
                      <Badge className={getPerformanceColor(supplier.performanceMetrics.onTimeDeliveryRate)}>
                        {supplier.performanceMetrics.onTimeDeliveryRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Average Lead Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {supplier.performanceMetrics.averageLeadTime} days
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Quality Performance</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quality Rating</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-3 h-3 rounded-full ${
                                star <= supplier.qualityRating ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            ></div>
                          ))}
                        </div>
                        <Badge className={getQualityColor(supplier.qualityRating)}>
                          {supplier.qualityRating}/5
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Rejection Rate</span>
                      <Badge className={getPerformanceColor(supplier.performanceMetrics.qualityRejectionRate, false)}>
                        {supplier.performanceMetrics.qualityRejectionRate}%
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Order Statistics</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-sm font-medium text-gray-900">
                          {supplier.performanceMetrics.totalOrders}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="text-sm font-medium text-gray-900">
                          ${supplier.performanceMetrics.totalOrderValue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Order Value</p>
                        <p className="text-sm font-medium text-gray-900">
                          ${supplier.performanceMetrics.averageOrderValue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Order</p>
                        <p className="text-sm font-medium text-gray-900">
                          {supplier.lastSupplyDate ? 
                            new Date(supplier.lastSupplyDate).toLocaleDateString() : 
                            'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Supplier Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Performance Comparison</h4>
              <div className="space-y-3">
                {suppliersData?.data?.map((supplier) => (
                  <div key={supplier._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{supplier.supplierName}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${supplier.performanceMetrics.onTimeDeliveryRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {supplier.performanceMetrics.onTimeDeliveryRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quality Ratings</h4>
              <div className="space-y-3">
                {suppliersData?.data?.map((supplier) => (
                  <div key={supplier._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{supplier.supplierName}</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-3 h-3 rounded-full ${
                              star <= supplier.qualityRating ? 'bg-yellow-400' : 'bg-gray-300'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {supplier.qualityRating}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Supplier Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{getActiveSuppliers()}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {suppliersData?.data?.filter(s => s.isPrimary).length || 0}
                </p>
                <p className="text-sm text-gray-600">Primary</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {suppliersData?.data?.filter(s => s.status === 'pending').length || 0}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {suppliersData?.data?.filter(s => s.status === 'blacklisted').length || 0}
                </p>
                <p className="text-sm text-gray-600">Blacklisted</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Supplier Settings</h3>
          
          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Supplier Configuration</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSupplierEvaluation"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoSupplierEvaluation" className="ml-2 text-sm text-gray-700">
                  Enable automatic supplier performance evaluation
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="priceAlert"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="priceAlert" className="ml-2 text-sm text-gray-700">
                  Alert on significant price changes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="qualityTracking"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="qualityTracking" className="ml-2 text-sm text-gray-700">
                  Track quality metrics automatically
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Supplier Notes Template
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter default supplier notes template"
                ></textarea>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedSupplier ? 'Edit' : 'Add'} Supplier
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name
                  </label>
                  <Input placeholder="Enter supplier name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Code
                  </label>
                  <Input placeholder="Enter supplier code" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Number
                </label>
                <Input placeholder="Enter part number" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (days)
                  </label>
                  <Input type="number" placeholder="Enter lead time" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Order Quantity
                  </label>
                  <Input type="number" placeholder="Enter min order qty" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Rating
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <Input placeholder="Enter contact person" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input type="email" placeholder="Enter email" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input placeholder="Enter phone number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input placeholder="Enter website URL" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter address"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Period (months)
                  </label>
                  <Input type="number" placeholder="Enter warranty period" />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimary"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrimary" className="ml-2 text-sm text-gray-700">
                  This is the primary supplier
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter supplier notes"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSupplierForm(false);
                  setSelectedSupplier(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                setShowSupplierForm(false);
                setSelectedSupplier(null);
              }}>
                {selectedSupplier ? 'Update' : 'Create'} Supplier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
