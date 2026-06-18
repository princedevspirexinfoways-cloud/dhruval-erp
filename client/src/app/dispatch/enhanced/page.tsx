'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveContainer, ResponsiveGrid } from '@/components/ui/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  Calendar,
  RotateCcw,
  XCircle,
  Plane,
  Navigation
} from 'lucide-react'

// Mock data for enhanced dispatch management
const dispatchData = {
  stats: {
    totalDispatches: 156,
    inTransit: 23,
    delivered: 128,
    rtoReturns: 5
  },
  recentDispatches: [
    {
      id: 'DISP-2024-001',
      orderId: 'ORD-2024-001',
      customer: 'ABC Textiles Ltd',
      items: 'Printed Sarees - 25 pcs',
      awb: 'AWB123456789',
      courier: 'Blue Dart',
      mode: 'air',
      destination: 'Mumbai, Maharashtra',
      dispatchDate: '2024-01-15',
      expectedDelivery: '2024-01-17',
      status: 'in_transit',
      packingList: 'PL-001.pdf',
      invoice: 'INV-2024-001'
    },
    {
      id: 'DISP-2024-002',
      orderId: 'ORD-2024-002',
      customer: 'Fashion Hub',
      items: 'African Cotton - 100m',
      awb: 'AWB987654321',
      courier: 'DTDC',
      mode: 'road',
      destination: 'Delhi, Delhi',
      dispatchDate: '2024-01-14',
      expectedDelivery: '2024-01-18',
      status: 'delivered',
      packingList: 'PL-002.pdf',
      invoice: 'INV-2024-002'
    },
    {
      id: 'DISP-2024-003',
      orderId: 'ORD-2024-003',
      customer: 'XYZ Garments',
      items: 'Digital Print Fabric - 50m',
      awb: 'AWB456789123',
      courier: 'Delhivery',
      mode: 'road',
      destination: 'Bangalore, Karnataka',
      dispatchDate: '2024-01-12',
      expectedDelivery: '2024-01-16',
      status: 'rto',
      packingList: 'PL-003.pdf',
      invoice: 'INV-2024-003'
    }
  ],
  packingDetails: [
    {
      id: 'PACK-001',
      orderId: 'ORD-2024-001',
      cartons: 3,
      weight: '15.5 kg',
      dimensions: '60x40x30 cm',
      items: [
        { sku: 'SAR-001', design: 'Floral Red', quantity: 10 },
        { sku: 'SAR-002', design: 'Floral Blue', quantity: 15 }
      ]
    }
  ],
  rtoTracking: [
    {
      id: 'RTO-001',
      dispatchId: 'DISP-2024-003',
      customer: 'XYZ Garments',
      reason: 'Address not found',
      returnDate: '2024-01-16',
      status: 'returned',
      action: 'Contact customer for correct address'
    }
  ]
}

export default function EnhancedDispatchPage() {
  const [activeTab, setActiveTab] = useState('dispatches')
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'in_transit': return 'bg-blue-100 text-blue-800'
      case 'dispatched': return 'bg-yellow-100 text-yellow-800'
      case 'rto': return 'bg-red-100 text-red-800'
      case 'returned': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getModeIcon = (mode: string) => {
    return mode === 'air' ? <Plane className="h-4 w-4" /> : <Truck className="h-4 w-4" />
  }

  return (
    <AppLayout>
      <ResponsiveContainer className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Enhanced Dispatch & Packing Management"
          description="Complete dispatch tracking with AWB, courier, and RTO management"
          icon={<Send className="h-6 w-6 text-white" />}
        />

        {/* Stats Cards */}
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Dispatches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dispatchData.stats.totalDispatches}
                  </p>
                </div>
                <Send className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dispatchData.stats.inTransit}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dispatchData.stats.delivered}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">RTO Returns</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dispatchData.stats.rtoReturns}
                  </p>
                </div>
                <RotateCcw className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dispatches')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dispatches'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="h-4 w-4 inline mr-2" />
            Dispatches
          </button>
          <button
            onClick={() => setActiveTab('packing')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'packing'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Packing Lists
          </button>
          <button
            onClick={() => setActiveTab('rto')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'rto'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            RTO Tracking
          </button>
        </div>

        {/* Tab Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeTab === 'dispatches' && 'Dispatch Tracking'}
                {activeTab === 'packing' && 'Packing Lists'}
                {activeTab === 'rto' && 'RTO & Returns'}
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Dispatch
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Dispatches Tab */}
            {activeTab === 'dispatches' && (
              <div className="space-y-4">
                {dispatchData.recentDispatches.map((dispatch) => (
                  <div key={dispatch.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getModeIcon(dispatch.mode)}
                        <div>
                          <p className="font-medium text-gray-900">{dispatch.id}</p>
                          <p className="text-sm text-gray-600">{dispatch.customer}</p>
                          <p className="text-xs text-gray-500">{dispatch.items}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(dispatch.status)}>
                          {dispatch.status?.replace('_', ' ') || 'Unknown Status'}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">AWB: {dispatch.awb}</p>
                        <p className="text-xs text-gray-500">{dispatch.courier}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{dispatch.destination || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Dispatched: {dispatch.dispatchDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>ETA: {dispatch.expectedDelivery}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Packing List
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Invoice
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Navigation className="h-4 w-4 mr-1" />
                          Track
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Packing Lists Tab */}
            {activeTab === 'packing' && (
              <div className="space-y-4">
                {dispatchData.packingDetails.map((pack) => (
                  <div key={pack.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{pack.id}</p>
                          <p className="text-sm text-gray-600">Order: {pack.orderId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{pack.cartons} Cartons</p>
                        <p className="text-sm text-gray-600">{pack.weight}</p>
                        <p className="text-xs text-gray-500">{pack.dimensions}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Items:</p>
                      {pack.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{item.sku} - {item.design}</span>
                          <span>{item.quantity} pcs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RTO Tracking Tab */}
            {activeTab === 'rto' && (
              <div className="space-y-4">
                {dispatchData.rtoTracking.map((rto) => (
                  <div key={rto.id} className="p-4 border rounded-lg border-red-200 bg-red-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">{rto.id}</p>
                          <p className="text-sm text-gray-600">{rto.customer}</p>
                          <p className="text-xs text-red-600">Dispatch: {rto.dispatchId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(rto.status)}>
                          {rto.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">Return: {rto.returnDate}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Reason:</strong> {rto.reason}</p>
                      <p className="text-sm"><strong>Action:</strong> {rto.action}</p>
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
