'use client'

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spare } from '@/lib/api/sparesApi';
import { 
  useGetMaintenanceSchedulesQuery,
  useCreateMaintenanceScheduleMutation,
  useUpdateMaintenanceScheduleMutation,
  useDeleteMaintenanceScheduleMutation,
  useGetMaintenanceRecordsQuery,
  useCreateMaintenanceRecordMutation,
  useUpdateMaintenanceRecordMutation,
  useDeleteMaintenanceRecordMutation,
  useGetMaintenanceAnalyticsQuery,
  MaintenanceSchedule,
  MaintenanceRecord
} from '@/lib/api/maintenanceApi';

interface MaintenanceManagementProps {
  spare: Spare;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  // Real API calls
  const { data: schedulesData, isLoading: schedulesLoading } = useGetMaintenanceSchedulesQuery(spare._id);
  const { data: recordsData, isLoading: recordsLoading } = useGetMaintenanceRecordsQuery(spare._id);
  const { data: analyticsData, isLoading: analyticsLoading } = useGetMaintenanceAnalyticsQuery(spare._id);

  const [createSchedule] = useCreateMaintenanceScheduleMutation();
  const [updateSchedule] = useUpdateMaintenanceScheduleMutation();
  const [deleteSchedule] = useDeleteMaintenanceScheduleMutation();
  const [createRecord] = useCreateMaintenanceRecordMutation();
  const [updateRecord] = useUpdateMaintenanceRecordMutation();
  const [deleteRecord] = useDeleteMaintenanceRecordMutation();

  const maintenanceSchedules = schedulesData?.data || [];
  const maintenanceRecords = recordsData?.data || [];
  // Analytics data
  const analytics = analyticsData?.data;

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateNextMaintenance = (lastDate: string, frequency: number, unit: string) => {
    const last = new Date(lastDate);
    const next = new Date(last);
    
    switch (unit) {
      case 'days':
        next.setDate(next.getDate() + frequency);
        break;
      case 'weeks':
        next.setDate(next.getDate() + (frequency * 7));
        break;
      case 'months':
        next.setMonth(next.getMonth() + frequency);
        break;
      case 'years':
        next.setFullYear(next.getFullYear() + frequency);
        break;
    }
    
    return next.toISOString().split('T')[0];
  };

  const isMaintenanceOverdue = (nextDate: string) => {
    return new Date(nextDate) < new Date();
  };

  const isMaintenanceDueSoon = (nextDate: string, days: number = 30) => {
    const next = new Date(nextDate);
    const now = new Date();
    const diffTime = next.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays > 0;
  };

