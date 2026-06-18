'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  CheckCircle, 
  XCircle,
  Clock, 
  AlertCircle,
  Eye,
  Settings,
  BarChart3,
  Factory,
  Package,
  Truck,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

export default function QualityControlPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with actual API calls
  const qualityChecks = [
    {
      id: '1',
      batchNumber: 'QC-001',
      productionOrderNumber: 'PO-2024-001',
      customerName: 'ABC Textiles',
      stage: 'Dyeing',
      status: 'pass',
      checkedBy: 'John Doe',
      checkedAt: '2024-01-15T14:00:00Z',
      qualityGrade: 'A',
      defects: [],
      remarks: 'Excellent quality, all parameters within limits'
    },
    {
      id: '2',
      batchNumber: 'QC-002',
      productionOrderNumber: 'PO-2024-002',
      customerName: 'XYZ Fabrics',
      stage: 'Printing',
      status: 'hold',
      checkedBy: 'Jane Smith',
      checkedAt: '2024-01-15T13:30:00Z',
      qualityGrade: 'B',
      defects: ['Color mismatch', 'Registration error'],
      remarks: 'Minor issues detected, requires rework'
    },
    {
      id: '3',
      batchNumber: 'QC-003',
      productionOrderNumber: 'PO-2024-003',
      customerName: 'DEF Industries',
      stage: 'Finishing',
      status: 'reject',
      checkedBy: 'Mike Johnson',
      checkedAt: '2024-01-15T12:00:00Z',
      qualityGrade: 'D',
      defects: ['Poor hand feel', 'Dimensional instability', 'Color bleeding'],
      remarks: 'Multiple quality issues, complete rework required'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pass': return 'Pass';
      case 'hold': return 'Hold';
      case 'reject': return 'Reject';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <ThumbsUp className="h-4 w-4" />;
      case 'hold': return <Clock className="h-4 w-4" />;
      case 'reject': return <ThumbsDown className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-green-100 text-green-800';
      case 'B+': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      case 'Reject': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
          <p className="text-gray-600">Pass/Hold/Reject quality inspections</p>
        </div>
        <Button className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          New Quality Check
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
                <p className="text-sm font-medium text-gray-600">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
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
                <p className="text-sm font-medium text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-gray-900">142</p>
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
                <p className="text-sm font-medium text-gray-600">On Hold</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checks">Quality Checks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Quality Checks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Quality Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityChecks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{check.batchNumber}</h3>
                          <Badge className={getStatusColor(check.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(check.status)}
                              {getStatusText(check.status)}
                            </div>
                          </Badge>
                          <Badge className={getGradeColor(check.qualityGrade)}>
                            Grade: {check.qualityGrade}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{check.productionOrderNumber} - {check.customerName}</p>
                        <p className="text-sm text-gray-500">Stage: {check.stage} | Checked by: {check.checkedBy}</p>
                        {check.defects.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-red-600 font-medium">Defects:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {check.defects.map((defect, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {defect}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
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

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pass Rate</span>
                    <span className="text-2xl font-bold text-green-600">91%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hold Rate</span>
                    <span className="text-2xl font-bold text-yellow-600">5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reject Rate</span>
                    <span className="text-2xl font-bold text-red-600">4%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Grade</span>
                    <span className="text-2xl font-bold text-blue-600">A-</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle>All Quality Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityChecks.map((check) => (
                  <div key={check.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{check.batchNumber}</h3>
                        <p className="text-gray-600">{check.productionOrderNumber} - {check.customerName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(check.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(check.status)}
                            {getStatusText(check.status)}
                          </div>
                        </Badge>
                        <Badge className={getGradeColor(check.qualityGrade)}>
                          Grade: {check.qualityGrade}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Stage</p>
                        <p className="font-medium">{check.stage}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Checked By</p>
                        <p className="font-medium">{check.checkedBy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Checked At</p>
                        <p className="font-medium">{new Date(check.checkedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {check.defects.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Defects Found</p>
                        <div className="flex flex-wrap gap-2">
                          {check.defects.map((defect, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {defect}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Remarks</p>
                      <p className="text-sm text-gray-700">{check.remarks}</p>
                    </div>

                    <div className="flex items-center justify-between">
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
              <CardTitle>Quality Analytics</CardTitle>
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
              <CardTitle>Quality Settings</CardTitle>
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
