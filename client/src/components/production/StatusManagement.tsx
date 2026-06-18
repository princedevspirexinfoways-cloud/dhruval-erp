'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StatusManagementProps {
  currentStatus: string;
  batchId: string;
  onStatusChange: (newStatus: string, notes?: string) => void;
  statusChangeLog?: Array<{
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    changedByName: string;
    changeDate: string;
    notes?: string;
  }>;
}

const statusOptions = [
  { 
    value: 'pending', 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Batch is waiting to start'
  },
  { 
    value: 'in_progress', 
    label: 'In Progress', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    description: 'Batch is currently being processed'
  },
  { 
    value: 'completed', 
    label: 'Completed', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Batch has been completed successfully'
  },
  { 
    value: 'on_hold', 
    label: 'On Hold', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Pause,
    description: 'Batch processing is temporarily paused'
  },
  { 
    value: 'cancelled', 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: X,
    description: 'Batch has been cancelled'
  },
  { 
    value: 'quality_hold', 
    label: 'Quality Hold', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: AlertCircle,
    description: 'Batch is on hold due to quality issues'
  }
];

const statusWorkflow = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'on_hold', 'quality_hold', 'cancelled'],
  on_hold: ['in_progress', 'cancelled'],
  quality_hold: ['in_progress', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [] // Terminal state
};

export default function StatusManagement({ 
  currentStatus, 
  batchId, 
  onStatusChange, 
  statusChangeLog = [] 
}: StatusManagementProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatusInfo = statusOptions.find(s => s.value === currentStatus);
  const availableTransitions = statusWorkflow[currentStatus as keyof typeof statusWorkflow] || [];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setSelectedStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(selectedStatus, statusNotes);
      setShowStatusModal(false);
      setStatusNotes('');
      setSelectedStatus('');
      toast.success(`Status updated to ${statusOptions.find(s => s.value === selectedStatus)?.label}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    const IconComponent = statusInfo?.icon || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Status
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
                const statusInfo = statusOptions.find(s => s.value === status);
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
              <p className="text-sm">This batch has reached a terminal state</p>
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
                        {statusOptions.find(s => s.value === log.fromStatus)?.label}
                      </Badge>
                      <span className="text-gray-500">to</span>
                      <Badge className={`${statusOptions.find(s => s.value === log.toStatus)?.color} text-xs`}>
                        {statusOptions.find(s => s.value === log.toStatus)?.label}
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
                      {statusOptions.find(s => s.value === selectedStatus)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {statusOptions.find(s => s.value === selectedStatus)?.description}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notes (Optional)
                </Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status change..."
                  rows={3}
                />
              </div>
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
                disabled={isUpdating}
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