  const getMaintenanceEfficiency = () => {
    const completed = maintenanceRecords.filter(r => r.status === 'completed').length;
    const total = maintenanceRecords.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getAverageMaintenanceCost = () => {
    const costs = maintenanceRecords.map(r => r.cost);
    return costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
  };

  const getTotalMaintenanceHours = () => {
    return maintenanceRecords.reduce((total, record) => total + record.duration, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Management</h2>
          <p className="text-gray-600">Track maintenance schedules, records, and lifecycle</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getCriticalityColor(spare.maintenance?.criticality || 'medium')}>
            {spare.maintenance?.criticality?.toUpperCase() || 'MEDIUM'} CRITICALITY
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            { id: 'schedules', label: 'Schedules', icon: Calendar },
            { id: 'records', label: 'Records', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
                <p className="text-sm font-medium text-gray-600">Next Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {maintenanceSchedules[0]?.nextMaintenance ? 
                    new Date(maintenanceSchedules[0].nextMaintenance).toLocaleDateString() : 
                    'Not Scheduled'
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            {maintenanceSchedules[0]?.nextMaintenance && (
              <div className="mt-2">
                {isMaintenanceOverdue(maintenanceSchedules[0].nextMaintenance) ? (
                  <Badge className="text-red-600 bg-red-100">Overdue</Badge>
                ) : isMaintenanceDueSoon(maintenanceSchedules[0].nextMaintenance) ? (
                  <Badge className="text-yellow-600 bg-yellow-100">Due Soon</Badge>
                ) : (
                  <Badge className="text-green-600 bg-green-100">On Track</Badge>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{maintenanceRecords.length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge className={getStatusColor('completed')}>
                {maintenanceRecords.filter(r => r.status === 'completed').length} Completed
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{getMaintenanceEfficiency()}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${getMaintenanceEfficiency()}%` }}
                ></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{getAverageMaintenanceCost().toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Total Hours: {getTotalMaintenanceHours()}h
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Maintenance Schedules</h3>
            {isEditable && (
              <Button onClick={() => setShowScheduleForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Schedule</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maintenanceSchedules.map((schedule, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {schedule.scheduleType} Maintenance
                    </h4>
                    <p className="text-sm text-gray-500">
                      Every {schedule.frequency} {schedule.frequencyUnit}
                    </p>
                  </div>
                  <Badge className={getPriorityColor(schedule.priority)}>
                    {schedule.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Last Maintenance</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.lastMaintenance ? 
                        new Date(schedule.lastMaintenance).toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Next Maintenance</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.nextMaintenance ? 
                        new Date(schedule.nextMaintenance).toLocaleDateString() : 
                        'Not Scheduled'
                      }
                    </p>
                    {schedule.nextMaintenance && (
                      <div className="mt-1">
                        {isMaintenanceOverdue(schedule.nextMaintenance) ? (
                          <Badge className="text-red-600 bg-red-100 text-xs">Overdue</Badge>
                        ) : isMaintenanceDueSoon(schedule.nextMaintenance) ? (
                          <Badge className="text-yellow-600 bg-yellow-100 text-xs">Due Soon</Badge>
                        ) : (
                          <Badge className="text-green-600 bg-green-100 text-xs">On Track</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Assigned Technician</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.assignedTechnician || 'Unassigned'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Duration</p>
                      <p className="text-sm font-medium text-gray-900">
                        {schedule.estimatedDuration || 0}h
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="text-sm font-medium text-gray-900">
                        ₹{schedule.estimatedCost?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  {schedule.maintenanceNotes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-sm text-gray-900">{schedule.maintenanceNotes}</p>
                    </div>
                  )}
                </div>

                {isEditable && (
                  <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowScheduleForm(true);
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
                        if (schedule._id) {
                          deleteSchedule(schedule._id);
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

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Maintenance Records</h3>
            {isEditable && (
              <Button onClick={() => setShowRecordForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {maintenanceRecords.map((record) => (
              <Card key={record.id || record._id || Math.random().toString()} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{record.description}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()} • {record.technician}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status.toUpperCase()}
                    </Badge>
                    <Badge className="text-blue-600 bg-blue-100 capitalize">
                      {record.type}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-sm font-medium text-gray-900">{record.duration}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cost</p>
                    <p className="text-sm font-medium text-gray-900">₹{record.cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parts Used</p>
                    <p className="text-sm font-medium text-gray-900">{record.partsUsed.length}</p>
                  </div>
                </div>

                {record.partsUsed.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Parts Used:</p>
                    <div className="space-y-1">
                      {record.partsUsed.map((part, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{part.spareName}</span>
                          <span className="text-gray-900">
                            {part.quantity} × ₹{part.cost.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                    <p className="text-sm text-gray-600">{record.notes}</p>
                  </div>
                )}

                {isEditable && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRecord(record as any);
                        setShowRecordForm(true);
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
                          deleteRecord(record._id);
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Maintenance Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Maintenance Type Distribution</h4>
              <div className="space-y-3">
                {['preventive', 'predictive', 'corrective', 'emergency'].map((type) => {
                  const count = maintenanceRecords.filter(r => r.type === type).length;
                  const percentage = maintenanceRecords.length > 0 ? 
                    Math.round((count / maintenanceRecords.length) * 100) : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Cost Analysis</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Maintenance Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{maintenanceRecords.reduce((total, r) => total + r.cost, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Cost per Maintenance</p>
                  <p className="text-lg font-medium text-gray-900">
                    ₹{getAverageMaintenanceCost().toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Maintenance Hours</p>
                  <p className="text-lg font-medium text-gray-900">
                    {getTotalMaintenanceHours()} hours
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Maintenance Timeline</h4>
            <div className="space-y-3">
              {maintenanceRecords
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((record) => (
                  <div key={record.id || record._id || Math.random().toString()} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'completed' ? 'bg-green-500' :
                      record.status === 'in-progress' ? 'bg-blue-500' :
                      record.status === 'scheduled' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{record.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.date).toLocaleDateString()} • {record.technician}
                      </p>
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Maintenance Settings</h3>
          
          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Criticality Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Criticality Level
                </label>
                <select
                  value={spare.maintenance?.criticality || 'medium'}
                  onChange={(e) => onUpdate({
                    maintenance: {
                      ...spare.maintenance,
                      criticality: e.target.value as 'low' | 'medium' | 'high' | 'critical'
                    }
                  })}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Lifespan (months)
                </label>
                <Input
                  type="number"
                  value={spare.maintenance?.expectedLifespan || ''}
                  onChange={(e) => onUpdate({
                    maintenance: {
                      ...spare.maintenance,
                      expectedLifespan: parseInt(e.target.value) || undefined
                    }
                  })}
                  disabled={!isEditable}
                  placeholder="Enter expected lifespan in months"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Failure Rate (%)
                </label>
                <Input
                  type="number"
                  value={spare.maintenance?.failureRate || ''}
                  onChange={(e) => onUpdate({
                    maintenance: {
                      ...spare.maintenance,
                      failureRate: parseFloat(e.target.value) || undefined
                    }
                  })}
                  disabled={!isEditable}
                  placeholder="Enter failure rate percentage"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MTBF (Mean Time Between Failures) - hours
                </label>
                <Input
                  type="number"
                  value={spare.maintenance?.mtbf || ''}
                  onChange={(e) => onUpdate({
                    maintenance: {
                      ...spare.maintenance,
                      mtbf: parseInt(e.target.value) || undefined
                    }
                  })}
                  disabled={!isEditable}
                  placeholder="Enter MTBF in hours"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isConsumable"
                  checked={spare.maintenance?.isConsumable || false}
                  onChange={(e) => onUpdate({
                    maintenance: {
                      ...spare.maintenance,
                      isConsumable: e.target.checked
                    }
                  })}
                  disabled={!isEditable}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isConsumable" className="ml-2 text-sm text-gray-700">
                  This is a consumable item
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedSchedule ? 'Edit' : 'Add'} Maintenance Schedule
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="preventive">Preventive</option>
                  <option value="predictive">Predictive</option>
                  <option value="corrective">Corrective</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <Input type="number" placeholder="Enter frequency" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Technician
                </label>
                <Input placeholder="Enter technician name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Est. Duration (hours)
                  </label>
                  <Input type="number" placeholder="Enter duration" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Est. Cost (₹)
                  </label>
                  <Input type="number" placeholder="Enter cost" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter maintenance notes"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleForm(false);
                  setSelectedSchedule(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={async () => {
                // TODO: Add form data collection and API call
                const formData = {
                  spareId: spare._id,
                  equipmentId: 'EQUIP-001',
                  maintenanceType: 'preventive' as const,
                  scheduleType: 'preventive' as const,
                  frequency: 30,
                  frequencyUnit: 'days' as const,
                  interval: 30,
                  lastMaintenance: new Date().toISOString(),
                  nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  description: 'Regular preventive maintenance',
                  assignedTechnician: 'Tech-001',
                  estimatedCost: 500,
                  priority: 'medium' as const,
                  status: 'scheduled' as const,
                  isActive: true
                };
                
                if (selectedSchedule) {
                  updateSchedule({ id: selectedSchedule._id || '', data: formData });
                } else {
                  createSchedule(formData);
                }
                
                setShowScheduleForm(false);
                setSelectedSchedule(null);
              }}>
                {selectedSchedule ? 'Update' : 'Create'} Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Form Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedRecord ? 'Edit' : 'Add'} Maintenance Record
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="preventive">Preventive</option>
                    <option value="predictive">Predictive</option>
                    <option value="corrective">Corrective</option>
                    <option value="emergency">Emergency</option>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technician
                  </label>
                  <Input placeholder="Enter technician name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours)
                  </label>
                  <Input type="number" placeholder="Enter duration" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost (₹)
                  </label>
                  <Input type="number" placeholder="Enter cost" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter additional notes"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRecordForm(false);
                  setSelectedRecord(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={async () => {
                // TODO: Add form data collection and API call
                const formData = {
                  spareId: spare._id,
                  scheduleId: 'SCHED-001',
                  date: new Date().toISOString(),
                  maintenanceDate: new Date().toISOString(),
                  technician: 'Tech-001',
                  type: 'preventive' as const,
                  maintenanceType: 'preventive' as const,
                  description: 'Regular maintenance performed',
                  partsUsed: [],
                  laborHours: 2,
                  duration: 2,
                  cost: 500,
                  status: 'completed' as const,
                  notes: 'Maintenance completed successfully'
                };
                
                if (selectedRecord) {
                  updateRecord({ id: selectedRecord._id || '', data: formData });
                } else {
                  createRecord(formData);
                }
                
                setShowRecordForm(false);
                setSelectedRecord(null);
              }}>
                {selectedRecord ? 'Update' : 'Create'} Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
