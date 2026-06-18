import React, { useState } from 'react';
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  Award,
  Shield,
  FileText,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spare } from '@/lib/api/sparesApi';

interface FormQualityManagementProps {
  spare: Partial<Spare>;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const FormQualityManagement: React.FC<FormQualityManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [showCertificationForm, setShowCertificationForm] = useState(false);

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
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B+': return 'text-yellow-600 bg-yellow-100';
      case 'B': return 'text-yellow-600 bg-yellow-100';
      case 'C': return 'text-red-600 bg-red-100';
      case 'Reject': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Quality Configuration</h3>
          <p className="text-gray-600">Configure quality parameters and certifications</p>
        </div>
      </div>

      {/* Basic Quality Settings */}
      <Card className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Basic Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Grade
            </label>
            <select
              value={spare.quality?.qualityGrade || 'A'}
              onChange={(e) => handleInputChange('quality.qualityGrade', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="Reject">Reject</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Check Required
            </label>
            <select
              value={spare.quality?.qualityCheckRequired ? 'true' : 'false'}
              onChange={(e) => handleInputChange('quality.qualityCheckRequired', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Quality Parameters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Quality Parameters</h4>
          {isEditable && (
            <Button
              onClick={() => setShowCheckForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Parameter</span>
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parameter Name
              </label>
              <Input placeholder="e.g., Tensile Strength" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Value
              </label>
              <Input placeholder="e.g., 500 MPa" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tolerance (±)
              </label>
              <Input placeholder="e.g., 10" />
            </div>
          </div>
        </div>
      </Card>

      {/* Certifications */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Certifications</h4>
          {isEditable && (
            <Button
              onClick={() => setShowCertificationForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Certification</span>
            </Button>
          )}
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No certifications yet</p>
          <p className="text-sm">Add quality certifications and compliance standards</p>
        </div>
      </Card>

      {/* Compliance Standards */}
      <Card className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Compliance Standards</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISO Standards
              </label>
              <Input placeholder="e.g., ISO 9001:2015" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Standards
              </label>
              <Input placeholder="e.g., ASTM, DIN" />
            </div>
          </div>
        </div>
      </Card>

      {/* Quality Check Form Modal */}
      {showCheckForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Quality Parameter</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parameter Name
                </label>
                <Input placeholder="Enter parameter name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Value
                  </label>
                  <Input placeholder="Enter target value" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerance
                  </label>
                  <Input placeholder="Enter tolerance" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter parameter notes"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCheckForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowCheckForm(false)}>
                Add Parameter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certification Form Modal */}
      {showCertificationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Certification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certification Name
                </label>
                <Input placeholder="Enter certification name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issuing Authority
                </label>
                <Input placeholder="Enter issuing authority" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date
                  </label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <Input type="date" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Number
                </label>
                <Input placeholder="Enter certificate number" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCertificationForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowCertificationForm(false)}>
                Add Certification
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
