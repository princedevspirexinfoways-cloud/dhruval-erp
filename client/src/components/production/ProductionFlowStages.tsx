'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  Settings,
  Factory,
  Package,
  Truck,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ProductionOrder {
  _id: string;
  productionOrderNumber?: string;
  orderNumber?: string;
  customerName?: string;
  product?: {
    productType: string;
    design: string;
    color: string;
    gsm: number;
  };
  productName?: string;
  productCode?: string;
  orderQuantity?: number;
  plannedQuantity?: number;
  completedQuantity?: number;
  producedQuantity?: number;
  status: string;
  productionStages?: ProductionStage[];
  schedule?: {
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
  };
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progressPercentage?: number;
}

interface ProductionStage {
  stageId: string;
  stageNumber: number;
  stageName: string;
  processType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'rejected' | 'rework';
  timing: {
    plannedStartTime?: string;
    actualStartTime?: string;
    plannedEndTime?: string;
    actualEndTime?: string;
    plannedDuration?: number;
    actualDuration?: number;
  };
  progress: number;
  output: {
    producedQuantity?: number;
    defectQuantity?: number;
    outputImages: string[];
  };
  qualityControl: {
    finalQuality: {
      qualityGrade?: string;
      qualityNotes?: string;
    };
  };
  notes?: string;
}

interface Props {
  orders: ProductionOrder[];
  onStageAction: (orderId: string, stageNumber: number, action: string, data?: any) => void;
  onRefresh: () => void;
  loading?: boolean;
  error?: any;
}

const stageNames: Record<string, string> = {
  'grey_fabric_inward': 'Grey Fabric Inward',
  'pre_processing': 'Pre-Processing',
  'dyeing': 'Dyeing',
  'printing': 'Printing',
  'washing': 'Washing',
  'fixing': 'Fixing',
  'finishing': 'Finishing',
  'quality_control': 'Quality Control',
  'cutting_packing': 'Cutting & Packing',
  'dispatch_invoice': 'Dispatch & Invoice'
};

const stageIcons: Record<string, React.ReactNode> = {
  'grey_fabric_inward': <Package className="h-5 w-5" />,
  'pre_processing': <Settings className="h-5 w-5" />,
  'dyeing': <Factory className="h-5 w-5" />,
  'printing': <Factory className="h-5 w-5" />,
  'washing': <Settings className="h-5 w-5" />,
  'fixing': <Settings className="h-5 w-5" />,
  'finishing': <Settings className="h-5 w-5" />,
  'quality_control': <CheckCircle className="h-5 w-5" />,
  'cutting_packing': <Package className="h-5 w-5" />,
  'dispatch_invoice': <Truck className="h-5 w-5" />
};

const statusColors: Record<string, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'on_hold': 'bg-yellow-100 text-yellow-800',
  'rejected': 'bg-red-100 text-red-800',
  'rework': 'bg-orange-100 text-orange-800'
};

