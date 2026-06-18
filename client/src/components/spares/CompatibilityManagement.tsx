'use client'

import React, { useState, useEffect } from 'react';
import { 
  Link, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Database,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Wrench,
  Truck,
  Factory,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spare } from '@/lib/api/sparesApi';
import { 
  useGetCompatibilityRecordsQuery,
  useCreateCompatibilityRecordMutation,
  useUpdateCompatibilityRecordMutation,
  useDeleteCompatibilityRecordMutation,
  useGetEquipmentQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
  useGetCompatibilityAnalyticsQuery,
  Equipment as ApiEquipment,
  CompatibilityRecord as ApiCompatibilityRecord
} from '@/lib/api/compatibilityApi';

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  brand: string;
  serialNumber: string;
  location: string;
  status: 'operational' | 'maintenance' | 'down' | 'retired';
  lastMaintenance?: string;
  nextMaintenance?: string;
}

interface CompatibilityRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  equipmentModel: string;
  equipmentBrand: string;
  isUniversal: boolean;
  compatibilityNotes?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  status: 'verified' | 'unverified' | 'incompatible' | 'pending';
  installationDate?: string;
  removalDate?: string;
  performanceRating?: number; // 1-5 stars
  issues?: string[];
}

interface CompatibilityManagementProps {
  spare: Spare;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const CompatibilityManagement: React.FC<CompatibilityManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCompatibilityForm, setShowCompatibilityForm] = useState(false);
  const [selectedCompatibility, setSelectedCompatibility] = useState<CompatibilityRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Real API calls
  const { data: compatibilityData, isLoading: compatibilityLoading } = useGetCompatibilityRecordsQuery(spare._id);
  const { data: equipmentData, isLoading: equipmentLoading } = useGetEquipmentQuery();
  const { data: analyticsData, isLoading: analyticsLoading } = useGetCompatibilityAnalyticsQuery(spare._id);

  const [createCompatibility] = useCreateCompatibilityRecordMutation();
  const [updateCompatibility] = useUpdateCompatibilityRecordMutation();
  const [deleteCompatibility] = useDeleteCompatibilityRecordMutation();
  const [createEquipment] = useCreateEquipmentMutation();
  const [updateEquipment] = useUpdateEquipmentMutation();
  const [deleteEquipment] = useDeleteEquipmentMutation();

  const compatibilityRecords = compatibilityData?.data || [];
  const equipment = equipmentData?.data || [];
  const analytics = analyticsData?.data;

  // Use API types instead of local interfaces
  type Equipment = ApiEquipment;
  type CompatibilityRecord = ApiCompatibilityRecord;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'operational': return 'text-green-600 bg-green-100';
      case 'unverified': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'incompatible': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      case 'down': return 'text-red-600 bg-red-100';
      case 'retired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompatibleEquipmentCount = () => {
    return compatibilityRecords.filter(c => c.status === 'verified').length;
  };

  const getUniversalCompatibilityCount = () => {
    return compatibilityRecords.filter(c => c.isUniversal).length;
  };

  const getAveragePerformanceRating = () => {
    const ratings = compatibilityRecords.map(c => c.performanceRating).filter((rating): rating is number => rating !== undefined);
    return ratings.length > 0 ? 
      Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
  };

  const getEquipmentTypes = () => {
    const types = new Set(compatibilityRecords.map(c => c.equipmentType));
    return Array.from(types);
  };

  const getBrands = () => {
    const brands = new Set(compatibilityRecords.map(c => c.equipmentBrand));
    return Array.from(brands);
  };

  const filteredCompatibilityRecords = compatibilityRecords.filter(record => {
    const matchesSearch = record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.equipmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.equipmentBrand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'verified' && record.status === 'verified') ||
                         (filterType === 'unverified' && record.status === 'unverified') ||
                         (filterType === 'universal' && record.isUniversal);
    
    return matchesSearch && matchesFilter;
  });

  const getCompatibilityPercentage = () => {
    const total = equipment.length;
    const compatible = getCompatibleEquipmentCount();
    return total > 0 ? Math.round((compatible / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Compatibility Management</h2>
          <p className="text-gray-600">Track equipment compatibility and universal parts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="text-blue-600 bg-blue-100">
            {getCompatibleEquipmentCount()} COMPATIBLE
          </Badge>
          {getUniversalCompatibilityCount() > 0 && (
            <Badge className="text-purple-600 bg-purple-100">
              {getUniversalCompatibilityCount()} UNIVERSAL
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'compatibility', label: 'Compatibility', icon: Link },
            { id: 'equipment', label: 'Equipment', icon: Database },
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
                <p className="text-sm font-medium text-gray-600">Compatible Equipment</p>
                <p className="text-2xl font-bold text-gray-900">{getCompatibleEquipmentCount()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {getCompatibilityPercentage()}% of total equipment
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Universal Parts</p>
                <p className="text-2xl font-bold text-gray-900">{getUniversalCompatibilityCount()}</p>
              </div>
              <Link className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge className="text-purple-600 bg-purple-100">
                UNIVERSAL COMPATIBILITY
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">{getAveragePerformanceRating()}/5</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-3 h-3 rounded-full ${
                      star <= getAveragePerformanceRating() ? 'bg-yellow-400' : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipment Types</p>
                <p className="text-2xl font-bold text-gray-900">{getEquipmentTypes().length}</p>
              </div>
              <Database className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {getBrands().length} different brands
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Compatibility Tab */}
      {activeTab === 'compatibility' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Compatibility Records</h3>
            {isEditable && (
              <Button onClick={() => setShowCompatibilityForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Compatibility</span>
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
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Records</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="universal">Universal</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredCompatibilityRecords.map((record) => (
              <Card key={record._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{record.equipmentName}</h4>
                    <p className="text-sm text-gray-500">
                      {record.equipmentType} • {record.equipmentBrand} {record.equipmentModel}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status.toUpperCase()}
                    </Badge>
                    {record.isUniversal && (
                      <Badge className="text-purple-600 bg-purple-100">UNIVERSAL</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Performance Rating</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-3 h-3 rounded-full ${
                              star <= (record.performanceRating || 0) ? 'bg-yellow-400' : 'bg-gray-300'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <Badge className={getPerformanceColor(record.performanceRating || 0)}>
                        {record.performanceRating}/5
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verified By</p>
                    <p className="text-sm font-medium text-gray-900">
                      {record.verifiedBy || 'Not Verified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Installation Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {record.installationDate ? 
                        new Date(record.installationDate).toLocaleDateString() : 
                        'Not Installed'
                      }
                    </p>
                  </div>
                </div>

                {record.compatibilityNotes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Compatibility Notes:</p>
                    <p className="text-sm text-gray-600">{record.compatibilityNotes}</p>
                  </div>
                )}

                {record.issues && record.issues.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Issues:</p>
                    <div className="space-y-1">
                      {record.issues.map((issue, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-600">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isEditable && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCompatibility(record);
                        setShowCompatibilityForm(true);
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
                        if (record._id) {
                          deleteCompatibility(record._id);
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

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Available Equipment</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((eq) => {
              const isCompatible = compatibilityRecords.some(c => 
                c.equipmentId === eq._id && c.status === 'verified'
              );
              const compatibilityRecord = compatibilityRecords.find(c => c.equipmentId === eq._id);

              return (
                <Card key={eq._id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{eq.name}</h4>
                      <p className="text-sm text-gray-500">
                        {eq.brand} {eq.model}
                      </p>
                    </div>
                    <Badge className={getStatusColor(eq.status)}>
                      {eq.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Equipment Type</p>
                      <p className="text-sm font-medium text-gray-900">{eq.type}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Serial Number</p>
                      <p className="text-sm font-medium text-gray-900">{eq.serialNumber}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-sm font-medium text-gray-900">{eq.location}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Last Maintenance</p>
                        <p className="text-sm font-medium text-gray-900">
                          {eq.lastMaintenance ? 
                            new Date(eq.lastMaintenance).toLocaleDateString() : 
                            'Not Available'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Next Maintenance</p>
                        <p className="text-sm font-medium text-gray-900">
                          {eq.nextMaintenance ? 
                            new Date(eq.nextMaintenance).toLocaleDateString() : 
                            'Not Scheduled'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    {isCompatible ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">Compatible</span>
                        </div>
                        {compatibilityRecord?.performanceRating && (
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <div
                                key={star}
                                className={`w-2 h-2 rounded-full ${
                                  star <= compatibilityRecord.performanceRating! ? 'bg-yellow-400' : 'bg-gray-300'
                                }`}
                              ></div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Not Tested</span>
                        </div>
                        {isEditable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                                                                      setSelectedCompatibility({
                              _id: '',
                              spareId: spare._id,
                              equipmentId: eq._id || '',
                              equipmentName: eq.name,
                              equipmentType: eq.type,
                              equipmentModel: eq.model,
                              equipmentBrand: eq.brand,
                              isUniversal: false,
                              status: 'pending'
                            } as any);
                              setShowCompatibilityForm(true);
                            }}
                          >
                            Test Compatibility
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Compatibility Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Compatibility by Equipment Type</h4>
              <div className="space-y-3">
                {getEquipmentTypes().map((type) => {
                  const count = compatibilityRecords.filter(c => c.equipmentType === type).length;
                  const verified = compatibilityRecords.filter(c => 
                    c.equipmentType === type && c.status === 'verified'
                  ).length;
                  const percentage = count > 0 ? Math.round((verified / count) * 100) : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {verified}/{count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Performance by Brand</h4>
              <div className="space-y-3">
                {getBrands().map((brand) => {
                  const records = compatibilityRecords.filter(c => c.equipmentBrand === brand);
                  const avgRating = records.length > 0 ? 
                    Math.round(records.reduce((sum, r) => sum + (r.performanceRating || 0), 0) / records.length) : 0;
                  
                  return (
                    <div key={brand} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{brand}</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-3 h-3 rounded-full ${
                                star <= avgRating ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            ></div>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {avgRating}/5
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Compatibility Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{getCompatibleEquipmentCount()}</p>
                <p className="text-sm text-gray-600">Compatible</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {compatibilityRecords.filter(c => c.status === 'unverified').length}
                </p>
                <p className="text-sm text-gray-600">Unverified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{getUniversalCompatibilityCount()}</p>
                <p className="text-sm text-gray-600">Universal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {compatibilityRecords.filter(c => c.status === 'incompatible').length}
                </p>
                <p className="text-sm text-gray-600">Incompatible</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Compatibility Settings</h3>
          
          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Compatibility Configuration</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoCompatibilityCheck"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoCompatibilityCheck" className="ml-2 text-sm text-gray-700">
                  Enable automatic compatibility checking
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="universalPartsAlert"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="universalPartsAlert" className="ml-2 text-sm text-gray-700">
                  Alert when universal parts are available
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="performanceTracking"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="performanceTracking" className="ml-2 text-sm text-gray-700">
                  Track performance ratings automatically
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Compatibility Notes Template
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter default compatibility notes template"
                ></textarea>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Compatibility Form Modal */}
      {showCompatibilityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedCompatibility ? 'Edit' : 'Add'} Compatibility Record
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  {equipment.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} - {eq.brand} {eq.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                    <option value="incompatible">Incompatible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Rating
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isUniversal"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isUniversal" className="ml-2 text-sm text-gray-700">
                  This is a universal part
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Date
                  </label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verified By
                  </label>
                  <Input placeholder="Enter verifier name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compatibility Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter compatibility notes"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issues (one per line)
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter any issues encountered"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompatibilityForm(false);
                  setSelectedCompatibility(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCompatibilityForm(false);
                setSelectedCompatibility(null);
              }}>
                {selectedCompatibility ? 'Update' : 'Create'} Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
