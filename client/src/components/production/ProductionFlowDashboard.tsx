'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Factory, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Package,
  Truck,
  Settings,
  Eye,
  Play,
  Pause
} from 'lucide-react';

interface ProductionFlowData {
  totalOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  delayedOrders: number;
  stageWiseCount: Record<string, number>;
  recentActivities: any[];
}

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
  productionStages?: any[];
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

interface Props {
  data: ProductionFlowData | null;
  orders: ProductionOrder[];
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
  'grey_fabric_inward': <Package className="h-4 w-4" />,
  'pre_processing': <Settings className="h-4 w-4" />,
  'dyeing': <Factory className="h-4 w-4" />,
  'printing': <Factory className="h-4 w-4" />,
  'washing': <Settings className="h-4 w-4" />,
  'fixing': <Settings className="h-4 w-4" />,
  'finishing': <Settings className="h-4 w-4" />,
  'quality_control': <CheckCircle className="h-4 w-4" />,
  'cutting_packing': <Package className="h-4 w-4" />,
  'dispatch_invoice': <Truck className="h-4 w-4" />
};

export function ProductionFlowDashboard({ data, orders, onRefresh, loading, error }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionPercentage = (order: ProductionOrder) => {
    if (order.progressPercentage !== undefined) return order.progressPercentage;
    
    const totalQuantity = order.orderQuantity || order.plannedQuantity || 0;
    const completedQuantity = order.completedQuantity || order.producedQuantity || 0;
    
    if (totalQuantity === 0) return 0;
    return Math.round((completedQuantity / totalQuantity) * 100);
  };

  const getCurrentStage = (order: ProductionOrder) => {
    if (!order.productionStages) return null;
    return order.productionStages.find(stage => stage.status === 'in_progress') || 
           order.productionStages.find(stage => stage.status === 'pending');
  };

  const isDelayed = (order: ProductionOrder) => {
    const endDate = order.schedule?.plannedEndDate || order.plannedEndDate;
    if (!endDate) return false;
    return new Date() > new Date(endDate) && order.status !== 'completed';
  };

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

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              All production orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.inProgressOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.completedOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data?.delayedOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Behind schedule
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stage-wise Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stage-wise Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.stageWiseCount && Object.entries(data.stageWiseCount).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stageIcons[stage]}
                    <span className="text-sm font-medium">
                      {stageNames[stage] || stage}
                    </span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentActivities?.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {activity.productionOrderNumber || activity.orderNumber} - {activity.customerName || 'Unknown Customer'}
                  </span>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              )) || orders.slice(0, 5).map((order, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {getOrderNumber(order)} - {getCustomerName(order)}
                  </span>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              )) || (
                <p className="text-gray-500 text-sm">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Orders List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Production Orders</CardTitle>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => {
              const currentStage = getCurrentStage(order);
              const completionPercentage = getCompletionPercentage(order);
              const delayed = isDelayed(order);

              return (
                <div key={order._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{getOrderNumber(order)}</h3>
                      <p className="text-sm text-gray-600">{getCustomerName(order)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      {delayed && (
                        <Badge variant="destructive">Delayed</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Product:</span>
                      <p className="font-medium">{getProductName(order)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <p className="font-medium">
                        {order.completedQuantity || order.producedQuantity || 0}/{order.orderQuantity || order.plannedQuantity || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Stage:</span>
                      <p className="font-medium">
                        {currentStage ? stageNames[currentStage.processType] || currentStage.stageName : 'Not Started'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <p className="font-medium">{completionPercentage}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>

                  {currentStage && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Handle stage actions
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Stage
                      </Button>
                      {currentStage.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            // Handle start stage
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {currentStage.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Handle pause stage
                          }}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductionFlowDashboard;
