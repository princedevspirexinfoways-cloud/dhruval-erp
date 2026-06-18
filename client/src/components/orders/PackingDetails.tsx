'use client'

import { useState } from 'react'
import { 
  Package, 
  FileText, 
  Hash, 
  Ruler, 
  Weight, 
  Box,
  Calendar,
  User,
  Edit,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PackingDetails {
  _id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  billNumber: string
  lrNumber: string
  packageCount: number
  packageWeight: number
  packageDimensions: {
    length: number
    width: number
    height: number
  }
  packingMaterial: string[]
  specialInstructions: string
  packingDate: string
  packedBy: string
  packingStatus: 'pending' | 'in_progress' | 'completed' | 'verified'
  qualityCheckStatus: 'pending' | 'passed' | 'failed'
  qualityCheckNotes?: string
  qualityCheckedBy?: string
  qualityCheckDate?: string
  packageImages: string[]
  packingChecklist: {
    item: string
    checked: boolean
    notes?: string
  }[]
  totalVolume: number
  totalWeight: number
  shippingClass: 'standard' | 'express' | 'priority'
  fragileItems: boolean
  temperatureSensitive: boolean
  specialHandling: boolean
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface PackingStats {
  totalPackages: number
  pendingPacking: number
  completedPacking: number
  verifiedPacking: number
  totalWeight: number
  totalVolume: number
  averagePackageWeight: number
  packingEfficiency: number
  packagesByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  packagesByMaterial: Array<{
    material: string
    count: number
    percentage: number
  }>
}

// Mock data
const mockPackingData = {
  stats: {
    totalPackages: 89,
    pendingPacking: 12,
    completedPacking: 65,
    verifiedPacking: 12,
    totalWeight: 4500,
    totalVolume: 125,
    averagePackageWeight: 50.6,
    packingEfficiency: 87,
    packagesByStatus: [
      { status: 'pending', count: 12, percentage: 13 },
      { status: 'in_progress', count: 0, percentage: 0 },
      { status: 'completed', count: 65, percentage: 73 },
      { status: 'verified', count: 12, percentage: 14 }
    ],
    packagesByMaterial: [
      { material: 'Cardboard Boxes', count: 45, percentage: 51 },
      { material: 'Wooden Crates', count: 23, percentage: 26 },
      { material: 'Plastic Containers', count: 15, percentage: 17 },
      { material: 'Other', count: 6, percentage: 6 }
    ]
  },
  packingDetails: [
    {
      _id: 'PACK-001',
      orderNumber: 'ORD-2024-001',
      customerName: 'ABC Textiles Ltd.',
      customerEmail: 'info@abctextiles.com',
      billNumber: 'BILL-2024-001',
      lrNumber: 'LR-2024-001',
      packageCount: 5,
      packageWeight: 250,
      packageDimensions: { length: 100, width: 80, height: 60 },
      packingMaterial: ['Cardboard Boxes', 'Bubble Wrap', 'Packing Tape'],
      specialInstructions: 'Handle with care. Fragile items inside.',
      packingDate: '2024-01-15T10:00:00Z',
      packedBy: 'Rajesh Kumar',
      packingStatus: 'completed',
      qualityCheckStatus: 'passed',
      qualityCheckNotes: 'All packages properly sealed and labeled',
      qualityCheckedBy: 'Quality Team A',
      qualityCheckDate: '2024-01-15T14:00:00Z',
      packageImages: ['package1.jpg', 'package2.jpg'],
      packingChecklist: [
        { item: 'Items counted correctly', checked: true },
        { item: 'Packages sealed properly', checked: true },
        { item: 'Labels attached', checked: true },
        { item: 'Special instructions noted', checked: true },
        { item: 'Weight verified', checked: true }
      ],
      totalVolume: 24,
      totalWeight: 250,
      shippingClass: 'standard',
      fragileItems: true,
      temperatureSensitive: false,
      specialHandling: false,
      companyId: 'company-001',
      createdBy: 'user-001',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z'
    },
    {
      _id: 'PACK-002',
      orderNumber: 'ORD-2024-002',
      customerName: 'XYZ Fabrics Pvt. Ltd.',
      customerEmail: 'info@xyzfabrics.com',
      billNumber: 'BILL-2024-002',
      lrNumber: 'LR-2024-002',
      packageCount: 3,
      packageWeight: 180,
      packageDimensions: { length: 90, width: 70, height: 50 },
      packingMaterial: ['Wooden Crates', 'Foam Padding', 'Stretch Wrap'],
      specialInstructions: 'Keep dry. Store in cool place.',
      packingDate: '2024-01-14T14:00:00Z',
      packedBy: 'Amit Singh',
      packingStatus: 'verified',
      qualityCheckStatus: 'passed',
      qualityCheckNotes: 'Excellent packing quality. Ready for dispatch.',
      qualityCheckedBy: 'Quality Team B',
      qualityCheckDate: '2024-01-14T16:00:00Z',
      packageImages: ['package3.jpg', 'package4.jpg'],
      packingChecklist: [
        { item: 'Items counted correctly', checked: true },
        { item: 'Packages sealed properly', checked: true },
        { item: 'Labels attached', checked: true },
        { item: 'Special instructions noted', checked: true },
        { item: 'Weight verified', checked: true }
      ],
      totalVolume: 15.75,
      totalWeight: 180,
      shippingClass: 'express',
      fragileItems: false,
      temperatureSensitive: true,
      specialHandling: true,
      companyId: 'company-001',
      createdBy: 'user-001',
      createdAt: '2024-01-14T14:00:00Z',
      updatedAt: '2024-01-14T16:00:00Z'
    }
  ]
}

export function PackingDetails() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [selectedPacking, setSelectedPacking] = useState<PackingDetails | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const stats = mockPackingData.stats
  const packingDetails = mockPackingData.packingDetails

  // Filter packing details based on search and filters
  const filteredPacking = packingDetails.filter(packing => {
    const matchesSearch = !searchTerm || 
      packing.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      packing.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      packing.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      packing.lrNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || packing.packingStatus === statusFilter
    const matchesMaterial = materialFilter === 'all' || 
      packing.packingMaterial.some(material => material === materialFilter)
    
    return matchesSearch && matchesStatus && matchesMaterial
  })

  const getPackingStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full flex items-center"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'verified':
        return `${baseClasses} bg-purple-100 text-purple-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getQualityStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full flex items-center"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'passed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getShippingClassBadge = (shippingClass: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (shippingClass) {
      case 'standard':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'express':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'priority':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatWeight = (weight: number) => {
    return `${weight} kg`
  }

  const formatVolume = (volume: number) => {
    return `${volume} m³`
  }

  const getPackingProgress = (packing: PackingDetails) => {
    switch (packing.packingStatus) {
      case 'pending':
        return 25
      case 'in_progress':
        return 50
      case 'completed':
        return 75
      case 'verified':
        return 100
      default:
        return 0
    }
  }

  const getChecklistProgress = (packing: PackingDetails) => {
    const checkedItems = packing.packingChecklist.filter(item => item.checked).length
    return (checkedItems / packing.packingChecklist.length) * 100
  }

  return (
    <div className="space-y-6">
      {/* Packing Header */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-blue-600" />
            <span>Packing Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Package Packing & Quality Control</h3>
              <p className="text-gray-600">
                Manage package packing, quality checks, and prepare items for dispatch with comprehensive tracking.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalPackages}
              </div>
              <p className="text-sm text-gray-600">Total Packages</p>
              <div className="text-2xl font-semibold text-green-600 mt-2">
                {formatWeight(stats.totalWeight)}
              </div>
              <p className="text-sm text-gray-600">Total Weight</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packing Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Packing</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingPacking}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Packing</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedPacking}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Packing</p>
                <p className="text-2xl font-bold text-purple-600">{stats.verifiedPacking}</p>
              </div>
              <Box className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Packing Efficiency</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.packingEfficiency}%</p>
              </div>
              <Settings className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="packing">Packing Status</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Materials</option>
                    <option value="Cardboard Boxes">Cardboard Boxes</option>
                    <option value="Wooden Crates">Wooden Crates</option>
                    <option value="Plastic Containers">Plastic Containers</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packing List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Packing Overview ({filteredPacking.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPacking.map((packing) => (
                  <div key={packing._id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{packing.orderNumber}</h4>
                          <p className="text-sm text-gray-500">{packing.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPackingStatusBadge(packing.packingStatus)}
                        {getQualityStatusBadge(packing.qualityCheckStatus)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Bill Number</p>
                        <p className="font-medium">{packing.billNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">LR Number</p>
                        <p className="font-medium">{packing.lrNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Package Count</p>
                        <p className="font-medium">{packing.packageCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Weight</p>
                        <p className="font-medium">{formatWeight(packing.totalWeight)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Dimensions (L×W×H)</p>
                        <p className="font-medium">
                          {packing.packageDimensions.length} × {packing.packageDimensions.width} × {packing.packageDimensions.height} cm
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Packing Materials</p>
                        <p className="font-medium">{packing.packingMaterial.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Shipping Class</p>
                        <div className="mt-1">{getShippingClassBadge(packing.shippingClass)}</div>
                      </div>
                    </div>

                    {/* Special Handling Indicators */}
                    <div className="flex items-center space-x-2 mb-3">
                      {packing.fragileItems && (
                        <Badge variant="destructive">Fragile</Badge>
                      )}
                      {packing.temperatureSensitive && (
                        <Badge variant="secondary">Temperature Sensitive</Badge>
                      )}
                      {packing.specialHandling && (
                        <Badge variant="outline">Special Handling</Badge>
                      )}
                    </div>

                    {/* Packing Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Packing Progress</span>
                        <span>{getPackingProgress(packing as PackingDetails)}%</span>
                      </div>
                      <Progress value={getPackingProgress(packing as PackingDetails)} className="h-2" />
                    </div>

                    {/* Checklist Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Checklist Progress</span>
                        <span>{Math.round(getChecklistProgress(packing as PackingDetails))}%</span>
                      </div>
                      <Progress value={getChecklistProgress(packing as PackingDetails)} className="h-2" />
                    </div>

                    {/* Packing Details */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Packing Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Packed By:</span> {packing.packedBy}
                        </div>
                        <div>
                          <span className="text-gray-600">Packing Date:</span> {formatDate(packing.packingDate)}
                        </div>
                        {packing.qualityCheckedBy && (
                          <div>
                            <span className="text-gray-600">QC By:</span> {packing.qualityCheckedBy}
                          </div>
                        )}
                        {packing.qualityCheckDate && (
                          <div>
                            <span className="text-gray-600">QC Date:</span> {formatDate(packing.qualityCheckDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPacking(packing as PackingDetails)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Last updated: {formatDate(packing.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packing Status Tab */}
        <TabsContent value="packing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Packing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Pending Packing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packingDetails.filter(p => p.packingStatus === 'pending').map((packing) => (
                    <div key={packing._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{packing.orderNumber}</h4>
                        {getPackingStatusBadge(packing.packingStatus)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{packing.customerName}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>📦 Package Count: {packing.packageCount}</p>
                        <p>📅 Order Date: {formatDate(packing.createdAt)}</p>
                        <p>📋 Bill: {packing.billNumber}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm">Start Packing</Button>
                        <Button size="sm" variant="outline">View Order</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Completed Packing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Completed Packing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packingDetails.filter(p => p.packingStatus === 'completed').map((packing) => (
                    <div key={packing._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{packing.orderNumber}</h4>
                        {getPackingStatusBadge(packing.packingStatus)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{packing.customerName}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>📦 Package Count: {packing.packageCount}</p>
                        <p>⚖️ Total Weight: {formatWeight(packing.totalWeight)}</p>
                        <p>📦 Packed By: {packing.packedBy}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm">Quality Check</Button>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Control Tab */}
        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Quality Control</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packingDetails.filter(p => p.packingStatus === 'completed' && p.qualityCheckStatus === 'pending').map((packing) => (
                  <div key={packing._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{packing.orderNumber}</h4>
                        <p className="text-sm text-gray-500">{packing.customerName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPackingStatusBadge(packing.packingStatus)}
                        {getQualityStatusBadge(packing.qualityCheckStatus)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Package Count</p>
                        <p className="font-medium">{packing.packageCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Weight</p>
                        <p className="font-medium">{formatWeight(packing.totalWeight)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Packed By</p>
                        <p className="font-medium">{packing.packedBy}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <Button size="sm">Start QC</Button>
                      <Button size="sm" variant="outline">View Packing Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Packing Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Packing Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.packagesByStatus.map((status, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{status.status.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{status.count}</span>
                        <span className="text-xs text-gray-500">({status.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Packing Materials Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Packing Materials Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.packagesByMaterial.map((material, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{material.material}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{material.count}</span>
                        <span className="text-xs text-gray-500">({material.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.totalPackages}
                  </div>
                  <p className="text-sm text-gray-600">Total Packages</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatWeight(stats.totalWeight)}
                  </div>
                  <p className="text-sm text-gray-600">Total Weight</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatVolume(stats.totalVolume)}
                  </div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatWeight(stats.averagePackageWeight)}
                  </div>
                  <p className="text-sm text-gray-600">Avg. Package Weight</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals would go here */}
      {/* Packing Details Modal */}
      {/* Edit Packing Modal */}
      {/* Quality Check Modal */}
    </div>
  )
}