export function ProductionFlowStages({ orders, onStageAction, onRefresh, loading, error }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(null);
  const [completionData, setCompletionData] = useState({
    actualQuantity: '',
    qualityNotes: '',
    defectQuantity: '',
    qualityGrade: '',
    notes: ''
  });

  const getOrderNumber = (order: ProductionOrder) => {
    return order.productionOrderNumber || order.orderNumber || order._id;
  };

  const getCustomerName = (order: ProductionOrder) => {
    return order.customerName || 'Unknown Customer';
  };

  const getProductName = (order: ProductionOrder) => {
    if (order.product?.design && order.product?.color) {
      return `${order.product.design} - ${order.product.color}`;
    }
    return order.productName || order.productCode || 'Unknown Product';
  };

  const filteredOrders = orders.filter(order => {
    const orderNumber = getOrderNumber(order);
    const customerName = getCustomerName(order);
    const productName = getProductName(order);
    
    const matchesSearch = orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStageStatusColor = (status: string) => {
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCompletionPercentage = (order: ProductionOrder) => {
    if (order.progressPercentage !== undefined) return order.progressPercentage;
    
    const totalQuantity = order.orderQuantity || order.plannedQuantity || 0;
    const completedQuantity = order.completedQuantity || order.producedQuantity || 0;
    
    if (totalQuantity === 0) return 0;
    return Math.round((completedQuantity / totalQuantity) * 100);
  };

  const handleStageAction = async (orderId: string, stageNumber: number, action: string) => {
    try {
      await onStageAction(orderId, stageNumber, action);
    } catch (error) {
      console.error('Error performing stage action:', error);
    }
  };

  const handleCompleteStage = async () => {
    if (!selectedOrder || !selectedStage) return;

    try {
      await onStageAction(selectedOrder._id, selectedStage.stageNumber, 'complete');
      setSelectedOrder(null);
      setSelectedStage(null);
      setCompletionData({
        actualQuantity: '',
        qualityNotes: '',
        defectQuantity: '',
        qualityGrade: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error completing stage:', error);
    }
  };

  const renderStageCard = (stage: ProductionStage, order: ProductionOrder) => {
    const isCurrentStage = stage.status === 'in_progress';
    const isCompleted = stage.status === 'completed';
    const isPending = stage.status === 'pending';

    return (
      <Card 
        key={stage.stageId} 
        className={`transition-all duration-200 ${
          isCurrentStage ? 'ring-2 ring-blue-500 shadow-lg' : 
          isCompleted ? 'bg-green-50' : 
          'hover:shadow-md'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stageIcons[stage.processType]}
              <CardTitle className="text-sm">
                {stage.stageNumber}. {stage.stageName}
              </CardTitle>
            </div>
            <Badge className={getStageStatusColor(stage.status)}>
              {stage.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {stage.timing?.plannedDuration && (
            <div className="text-xs text-gray-500">
              Planned Duration: {stage.timing.plannedDuration} minutes
            </div>
          )}
          
          {stage.timing?.actualDuration && (
            <div className="text-xs text-gray-500">
              Actual Duration: {stage.timing.actualDuration} minutes
            </div>
          )}

          {stage.output?.producedQuantity && (
            <div className="text-xs text-gray-500">
              Produced: {stage.output.producedQuantity} units
            </div>
          )}

          {stage.qualityControl?.finalQuality?.qualityGrade && (
            <div className="text-xs text-gray-500">
              Quality Grade: {stage.qualityControl.finalQuality.qualityGrade}
            </div>
          )}

          <div className="flex gap-2">
            {isPending && (
              <Button
                size="sm"
                onClick={() => handleStageAction(order._id, stage.stageNumber, 'start')}
                className="flex-1"
              >
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}

            {isCurrentStage && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStageAction(order._id, stage.stageNumber, 'hold')}
                  className="flex-1"
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Hold
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setSelectedStage(stage);
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Complete Stage: {stage.stageName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="actualQuantity">Actual Quantity Produced</Label>
                        <Input
                          id="actualQuantity"
                          type="number"
                          value={completionData.actualQuantity}
                          onChange={(e) => setCompletionData(prev => ({
                            ...prev,
                            actualQuantity: e.target.value
                          }))}
                          placeholder="Enter quantity"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defectQuantity">Defect Quantity</Label>
                        <Input
                          id="defectQuantity"
                          type="number"
                          value={completionData.defectQuantity}
                          onChange={(e) => setCompletionData(prev => ({
                            ...prev,
                            defectQuantity: e.target.value
                          }))}
                          placeholder="Enter defect quantity"
                        />
                      </div>
                      <div>
                        <Label htmlFor="qualityGrade">Quality Grade</Label>
                        <Select
                          value={completionData.qualityGrade}
                          onValueChange={(value) => setCompletionData(prev => ({
                            ...prev,
                            qualityGrade: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select quality grade" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                            <SelectItem value="A" className="bg-white hover:bg-gray-50">A - Excellent</SelectItem>
                            <SelectItem value="B" className="bg-white hover:bg-gray-50">B - Good</SelectItem>
                            <SelectItem value="C" className="bg-white hover:bg-gray-50">C - Fair</SelectItem>
                            <SelectItem value="D" className="bg-white hover:bg-gray-50">D - Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="qualityNotes">Quality Notes</Label>
                        <Textarea
                          id="qualityNotes"
                          value={completionData.qualityNotes}
                          onChange={(e) => setCompletionData(prev => ({
                            ...prev,
                            qualityNotes: e.target.value
                          }))}
                          placeholder="Enter quality notes"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          value={completionData.notes}
                          onChange={(e) => setCompletionData(prev => ({
                            ...prev,
                            notes: e.target.value
                          }))}
                          placeholder="Enter additional notes"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCompleteStage} className="flex-1">
                          Complete Stage
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {stage.status === 'on_hold' && (
              <Button
                size="sm"
                onClick={() => handleStageAction(order._id, stage.stageNumber, 'resume')}
                className="flex-1"
              >
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedOrder(order);
                setSelectedStage(stage);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Production Stages</CardTitle>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all" className="bg-white hover:bg-gray-50">All Status</SelectItem>
                <SelectItem value="draft" className="bg-white hover:bg-gray-50">Draft</SelectItem>
                <SelectItem value="approved" className="bg-white hover:bg-gray-50">Approved</SelectItem>
                <SelectItem value="in_progress" className="bg-white hover:bg-gray-50">In Progress</SelectItem>
                <SelectItem value="completed" className="bg-white hover:bg-gray-50">Completed</SelectItem>
                <SelectItem value="on_hold" className="bg-white hover:bg-gray-50">On Hold</SelectItem>
                <SelectItem value="cancelled" className="bg-white hover:bg-gray-50">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Production Orders with Stages */}
      <div className="space-y-6">
        {filteredOrders.map((order) => {
          const completionPercentage = getCompletionPercentage(order);
          const currentStage = order.productionStages?.find(stage => stage.status === 'in_progress');
          const completedStages = order.productionStages?.filter(stage => stage.status === 'completed').length || 0;
          const totalStages = order.productionStages?.length || 0;

          return (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{getOrderNumber(order)}</CardTitle>
                    <p className="text-sm text-gray-600">{getCustomerName(order)}</p>
                    <p className="text-xs text-gray-500">{getProductName(order)}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-2">{order.status}</Badge>
                    <p className="text-sm text-gray-500">
                      {completedStages}/{totalStages} stages completed
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress: {completionPercentage}%</span>
                    <span>
                      {order.completedQuantity || order.producedQuantity || 0}/{order.orderQuantity || order.plannedQuantity || 0} units
                    </span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
              </CardHeader>
              <CardContent>
                {order.productionStages && order.productionStages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {order.productionStages.map((stage) => renderStageCard(stage, order))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Factory className="h-8 w-8 mx-auto mb-2" />
                    <p>No production stages defined for this order</p>
                    <p className="text-sm">Initialize production flow to add stages</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No production orders found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProductionFlowStages;
