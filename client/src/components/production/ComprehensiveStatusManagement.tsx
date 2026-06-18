'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  RefreshCw,
  ArrowRight,
  Calendar,
  User,
  Factory,
  Package,
  Droplets,
  Target,
  Scissors,
  FileText,
  Zap,
  Thermometer,
  Gauge
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ComprehensiveStatusManagementProps {
  currentStatus: string;
  processType: 'pre-processing' | 'dyeing' | 'printing' | 'finishing' | 'quality-control' | 'cutting-packing';
  batchId: string;
  onStatusChange: (newStatus: string, notes?: string, processData?: any) => void;
  statusChangeLog?: Array<{
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    changedByName: string;
    changeDate: string;
    notes?: string;
    processData?: any;
  }>;
}

// Comprehensive status options for all production processes
const allStatusOptions = [
  { 
    value: 'pending', 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Process is waiting to start'
  },
  { 
    value: 'in_progress', 
    label: 'In Progress', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    description: 'Process is currently running'
  },
  { 
    value: 'completed', 
    label: 'Completed', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Process completed successfully'
  },
  { 
    value: 'on_hold', 
    label: 'On Hold', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Pause,
    description: 'Process temporarily paused'
  },
  { 
    value: 'quality_hold', 
    label: 'Quality Hold', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: AlertCircle,
    description: 'Process on hold due to quality issues'
  },
  { 
    value: 'machine_breakdown', 
    label: 'Machine Breakdown', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Factory,
    description: 'Process stopped due to machine issues'
  },
  { 
    value: 'material_shortage', 
    label: 'Material Shortage', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Package,
    description: 'Process stopped due to material shortage'
  },
  { 
    value: 'chemical_issue', 
    label: 'Chemical Issue', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Droplets,
    description: 'Process stopped due to chemical problems'
  },
  { 
    value: 'quality_reject', 
    label: 'Quality Reject', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Target,
    description: 'Process rejected due to quality issues'
  },
  { 
    value: 'cancelled', 
    label: 'Cancelled', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: X,
    description: 'Process has been cancelled'
  },
  { 
    value: 'rework', 
    label: 'Rework Required', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: RefreshCw,
    description: 'Process needs to be redone'
  },
  { 
    value: 'ready_for_next', 
    label: 'Ready for Next Process', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: ArrowRight,
    description: 'Ready to move to next production stage'
  }
];

// Process-specific status workflows
const processWorkflows = {
  'pre-processing': {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'on_hold', 'quality_hold', 'machine_breakdown', 'material_shortage', 'chemical_issue', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    quality_hold: ['in_progress', 'quality_reject', 'cancelled'],
    machine_breakdown: ['in_progress', 'cancelled'],
    material_shortage: ['in_progress', 'cancelled'],
    chemical_issue: ['in_progress', 'cancelled'],
    quality_reject: ['rework', 'cancelled'],
    rework: ['in_progress', 'cancelled'],
    completed: ['ready_for_next'],
    ready_for_next: [], // Terminal state
    cancelled: [] // Terminal state
  },
  'dyeing': {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'on_hold', 'quality_hold', 'machine_breakdown', 'material_shortage', 'chemical_issue', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    quality_hold: ['in_progress', 'quality_reject', 'cancelled'],
    machine_breakdown: ['in_progress', 'cancelled'],
    material_shortage: ['in_progress', 'cancelled'],
    chemical_issue: ['in_progress', 'cancelled'],
    quality_reject: ['rework', 'cancelled'],
    rework: ['in_progress', 'cancelled'],
    completed: ['ready_for_next'],
    ready_for_next: [], // Terminal state
    cancelled: [] // Terminal state
  },
  'printing': {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'on_hold', 'quality_hold', 'machine_breakdown', 'material_shortage', 'chemical_issue', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    quality_hold: ['in_progress', 'quality_reject', 'cancelled'],
    machine_breakdown: ['in_progress', 'cancelled'],
    material_shortage: ['in_progress', 'cancelled'],
    chemical_issue: ['in_progress', 'cancelled'],
    quality_reject: ['rework', 'cancelled'],
    rework: ['in_progress', 'cancelled'],
    completed: ['ready_for_next'],
    ready_for_next: [], // Terminal state
    cancelled: [] // Terminal state
  },
  'finishing': {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'on_hold', 'quality_hold', 'machine_breakdown', 'material_shortage', 'chemical_issue', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    quality_hold: ['in_progress', 'quality_reject', 'cancelled'],
    machine_breakdown: ['in_progress', 'cancelled'],
    material_shortage: ['in_progress', 'cancelled'],
    chemical_issue: ['in_progress', 'cancelled'],
    quality_reject: ['rework', 'cancelled'],
    rework: ['in_progress', 'cancelled'],
    completed: ['ready_for_next'],
    ready_for_next: [], // Terminal state
    cancelled: [] // Terminal state
  },
  'quality-control': {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'on_hold', 'quality_hold', 'machine_breakdown', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    quality_hold: ['in_progress', 'quality_reject', 'cancelled'],
    machine_breakdown: ['in_progress', 'cancelled'],
    quality_reject: ['rework', 'cancelled'],
    rework: ['in_progress', 'cancelled'],
    completed: ['ready_for_next'],
    ready_for_next: [], // Terminal state
    cancelled: [] // Terminal state
  },
  'cutting-packing': {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'on_hold', 'quality_hold', 'machine_breakdown', 'material_shortage', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    quality_hold: ['in_progress', 'quality_reject', 'cancelled'],
    machine_breakdown: ['in_progress', 'cancelled'],
    material_shortage: ['in_progress', 'cancelled'],
    quality_reject: ['rework', 'cancelled'],
    rework: ['in_progress', 'cancelled'],
    completed: [], // Final terminal state
    cancelled: [] // Terminal state
  }
};

