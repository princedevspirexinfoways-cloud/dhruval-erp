'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Settings,
  BarChart3,
  Factory,
  Package,
  CheckCircle,
  Truck,
  RefreshCw,
  TrendingUp,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import ProductionFlowDashboard from '@/components/production/ProductionFlowDashboard';
import ProductionFlowStages from '@/components/production/ProductionFlowStages';
import ProductionFlowAnalytics from '@/components/production/ProductionFlowAnalytics';
import ProductionFlowSettings from '@/components/production/ProductionFlowSettings';
import { 
  useGetProductionFlowDashboardQuery,
  useStartStageMutation,
  useCompleteStageMutation,
  useHoldStageMutation,
  useResumeStageMutation,
  useGetFlowAnalyticsQuery
} from '@/lib/api/productionFlowApi';
import { useGetProductionOrdersQuery, ProductionOrder as ApiProductionOrder } from '@/lib/api/productionApi';

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
  productionOrderNumber: string;
  customerName: string;
  product: {
    productType: string;
    design: string;
    color: string;
    gsm: number;
  };
  orderQuantity: number;
  completedQuantity: number;
  status: string;
  productionStages: ProductionStage[];
  schedule: {
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
  };
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
}

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

const stageColors: Record<string, string> = {
  'grey_fabric_inward': 'bg-blue-100 text-blue-800',
  'pre_processing': 'bg-purple-100 text-purple-800',
  'dyeing': 'bg-green-100 text-green-800',
  'printing': 'bg-orange-100 text-orange-800',
  'washing': 'bg-cyan-100 text-cyan-800',
  'fixing': 'bg-yellow-100 text-yellow-800',
  'finishing': 'bg-pink-100 text-pink-800',
  'quality_control': 'bg-red-100 text-red-800',
  'cutting_packing': 'bg-indigo-100 text-indigo-800',
  'dispatch_invoice': 'bg-gray-100 text-gray-800'
};

const statusColors: Record<string, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'on_hold': 'bg-yellow-100 text-yellow-800',
  'rejected': 'bg-red-100 text-red-800',
  'rework': 'bg-orange-100 text-orange-800'
};

