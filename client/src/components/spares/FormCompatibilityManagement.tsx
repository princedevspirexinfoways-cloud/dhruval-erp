import React, { useState } from 'react';
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

interface FormCompatibilityManagementProps {
  spare: Partial<Spare>;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const FormCompatibilityManagement: React.FC<FormCompatibilityManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [showCompatibilityForm, setShowCompatibilityForm] = useState(false);

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
      case 'verified': return 'text-green-600 bg-green-100';
      case 'unverified': return 'text-yellow-600 bg-yellow-100';
      case 'incompatible': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Compatibility Configuration</h3>
          <p className="text-gray-600">Configure equipment compatibility and universal parts</p>
        </div>
      </div>

      {/* Basic Compatibility Settings */}
      <Card className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Basic Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is Universal Part
            </label>
            <select
              value={spare.compatibility?.[0]?.isUniversal ? 'true' : 'false'}
              onChange={(e) => handleInputChange('compatibility.0.isUniversal', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

        </div>
      </Card>





      {/* Compatibility Records */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Compatibility Records</h4>
          {isEditable && (
            <Button
              onClick={() => setShowCompatibilityForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </Button>
          )}
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Link className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No compatibility records yet</p>
          <p className="text-sm">Add compatibility records to track equipment compatibility</p>
        </div>
      </Card>

      {/* Compatibility Form Modal */}
      {showCompatibilityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Compatibility Record</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Name
                </label>
                <Input placeholder="Enter equipment name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="pump">Pump</option>
                    <option value="motor">Motor</option>
                    <option value="valve">Valve</option>
                    <option value="compressor">Compressor</option>
                    <option value="generator">Generator</option>
                    <option value="conveyor">Conveyor</option>
                    <option value="crane">Crane</option>
                    <option value="furnace">Furnace</option>
                    <option value="reactor">Reactor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <Input placeholder="Enter brand name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <Input placeholder="Enter model number" />
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
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCompatibilityForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowCompatibilityForm(false)}>
                Add Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
