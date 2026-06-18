'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
  Play,
  SkipForward,
  Package,
  DollarSign,
  TrendingUp,
  Activity,
  FileText,
  BarChart3,
  Settings,
  Zap,
  Target,
  Users,
  Copy,
  Printer,
  Wrench,
  List,
  Grid3X3
} from 'lucide-react';
import {
  useGetBatchesQuery,
  useDeleteBatchMutation,
  useUpdateStageStatusMutation,
  useConsumeMaterialMutation,
  useAddMaterialOutputMutation,
  useAddQualityCheckMutation,
  usePassQualityGateMutation,
  useFailQualityGateMutation,
  useAddCostMutation,
  useGetBatchMetricsQuery,
  useTransferToWorkingInventoryMutation,
  useTransferMaterialCategoryMutation,
  ProductionBatch
} from '@/lib/api/productionBatches';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  quality_hold: 'bg-purple-100 text-purple-800 border-purple-200',
  rework: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusIcons = {
  pending: Clock,
  in_progress: RefreshCw,
  completed: CheckCircle,
  on_hold: Pause,
  cancelled: XCircle,
  quality_hold: AlertCircle,
  rework: RefreshCw
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

function BatchesPageContent() {
  const router = useRouter();
  // const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  // Get user and company from Redux store
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.isSuperAdmin || false;
  
  // For superadmin, we'll fetch all batches. For regular users, use their company ID
  const companyId = isSuperAdmin ? null : (user?.companyId || '507f1f77bcf86cd799439011');

  // Use the API hooks
  const { 
    data: batchesResponse, 
    isLoading: loading, 
    error, 
    refetch 
  } = useGetBatchesQuery({
    companyId: isSuperAdmin && companyFilter !== 'all' ? companyFilter : (companyId || 'all'), // Use companyFilter for superadmin
    params: {
      page,
      limit: 12,
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      sortBy,
      sortOrder
    }
  }, {
    skip: !user // Skip query if user is not loaded
  });

  const [deleteBatch] = useDeleteBatchMutation();
  const [updateStageStatus] = useUpdateStageStatusMutation();
  const [consumeMaterial] = useConsumeMaterialMutation();
  const [addMaterialOutput] = useAddMaterialOutputMutation();
  const [addQualityCheck] = useAddQualityCheckMutation();
  const [passQualityGate] = usePassQualityGateMutation();
  const [failQualityGate] = useFailQualityGateMutation();
  const [addCost] = useAddCostMutation();
  const [transferToWorkingInventory] = useTransferToWorkingInventoryMutation();
  const [transferMaterialCategory] = useTransferMaterialCategoryMutation();

  const batches = batchesResponse?.data || [];
  const totalPages = batchesResponse?.pagination.pages || 1;
  const totalBatches = batchesResponse?.pagination.total || 0;

  // Get metrics for selected batch
  const { data: batchMetrics } = useGetBatchMetricsQuery(selectedBatch?._id || '', {
    skip: !selectedBatch
  });

  useEffect(() => {
    refetch();
  }, [page, searchTerm, statusFilter, priorityFilter, companyFilter, sortBy, sortOrder, refetch]);

  const handleDeleteBatch = async (batchId: string) => {
    try {
      await deleteBatch(batchId).unwrap();
      console.log('Batch deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const handleDuplicateBatch = (batch: any) => {
    // Navigate to create page with pre-filled data
    const queryParams = new URLSearchParams({
      duplicate: 'true',
      batchNumber: batch.batchNumber,
      productType: batch.productSpecifications?.productType || '',
      fabricType: batch.productSpecifications?.fabricType || '',
      plannedQuantity: batch.plannedQuantity?.toString() || '',
      unit: batch.unit || '',
      priority: batch.priority || '',
      plannedStartDate: batch.plannedStartDate || '',
      plannedEndDate: batch.plannedEndDate || '',
      description: batch.description || ''
    });
    router.push(`/production/batches/create?${queryParams.toString()}`);
  };

  const handleExportBatch = (batch: any) => {
    // Create a downloadable JSON file
    const dataStr = JSON.stringify(batch, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `batch-${batch.batchNumber}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handlePrintBatch = (batch: any) => {
    // Open print dialog with batch details
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Batch Report - ${batch.batchNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Production Batch Report</h1>
              <p><strong>Batch Number:</strong> ${batch.batchNumber}</p>
              <p><strong>Status:</strong> ${batch.status?.toUpperCase()}</p>
              <p><strong>Created:</strong> ${new Date(batch.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h3>Product Specifications</h3>
              <p><strong>Product Type:</strong> ${batch.productSpecifications?.productType || 'N/A'}</p>
              <p><strong>Fabric Type:</strong> ${batch.productSpecifications?.fabricType || 'N/A'}</p>
              <p><strong>Planned Quantity:</strong> ${batch.plannedQuantity} ${batch.unit}</p>
            </div>
            
            <div class="section">
              <h3>Stages</h3>
              <table>
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  ${batch.stages?.map((stage: any) => `
                    <tr>
                      <td>${stage.stageNumber}</td>
                      <td>${stage.stageName}</td>
                      <td>${stage.status?.toUpperCase()}</td>
                      <td>${stage.progress || 0}%</td>
                    </tr>
                  `).join('') || '<tr><td colspan="4">No stages defined</td></tr>'}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };


  const handleUpdateStageStatus = async (batchId: string, stageNumber: number, newStatus: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'quality_hold' | 'failed' | 'skipped', reason: string) => {
    try {
      await updateStageStatus({
        batchId,
        stageNumber,
        data: { newStatus, reason }
      }).unwrap();
      console.log('Stage status updated successfully');
      refetch();
      // Close the dialog by clearing selectedBatch
      setSelectedBatch(null);
    } catch (error) {
      console.error('Error updating stage status:', error);
      throw error; // Re-throw to handle in form
    }
  };

  // Calculate progress based on completed stages
  const calculateProgress = (batch: any) => {
    if (!batch.stages || batch.stages.length === 0) return 0;
    const completedStages = batch.stages.filter((stage: any) => stage.status === 'completed').length;
    return Math.round((completedStages / batch.stages.length) * 100);
  };

  const handleConsumeMaterial = async (batchId: string, stageNumber: number, materialData: any) => {
    try {
      // Convert single material to materials array format
      const materials = Array.isArray(materialData) ? materialData : [materialData];
      await consumeMaterial({
        batchId,
        stageNumber,
        data: { materials }
      }).unwrap();
      console.log('Material consumed successfully');
      refetch();
    } catch (error) {
      console.error('Error consuming material:', error);
    }
  };

  const handleAddMaterialOutput = async (batchId: string, stageNumber: number, outputData: any) => {
    try {
      // Convert single output to outputs array format
      const outputs = Array.isArray(outputData) ? outputData : [outputData];
      await addMaterialOutput({
        batchId,
        stageNumber,
        data: { outputs }
      }).unwrap();
      console.log('Material output added successfully');
      refetch();
    } catch (error) {
      console.error('Error adding material output:', error);
    }
  };

  const handleAddQualityCheck = async (batchId: string, stageNumber: number, checkData: any) => {
    try {
      await addQualityCheck({
        batchId,
        stageNumber,
        data: checkData
      }).unwrap();
      console.log('Quality check added successfully');
      refetch();
    } catch (error) {
      console.error('Error adding quality check:', error);
    }
  };

  const handlePassQualityGate = async (batchId: string, stageNumber: number, notes?: string) => {
    try {
      await passQualityGate({
        batchId,
        stageNumber,
        notes
      }).unwrap();
      console.log('Quality gate passed successfully');
      refetch();
    } catch (error) {
      console.error('Error passing quality gate:', error);
    }
  };

  const handleFailQualityGate = async (batchId: string, stageNumber: number, rejectionReason: string) => {
    try {
      await failQualityGate({
        batchId,
        stageNumber,
        rejectionReason
      }).unwrap();
      console.log('Quality gate failed successfully');
      refetch();
    } catch (error) {
      console.error('Error failing quality gate:', error);
    }
  };

  const handleAddCost = async (batchId: string, costData: any) => {
    try {
      await addCost({
        batchId,
        data: costData
      }).unwrap();
      console.log('Cost added successfully');
      refetch();
    } catch (error) {
      console.error('Error adding cost:', error);
    }
  };

  const handleTransferToWorkingInventory = async (batchId: string, materialInputs: any[]) => {
    try {
      await transferToWorkingInventory({
        batchId,
        data: { materialInputs }
      }).unwrap();
      console.log('Materials transferred to working inventory successfully');
      refetch();
    } catch (error) {
      console.error('Error transferring to working inventory:', error);
    }
  };

  const handleTransferMaterialCategory = async (itemId: string, fromCategory: string, toCategory: string, notes?: string) => {
    try {
      await transferMaterialCategory({
        itemId,
        data: { fromCategory, toCategory, notes }
      }).unwrap();
      console.log('Material category transferred successfully');
    } catch (error) {
      console.error('Error transferring material category:', error);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStageName = (stageNumber: number) => {
    const stageNames = {
      // Updated to match server's 8-stage system
      1: 'Pre-Processing (Desizing/Bleaching)',
      2: 'Dyeing Process',
      3: 'Printing Process',
      4: 'Washing Process',
      5: 'Color Fixing',
      6: 'Finishing (Stenter, Coating)',
      7: 'Quality Control (Pass/Hold/Reject)',
      8: 'Cutting & Packing (Labels & Cartons)'
    };
    return stageNames[stageNumber as keyof typeof stageNames] || `Stage ${stageNumber}`;
  };

  const getStageIcon = (stageType: string) => {
    const icons = {
      // Updated to match server's 8-stage system
      pre_processing: Wrench,
      dyeing: Zap,
      printing: Printer,
      washing: RefreshCw,
      fixing: Target,
      finishing: Settings,
      quality_control: CheckCircle,
      cutting_packing: Package
    };
    return icons[stageType as keyof typeof icons] || Activity;
  };

  const getStageStatusColor = (status: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-orange-100 text-orange-800',
      quality_hold: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800',
      skipped: 'bg-gray-100 text-gray-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Production Batches</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {isSuperAdmin 
              ? 'Manage and track production batches across all companies and stages'
              : 'Manage and track production batches across all stages'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
          
          <Button onClick={() => router.push('/production/batches/create')} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Batch</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Sort Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="createdAt" className="bg-white hover:bg-gray-50">Created Date</SelectItem>
                    <SelectItem value="batchNumber" className="bg-white hover:bg-gray-50">Batch Number</SelectItem>
                    <SelectItem value="status" className="bg-white hover:bg-gray-50">Status</SelectItem>
                    <SelectItem value="priority" className="bg-white hover:bg-gray-50">Priority</SelectItem>
                    <SelectItem value="progress" className="bg-white hover:bg-gray-50">Progress</SelectItem>
                    <SelectItem value="plannedQuantity" className="bg-white hover:bg-gray-50">Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Order</Label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="desc" className="bg-white hover:bg-gray-50">Descending</SelectItem>
                    <SelectItem value="asc" className="bg-white hover:bg-gray-50">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="itemsPerPage">Items per page</Label>
                <Select value="12" onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="6" className="bg-white hover:bg-gray-50">6 items</SelectItem>
                    <SelectItem value="12" className="bg-white hover:bg-gray-50">12 items</SelectItem>
                    <SelectItem value="24" className="bg-white hover:bg-gray-50">24 items</SelectItem>
                    <SelectItem value="48" className="bg-white hover:bg-gray-50">48 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filter Row */}
            <div className={`grid grid-cols-1 gap-4 ${isSuperAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="all" className="bg-white hover:bg-gray-50">All companies</SelectItem>
                      {batches.reduce((unique: string[], batch) => {
                        const companyName = (batch as any).companyId?.companyName;
                        if (companyName && !unique.includes(companyName)) {
                          unique.push(companyName);
                        }
                        return unique;
                      }, []).map((companyName) => (
                        <SelectItem key={companyName} value={companyName} className="bg-white hover:bg-gray-50">
                          {companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="bg-white hover:bg-gray-50">All statuses</SelectItem>
                  <SelectItem value="pending" className="bg-white hover:bg-gray-50">Pending</SelectItem>
                  <SelectItem value="in_progress" className="bg-white hover:bg-gray-50">In Progress</SelectItem>
                  <SelectItem value="completed" className="bg-white hover:bg-gray-50">Completed</SelectItem>
                  <SelectItem value="on_hold" className="bg-white hover:bg-gray-50">On Hold</SelectItem>
                  <SelectItem value="quality_hold" className="bg-white hover:bg-gray-50">Quality Hold</SelectItem>
                  <SelectItem value="cancelled" className="bg-white hover:bg-gray-50">Cancelled</SelectItem>
                  <SelectItem value="rework" className="bg-white hover:bg-gray-50">Rework</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="bg-white hover:bg-gray-50">All priorities</SelectItem>
                  <SelectItem value="low" className="bg-white hover:bg-gray-50">Low</SelectItem>
                  <SelectItem value="medium" className="bg-white hover:bg-gray-50">Medium</SelectItem>
                  <SelectItem value="high" className="bg-white hover:bg-gray-50">High</SelectItem>
                  <SelectItem value="urgent" className="bg-white hover:bg-gray-50">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold">{totalBatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {batches.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {batches.filter(b => b.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Pause className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">On Hold</p>
                <p className="text-2xl font-bold">
                  {batches.filter(b => b.status === 'on_hold' || b.status === 'quality_hold').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Batches</CardTitle>
          <CardDescription>
            View and manage all production batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <div className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 border-b border-gray-200">
                      <div className={`grid gap-4 px-6 py-3 text-sm font-medium text-gray-700 ${isSuperAdmin ? 'grid-cols-10' : 'grid-cols-9'}`}>
                        <div>Batch Number</div>
                        {isSuperAdmin && <div>Company</div>}
                        <div>Product</div>
                        <div>Quantity</div>
                        <div>Status</div>
                        <div>Current Stage</div>
                        <div>Priority</div>
                        <div>Progress</div>
                        <div>Created</div>
                        <div>Actions</div>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {batches.map((batch) => {
                        const StatusIcon = statusIcons[batch.status as keyof typeof statusIcons];
                        return (
                          <div key={batch._id} className={`grid gap-4 px-6 py-4 text-sm ${isSuperAdmin ? 'grid-cols-10' : 'grid-cols-9'}`}>
                            <div className="font-medium">
                              {batch.batchNumber}
                            </div>
                            {isSuperAdmin && (
                              <div>
                                <div>
                                  <p className="font-medium">{(batch as any).companyId?.companyName || 'Unknown Company'}</p>
                                  <p className="text-sm text-gray-500">{(batch as any).companyId?.companyCode || 'N/A'}</p>
                                </div>
                              </div>
                            )}
                            <div>
                              <div>
                                <p className="font-medium">{batch.productSpecifications.productType}</p>
                                <p className="text-sm text-gray-500">{batch.productSpecifications.fabricType}</p>
                              </div>
                            </div>
                            <div>
                              {batch.plannedQuantity} {batch.unit}
                            </div>
                            <div>
                              <Badge className={statusColors[batch.status as keyof typeof statusColors]}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {batch.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <div>
                                <p className="font-medium">{getStageName(batch.currentStage)}</p>
                                <p className="text-sm text-gray-500">Stage {batch.currentStage}</p>
                              </div>
                            </div>
                            <div>
                              <Badge className={priorityColors[batch.priority as keyof typeof priorityColors]}>
                                {batch.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <Progress value={calculateProgress(batch)} className="flex-1" />
                                <span className="text-xs text-gray-500">{calculateProgress(batch)}%</span>
                              </div>
                            </div>
                            <div>
                              {formatDate(batch.createdAt)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedBatch(batch)}
                                  className="h-8 w-8 p-0"
                                  title="Quick View"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/production/batches/${batch._id}`)}
                                  className="h-8 w-8 p-0"
                                  title="View Details"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicateBatch(batch)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  title="Duplicate Batch"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExportBatch(batch)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  title="Export Batch"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePrintBatch(batch)}
                                  className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                                  title="Print Batch"
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" title="Delete Batch">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete Batch</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete batch {batch.batchNumber}? 
                                        This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button variant="outline">Cancel</Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => handleDeleteBatch(batch._id)}
                                      >
                                        Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {batches.map((batch) => {
                    const StatusIcon = statusIcons[batch.status as keyof typeof statusIcons];
                    return (
                      <Card key={batch._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedBatch(batch)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-5 h-5 text-gray-500" />
                              <Badge className={statusColors[batch.status as keyof typeof statusColors]}>
                                {batch.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBatch(batch);
                                }}
                                className="h-8 w-8 p-0"
                                title="Quick View"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/production/batches/${batch._id}`);
                                }}
                                className="h-8 w-8 p-0"
                                title="View Details"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateBatch(batch);
                                }}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="Duplicate Batch"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportBatch(batch);
                                }}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                title="Export Batch"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintBatch(batch);
                                }}
                                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                                title="Print Batch"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <CardTitle className="text-lg">{batch.batchNumber}</CardTitle>
                          <CardDescription>
                            {batch.productSpecifications.productType} • {batch.productSpecifications.fabricType}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {isSuperAdmin && batch.companyId && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{(batch as any).companyId?.companyName}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Quantity</span>
                            <span className="font-semibold">{batch.plannedQuantity} {batch.unit}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Progress</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={calculateProgress(batch)} className="w-16" />
                              <span className="text-sm font-medium">{calculateProgress(batch)}%</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Priority</span>
                            <Badge className={priorityColors[batch.priority as keyof typeof priorityColors]}>
                              {batch.priority.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Created</span>
                            <span className="text-sm">{new Date(batch.createdAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Batch Details - {selectedBatch.batchNumber}</span>
              </DialogTitle>
              <DialogDescription>
                Manage production stages, materials, quality, and costs for this batch
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stages">Stages</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="costs">Costs</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Batch Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Batch Number:</span>
                        <span>{selectedBatch.batchNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <Badge className={statusColors[selectedBatch.status as keyof typeof statusColors]}>
                          {selectedBatch.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Priority:</span>
                        <Badge className={priorityColors[selectedBatch.priority as keyof typeof priorityColors]}>
                          {selectedBatch.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Progress:</span>
                        <span>{selectedBatch.progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Current Stage:</span>
                        <span>{getStageName(selectedBatch.currentStage)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Product Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Product Type:</span>
                        <span>{selectedBatch.productSpecifications.productType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Fabric Type:</span>
                        <span>{selectedBatch.productSpecifications.fabricType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Planned Quantity:</span>
                        <span>{selectedBatch.plannedQuantity} {selectedBatch.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Actual Quantity:</span>
                        <span>{selectedBatch.actualQuantity || 'N/A'} {selectedBatch.unit}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {batchMetrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Production Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {batchMetrics.metrics?.efficiency || 0}%
                          </div>
                          <div className="text-sm text-gray-600">Efficiency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {batchMetrics.metrics?.qualityScore || 0}%
                          </div>
                          <div className="text-sm text-gray-600">Quality Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {batchMetrics.metrics?.onTimeDelivery || 0}%
                          </div>
                          <div className="text-sm text-gray-600">On-Time Delivery</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="stages" className="space-y-4">
                <div className="space-y-4">
                  {selectedBatch.stages && selectedBatch.stages.length > 0 ? selectedBatch.stages.map((stage, index) => {
                    const StageIcon = getStageIcon(stage.stageType);
                    return (
                      <Card key={stage.stageNumber} className="relative">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <StageIcon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{stage.stageName}</CardTitle>
                                <CardDescription>Stage {stage.stageNumber}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStageStatusColor(stage.status)}>
                                {stage.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <div className="text-sm text-gray-600">
                                {stage.progress || 0}% Complete
                              </div>
                            </div>
                          </div>
                          <Progress value={stage.progress || 0} className="w-full" />
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Timing</h4>
                              <div className="space-y-1 text-sm">
                                <div>Planned Start: {stage.plannedStartTime ? formatDate(stage.plannedStartTime) : 'Not set'}</div>
                                <div>Actual Start: {stage.actualStartTime ? formatDate(stage.actualStartTime) : 'Not started'}</div>
                                <div>Planned End: {stage.plannedEndTime ? formatDate(stage.plannedEndTime) : 'Not set'}</div>
                                <div>Actual End: {stage.actualEndTime ? formatDate(stage.actualEndTime) : 'Not completed'}</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Quality Gate</h4>
                              <div className="space-y-1 text-sm">
                                <div>Required: {stage.qualityGate.required ? 'Yes' : 'No'}</div>
                                <div>Status: {stage.qualityGate.passed ? 'Passed' : 'Pending'}</div>
                                {stage.qualityGate.passedBy && (
                                  <div>Passed By: {stage.qualityGate.passedBy}</div>
                                )}
                                {stage.qualityGate.passedDate && (
                                  <div>Passed Date: {formatDate(stage.qualityGate.passedDate)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Settings className="w-4 h-4 mr-2" />
                                  Update Status
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Update Stage Status</DialogTitle>
                                  <DialogDescription>
                                    Update the status for {stage.stageName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="px-1">
                                  <StageStatusUpdateForm
                                    batchId={selectedBatch._id}
                                    stageNumber={stage.stageNumber}
                                    currentStatus={stage.status}
                                    onUpdate={handleUpdateStageStatus}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Package className="w-4 h-4 mr-2" />
                                  Add Material
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Add Material Output</DialogTitle>
                                  <DialogDescription>
                                    Record material output for {stage.stageName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="px-1">
                                  <MaterialOutputForm
                                    batchId={selectedBatch._id}
                                    stageNumber={stage.stageNumber}
                                    onAdd={handleAddMaterialOutput}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Quality Check
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Add Quality Check</DialogTitle>
                                  <DialogDescription>
                                    Record quality check for {stage.stageName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="px-1">
                                  <QualityCheckForm
                                    batchId={selectedBatch._id}
                                    stageNumber={stage.stageNumber}
                                    onAdd={handleAddQualityCheck}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }) : (
                    <div className="text-center text-gray-500 py-8">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No stages available for this batch</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="materials" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Material Management</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Transfer to Working Inventory
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Transfer Materials to Working Inventory</DialogTitle>
                            <DialogDescription>
                              Transfer raw materials to working inventory for batch {selectedBatch.batchNumber}
                            </DialogDescription>
                          </DialogHeader>
                          <WorkingInventoryTransferForm
                            batchId={selectedBatch._id}
                            onTransfer={handleTransferToWorkingInventory}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(selectedBatch as any).inputMaterials && (selectedBatch as any).inputMaterials.length > 0 ? (
                      <div className="space-y-2">
                        {(selectedBatch as any).inputMaterials.map((input: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <div className="font-medium">{input.itemName}</div>
                              <div className="text-sm text-gray-600">{input.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{input.plannedQuantity || input.quantity} {input.unit}</div>
                              <div className="text-sm text-gray-600">₹{input.totalCost}</div>
                              <div className="text-xs text-gray-500">
                                Status: {input.status || 'planned'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No material inputs recorded
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedBatch.qualityGrade || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Quality Grade</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedBatch.qualityScore || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Quality Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedBatch.qualityIssues.length}
                        </div>
                        <div className="text-sm text-gray-600">Quality Issues</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{selectedBatch.totalCost || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          ₹{selectedBatch.costPerUnit || 0}
                        </div>
                        <div className="text-sm text-gray-600">Cost Per Unit</div>
                      </div>
                      <div className="text-center">
                        <Button size="sm" variant="outline">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Add Cost
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Status Change Logs</h4>
                        {selectedBatch.statusChangeLogs && selectedBatch.statusChangeLogs.length > 0 ? (
                          <div className="space-y-2">
                            {selectedBatch.statusChangeLogs.map((log, index) => (
                              <div key={index} className="p-3 border rounded text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{log.reason}</div>
                                    <div className="text-gray-600">{log.notes}</div>
                                  </div>
                                  <div className="text-right text-gray-500">
                                    <div>{formatDate(log.timestamp)}</div>
                                    <div>By: {log.userName}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            No status change logs
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Material Consumption Logs</h4>
                        {selectedBatch.materialConsumptionLogs && selectedBatch.materialConsumptionLogs.length > 0 ? (
                          <div className="space-y-2">
                            {selectedBatch.materialConsumptionLogs.map((log, index) => (
                              <div key={index} className="p-3 border rounded text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{log.materialName}</div>
                                    <div className="text-gray-600">Consumed: {log.consumedQuantity} {log.unit}</div>
                                  </div>
                                  <div className="text-right text-gray-500">
                                    <div>{formatDate(log.timestamp)}</div>
                                    <div>By: {log.userName}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            No material consumption logs
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Form Components
function StageStatusUpdateForm({ batchId, stageNumber, currentStatus, onUpdate }: {
  batchId: string;
  stageNumber: number;
  currentStatus: string;
  onUpdate: (batchId: string, stageNumber: number, newStatus: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'quality_hold' | 'failed' | 'skipped', reason: string) => void;
}) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!reason.trim()) {
      alert('Reason is required for status change');
      return;
    }
    
    if (!newStatus || newStatus === currentStatus) {
      alert('Please select a different status');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onUpdate(batchId, stageNumber, newStatus as any, reason);
      // Reset form after successful update
      setReason('');
      setNotes('');
      setNewStatus(currentStatus);
    } catch (error) {
      console.error('Error updating stage status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">New Status</Label>
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="not_started" className="bg-white hover:bg-gray-50">Not Started</SelectItem>
            <SelectItem value="in_progress" className="bg-white hover:bg-gray-50">In Progress</SelectItem>
            <SelectItem value="completed" className="bg-white hover:bg-gray-50">Completed</SelectItem>
            <SelectItem value="on_hold" className="bg-white hover:bg-gray-50">On Hold</SelectItem>
            <SelectItem value="quality_hold" className="bg-white hover:bg-gray-50">Quality Hold</SelectItem>
            <SelectItem value="failed" className="bg-white hover:bg-gray-50">Failed</SelectItem>
            <SelectItem value="skipped" className="bg-white hover:bg-gray-50">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reason">Reason *</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for status change"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes (optional)"
        />
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function MaterialOutputForm({ batchId, stageNumber, onAdd }: {
  batchId: string;
  stageNumber: number;
  onAdd: (batchId: string, stageNumber: number, outputData: any) => void;
}) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('finished_goods');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!itemName.trim()) {
      alert('Item name is required');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Valid quantity is required');
      return;
    }
    if (!unit) {
      alert('Unit is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(batchId, stageNumber, {
        itemName: itemName.trim(),
        category,
        quantity: parseFloat(quantity),
        unit,
        qualityGrade,
        notes: notes.trim()
      });
      
      // Reset form
      setItemName('');
      setQuantity('');
      setNotes('');
    } catch (error) {
      console.error('Error adding material output:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="itemName">Item Name *</Label>
        <Input
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Enter item name"
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="finished_goods" className="bg-white hover:bg-gray-50">Finished Goods</SelectItem>
            <SelectItem value="semi_finished" className="bg-white hover:bg-gray-50">Semi-Finished</SelectItem>
            <SelectItem value="by_product" className="bg-white hover:bg-gray-50">By-Product</SelectItem>
            <SelectItem value="waste" className="bg-white hover:bg-gray-50">Waste</SelectItem>
            <SelectItem value="scrap" className="bg-white hover:bg-gray-50">Scrap</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select value={unit} onValueChange={setUnit} disabled={isSubmitting}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="pieces" className="bg-white hover:bg-gray-50">Pieces</SelectItem>
              <SelectItem value="meters" className="bg-white hover:bg-gray-50">Meters</SelectItem>
              <SelectItem value="kg" className="bg-white hover:bg-gray-50">Kilograms</SelectItem>
              <SelectItem value="grams" className="bg-white hover:bg-gray-50">Grams</SelectItem>
              <SelectItem value="liters" className="bg-white hover:bg-gray-50">Liters</SelectItem>
              <SelectItem value="ml" className="bg-white hover:bg-gray-50">Milliliters</SelectItem>
              <SelectItem value="yards" className="bg-white hover:bg-gray-50">Yards</SelectItem>
              <SelectItem value="feet" className="bg-white hover:bg-gray-50">Feet</SelectItem>
              <SelectItem value="inches" className="bg-white hover:bg-gray-50">Inches</SelectItem>
              <SelectItem value="tons" className="bg-white hover:bg-gray-50">Tons</SelectItem>
              <SelectItem value="pounds" className="bg-white hover:bg-gray-50">Pounds</SelectItem>
              <SelectItem value="dozen" className="bg-white hover:bg-gray-50">Dozen</SelectItem>
              <SelectItem value="pairs" className="bg-white hover:bg-gray-50">Pairs</SelectItem>
              <SelectItem value="sets" className="bg-white hover:bg-gray-50">Sets</SelectItem>
              <SelectItem value="boxes" className="bg-white hover:bg-gray-50">Boxes</SelectItem>
              <SelectItem value="rolls" className="bg-white hover:bg-gray-50">Rolls</SelectItem>
              <SelectItem value="sheets" className="bg-white hover:bg-gray-50">Sheets</SelectItem>
              <SelectItem value="units" className="bg-white hover:bg-gray-50">Units</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="qualityGrade">Quality Grade</Label>
        <Select value={qualityGrade} onValueChange={setQualityGrade} disabled={isSubmitting}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select quality grade" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="A+" className="bg-white hover:bg-gray-50">A+ (Excellent)</SelectItem>
            <SelectItem value="A" className="bg-white hover:bg-gray-50">A (Very Good)</SelectItem>
            <SelectItem value="B+" className="bg-white hover:bg-gray-50">B+ (Good)</SelectItem>
            <SelectItem value="B" className="bg-white hover:bg-gray-50">B (Satisfactory)</SelectItem>
            <SelectItem value="C" className="bg-white hover:bg-gray-50">C (Below Standard)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes (optional)"
          disabled={isSubmitting}
          rows={3}
        />
      </div>
      
      <DialogFooter className="gap-2">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Adding...' : 'Add Material Output'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function QualityCheckForm({ batchId, stageNumber, onAdd }: {
  batchId: string;
  stageNumber: number;
  onAdd: (batchId: string, stageNumber: number, checkData: any) => void;
}) {
  const [checkType, setCheckType] = useState('');
  const [overallResult, setOverallResult] = useState('pass');
  const [grade, setGrade] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(batchId, stageNumber, {
      checkType,
      parameters: [],
      overallResult,
      grade,
      score: score ? parseFloat(score) : undefined,
      notes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="checkType">Check Type *</Label>
        <Input
          id="checkType"
          value={checkType}
          onChange={(e) => setCheckType(e.target.value)}
          placeholder="e.g., Visual Inspection, Color Matching"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="overallResult">Overall Result *</Label>
        <Select value={overallResult} onValueChange={setOverallResult}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="pass" className="bg-white hover:bg-gray-50">Pass</SelectItem>
            <SelectItem value="fail" className="bg-white hover:bg-gray-50">Fail</SelectItem>
            <SelectItem value="conditional" className="bg-white hover:bg-gray-50">Conditional</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grade">Quality Grade</Label>
          <Input
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="e.g., A+, A, B"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="score">Quality Score</Label>
          <Input
            id="score"
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="0-100"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about the quality check"
        />
      </div>
      
      <DialogFooter>
        <Button type="submit">Add Quality Check</Button>
      </DialogFooter>
    </form>
  );
}

// Working Inventory Transfer Form Component
function WorkingInventoryTransferForm({
  batchId,
  onTransfer
}: {
  batchId: string;
  onTransfer: (batchId: string, materialInputs: any[]) => void;
}) {
  const [materialInputs, setMaterialInputs] = useState([
    { itemId: '', quantity: 0, unit: 'meters' }
  ]);

  const handleAddMaterial = () => {
    setMaterialInputs([...materialInputs, { itemId: '', quantity: 0, unit: 'meters' }]);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterialInputs(materialInputs.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updated = materialInputs.map((material, i) =>
      i === index ? { ...material, [field]: value } : material
    );
    setMaterialInputs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMaterials = materialInputs.filter(m => m.itemId && m.quantity > 0);
    if (validMaterials.length > 0) {
      onTransfer(batchId, validMaterials);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {materialInputs.map((material, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <Label htmlFor={`itemId-${index}`}>Item ID</Label>
              <Input
                id={`itemId-${index}`}
                value={material.itemId}
                onChange={(e) => handleMaterialChange(index, 'itemId', e.target.value)}
                placeholder="Enter item ID"
                required
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`quantity-${index}`}>Quantity</Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                min="0"
                step="0.01"
                value={material.quantity}
                onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`unit-${index}`}>Unit</Label>
              <Select
                value={material.unit}
                onValueChange={(value) => handleMaterialChange(index, 'unit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="meters" className="bg-white hover:bg-gray-50">Meters</SelectItem>
                  <SelectItem value="kg" className="bg-white hover:bg-gray-50">Kilograms</SelectItem>
                  <SelectItem value="pieces" className="bg-white hover:bg-gray-50">Pieces</SelectItem>
                  <SelectItem value="liters" className="bg-white hover:bg-gray-50">Liters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              {materialInputs.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMaterial(index)}
                  className="h-10 w-10 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAddMaterial}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Material
      </Button>

      <DialogFooter>
        <Button type="submit">Transfer to Working Inventory</Button>
      </DialogFooter>
    </form>
  );
}

export default function BatchesPage() {
  return (
    <AppLayout>
      <BatchesPageContent />
    </AppLayout>
  );
}