export default function ProductionFlowPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // RTK Query hooks
  const { 
    data: productionFlowData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useGetProductionFlowDashboardQuery();
  
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError 
  } = useGetFlowAnalyticsQuery({ period: '30d' });

  // Get production orders for real data
  const { 
    data: productionOrdersData, 
    isLoading: ordersLoading, 
    error: ordersError,
    refetch: refetchOrders 
  } = useGetProductionOrdersQuery({ 
    page: 1, 
    limit: 50
  });

  // Mock data for demonstration when no real data is available
  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'PO-2024-001',
      productName: 'Cotton Saree',
      productCode: 'CS-001',
      status: 'in_progress',
      plannedQuantity: 100,
      producedQuantity: 45,
      progressPercentage: 45,
      customerName: 'Fashion Store Mumbai',
      productionStages: [
        {
          stageId: '1',
          stageNumber: 1,
          stageName: 'Grey Fabric Inward',
          processType: 'grey_fabric_inward',
          status: 'completed',
          timing: { plannedDuration: 60, actualDuration: 55 },
          progress: 100,
          output: { producedQuantity: 100, defectQuantity: 0, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: 'A', 
              qualityNotes: 'Good quality fabric received',
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 0,
              approvedQuantity: 100,
              rejectedQuantity: 0,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        },
        {
          stageId: '2',
          stageNumber: 2,
          stageName: 'Pre-Processing',
          processType: 'pre_processing',
          status: 'completed',
          timing: { plannedDuration: 240, actualDuration: 220 },
          progress: 100,
          output: { producedQuantity: 95, defectQuantity: 5, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: 'A', 
              qualityNotes: 'Pre-processing completed successfully',
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 5,
              approvedQuantity: 95,
              rejectedQuantity: 5,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        },
        {
          stageId: '3',
          stageNumber: 3,
          stageName: 'Dyeing Process',
          processType: 'dyeing',
          status: 'in_progress',
          timing: { plannedDuration: 480, actualDuration: 120 },
          progress: 25,
          output: { producedQuantity: 45, defectQuantity: 0, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: 'A', 
              qualityNotes: 'Dyeing in progress',
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 0,
              approvedQuantity: 45,
              rejectedQuantity: 0,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        },
        {
          stageId: '4',
          stageNumber: 4,
          stageName: 'Printing Process',
          processType: 'printing',
          status: 'pending',
          timing: { plannedDuration: 360 },
          progress: 0,
          output: { producedQuantity: 0, defectQuantity: 0, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: null, 
              qualityNotes: null,
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 0,
              approvedQuantity: 0,
              rejectedQuantity: 0,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        },
        {
          stageId: '5',
          stageNumber: 5,
          stageName: 'Quality Control',
          processType: 'quality_control',
          status: 'pending',
          timing: { plannedDuration: 60 },
          progress: 0,
          output: { producedQuantity: 0, defectQuantity: 0, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: null, 
              qualityNotes: null,
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 0,
              approvedQuantity: 0,
              rejectedQuantity: 0,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        }
      ]
    },
    {
      _id: '2',
      orderNumber: 'PO-2024-002',
      productName: 'Silk Dress Material',
      productCode: 'SDM-002',
      status: 'in_progress',
      plannedQuantity: 50,
      producedQuantity: 20,
      progressPercentage: 40,
      customerName: 'Textile Hub Delhi',
      productionStages: [
        {
          stageId: '1',
          stageNumber: 1,
          stageName: 'Grey Fabric Inward',
          processType: 'grey_fabric_inward',
          status: 'completed',
          timing: { plannedDuration: 60, actualDuration: 50 },
          progress: 100,
          output: { producedQuantity: 50, defectQuantity: 0, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: 'A+', 
              qualityNotes: 'Excellent quality silk fabric',
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 0,
              approvedQuantity: 50,
              rejectedQuantity: 0,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        },
        {
          stageId: '2',
          stageNumber: 2,
          stageName: 'Pre-Processing',
          processType: 'pre_processing',
          status: 'in_progress',
          timing: { plannedDuration: 240, actualDuration: 100 },
          progress: 42,
          output: { producedQuantity: 20, defectQuantity: 0, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: 'A', 
              qualityNotes: 'Pre-processing in progress',
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 0,
              approvedQuantity: 20,
              rejectedQuantity: 0,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        },
        {
          stageId: '3',
          stageNumber: 3,
          stageName: 'Dyeing Process',
          processType: 'dyeing',
          status: 'pending',
          timing: { plannedDuration: 480 },
          progress: 0,
          output: { producedQuantity: 0, defectQuantity: 0, outputImages: [] },
          qualityControl: { 
            finalQuality: { 
              qualityGrade: null, 
              qualityNotes: null,
              checkedBy: null,
              checkedAt: null,
              defects: [],
              defectPercentage: 0,
              approvedQuantity: 0,
              rejectedQuantity: 0,
              reworkQuantity: 0,
              qualityImages: []
            }
          }
        }
      ]
    }
  ];

  // Use mock data if no real data is available
  const ordersToDisplay = (productionOrdersData?.data && productionOrdersData.data.length > 0) ? productionOrdersData.data : mockOrders;

  // Mutations
  const [startStage, { isLoading: startLoading }] = useStartStageMutation();
  const [completeStage, { isLoading: completeLoading }] = useCompleteStageMutation();
  const [holdStage, { isLoading: holdLoading }] = useHoldStageMutation();
  const [resumeStage, { isLoading: resumeLoading }] = useResumeStageMutation();

  const handleStageAction = async (orderId: string, stageNumber: number, action: string, data?: any) => {
    try {
      switch (action) {
        case 'start':
          await startStage({ 
            productionOrderId: orderId, 
            stageNumber, 
            data: { startedBy: data?.startedBy } 
          }).unwrap();
          break;
        case 'complete':
          await completeStage({ 
            productionOrderId: orderId, 
            stageNumber, 
            data: {
              actualQuantity: data?.actualQuantity,
              qualityNotes: data?.qualityNotes,
              defectQuantity: data?.defectQuantity,
              completedBy: data?.completedBy,
              qualityGrade: data?.qualityGrade,
              images: data?.images,
              notes: data?.notes
            }
          }).unwrap();
          break;
        case 'hold':
          await holdStage({ 
            productionOrderId: orderId, 
            stageNumber, 
            data: {
              reason: data?.reason || 'Production hold',
              heldBy: data?.heldBy
            }
          }).unwrap();
          break;
        case 'resume':
          await resumeStage({ 
            productionOrderId: orderId, 
            stageNumber, 
            data: { resumedBy: data?.resumedBy } 
          }).unwrap();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (err) {
      console.error(`Error performing ${action} stage:`, err);
      throw err;
    }
  };

  const handleRefresh = () => {
    refetchDashboard();
    refetchOrders();
  };

  const isLoading = dashboardLoading || ordersLoading;
  const hasError = dashboardError || ordersError;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading production flow data...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (hasError) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Error loading production flow data</p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Factory className="h-10 w-10 text-blue-600" />
                Production Flow Management
              </h1>
              <p className="text-lg text-gray-600">
                Complete textile manufacturing process tracking and management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Orders</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {productionFlowData?.data?.totalOrders || ordersToDisplay.length}
                    </p>
                  </div>
                  <Factory className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">In Progress</p>
                    <p className="text-3xl font-bold text-green-900">
                      {productionFlowData?.data?.inProgressOrders || 
                       ordersToDisplay.filter(order => order.status === 'in_progress').length}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Completed</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {productionFlowData?.data?.completedOrders || 
                       ordersToDisplay.filter(order => order.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Delayed</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {productionFlowData?.data?.delayedOrders || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="stages" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Factory className="h-4 w-4" />
              Production Stages
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ProductionFlowDashboard 
              data={productionFlowData?.data || null}
              orders={ordersToDisplay as any}
              onRefresh={handleRefresh}
              loading={dashboardLoading}
              error={dashboardError}
            />
          </TabsContent>

          <TabsContent value="stages">
            <ProductionFlowStages 
              orders={ordersToDisplay as any}
              onStageAction={handleStageAction}
              onRefresh={handleRefresh}
              loading={ordersLoading}
              error={ordersError}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <ProductionFlowAnalytics 
              data={analyticsData?.data}
              loading={analyticsLoading}
              error={analyticsError}
            />
          </TabsContent>

          <TabsContent value="settings">
            <ProductionFlowSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
