'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Factory,
  DollarSign
} from 'lucide-react';

interface FlowAnalytics {
  period: string;
  analytics: {
    totalProduction: number;
    averageCycleTime: number;
    qualityMetrics: {
      passRate: number;
      defectRate: number;
      reworkRate: number;
    };
    efficiencyMetrics: {
      machineUtilization: number;
      laborEfficiency: number;
      overallEfficiency: number;
    };
    costMetrics: {
      materialCost: number;
      laborCost: number;
      overheadCost: number;
      totalCost: number;
    };
  };
}

interface Props {
  data?: FlowAnalytics;
  loading?: boolean;
  error?: any;
}

export function ProductionFlowAnalytics({ data, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading analytics data</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  const { analytics } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProduction}</div>
            <p className="text-xs text-muted-foreground">
              Units produced this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cycle Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageCycleTime}h</div>
            <p className="text-xs text-muted-foreground">
              Per production order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.qualityMetrics.passRate}%</div>
            <p className="text-xs text-muted-foreground">
              First pass quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.efficiencyMetrics.overallEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Production efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pass Rate</span>
                <span className="text-sm text-green-600">{analytics.qualityMetrics.passRate}%</span>
              </div>
              <Progress value={analytics.qualityMetrics.passRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Defect Rate</span>
                <span className="text-sm text-red-600">{analytics.qualityMetrics.defectRate}%</span>
              </div>
              <Progress value={analytics.qualityMetrics.defectRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rework Rate</span>
                <span className="text-sm text-orange-600">{analytics.qualityMetrics.reworkRate}%</span>
              </div>
              <Progress value={analytics.qualityMetrics.reworkRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Efficiency Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Machine Utilization</span>
                <span className="text-sm text-blue-600">{analytics.efficiencyMetrics.machineUtilization}%</span>
              </div>
              <Progress value={analytics.efficiencyMetrics.machineUtilization} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Labor Efficiency</span>
                <span className="text-sm text-green-600">{analytics.efficiencyMetrics.laborEfficiency}%</span>
              </div>
              <Progress value={analytics.efficiencyMetrics.laborEfficiency} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Efficiency</span>
                <span className="text-sm text-purple-600">{analytics.efficiencyMetrics.overallEfficiency}%</span>
              </div>
              <Progress value={analytics.efficiencyMetrics.overallEfficiency} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{analytics.costMetrics.materialCost.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Material Cost</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{analytics.costMetrics.laborCost.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Labor Cost</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₹{analytics.costMetrics.overheadCost.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Overhead Cost</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ₹{analytics.costMetrics.totalCost.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Total Cost</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductionFlowAnalytics;
