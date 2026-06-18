'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  ArrowLeft,
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  Factory,
  Package,
  Truck,
  Droplets,
  RefreshCw,
  Activity,
  Edit,
  Save,
  X,
  Eye,
  Calendar,
  Users,
  Thermometer,
  Gauge,
  Timer,
  Zap,
  Target,
  TrendingUp,
  DollarSign,
  FileText,
  Image,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ComprehensiveStatusManagement from '@/components/production/ComprehensiveStatusManagement';
import { 
  useGetPreProcessingBatchQuery,
  useUpdatePreProcessingStatusMutation,
  useUpdatePreProcessingBatchMutation
} from '@/lib/api/preProcessingApi';

interface BatchDetails {
  _id: string;
  batchNumber: string;
  processType: string;
  processName: string;
  processDescription: string;
  status: string;
  progress: number;
  inputMaterials: any[];
  chemicalRecipe: any;
  processParameters: any;
  machineAssignment: any;
  workerAssignment: any;
  timing: any;
  qualityControl: any;
  outputMaterial: any;
  wasteManagement: any;
  costs: any;
  notes: string;
  images: string[];
  documents: string[];
  tags: string[];
  statusChangeLog?: Array<{
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    changedByName: string;
    changeDate: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;
  
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState<any>({});

  // RTK Query hooks
  const { 
    data: batchResponse, 
    isLoading: loading, 
    error,
    refetch 
  } = useGetPreProcessingBatchQuery(batchId);
  
  const [updateStatus] = useUpdatePreProcessingStatusMutation();
  const [updateBatch] = useUpdatePreProcessingBatchMutation();

  const batch = batchResponse?.data;

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'quality_hold', label: 'Quality Hold', color: 'bg-purple-100 text-purple-800' }
  ];

  // Update form data when batch data changes
  useEffect(() => {
    if (batch) {
      setFormData(batch);
    }
  }, [batch]);

  const handleStatusChange = async (newStatus: string, notes?: string, processData?: any) => {
    try {
      await updateStatus({
        id: batchId,
        data: { 
          status: newStatus as 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'quality_hold',
          notes,
          processData
        }
      }).unwrap();
      
      toast.success(`Status updated to ${statusOptions.find(s => s.value === newStatus)?.label}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSave = async () => {
    try {
      await updateBatch({
        id: batchId,
        data: formData
      }).unwrap();
      
      setEditing(false);
      toast.success('Batch updated successfully');
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch');
    }
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'on_hold': return <Pause className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      case 'quality_hold': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading batch details...</p>
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
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-gray-600">Failed to load batch details</p>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
              <Button onClick={() => router.push('/production')}>
                Back to Pre-Processing
              </Button>
            </div>
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
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-gray-600">Batch not found</p>
            <Button onClick={() => router.push('/production')} className="mt-4">
              Back to Pre-Processing
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/production')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{batch.batchNumber}</h1>
              <p className="text-gray-600">{batch.processName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(batch.status)} flex items-center gap-1`}>
              {getStatusIcon(batch.status)}
              {statusOptions.find(s => s.value === batch.status)?.label}
            </Badge>
            {editing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{batch.progress}%</span>
              </div>
              <Progress value={batch.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Status Management */}
        <ComprehensiveStatusManagement
          currentStatus={batch.status}
          processType="pre-processing"
          batchId={batch._id}
          onStatusChange={handleStatusChange}
          statusChangeLog={batch.statusChangeLog || []}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Process Type</Label>
                    <p className="text-sm">{batch.processType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Process Name</Label>
                    {editing ? (
                      <Input
                        value={formData.processName || ''}
                        onChange={(e) => setFormData({...formData, processName: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm">{batch.processName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    {editing ? (
                      <Textarea
                        value={formData.processDescription || ''}
                        onChange={(e) => setFormData({...formData, processDescription: e.target.value})}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm">{batch.processDescription || 'No description'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Planned Start</Label>
                    <p className="text-sm">{new Date(batch.timing.plannedStartTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Planned End</Label>
                    <p className="text-sm">{new Date(batch.timing.plannedEndTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Duration</Label>
                    <p className="text-sm">{batch.timing.plannedDuration} minutes</p>
                  </div>
                </CardContent>
              </Card>

              {/* Machine Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    Machine Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Machine Name</Label>
                    <p className="text-sm">{batch.machineAssignment.machineName || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Machine Type</Label>
                    <p className="text-sm">{batch.machineAssignment.machineType || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Capacity</Label>
                    <p className="text-sm">{batch.machineAssignment.capacity || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Materials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Input Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {batch.inputMaterials && batch.inputMaterials.length > 0 ? (
                    <div className="space-y-3">
                      {batch.inputMaterials.map((material, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Type:</strong> {material.fabricType}</div>
                            <div><strong>Grade:</strong> {material.fabricGrade}</div>
                            <div><strong>GSM:</strong> {material.gsm}</div>
                            <div><strong>Width:</strong> {material.width}</div>
                            <div><strong>Color:</strong> {material.color}</div>
                            <div><strong>Quantity:</strong> {material.quantity} {material.unit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No input materials</p>
                  )}
                </CardContent>
              </Card>

              {/* Chemical Recipe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    Chemical Recipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Recipe Name</Label>
                      <p className="text-sm">{batch.chemicalRecipe.recipeName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Version</Label>
                      <p className="text-sm">{batch.chemicalRecipe.recipeVersion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Total Cost</Label>
                      <p className="text-sm font-bold text-green-600">₹{batch.chemicalRecipe.totalRecipeCost}</p>
                    </div>
                    {batch.chemicalRecipe.chemicals && batch.chemicalRecipe.chemicals.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Chemicals</Label>
                        <div className="space-y-2 mt-2">
                          {batch.chemicalRecipe.chemicals.map((chemical: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <div className="font-medium">{chemical.chemicalName}</div>
                              <div className="text-gray-600">{chemical.quantity} {chemical.unit}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Process Tab */}
          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Process Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Temperature */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Thermometer className="h-4 w-4" />
                      Temperature
                    </Label>
                    <div className="text-sm">
                      <div>Min: {batch.processParameters.temperature.min}°C</div>
                      <div>Max: {batch.processParameters.temperature.max}°C</div>
                      <div>Actual: {batch.processParameters.temperature.actual}°C</div>
                    </div>
                  </div>

                  {/* Pressure */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Gauge className="h-4 w-4" />
                      Pressure
                    </Label>
                    <div className="text-sm">
                      <div>Min: {batch.processParameters.pressure.min} bar</div>
                      <div>Max: {batch.processParameters.pressure.max} bar</div>
                      <div>Actual: {batch.processParameters.pressure.actual} bar</div>
                    </div>
                  </div>

                  {/* pH */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">pH Level</Label>
                    <div className="text-sm">
                      <div>Min: {batch.processParameters.ph.min}</div>
                      <div>Max: {batch.processParameters.ph.max}</div>
                      <div>Actual: {batch.processParameters.ph.actual}</div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      Time
                    </Label>
                    <div className="text-sm">
                      <div>Planned: {batch.processParameters.time.planned} {batch.processParameters.time.unit}</div>
                      {batch.processParameters.time.actual && (
                        <div>Actual: {batch.processParameters.time.actual} {batch.processParameters.time.unit}</div>
                      )}
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      Speed
                    </Label>
                    <div className="text-sm">
                      <div>Planned: {batch.processParameters.speed.planned} {batch.processParameters.speed.unit}</div>
                      {batch.processParameters.speed.actual && (
                        <div>Actual: {batch.processParameters.speed.actual} {batch.processParameters.speed.unit}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pre-Process Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Pre-Process Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fabric Condition</Label>
                    <Badge className="bg-green-100 text-green-800">{batch.qualityControl.preProcessCheck.fabricCondition}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Checked By</Label>
                    <p className="text-sm">{batch.qualityControl.preProcessCheck.checkedByName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Check Date</Label>
                    <p className="text-sm">{new Date(batch.qualityControl.preProcessCheck.checkDate).toLocaleString()}</p>
                  </div>
                  {batch.qualityControl.preProcessCheck.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Notes</Label>
                      <p className="text-sm">{batch.qualityControl.preProcessCheck.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* In-Process Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    In-Process Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Temperature</Label>
                    <p className="text-sm">{batch.qualityControl.inProcessCheck.temperature}°C</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">pH</Label>
                    <p className="text-sm">{batch.qualityControl.inProcessCheck.ph}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Color</Label>
                    <p className="text-sm">{batch.qualityControl.inProcessCheck.color || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Consistency</Label>
                    <Badge className="bg-green-100 text-green-800">{batch.qualityControl.inProcessCheck.consistency}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Post-Process Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Post-Process Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Whiteness</Label>
                    <p className="text-sm">{batch.qualityControl.postProcessCheck.whiteness}%</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Absorbency</Label>
                    <Badge className="bg-green-100 text-green-800">{batch.qualityControl.postProcessCheck.absorbency}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Strength</Label>
                    <p className="text-sm">{batch.qualityControl.postProcessCheck.strength}%</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Quality Grade</Label>
                    <Badge className="bg-blue-100 text-blue-800">{batch.qualityControl.postProcessCheck.qualityGrade}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Chemical Cost</Label>
                    <p className="text-2xl font-bold text-blue-600">₹{batch.costs.chemicalCost}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Labor Cost</Label>
                    <p className="text-2xl font-bold text-green-600">₹{batch.costs.laborCost}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Machine Cost</Label>
                    <p className="text-2xl font-bold text-purple-600">₹{batch.costs.machineCost}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Utility Cost</Label>
                    <p className="text-2xl font-bold text-orange-600">₹{batch.costs.utilityCost}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Waste Disposal Cost</Label>
                    <p className="text-2xl font-bold text-red-600">₹{batch.costs.wasteDisposalCost}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Total Cost</Label>
                    <p className="text-3xl font-bold text-gray-900">₹{batch.costs.totalCost}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-medium text-gray-700">Cost Per Unit</Label>
                    <p className="text-xl font-bold text-gray-900">₹{batch.costs.costPerUnit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Process Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Batch Created</p>
                      <p className="text-sm text-gray-600">{new Date(batch.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Planned Start</p>
                      <p className="text-sm text-gray-600">{new Date(batch.timing.plannedStartTime).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Planned End</p>
                      <p className="text-sm text-gray-600">{new Date(batch.timing.plannedEndTime).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-gray-600">{new Date(batch.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
