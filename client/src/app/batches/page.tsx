'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Factory,
  Package,
  TrendingUp,
  Users
} from 'lucide-react';
import { useGetAllBatchesQuery, useDeleteBatchMutation } from '@/lib/features/batches/batchApi';
import { Can } from '@/lib/casl/Can';
import { IBatch } from '@/types/batches';
import { toast } from 'react-hot-toast';

const BatchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<IBatch | null>(null);

  // RTK Query hooks
  const { data: batchData, isLoading, error, refetch } = useGetAllBatchesQuery({
    search: searchTerm,
    status: statusFilter,
    priority: priorityFilter,
  });

  const [deleteBatch] = useDeleteBatchMutation();

  const batches = batchData?.data || [];

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = !searchTerm || 
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDeleteBatch = async (batchId: string) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await deleteBatch(batchId).unwrap();
        toast.success('Batch deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete batch');
        console.error('Delete failed:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'quality_check': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'on_hold': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'quality_check': return <Package className="w-4 h-4 text-purple-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const calculateProgress = (batch: IBatch) => {
    if (batch.status === 'completed') return 100;
    if (batch.status === 'pending') return 0;
    if (batch.status === 'in_progress') return 50;
    if (batch.status === 'quality_check') return 80;
    if (batch.status === 'on_hold') return 30;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading batches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg">Error loading batches</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600 mt-2">Manage production batches, track progress, and monitor quality</p>
        </div>
        <Can I="create" a="Batch">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Batch
          </Button>
        </Can>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Factory className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Play className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {batches.filter(batch => batch.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {batches.filter(batch => batch.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Quality Check</p>
                <p className="text-2xl font-bold">
                  {batches.filter(batch => batch.status === 'quality_check').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search batches by number or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
              <option value="quality_check">Quality Check</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>

            <Button variant="outline" className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Batches ({filteredBatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Batch</th>
                  <th className="text-left p-3 font-semibold">Product & Quantity</th>
                  <th className="text-left p-3 font-semibold">Timeline</th>
                  <th className="text-left p-3 font-semibold">Status & Progress</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr key={batch._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getStatusIcon(batch.status)}
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold">{batch.batchNumber}</p>
                          <p className="text-sm text-gray-600">Priority: 
                            <Badge className={`ml-2 ${getPriorityColor(batch.priority)}`}>
                              {batch.priority}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="font-medium">{batch.productName}</p>
                        <p className="text-gray-600">Quantity: {batch.quantity}</p>
                        {batch.machineName && (
                          <p className="text-xs text-gray-500">
                            Machine: {batch.machineName}
                          </p>
                        )}
                        {batch.operatorName && (
                          <p className="text-xs text-gray-500">
                            Operator: {batch.operatorName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Planned Start:</span><br/>
                          {new Date(batch.plannedStartDate).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Planned End:</span><br/>
                          {new Date(batch.plannedEndDate).toLocaleDateString()}
                        </p>
                        {batch.actualStartDate && (
                          <p>
                            <span className="font-medium">Actual Start:</span><br/>
                            {new Date(batch.actualStartDate).toLocaleDateString()}
                          </p>
                        )}
                        {batch.actualEndDate && (
                          <p>
                            <span className="font-medium">Actual End:</span><br/>
                            {new Date(batch.actualEndDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status?.replace('_', ' ') || 'Unknown Status'}
                        </Badge>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProgress(batch)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {calculateProgress(batch)}% Complete
                        </p>

                        {/* Quality Score if available */}
                        {batch.qualityRecords && batch.qualityRecords.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Quality Score:</span>
                            <span className="ml-1 text-green-600">
                              {batch.qualityRecords[batch.qualityRecords.length - 1].score}/
                              {batch.qualityRecords[batch.qualityRecords.length - 1].maxScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Can I="read" a="Batch">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBatch(batch)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="update" a="Batch">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowCreateModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="delete" a="Batch">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBatch(batch._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBatches.length === 0 && (
            <div className="text-center py-8">
              <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No batches found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedBatch ? 'Edit Batch' : 'Create New Batch'}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedBatch(null);
                }}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Batch form will be implemented here with all required fields
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedBatch(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {selectedBatch ? 'Update Batch' : 'Create Batch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Batch Modal Placeholder */}
      {selectedBatch && !showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Batch Details</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedBatch(null)}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Detailed batch view will be implemented here
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedBatch(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchPage;
