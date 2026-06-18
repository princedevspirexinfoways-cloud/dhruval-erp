import React, { useState } from 'react';
import { 
  Settings, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  Wrench,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spare } from '@/lib/api/sparesApi';

interface FormMaintenanceManagementProps {
  spare: Partial<Spare>;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const FormMaintenanceManagement: React.FC<FormMaintenanceManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);

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
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Maintenance Configuration</h3>
          <p className="text-gray-600">Configure maintenance schedules and requirements</p>
        </div>
      </div>

      {/* Basic Maintenance Settings */}
      <Card className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Basic Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is Consumable
            </label>
            <select
              value={spare.maintenance?.isConsumable ? 'true' : 'false'}
              onChange={(e) => handleInputChange('maintenance.isConsumable', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criticality Level
            </label>
            <select
              value={spare.maintenance?.criticality || 'medium'}
              onChange={(e) => handleInputChange('maintenance.criticality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Maintenance Schedule */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Maintenance Schedule</h4>
          {isEditable && (
            <Button
              onClick={() => setShowScheduleForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Schedule</span>
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Type
              </label>
              <select
                value={spare.maintenance?.maintenanceSchedule?.scheduleType || 'preventive'}
                onChange={(e) => handleInputChange('maintenance.maintenanceSchedule.scheduleType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="preventive">Preventive</option>
                <option value="predictive">Predictive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency (Days)
              </label>
              <Input
                type="number"
                value={spare.maintenance?.maintenanceSchedule?.frequency || 30}
                onChange={(e) => handleInputChange('maintenance.maintenanceSchedule.frequency', parseInt(e.target.value) || 30)}
                placeholder="30"
                min="1"
              />
            </div>

          </div>
        </div>
      </Card>

      {/* Maintenance Records */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Maintenance Records</h4>
          {isEditable && (
            <Button
              onClick={() => setShowRecordForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </Button>
          )}
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No maintenance records yet</p>
          <p className="text-sm">Add maintenance records to track service history</p>
        </div>
      </Card>

      {/* Maintenance Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Maintenance Schedule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment ID
                </label>
                <Input placeholder="Enter equipment ID" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="preventive">Preventive</option>
                    <option value="predictive">Predictive</option>
                    <option value="corrective">Corrective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter maintenance description"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowScheduleForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowScheduleForm(false)}>
                Add Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Record Form Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Maintenance Record</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Date
                </label>
                <Input type="date" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technician
                </label>
                <Input placeholder="Enter technician name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter maintenance description"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Hours
                  </label>
                  <Input type="number" placeholder="0" min="0" step="0.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost
                  </label>
                  <Input type="number" placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRecordForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowRecordForm(false)}>
                Add Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
