'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveContainer, ResponsiveGrid } from '@/components/ui/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Droplets,
  Scissors,
  Palette
} from 'lucide-react'

// Mock data for advanced inventory
const inventoryData = {
  stats: {
    totalItems: 1250,
    fentStock: 85,
    agingItems: 23,
    processItems: 156
  },
  fentInventory: [
    {
      id: 'FENT-001',
      design: 'Floral Print A',
      color: 'Red',
      quantity: 45,
      unit: 'meters',
      originalBatch: 'BATCH-2024-001',
      reason: 'Print defect',
      date: '2024-01-10',
      value: 15000
    },
    {
      id: 'FENT-002',
      design: 'Geometric B',
      color: 'Blue',
      quantity: 32,
      unit: 'meters',
      originalBatch: 'BATCH-2024-002',
      reason: 'Color variation',
      date: '2024-01-12',
      value: 12000
    }
  ],
  processTracking: [
    {
      id: 'PROC-001',
      item: 'African Cotton Fabric',
      batch: 'BATCH-2024-003',
      currentStage: 'longation',
      quantity: 500,
      unit: 'meters',
      startDate: '2024-01-14',
      expectedCompletion: '2024-01-18',
      progress: 65
    },
    {
      id: 'PROC-002',
      item: 'Saree Fabric',
      batch: 'BATCH-2024-004',
      currentStage: 'bleach',
      quantity: 200,
      unit: 'pieces',
      startDate: '2024-01-15',
      expectedCompletion: '2024-01-20',
      progress: 30
    }
  ],
  agingStock: [
    {
      id: 'AGE-001',
      item: 'Digital Print Fabric',
      design: 'Vintage Pattern',
      quantity: 150,
      unit: 'meters',
      lastMovement: '2023-11-15',
      ageInDays: 67,
      value: 45000,
      location: 'Warehouse A-2'
    },
    {
      id: 'AGE-002',
      item: 'Printed Sarees',
      design: 'Traditional Motif',
      quantity: 25,
      unit: 'pieces',
      lastMovement: '2023-12-01',
      ageInDays: 51,
      value: 37500,
      location: 'Warehouse B-1'
    }
  ]
}

export default function AdvancedInventoryPage() {
  const [activeTab, setActiveTab] = useState('fent')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Add client-side state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false)

  // Set client-side state after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'longation': return 'bg-blue-100 text-blue-800'
      case 'bleach': return 'bg-purple-100 text-purple-800'
      case 'print': return 'bg-green-100 text-green-800'
      case 'wash': return 'bg-cyan-100 text-cyan-800'
      case 'fix': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAgeColor = (days: number) => {
    if (days > 60) return 'bg-red-100 text-red-800'
    if (days > 30) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <ResponsiveContainer className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Advanced Inventory Management"
          description="Track fent inventory, process stages, and aging stock"
          icon={<Package className="h-6 w-6 text-white" />}
        />

        {/* Stats Cards */}
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inventoryData.stats.totalItems}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fent Stock</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {inventoryData.stats.fentStock}
                  </p>
                </div>
                <Scissors className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aging Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {inventoryData.stats.agingItems}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Process</p>
                  <p className="text-2xl font-bold text-green-600">
                    {inventoryData.stats.processItems}
                  </p>
                </div>
                <Layers className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('fent')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'fent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Scissors className="h-4 w-4 inline mr-2" />
            Fent Inventory
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'process'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Droplets className="h-4 w-4 inline mr-2" />
            Process Tracking
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'aging'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Aging Stock
          </button>
        </div>

        {/* Tab Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeTab === 'fent' && 'Fent Inventory'}
                {activeTab === 'process' && 'Process Tracking'}
                {activeTab === 'aging' && 'Aging Stock Alert'}
              </CardTitle>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Fent Inventory Tab */}
            {activeTab === 'fent' && (
              <div className="space-y-4">
                {inventoryData.fentInventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Scissors className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">{item.id}</p>
                          <p className="text-sm text-gray-600">{item.design} - {item.color}</p>
                          <p className="text-xs text-gray-500">Batch: {item.originalBatch}</p>
                          <Badge variant="outline" className="mt-1">
                            {item.reason}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{item.quantity} {item.unit}</p>
                      <p className="text-sm text-gray-600">₹{item.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                    <div className="ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Process Tracking Tab */}
            {activeTab === 'process' && (
              <div className="space-y-4">
                {inventoryData.processTracking.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Droplets className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{item.item}</p>
                          <p className="text-sm text-gray-600">Batch: {item.batch}</p>
                          <Badge className={getStageColor(item.currentStage)}>
                            {item.currentStage}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{item.quantity} {item.unit}</p>
                        <p className="text-xs text-gray-500">Expected: {item.expectedCompletion}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Aging Stock Tab */}
            {activeTab === 'aging' && (
              <div className="space-y-4">
                {inventoryData.agingStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">{item.item}</p>
                          <p className="text-sm text-gray-600">{item.design}</p>
                          <p className="text-xs text-gray-500">Location: {item.location}</p>
                          <Badge className={getAgeColor(item.ageInDays)}>
                            {item.ageInDays} days old
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{item.quantity} {item.unit}</p>
                      <p className="text-sm text-gray-600">₹{item.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Last moved: {item.lastMovement}</p>
                    </div>
                    <div className="ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </ResponsiveContainer>
    </AppLayout>
  )
}
