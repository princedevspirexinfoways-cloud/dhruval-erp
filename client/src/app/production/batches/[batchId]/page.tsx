'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import {
  useGetBatchByIdQuery,
  useUpdateStageStatusMutation,
  useAddMaterialOutputMutation,
  useAddQualityCheckMutation,
  usePassQualityGateMutation,
  useFailQualityGateMutation,
  useConsumeMaterialMutation,
  useAddCostMutation,
  useDeleteBatchMutation
} from '@/lib/api/productionBatches';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Download,
  Printer,
  Eye,
  Activity,
  BarChart3,
  TrendingUp,
  FileText,
  Settings,
  Wrench,
  User,
  Zap,
  Target,
  Users,
  DollarSign,
  Package2,
  SkipForward,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle as XCircle2,
  AlertTriangle,
  Timer,
  Gauge,
  Layers,
  ClipboardList,
  TrendingDown,
  Factory,
  Workflow,
  Database,
  Shield,
  Star,
  Award,
  Flame,
  Sparkles,
  Rocket,
  Crown,
  Gem,
  Heart,
  ThumbsUp,
  MessageSquare,
  Bell,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronRight,
  ChevronDown,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Share2,
  Bookmark,
  Flag,
  MapPin,
  Globe,
  Wifi,
  Battery,
  Signal,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Video,
  Image,
  File,
  Folder,
  Archive,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  AlertOctagon,
  CheckSquare,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  MessageSquare as MessageSquareIcon,
  Bell as BellIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  SortAsc as SortAscIcon,
  SortDesc as SortDescIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon,
  Share2 as Share2Icon,
  Bookmark as BookmarkIcon,
  Flag as FlagIcon,
  MapPin as MapPinIcon,
  Globe as GlobeIcon,
  Wifi as WifiIcon,
  Battery as BatteryIcon,
  Signal as SignalIcon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Camera as CameraIcon,
  Video as VideoIcon,
  Image as ImageIcon,
  File as FileIcon,
  Folder as FolderIcon,
  Archive as ArchiveIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Key as KeyIcon,
  ShieldCheck as ShieldCheckIcon,
  AlertOctagon as AlertOctagonIcon,
  CheckSquare as CheckSquareIcon,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Hexagon as HexagonIcon,
  Octagon as OctagonIcon,
  Diamond as DiamondIcon,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Save,
  X,
  Building,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.isSuperAdmin || false;

  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: batch,
    isLoading: loading,
    error,
    refetch
  } = useGetBatchByIdQuery(batchId, {
    skip: !batchId
  });

  // Debug logging (remove in production)
  // console.log('Batch data:', batch);
  // console.log('Loading:', loading);
  // console.log('Error:', error);

  const [updateStageStatus] = useUpdateStageStatusMutation();
  const [addMaterialOutput] = useAddMaterialOutputMutation();
  const [addQualityCheck] = useAddQualityCheckMutation();
  const [passQualityGate] = usePassQualityGateMutation();
  const [failQualityGate] = useFailQualityGateMutation();
  const [consumeMaterial] = useConsumeMaterialMutation();
  const [addCost] = useAddCostMutation();
  const [deleteBatch] = useDeleteBatchMutation();

  // useEffect(() => {
  //   if (!user) {
  //     router.push('/auth/login');
  //     return;
  //   }
  // }, [user, router]);

  const handleDeleteBatch = async () => {
    if (!batch) return;

    try {
      await deleteBatch(batch._id).unwrap();
      router.push('/production/batches');
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const handleExportBatch = (batch: any) => {
    // Create a downloadable JSON file
    const dataStr = JSON.stringify(batch, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

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

  const handleShareBatch = (batch: any) => {
    if (navigator.share) {
      navigator.share({
        title: `Batch ${batch.batchNumber}`,
        text: `Production batch ${batch.batchNumber} - ${batch.productSpecifications?.productType}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
      console.log('URL copied to clipboard');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading batch details...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Batch</h2>
            <p className="text-gray-600 mb-4">There was an error loading the batch details.</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => router.push('/production/batches')} variant="outline" className="ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Batches
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!batch) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Batch Not Found</h2>
            <p className="text-gray-600 mb-4">The batch you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/production/batches')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Batches
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      'pending': Clock,
      'in_progress': Play,
      'on_hold': Pause,
      'completed': CheckCircle,
      'cancelled': XCircle,
      'quality_hold': AlertCircle,
      'failed': XCircle2,
      'skipped': SkipForward
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'on_hold': 'text-orange-600 bg-orange-100',
      'completed': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100',
      'quality_hold': 'text-purple-600 bg-purple-100',
      'failed': 'text-red-600 bg-red-100',
      'skipped': 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityIcon = (priority: string) => {
    const icons: { [key: string]: any } = {
      'low': ArrowDown,
      'medium': ArrowRight,
      'high': ArrowUp,
      'urgent': Flame,
      'critical': AlertTriangle
    };
    return icons[priority] || ArrowRight;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': 'text-green-600 bg-green-100',
      'medium': 'text-blue-600 bg-blue-100',
      'high': 'text-orange-600 bg-orange-100',
      'urgent': 'text-red-600 bg-red-100',
      'critical': 'text-red-800 bg-red-200'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  const StatusIcon = getStatusIcon(batch?.status || 'pending');

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/production/batches')}
                  className="flex items-center space-x-2 hover:bg-white/50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Batches</span>
                </Button>
                <div className="hidden sm:block w-px h-8 bg-gray-300" />

                {/* Batch Info with Enhanced Icons */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Factory className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-bold text-gray-900">
                        {batch.batchNumber || 'Unknown Batch'}
                      </h1>
                      <Badge className={`${getStatusColor(batch.status || 'pending')} font-medium`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {batch.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Package className="w-4 h-4" />
                        <span>{batch.productSpecifications?.productType || 'Unknown Product'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{batch.plannedQuantity || 0} {batch.unit || 'units'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Gauge className="w-4 h-4" />
                        <span>{batch.progress || 0}% Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                {/* Export Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportBatch(batch)}
                  className="flex items-center space-x-2 hover:bg-green-50 hover:border-green-300 transition-colors"
                  title="Export Batch Data"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>

                {/* Print Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintBatch(batch)}
                  className="flex items-center space-x-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  title="Print Batch Report"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </Button>

                {/* Share Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareBatch(batch)}
                  className="flex items-center space-x-2 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  title="Share Batch"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>

                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteBatch}
                  className="flex items-center space-x-2 hover:bg-red-600 transition-colors"
                  title="Delete Batch"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Enhanced Status Bar */}
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                {/* Status */}
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <StatusIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <Badge className={`${getStatusColor(batch.status || 'pending')} font-medium ml-2`}>
                      {batch.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {React.createElement(getPriorityIcon(batch.priority || 'medium'), { className: "w-5 h-5 text-gray-600" })}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Priority</span>
                    <Badge className={`${getPriorityColor(batch.priority || 'medium')} font-medium ml-2`}>
                      {batch.priority?.toUpperCase() || 'MEDIUM'}
                    </Badge>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Gauge className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="min-w-[120px]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-600">Progress</span>
                      <span className="font-bold text-gray-900">{batch.progress || 0}%</span>
                    </div>
                    <Progress value={batch.progress || 0} className="w-full h-2 mt-1" />
                  </div>
                </div>

                {/* Company (Super Admin) */}
                {isSuperAdmin && batch.companyId && (
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Building className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Company</span>
                      <Badge variant="outline" className="ml-2">
                        {(batch.companyId as any).companyName || 'Unknown Company'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Progress</div>
                  <div className="flex items-center space-x-2">
                    <Progress value={batch.progress || 0} className="w-20" />
                    <span className="text-sm text-gray-500">{batch.progress || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stages">Stages</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Batch Number</Label>
                        <p className="text-sm font-semibold">{batch.batchNumber || 'Unknown'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <div className="mt-1">
                          <Badge className="bg-blue-100 text-blue-800">
                            {batch.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Current Stage</Label>
                        <p className="text-sm font-semibold">Stage {batch.currentStage || 0}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Priority</Label>
                        <div className="mt-1">
                          <Badge className="bg-green-100 text-green-800">
                            {batch.priority?.toUpperCase() || 'UNKNOWN'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium text-gray-500">Product Specifications</Label>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm"><span className="font-medium">Type:</span> {batch.productSpecifications?.productType || 'Unknown'}</p>
                        <p className="text-sm"><span className="font-medium">Fabric:</span> {batch.productSpecifications?.fabricType || 'Unknown'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Production Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Production Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Planned Quantity</Label>
                        <p className="text-2xl font-bold">{batch.plannedQuantity || 0} {batch.unit || 'units'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Progress</Label>
                        <div className="mt-1">
                          <Progress value={batch.progress || 0} className="w-full" />
                          <p className="text-sm text-gray-500 mt-1">{batch.progress || 0}% Complete</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Total Cost</Label>
                        <p className="text-xl font-semibold">₹{(batch.totalCost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Cost per Unit</Label>
                        <p className="text-xl font-semibold">₹{(batch.costPerUnit || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Production Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Planned Start</p>
                      <p className="text-lg font-semibold text-blue-800">
                        {batch.plannedStartDate ? new Date(batch.plannedStartDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">Planned End</p>
                      <p className="text-lg font-semibold text-green-800">
                        {batch.plannedEndDate ? new Date(batch.plannedEndDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-900">Duration</p>
                      <p className="text-lg font-semibold text-purple-800">
                        {batch.totalPlannedDuration ? Math.round(batch.totalPlannedDuration / 1440) : 0} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stages Tab */}
            <TabsContent value="stages" className="space-y-6">
              <div className="space-y-4">
                {batch.stages?.map((stage, index) => (
                  <StageManagementCard
                    key={stage.stageNumber}
                    stage={stage}
                    batchId={batch._id}
                    onUpdateStageStatus={updateStageStatus}
                    onAddMaterialOutput={addMaterialOutput}
                    onAddQualityCheck={addQualityCheck}
                    onPassQualityGate={passQualityGate}
                    onFailQualityGate={failQualityGate}
                    onConsumeMaterial={consumeMaterial}
                    onAddCost={addCost}
                    onRefetch={refetch}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Material Inputs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Material Inputs</span>
                      <Badge variant="outline" className="ml-auto">
                        {(batch as any).inputMaterials?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(batch as any).inputMaterials && (batch as any).inputMaterials.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {(batch as any).inputMaterials.map((input: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3 bg-blue-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {input.category?.primary || 'Raw Material'}
                                  </Badge>
                                  <span className="text-sm font-medium text-gray-900">
                                    {input.inventoryItemId?.itemName || input.itemName || 'Unknown Item'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Quantity:</span> {input.quantity} {input.unit}
                                </p>
                                <p className="text-xs text-gray-600 mb-2">
                                  <span className="font-medium">Description:</span> {input.inventoryItemId?.description || input.description || 'No description'}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>
                                    <Package className="w-3 h-3 inline mr-1" />
                                    {input.inventoryItemId?.itemCode || input.itemCode || 'N/A'}
                                  </span>
                                  <span>
                                    <DollarSign className="w-3 h-3 inline mr-1" />
                                    ₹{input.costPerUnit?.toFixed(2) || '0.00'}/unit
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No material inputs recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Material Outputs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Material Outputs</span>
                      <Badge variant="outline" className="ml-auto">
                        {batch.stages?.reduce((total: number, stage: any) => total + (stage.outputMaterials?.length || 0), 0) || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {batch.stages && batch.stages.some((stage: any) => stage.outputMaterials && stage.outputMaterials.length > 0) ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {batch.stages.map((stage: any) =>
                          stage.outputMaterials && stage.outputMaterials.map((output: any, index: number) => (
                            <div key={`${stage.stageNumber}-${index}`} className="border rounded-lg p-3 bg-green-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      Stage {stage.stageNumber}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {output.category?.primary || 'Output'}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-900">
                                      {output.itemName || 'Unknown Item'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">Quantity:</span> {output.quantity} {output.unit}
                                  </p>
                                  <p className="text-xs text-gray-600 mb-1">
                                    <span className="font-medium">Quality:</span> {output.qualityGrade || 'N/A'}
                                    {output.notes && (
                                      <span className="ml-2">
                                        <span className="font-medium">Notes:</span> {output.notes}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-blue-600 mb-2">
                                    <span className="font-medium">Batch:</span> {output.productionInfo?.batchNumber || batch.batchNumber || 'N/A'}
                                    <span className="ml-2">
                                      <span className="font-medium">Stage:</span> {output.productionInfo?.stageNumber || stage.stageNumber}
                                    </span>
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {output.productionDate ? new Date(output.productionDate).toLocaleString() : 'N/A'}
                                    </span>
                                    <span>
                                      <User className="w-3 h-3 inline mr-1" />
                                      {output.producedBy || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No material outputs recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Output Materials Tab */}
            <TabsContent value="outputs" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Output Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Production Output Summary</span>
                      <Badge variant="outline" className="ml-auto">
                        {batch.stages?.reduce((total: number, stage: any) => total + (stage.outputMaterials?.length || 0), 0) || 0} Items
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-blue-900">Total Outputs</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {batch.stages?.reduce((total: number, stage: any) => total + (stage.outputMaterials?.length || 0), 0) || 0}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-900">Completed Stages</p>
                        <p className="text-2xl font-bold text-green-800">
                          {batch.stages?.filter((stage: any) => stage.status === 'completed').length || 0}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-yellow-900">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-800">
                          {batch.stages?.filter((stage: any) => stage.status === 'in_progress').length || 0}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-purple-900">Progress</p>
                        <p className="text-2xl font-bold text-purple-800">
                          {batch.stages && batch.stages.length > 0
                            ? Math.round((batch.stages.filter((stage: any) => stage.status === 'completed').length / batch.stages.length) * 100)
                            : batch.progress || 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Output Materials by Stage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Output Materials by Stage</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {batch.stages && batch.stages.some((stage: any) => stage.outputMaterials && stage.outputMaterials.length > 0) ? (
                      <div className="space-y-4">
                        {batch.stages.map((stage: any) =>
                          stage.outputMaterials && stage.outputMaterials.length > 0 && (
                            <div key={stage.stageNumber} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-sm">
                                    Stage {stage.stageNumber}
                                  </Badge>
                                  <span className="font-medium text-gray-900">{stage.stageName}</span>
                                  <Badge
                                    variant={stage.status === 'completed' ? 'default' : stage.status === 'in_progress' ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                                    {stage.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {stage.outputMaterials.length} output{stage.outputMaterials.length !== 1 ? 's' : ''}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {stage.outputMaterials.map((output: any, index: number) => (
                                  <div key={index} className="bg-white border rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 text-sm">{output.itemName || 'Unknown Item'}</h4>
                                        <p className="text-xs text-gray-600">
                                          {output.quantity} {output.unit}
                                        </p>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {output.category?.primary || 'Output'}
                                      </Badge>
                                    </div>

                                    <div className="space-y-1 text-xs text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Quality:</span>
                                        <span className="font-medium">{output.qualityGrade || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Batch:</span>
                                        <span className="font-medium">{output.productionInfo?.batchNumber || batch.batchNumber || 'N/A'}</span>
                                      </div>
                                      {output.productionDate && (
                                        <div className="flex justify-between">
                                          <span>Date:</span>
                                          <span className="font-medium">
                                            {new Date(output.productionDate).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {output.notes && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                        <span className="font-medium">Notes:</span> {output.notes}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No output materials recorded yet</p>
                        <p className="text-sm">Add material outputs in the Stages tab to see them here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Quality Tab */}
            <TabsContent value="quality" className="space-y-6">
              {/* Quality Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Quality Control Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">Total Quality Checks</p>
                      <p className="text-lg font-semibold text-green-800">
                        {batch.stages?.reduce((total: number, stage: any) =>
                          total + (stage.qualityChecks?.length || 0), 0) || 0}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Passed Checks</p>
                      <p className="text-lg font-semibold text-blue-800">
                        {batch.stages?.reduce((total: number, stage: any) =>
                          total + (stage.qualityChecks?.filter((check: any) => check.overallResult === 'pass').length || 0), 0) || 0}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-orange-900">Failed Checks</p>
                      <p className="text-lg font-semibold text-orange-800">
                        {batch.stages?.reduce((total: number, stage: any) =>
                          total + (stage.qualityChecks?.filter((check: any) => check.overallResult === 'fail').length || 0), 0) || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Checks by Stage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClipboardList className="w-5 h-5" />
                    <span>Quality Checks by Stage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {batch.stages && batch.stages.length > 0 ? (
                    <div className="space-y-4">
                      {batch.stages.map((stage: any, stageIndex: number) => (
                        <div key={stageIndex} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg">
                              Stage {stage.stageNumber}: {stage.stageName}
                            </h4>
                            <Badge variant={stage.qualityGate?.passed ? "default" : "secondary"}>
                              {stage.qualityGate?.passed ? "Passed" : "Pending"}
                            </Badge>
                          </div>

                          {stage.qualityChecks && stage.qualityChecks.length > 0 ? (
                            <div className="space-y-3">
                              {stage.qualityChecks.map((check: any, checkIndex: number) => (
                                <div key={checkIndex} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        variant={check.overallResult === 'pass' ? 'default' :
                                          check.overallResult === 'fail' ? 'destructive' : 'secondary'}
                                      >
                                        {check.overallResult?.toUpperCase()}
                                      </Badge>
                                      <span className="font-medium">{check.checkType}</span>
                                      {check.grade && (
                                        <Badge variant="outline">Grade: {check.grade}</Badge>
                                      )}
                                      {check.score && (
                                        <Badge variant="outline">Score: {check.score}/100</Badge>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      {new Date(check.checkDate).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {check.parameters && check.parameters.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium text-gray-700 mb-1">Parameters:</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {check.parameters.map((param: any, paramIndex: number) => (
                                          <div key={paramIndex} className="text-sm">
                                            <span className="font-medium">{param.name}:</span> {param.actualValue}
                                            {param.unit && <span className="text-gray-500"> {param.unit}</span>}
                                            <Badge
                                              variant={param.status === 'pass' ? 'default' : 'destructive'}
                                              className="ml-2 text-xs"
                                            >
                                              {param.status}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {check.notes && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      <span className="font-medium">Notes:</span> {check.notes}
                                    </p>
                                  )}

                                  {check.defects && check.defects.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium text-red-700">Defects:</p>
                                      <ul className="text-sm text-red-600 list-disc list-inside">
                                        {check.defects.map((defect: string, defectIndex: number) => (
                                          <li key={defectIndex}>{defect}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {check.correctiveActions && check.correctiveActions.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium text-blue-700">Corrective Actions:</p>
                                      <ul className="text-sm text-blue-600 list-disc list-inside">
                                        {check.correctiveActions.map((action: string, actionIndex: number) => (
                                          <li key={actionIndex}>{action}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No quality checks performed for this stage</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No stages available</p>
                      <p className="text-sm">Quality checks will appear here once stages are created</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Costs Tab */}
            <TabsContent value="costs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Cost Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">Total Cost</p>
                      <p className="text-2xl font-bold text-green-800">₹{(batch.totalCost || 0).toFixed(2)}</p>
                    </div>

                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Cost per Unit</p>
                      <p className="text-2xl font-bold text-blue-800">₹{(batch.costPerUnit || 0).toFixed(2)}</p>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-900">Budget Variance</p>
                      <p className="text-2xl font-bold text-purple-800">+5.2%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Change Logs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Status Changes</span>
                      <Badge variant="outline" className="ml-auto">
                        {batch.statusChangeLogs?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {batch.statusChangeLogs && batch.statusChangeLogs.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {[...(batch.statusChangeLogs || [])]
                          .sort((a: any, b: any) => new Date(b.changedDate).getTime() - new Date(a.changedDate).getTime())
                          .map((log: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {log.changeType?.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-900">
                                      {log.entityType?.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">From:</span> {log.previousStatus || 'N/A'}
                                    <span className="mx-2">→</span>
                                    <span className="font-medium">To:</span> {log.newStatus}
                                  </p>
                                  <p className="text-xs text-gray-600 mb-2">
                                    {log.changeReason}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {log.changedDate ? new Date(log.changedDate).toLocaleString() : 'Invalid Date'}
                                    </span>
                                    <span>
                                      <User className="w-3 h-3 inline mr-1" />
                                      {log.changedBy || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No status changes recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Material Consumption Logs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Material Consumption</span>
                      <Badge variant="outline" className="ml-auto">
                        {batch.materialConsumptionLogs?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {batch.materialConsumptionLogs && batch.materialConsumptionLogs.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {[...(batch.materialConsumptionLogs || [])]
                          .sort((a: any, b: any) => new Date(b.consumptionDate).getTime() - new Date(a.consumptionDate).getTime())
                          .map((log: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      Stage {log.stageNumber}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-900">
                                      {log.stageName}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">Material:</span> {log.materialName}
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                                    <div>
                                      <span className="font-medium">Allocated:</span> {log.allocatedQuantity} {log.unit}
                                    </div>
                                    <div>
                                      <span className="font-medium">Consumed:</span> {log.consumedQuantity} {log.unit}
                                    </div>
                                    <div>
                                      <span className="font-medium">Waste:</span> {log.wasteQuantity} {log.unit}
                                    </div>
                                    <div>
                                      <span className="font-medium">Cost:</span> ₹{log.totalCost?.toFixed(2) || '0.00'}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {log.consumptionDate ? new Date(log.consumptionDate).toLocaleString() : 'Invalid Date'}
                                    </span>
                                    <span>
                                      <User className="w-3 h-3 inline mr-1" />
                                      {log.consumedBy || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No material consumption recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

// Stage Management Card Component
function StageManagementCard({
  stage,
  batchId,
  onUpdateStageStatus,
  onAddMaterialOutput,
  onAddQualityCheck,
  onPassQualityGate,
  onFailQualityGate,
  onConsumeMaterial,
  onAddCost,
  onRefetch
}: {
  stage: any;
  batchId: string;
  onUpdateStageStatus: any;
  onAddMaterialOutput: any;
  onAddQualityCheck: any;
  onPassQualityGate: any;
  onFailQualityGate: any;
  onConsumeMaterial: any;
  onAddCost: any;
  onRefetch: any;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [showQualityDialog, setShowQualityDialog] = useState(false);
  const [showCostDialog, setShowCostDialog] = useState(false);

  const getStageIcon = (stageType: string) => {
    const icons: { [key: string]: any } = {
      'pre_processing': Wrench,
      'dyeing': Zap,
      'printing': Printer,
      'washing': RefreshCw,
      'fixing': Target,
      'finishing': Settings,
      'quality_control': CheckCircle,
      'cutting_packing': Package2
    };
    return icons[stageType] || Package;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'not_started': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'on_hold': 'bg-orange-100 text-orange-800',
      'quality_hold': 'bg-purple-100 text-purple-800',
      'failed': 'bg-red-100 text-red-800',
      'skipped': 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      'not_started': Clock,
      'in_progress': PlayCircle,
      'completed': CheckCircle2,
      'on_hold': PauseCircle,
      'quality_hold': AlertTriangle,
      'failed': XCircle2,
      'skipped': SkipForward
    };
    return icons[status] || Clock;
  };

  const StageIcon = getStageIcon(stage.stageType);
  const StatusIcon = getStatusIcon(stage.status);

  const handleStatusUpdate = async (newStatus: string, reason: string) => {
    try {
      await onUpdateStageStatus({
        batchId,
        stageNumber: stage.stageNumber,
        data: { newStatus, reason }
      }).unwrap();
      onRefetch();
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating stage status:', error);
    }
  };

  const handleQualityGatePass = async (notes?: string) => {
    try {
      await onPassQualityGate({
        batchId,
        stageNumber: stage.stageNumber,
        notes
      }).unwrap();
      onRefetch();
    } catch (error) {
      console.error('Error passing quality gate:', error);
    }
  };

  const handleQualityGateFail = async (rejectionReason: string) => {
    try {
      await onFailQualityGate({
        batchId,
        stageNumber: stage.stageNumber,
        rejectionReason
      }).unwrap();
      onRefetch();
    } catch (error) {
      console.error('Error failing quality gate:', error);
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <StageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{stage.stageName}</CardTitle>
              <p className="text-sm text-gray-500">Stage {stage.stageNumber} • {stage.stageType.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(stage.status)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {stage.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ArrowLeftIcon className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{stage.progress}%</span>
          </div>
          <Progress value={stage.progress} className="w-full" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Stage Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Timeline</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div>Planned Start: {stage.plannedStartTime ? new Date(stage.plannedStartTime).toLocaleString() : 'Not set'}</div>
                <div>Actual Start: {stage.actualStartTime ? new Date(stage.actualStartTime).toLocaleString() : 'Not started'}</div>
                <div>Planned End: {stage.plannedEndTime ? new Date(stage.plannedEndTime).toLocaleString() : 'Not set'}</div>
                <div>Actual End: {stage.actualEndTime ? new Date(stage.actualEndTime).toLocaleString() : 'Not completed'}</div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Quality Gate</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Status:</span>
                  {stage.qualityGate.passed ? (
                    <Badge className="bg-green-100 text-green-800">Passed</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Not Passed</Badge>
                  )}
                </div>
                {stage.qualityGate.passedBy && (
                  <div className="text-sm text-gray-600">Passed by: {stage.qualityGate.passedBy}</div>
                )}
                {stage.qualityGate.passedDate && (
                  <div className="text-sm text-gray-600">Date: {new Date(stage.qualityGate.passedDate).toLocaleString()}</div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Costs</Label>
              <div className="mt-2">
                <div className="text-sm font-semibold">₹{stage.totalStageCost || 0}</div>
                <div className="text-xs text-gray-500">{stage.stageCosts?.length || 0} cost entries</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStatusDialog(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Update Status
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMaterialDialog(true)}
            >
              <Package className="w-4 h-4 mr-2" />
              Manage Materials
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQualityDialog(true)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Quality Control
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCostDialog(true)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Add Cost
            </Button>
          </div>

          {/* Material Inputs/Outputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2 block">Input Materials</Label>
              <div className="space-y-2">
                {stage.inputMaterials?.length > 0 ? (
                  stage.inputMaterials.map((material: any, index: number) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{material.itemName}</div>
                      <div className="text-gray-500">
                        {material.quantity} {material.unit} • ₹{material.totalCost}
                      </div>
                      <div className="text-xs text-gray-400">
                        Status: {material.status} • Consumed: {material.actualConsumption || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No input materials</div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2 block">Output Materials</Label>
              <div className="space-y-2">
                {stage.outputMaterials?.length > 0 ? (
                  stage.outputMaterials.map((output: any, index: number) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{output.itemName}</div>
                      <div className="text-gray-500">
                        {output.quantity} {output.unit} • Grade: {output.qualityGrade || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Category: {output.category} • Status: {output.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No output materials</div>
                )}
              </div>
            </div>
          </div>

          {/* Quality Checks */}
          {stage.qualityChecks?.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2 block">Quality Checks</Label>
              <div className="space-y-2">
                {stage.qualityChecks.map((check: any, index: number) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{check.checkType}</div>
                        <div className="text-gray-500">Result: {check.overallResult}</div>
                        {check.grade && <div className="text-gray-500">Grade: {check.grade}</div>}
                      </div>
                      <Badge className={check.overallResult === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {check.overallResult.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stage Status</DialogTitle>
          </DialogHeader>
          <StageStatusUpdateForm
            currentStatus={stage.status}
            onUpdate={handleStatusUpdate}
          />
        </DialogContent>
      </Dialog>

      {/* Material Management Dialog */}
      <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Material Management</DialogTitle>
          </DialogHeader>
          <MaterialManagementForm
            stage={stage}
            batchId={batchId}
            onAddMaterialOutput={onAddMaterialOutput}
            onConsumeMaterial={onConsumeMaterial}
            onRefetch={onRefetch}
          />
        </DialogContent>
      </Dialog>

      {/* Quality Control Dialog */}
      <Dialog open={showQualityDialog} onOpenChange={setShowQualityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quality Control</DialogTitle>
          </DialogHeader>
          <QualityControlForm
            stage={stage}
            batchId={batchId}
            onAddQualityCheck={onAddQualityCheck}
            onPassQualityGate={handleQualityGatePass}
            onFailQualityGate={handleQualityGateFail}
            onRefetch={onRefetch}
            onClose={() => setShowQualityDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Cost Management Dialog */}
      <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost</DialogTitle>
          </DialogHeader>
          <CostManagementForm
            stage={stage}
            batchId={batchId}
            onAddCost={onAddCost}
            onRefetch={onRefetch}
            onClose={() => setShowCostDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Stage Status Update Form
function StageStatusUpdateForm({ currentStatus, onUpdate }: { currentStatus: string; onUpdate: (status: string, reason: string) => void }) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason.trim() || 'Status updated without specific reason';
    onUpdate(newStatus, finalReason);
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
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for status change (optional)"
        />
      </div>

      <DialogFooter>
        <Button type="submit">Update Status</Button>
      </DialogFooter>
    </form>
  );
}

// Material Management Form
function MaterialManagementForm({ stage, batchId, onAddMaterialOutput, onConsumeMaterial, onRefetch }: any) {
  const [activeTab, setActiveTab] = useState('output');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="output">Add Output</TabsTrigger>
          <TabsTrigger value="consume">Consume Material</TabsTrigger>
        </TabsList>

        <TabsContent value="output">
          <MaterialOutputForm
            stage={stage}
            batchId={batchId}
            onAdd={onAddMaterialOutput}
            onRefetch={onRefetch}
          />
        </TabsContent>

        <TabsContent value="consume">
          <MaterialConsumptionForm
            stage={stage}
            batchId={batchId}
            onConsume={onConsumeMaterial}
            onRefetch={onRefetch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Material Output Form
function MaterialOutputForm({ stage, batchId, onAdd, onRefetch }: any) {
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'finished_goods',
    quantity: '',
    unit: '',
    qualityGrade: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAdd({
        batchId,
        stageNumber: stage.stageNumber,
        data: {
          outputs: [{
            ...formData,
            quantity: parseFloat(formData.quantity),
            producedBy: 'Current User' // This should come from auth context
          }]
        }
      }).unwrap();
      onRefetch();
      setFormData({
        itemName: '',
        category: 'finished_goods',
        quantity: '',
        unit: '',
        qualityGrade: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding material output:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemName">Item Name *</Label>
          <Input
            id="itemName"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qualityGrade">Quality Grade</Label>
        <Input
          id="qualityGrade"
          value={formData.qualityGrade}
          onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Add Material Output
      </Button>
    </form>
  );
}

// Material Consumption Form
function MaterialConsumptionForm({ stage, batchId, onConsume, onRefetch }: any) {
  const [formData, setFormData] = useState({
    materialId: '',
    consumedQuantity: '',
    wasteQuantity: '',
    returnedQuantity: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onConsume({
        batchId,
        stageNumber: stage.stageNumber,
        data: {
          materials: [{
            materialId: formData.materialId,
            consumedQuantity: parseFloat(formData.consumedQuantity),
            wasteQuantity: parseFloat(formData.wasteQuantity) || 0,
            returnedQuantity: parseFloat(formData.returnedQuantity) || 0,
            notes: formData.notes
          }]
        }
      }).unwrap();
      onRefetch();
      setFormData({
        materialId: '',
        consumedQuantity: '',
        wasteQuantity: '',
        returnedQuantity: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error consuming material:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="materialId">Material ID *</Label>
        <Input
          id="materialId"
          value={formData.materialId}
          onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="consumedQuantity">Consumed *</Label>
          <Input
            id="consumedQuantity"
            type="number"
            value={formData.consumedQuantity}
            onChange={(e) => setFormData({ ...formData, consumedQuantity: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wasteQuantity">Waste</Label>
          <Input
            id="wasteQuantity"
            type="number"
            value={formData.wasteQuantity}
            onChange={(e) => setFormData({ ...formData, wasteQuantity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="returnedQuantity">Returned</Label>
          <Input
            id="returnedQuantity"
            type="number"
            value={formData.returnedQuantity}
            onChange={(e) => setFormData({ ...formData, returnedQuantity: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Record Consumption
      </Button>
    </form>
  );
}

// Quality Control Form
function QualityControlForm({ stage, batchId, onAddQualityCheck, onPassQualityGate, onFailQualityGate, onRefetch, onClose }: any) {
  const [activeTab, setActiveTab] = useState('check');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="check">Add Check</TabsTrigger>
          <TabsTrigger value="pass">Pass Gate</TabsTrigger>
          <TabsTrigger value="fail">Fail Gate</TabsTrigger>
        </TabsList>

        <TabsContent value="check">
          <QualityCheckForm
            stage={stage}
            batchId={batchId}
            onAdd={onAddQualityCheck}
            onRefetch={onRefetch}
            onClose={onClose}
          />
        </TabsContent>

        <TabsContent value="pass">
          <QualityGatePassForm
            stage={stage}
            onPass={onPassQualityGate}
            onClose={onClose}
          />
        </TabsContent>

        <TabsContent value="fail">
          <QualityGateFailForm
            stage={stage}
            onFail={onFailQualityGate}
            onClose={onClose}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Quality Check Form
function QualityCheckForm({ stage, batchId, onAdd, onRefetch, onClose }: any) {
  const [formData, setFormData] = useState({
    checkType: '',
    overallResult: 'pass',
    grade: '',
    score: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        batchId,
        stageNumber: stage.stageNumber,
        data: {
          checkType: formData.checkType,
          parameters: [],
          overallResult: formData.overallResult,
          grade: formData.grade,
          score: formData.score ? parseFloat(formData.score) : undefined,
          notes: formData.notes
        }
      }).unwrap();

      // Show success notification
      console.log('✅ Quality check added successfully!');

      onRefetch();
      setFormData({
        checkType: '',
        overallResult: 'pass',
        grade: '',
        score: '',
        notes: ''
      });

      // Close dialog if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error adding quality check:', error);
      console.error('❌ Failed to add quality check. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="checkType">Check Type *</Label>
        <Input
          id="checkType"
          value={formData.checkType}
          onChange={(e) => setFormData({ ...formData, checkType: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="overallResult">Overall Result *</Label>
        <Select value={formData.overallResult} onValueChange={(value) => setFormData({ ...formData, overallResult: value })}>
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
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="score">Quality Score (0-100)</Label>
          <Input
            id="score"
            type="number"
            min="0"
            max="100"
            value={formData.score}
            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <Save className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Adding...' : 'Add Quality Check'}
      </Button>
    </form>
  );
}

// Quality Gate Pass Form
function QualityGatePassForm({ stage, onPass, onClose }: any) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onPass(notes);

      // Show success notification
      console.log('✅ Quality gate passed successfully!');

      // Close dialog if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error passing quality gate:', error);
      console.error('❌ Failed to pass quality gate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium text-green-800">Pass Quality Gate</span>
        </div>
        <p className="text-sm text-green-700 mt-1">
          This will mark the quality gate as passed for {stage.stageName}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the quality gate approval"
        />
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
        <CheckCircle className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Passing...' : 'Pass Quality Gate'}
      </Button>
    </form>
  );
}

// Quality Gate Fail Form
function QualityGateFailForm({ stage, onFail, onClose }: any) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onFail(rejectionReason);

      // Show success notification
      console.log('✅ Quality gate failed successfully!');

      // Close dialog if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error failing quality gate:', error);
      console.error('❌ Failed to fail quality gate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <span className="font-medium text-red-800">Fail Quality Gate</span>
        </div>
        <p className="text-sm text-red-700 mt-1">
          This will mark the quality gate as failed for {stage.stageName}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rejectionReason">Rejection Reason *</Label>
        <Input
          id="rejectionReason"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Explain why the quality gate failed"
          required
        />
      </div>

      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting || !rejectionReason.trim()}>
        <XCircle className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Failing...' : 'Fail Quality Gate'}
      </Button>
    </form>
  );
}

// Cost Management Form
function CostManagementForm({ stage, batchId, onAddCost, onRefetch, onClose }: any) {
  const [formData, setFormData] = useState({
    costType: 'material',
    category: 'direct_material',
    description: '',
    amount: '',
    unitCost: '',
    quantity: '',
    unit: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddCost({
        batchId,
        data: {
          costType: formData.costType,
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          stageNumber: stage.stageNumber,
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
          quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
          unit: formData.unit,
          notes: formData.notes
        }
      }).unwrap();
      onRefetch();
      onClose(); // Close the modal after successful cost addition
      setFormData({
        costType: 'material',
        category: 'direct_material',
        description: '',
        amount: '',
        unitCost: '',
        quantity: '',
        unit: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding cost:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="costType">Cost Type *</Label>
          <Select value={formData.costType} onValueChange={(value) => setFormData({ ...formData, costType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="material" className="bg-white hover:bg-gray-50">Material</SelectItem>
              <SelectItem value="labor" className="bg-white hover:bg-gray-50">Labor</SelectItem>
              <SelectItem value="machine" className="bg-white hover:bg-gray-50">Machine</SelectItem>
              <SelectItem value="overhead" className="bg-white hover:bg-gray-50">Overhead</SelectItem>
              <SelectItem value="utility" className="bg-white hover:bg-gray-50">Utility</SelectItem>
              <SelectItem value="chemical" className="bg-white hover:bg-gray-50">Chemical</SelectItem>
              <SelectItem value="dye" className="bg-white hover:bg-gray-50">Dye</SelectItem>
              <SelectItem value="auxiliary" className="bg-white hover:bg-gray-50">Auxiliary</SelectItem>
              <SelectItem value="packaging" className="bg-white hover:bg-gray-50">Packaging</SelectItem>
              <SelectItem value="transport" className="bg-white hover:bg-gray-50">Transport</SelectItem>
              <SelectItem value="quality_control" className="bg-white hover:bg-gray-50">Quality Control</SelectItem>
              <SelectItem value="waste_disposal" className="bg-white hover:bg-gray-50">Waste Disposal</SelectItem>
              <SelectItem value="maintenance" className="bg-white hover:bg-gray-50">Maintenance</SelectItem>
              <SelectItem value="other" className="bg-white hover:bg-gray-50">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="direct_material" className="bg-white hover:bg-gray-50">Direct Material</SelectItem>
              <SelectItem value="direct_labor" className="bg-white hover:bg-gray-50">Direct Labor</SelectItem>
              <SelectItem value="manufacturing_overhead" className="bg-white hover:bg-gray-50">Manufacturing Overhead</SelectItem>
              <SelectItem value="indirect_material" className="bg-white hover:bg-gray-50">Indirect Material</SelectItem>
              <SelectItem value="indirect_labor" className="bg-white hover:bg-gray-50">Indirect Labor</SelectItem>
              <SelectItem value="variable_overhead" className="bg-white hover:bg-gray-50">Variable Overhead</SelectItem>
              <SelectItem value="fixed_overhead" className="bg-white hover:bg-gray-50">Fixed Overhead</SelectItem>
              <SelectItem value="quality_cost" className="bg-white hover:bg-gray-50">Quality Cost</SelectItem>
              <SelectItem value="waste_cost" className="bg-white hover:bg-gray-50">Waste Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Total Amount *</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitCost">Unit Cost</Label>
          <Input
            id="unitCost"
            type="number"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Add Cost
      </Button>
    </form>
  );
}