// Process-specific icons and colors
const processInfo = {
  'pre-processing': { icon: Droplets, color: 'bg-blue-500', name: 'Pre-Processing' },
  'dyeing': { icon: Zap, color: 'bg-purple-500', name: 'Dyeing' },
  'printing': { icon: FileText, color: 'bg-green-500', name: 'Printing' },
  'finishing': { icon: Thermometer, color: 'bg-orange-500', name: 'Finishing' },
  'quality-control': { icon: Target, color: 'bg-red-500', name: 'Quality Control' },
  'cutting-packing': { icon: Scissors, color: 'bg-gray-500', name: 'Cutting & Packing' }
};

export default function ComprehensiveStatusManagement({ 
  currentStatus, 
  processType,
  batchId, 
  onStatusChange, 
  statusChangeLog = [] 
}: ComprehensiveStatusManagementProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [processData, setProcessData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatusInfo = allStatusOptions.find(s => s.value === currentStatus);
  const availableTransitions = processWorkflows[processType]?.[currentStatus as keyof typeof processWorkflows[typeof processType]] || [];
  const processDetails = processInfo[processType];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setSelectedStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(selectedStatus, statusNotes, processData);
      setShowStatusModal(false);
      setStatusNotes('');
      setSelectedStatus('');
      setProcessData({});
      toast.success(`Status updated to ${allStatusOptions.find(s => s.value === selectedStatus)?.label}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusInfo = allStatusOptions.find(s => s.value === status);
    const IconComponent = statusInfo?.icon || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  const getProcessIcon = () => {
    const IconComponent = processDetails.icon;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Process Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getProcessIcon()}
            <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${processDetails.color}`}>
              {processDetails.name}
            </span>
            <span className="text-gray-500">- Status Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge className={`${currentStatusInfo?.color} flex items-center gap-2 px-4 py-2 text-sm font-medium`}>
              {getStatusIcon(currentStatus)}
              {currentStatusInfo?.label}
            </Badge>
            <div className="text-sm text-gray-600">
              {currentStatusInfo?.description}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Status Transitions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Available Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableTransitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableTransitions.map((status) => {
                const statusInfo = allStatusOptions.find(s => s.value === status);
                return (
                  <Button
                    key={status}
                    variant="outline"
                    onClick={() => handleStatusChange(status)}
                    className={`flex items-center gap-2 h-auto p-4 ${statusInfo?.color} hover:opacity-80 transition-opacity`}
                  >
                    {getStatusIcon(status)}
                    <div className="text-left">
                      <div className="font-medium">{statusInfo?.label}</div>
                      <div className="text-xs opacity-75">{statusInfo?.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>No further status changes available</p>
              <p className="text-sm">This process has reached a terminal state</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change History */}
      {statusChangeLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusChangeLog.map((log, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getStatusIcon(log.toStatus)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.changedByName}</span>
                      <span className="text-gray-500">changed status from</span>
                      <Badge variant="outline" className="text-xs">
                        {allStatusOptions.find(s => s.value === log.fromStatus)?.label}
                      </Badge>
                      <span className="text-gray-500">to</span>
                      <Badge className={`${allStatusOptions.find(s => s.value === log.toStatus)?.color} text-xs`}>
                        {allStatusOptions.find(s => s.value === log.toStatus)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.changeDate).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.changedBy}
                      </div>
                    </div>
                    {log.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Notes:</strong> {log.notes}
                      </div>
                    )}
                    {log.processData && Object.keys(log.processData).length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <strong>Process Data:</strong>
                        <pre className="text-xs mt-1">{JSON.stringify(log.processData, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Change Status</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  New Status
                </Label>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedStatus)}
                    <span className="font-medium">
                      {allStatusOptions.find(s => s.value === selectedStatus)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {allStatusOptions.find(s => s.value === selectedStatus)?.description}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notes (Required)
                </Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add detailed notes about this status change..."
                  rows={3}
                  required
                />
              </div>

              {/* Process-specific data collection */}
              {selectedStatus === 'in_progress' && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Process Parameters
                  </Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Temperature (°C)</Label>
                        <input
                          type="number"
                          value={processData.temperature || ''}
                          onChange={(e) => setProcessData({...processData, temperature: e.target.value})}
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="Enter temperature"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Pressure (Bar)</Label>
                        <input
                          type="number"
                          value={processData.pressure || ''}
                          onChange={(e) => setProcessData({...processData, pressure: e.target.value})}
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="Enter pressure"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Additional Notes</Label>
                      <input
                        type="text"
                        value={processData.additionalNotes || ''}
                        onChange={(e) => setProcessData({...processData, additionalNotes: e.target.value})}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Any additional process notes"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStatusChange}
                disabled={isUpdating || !statusNotes.trim()}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Confirm Change'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
