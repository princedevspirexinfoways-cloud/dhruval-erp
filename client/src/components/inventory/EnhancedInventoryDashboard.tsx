'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Layers, MapPin, Clock, AlertTriangle, TrendingUp, Award, Factory } from 'lucide-react'
import { useGetInventorySummaryQuery, useGetProductSummaryQuery, useGetAgeingAnalysisQuery } from '@/lib/features/inventory/enhancedInventoryApi'

export function EnhancedInventoryDashboard() {
  const { data: summaryData, isLoading: summaryLoading } = useGetInventorySummaryQuery()
  const { data: productData, isLoading: productLoading } = useGetProductSummaryQuery()
  const { data: ageingData, isLoading: ageingLoading } = useGetAgeingAnalysisQuery()

  const getCategoryColor = (category: string) => {
    const colors = {
      raw_material: 'bg-sky-100 text-sky-800 border-sky-200',
      semi_finished: 'bg-green-100 text-green-800 border-green-200',
      finished_goods: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      consumables: 'bg-slate-100 text-slate-800 border-slate-200',
      spare_parts: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getProductTypeIcon = (type: string) => {
    const icons = {
      saree: '🥻',
      african: '👗',
      garment: '👔',
      digital_print: '🖨️',
      yarn: '🧶',
      thread: '🪡',
      chemical: '🧪',
      dye: '🎨'
    }
    return icons[type as keyof typeof icons] || '📦'
  }

  const getAgeColor = (category: string) => {
    const colors = {
      fresh: 'bg-green-500',
      good: 'bg-blue-500',
      aging: 'bg-yellow-500',
      old: 'bg-orange-500',
      obsolete: 'bg-red-500'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500'
  }

  if (summaryLoading || productLoading || ageingLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory by Category
            </CardTitle>
            <CardDescription>Stock distribution across categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summaryData?.data?.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{item.totalItems} items</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>₹{(item.totalValue / 1000).toFixed(1)}K</span>
                  <span>{item.totalQuantity.toLocaleString()} units</span>
                </div>
                {item.lowStockItems > 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">{item.lowStockItems} low stock</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Product Types
            </CardTitle>
            <CardDescription>Distribution by product type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productData?.data?.slice(0, 6).map((product) => (
              <div key={product.productType} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProductTypeIcon(product.productType)}</span>
                    <span className="font-medium capitalize">{product.productType}</span>
                  </div>
                  <span className="text-sm text-gray-600">{product.totalItems}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <span>₹{(product.totalValue / 1000).toFixed(1)}K</span>
                  <span>{product.uniqueColorsCount} colors</span>
                  <span>{product.uniqueDesignsCount} designs</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Stock Ageing
            </CardTitle>
            <CardDescription>Age distribution of inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ageingData?.data?.map((age) => (
              <div key={age.ageCategory} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getAgeColor(age.ageCategory)}`}></div>
                    <span className="font-medium capitalize">{age.ageCategory}</span>
                  </div>
                  <span className="text-sm text-gray-600">{age.count} items</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Avg: {age.avgAge} days</span>
                  <span>₹{(age.totalValue / 1000).toFixed(1)}K</span>
                </div>
                <Progress 
                  value={(age.count / (ageingData?.data?.reduce((sum, item) => sum + item.count, 0) || 1)) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Process Stage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Manufacturing Process Overview
          </CardTitle>
          <CardDescription>Track materials through production stages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="raw" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="raw">Raw Materials</TabsTrigger>
              <TabsTrigger value="semi">Semi-Finished</TabsTrigger>
              <TabsTrigger value="finished">Finished Goods</TabsTrigger>
            </TabsList>
            
            <TabsContent value="raw" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {summaryData?.data?.find(item => item.category === 'raw_material')?.totalItems || 0}
                  </div>
                  <div className="text-sm text-gray-600">Grey Fabric</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">45</div>
                  <div className="text-sm text-gray-600">Chemicals</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">23</div>
                  <div className="text-sm text-gray-600">Dyes & Colors</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">12</div>
                  <div className="text-sm text-gray-600">Yarn & Thread</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="semi" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">18</div>
                  <div className="text-sm text-gray-600">In Print</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">12</div>
                  <div className="text-sm text-gray-600">In Wash</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">8</div>
                  <div className="text-sm text-gray-600">In Fix</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <div className="text-sm text-gray-600">Quality Check</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="finished" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">
                    {productData?.data?.find(item => item.productType === 'saree')?.totalItems || 0}
                  </div>
                  <div className="text-sm text-gray-600">Sarees</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {productData?.data?.find(item => item.productType === 'african')?.totalItems || 0}
                  </div>
                  <div className="text-sm text-gray-600">African Prints</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {productData?.data?.find(item => item.productType === 'garment')?.totalItems || 0}
                  </div>
                  <div className="text-sm text-gray-600">Garment Fabric</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {productData?.data?.find(item => item.productType === 'digital_print')?.totalItems || 0}
                  </div>
                  <div className="text-sm text-gray-600">Digital Prints</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Stock received', item: 'Grey Fabric - GSM 120', time: '2 hours ago', type: 'in' },
                { action: 'Batch moved to print', item: 'Saree Design #S001', time: '4 hours ago', type: 'process' },
                { action: 'Quality check completed', item: 'African Print Batch #AP123', time: '6 hours ago', type: 'quality' },
                { action: 'Stock dispatched', item: 'Garment Fabric - Blue', time: '8 hours ago', type: 'out' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'in' ? 'bg-green-500' :
                    activity.type === 'out' ? 'bg-red-500' :
                    activity.type === 'process' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.item}</p>
                  </div>
                  <div className="text-xs text-gray-400">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'low_stock', message: '5 items below reorder level', severity: 'high' },
                { type: 'expiry', message: '2 batches expiring in 30 days', severity: 'medium' },
                { type: 'quality', message: '3 items pending quality check', severity: 'medium' },
                { type: 'aging', message: '8 items aging beyond 90 days', severity: 'low' }
              ].map((alert, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.severity === 'high' ? 'text-red-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
