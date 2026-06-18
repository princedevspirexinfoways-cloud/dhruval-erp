'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  Scissors, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Settings,
  BarChart3,
  Factory,
  Package,
  Truck,
  Tag
} from 'lucide-react';
import { useGetProductionOrdersQuery } from '@/lib/api/productionApi';

export default function CuttingPackingPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading, isError } = useGetProductionOrdersQuery({ page: 1, limit: 20 });
  const orders = data?.data ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'planned': return 'Planned';
      case 'pending': return 'Pending';
      case 'on_hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cutting & Packing</h1>
          <p className="text-gray-600">Manage cutting and packing operations with labels & cartons</p>
        </div>
        <Button className="flex items-center gap-2">
          <Scissors className="h-4 w-4" />
          New Cutting & Packing Process
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Factory className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Processes</p>
                <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : orders.filter((o: any) => o.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : orders.filter((o: any) => o.status === 'in_progress').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Processes */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Cutting & Packing Processes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isError && (
                    <div className="p-4 text-sm text-red-600 border border-red-200 rounded">Failed to load data.</div>
                  )}
                  {isLoading && (
                    <div className="p-4 text-sm text-gray-500 border rounded">Loading...</div>
                  )}
                  {!isLoading && !isError && orders.map((order: any) => (
                    <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{order.orderNumber}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{order.productName}</p>
                        <p className="text-sm text-gray-500">Planned: {order.plannedQuantity} | Produced: {order.producedQuantity}</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round(order.progressPercentage ?? (order.plannedQuantity ? (order.producedQuantity / order.plannedQuantity) * 100 : 0))}%</span>
                          </div>
                          <Progress value={Math.round(order.progressPercentage ?? (order.plannedQuantity ? (order.producedQuantity / order.plannedQuantity) * 100 : 0))} className="h-2" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Process Status */}
            <Card>
              <CardHeader>
                <CardTitle>Process Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Processes</span>
                    <span className="text-2xl font-bold text-blue-600">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed Today</span>
                    <span className="text-2xl font-bold text-green-600">4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Pieces Cut</span>
                    <span className="text-2xl font-bold text-purple-600">2,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cartons Packed</span>
                    <span className="text-2xl font-bold text-green-600">98</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="processes">
          <Card>
            <CardHeader>
              <CardTitle>All Cutting & Packing Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isError && (
                  <div className="p-4 text-sm text-red-600 border border-red-200 rounded">Failed to load data.</div>
                )}
                {isLoading && (
                  <div className="p-4 text-sm text-gray-500 border rounded">Loading...</div>
                )}
                {!isLoading && !isError && orders.map((order: any) => (
                  <div key={order._id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                        <p className="text-gray-600">{order.productName}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Planned Qty</p>
                        <p className="font-medium">{order.plannedQuantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Produced Qty</p>
                        <p className="font-medium">{order.producedQuantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Remaining Qty</p>
                        <p className="font-medium">{order.remainingQuantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Priority</p>
                        <p className="font-medium">{order.priority}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Planned: {order.plannedQuantity}</span>
                        <span>Produced: {order.producedQuantity}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round(order.progressPercentage ?? (order.plannedQuantity ? (order.producedQuantity / order.plannedQuantity) * 100 : 0))}%</span>
                        </div>
                        <Progress value={Math.round(order.progressPercentage ?? (order.plannedQuantity ? (order.producedQuantity / order.plannedQuantity) * 100 : 0))} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Cutting & Packing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Analytics charts will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Cutting & Packing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Settings configuration will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
