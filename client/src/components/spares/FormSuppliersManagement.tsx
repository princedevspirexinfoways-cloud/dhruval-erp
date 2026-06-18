import React, { useState } from 'react';
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

interface FormSuppliersManagementProps {
  spare: Partial<Spare>;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const FormSuppliersManagement: React.FC<FormSuppliersManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  const handleInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = { ...spare };
    let current: any = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onUpdate(newData);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Suppliers Configuration</h3>
          <p className="text-gray-600">Configure suppliers and procurement settings</p>
        </div>
      </div>

      {/* Primary Supplier Settings */}
      <Card className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Primary Supplier</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Supplier Name
            </label>
            <Input
              placeholder="Enter primary supplier name"
              value={spare.suppliers?.find(s => s.isPrimary)?.supplierName || ''}
              onChange={(e) => handleInputChange('suppliers.primarySupplier.name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Code
            </label>
            <Input
              placeholder="Enter supplier code"
              value={spare.suppliers?.find(s => s.isPrimary)?.supplierCode || ''}
              onChange={(e) => handleInputChange('suppliers.primarySupplier.code', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Time (Days)
            </label>
            <Input
              type="number"
              placeholder="7"
              min="1"
              value={spare.suppliers?.find(s => s.isPrimary)?.leadTime || ''}
              onChange={(e) => handleInputChange('suppliers.primarySupplier.leadTime', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Order Quantity
            </label>
            <Input
              type="number"
              placeholder="10"
              min="1"
              value={spare.suppliers?.find(s => s.isPrimary)?.minOrderQuantity || ''}
              onChange={(e) => handleInputChange('suppliers.primarySupplier.minOrderQuantity', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Rating
            </label>
            <select
              value={spare.suppliers?.find(s => s.isPrimary)?.qualityRating || 3}
              onChange={(e) => handleInputChange('suppliers.primarySupplier.qualityRating', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>
        </div>
      </Card>



      {/* Alternative Suppliers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Alternative Suppliers</h4>
          {isEditable && (
            <Button
              onClick={() => setShowSupplierForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </Button>
          )}
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No alternative suppliers yet</p>
          <p className="text-sm">Add alternative suppliers for backup options</p>
        </div>
      </Card>

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Alternative Supplier</h3>
            
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (Days)
                  </label>
                  <Input type="number" placeholder="7" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Order Quantity
                  </label>
                  <Input type="number" placeholder="10" min="1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price
                </label>
                <Input type="number" placeholder="0.00" min="0" step="0.01" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <Input placeholder="Enter contact person name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input type="email" placeholder="Enter email address" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input placeholder="Enter phone number" />
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
                onClick={() => setShowSupplierForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowSupplierForm(false)}>
                Add Supplier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
