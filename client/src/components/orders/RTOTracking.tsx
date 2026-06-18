'use client'

import { useState } from 'react'
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Package,
  Truck,
  DollarSign,
  FileText,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Edit,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RTODetails {
  _id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  originalDeliveryDate: string
  rtoDate: string
  rtoReason: string
  rtoAmount: number
  rtoStatus: 'pending' | 'processed' | 'completed'
  returnTrackingNumber: string
  returnNotes: string
  courierName: string
  returnLocation: string
  returnAddress: string
  returnContactPerson: string
  returnContactPhone: string
  returnContactEmail: string
  returnInstructions: string
  returnDocuments: string[]
  refundStatus: 'pending' | 'processed' | 'completed'
  refundAmount: number
  refundMethod: string
  refundDate?: string
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface RTOStats {
  totalRTOs: number
  pendingRTOs: number
  processedRTOs: number
  completedRTOs: number
  totalRTOAmount: number
  totalRefundAmount: number
  averageProcessingTime: number
  rtoByReason: Array<{
    reason: string
    count: number
    percentage: number
  }>
  rtoByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
}

// Mock data
const mockRTOData = {
  stats: {
    totalRTOs: 45,
    pendingRTOs: 12,
    processedRTOs: 18,
    completedRTOs: 15,
    totalRTOAmount: 125000,
    totalRefundAmount: 118000,
    averageProcessingTime: 3.2,
    rtoByReason: [
      { reason: 'Customer Not Available', count: 18, percentage: 40 },
      { reason: 'Wrong Address', count: 12, percentage: 27 },
      { reason: 'Customer Refused', count: 8, percentage: 18 },
      { reason: 'Damaged Package', count: 4, percentage: 9 },
      { reason: 'Other', count: 3, percentage: 6 }
    ],
    rtoByStatus: [
      { status: 'pending', count: 12, percentage: 27 },
      { status: 'processed', count: 18, percentage: 40 },
      { status: 'completed', count: 15, percentage: 33 }
    ]
  },
  rtoDetails: [
    {
      _id: 'RTO-001',
      orderNumber: 'ORD-2024-001',
      customerName: 'ABC Textiles Ltd.',
      customerEmail: 'info@abctextiles.com',
      customerPhone: '+91-9876543210',
      originalDeliveryDate: '2024-01-15T10:00:00Z',
      rtoDate: '2024-01-16T14:00:00Z',
      rtoReason: 'Customer Not Available',
      rtoAmount: 5000,
      rtoStatus: 'pending',
      returnTrackingNumber: 'RT123456789',
      returnNotes: 'Customer was not available at the address. Multiple attempts made.',
      courierName: 'Blue Dart Express',
      returnLocation: 'Mumbai Warehouse',
      returnAddress: 'Warehouse A, Sector 1, Mumbai, Maharashtra',
      returnContactPerson: 'Rajesh Kumar',
      returnContactPhone: '+91-9876543211',
      returnContactEmail: 'returns@company.com',
      returnInstructions: 'Package to be returned to main warehouse for inspection',
      returnDocuments: ['RTO Form', 'Delivery Attempt Report'],
      refundStatus: 'pending',
      refundAmount: 5000,
      refundMethod: 'Bank Transfer',
      companyId: 'company-001',
      createdBy: 'user-001',
      createdAt: '2024-01-16T14:00:00Z',
      updatedAt: '2024-01-16T14:00:00Z'
    },
    {
      _id: 'RTO-002',
      orderNumber: 'ORD-2024-002',
      customerName: 'XYZ Fabrics Pvt. Ltd.',
      customerEmail: 'info@xyzfabrics.com',
      customerPhone: '+91-9876543212',
      originalDeliveryDate: '2024-01-14T10:00:00Z',
      rtoDate: '2024-01-15T16:00:00Z',
      rtoReason: 'Wrong Address',
      rtoAmount: 3500,
      rtoStatus: 'processed',
      returnTrackingNumber: 'RT987654321',
      returnNotes: 'Address provided was incorrect. Customer has moved to new location.',
      courierName: 'DTDC Express',
      returnLocation: 'Delhi Warehouse',
      returnAddress: 'Warehouse B, Sector 2, Delhi, NCR',
      returnContactPerson: 'Amit Singh',
      returnContactPhone: '+91-9876543213',
      returnContactEmail: 'returns@company.com',
      returnInstructions: 'Package returned and inspected. Ready for reshipment.',
      returnDocuments: ['RTO Form', 'Address Verification Report'],
      refundStatus: 'processed',
      refundAmount: 3500,
      refundMethod: 'Credit Note',
      refundDate: '2024-01-17T10:00:00Z',
      companyId: 'company-001',
      createdBy: 'user-001',
      createdAt: '2024-01-15T16:00:00Z',
      updatedAt: '2024-01-17T10:00:00Z'
    }
  ]
}

export function RTOTracking() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [selectedRTO, setSelectedRTO] = useState<RTODetails | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const stats = mockRTOData.stats
  const rtoDetails = mockRTOData.rtoDetails

  // Filter RTOs based on search and filters
  const filteredRTOs = rtoDetails.filter(rto => {
    const matchesSearch = !searchTerm || 
      rto.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rto.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rto.returnTrackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || rto.rtoStatus === statusFilter
    const matchesReason = reasonFilter === 'all' || rto.rtoReason === reasonFilter
    
    return matchesSearch && matchesStatus && matchesReason
  })

  const getRTOStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full flex items-center"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'processed':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getRefundStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full flex items-center"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'processed':
        return `${baseClasses} bg-purple-100 text-purple-800`
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getProcessingProgress = (rto: RTODetails) => {
    switch (rto.rtoStatus) {
      case 'pending':
        return 25
      case 'processed':
        return 75
      case 'completed':
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* RTO Header */}
      <Card className="border-2 border-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-6 w-6 text-orange-600" />
            <span>RTO & Returns Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Return to Origin Tracking</h3>
              <p className="text-gray-600">
                Manage and track all return shipments, process refunds, and monitor RTO performance.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalRTOs}
              </div>
              <p className="text-sm text-gray-600">Total RTOs</p>
              <div className="text-2xl font-semibold text-red-600 mt-2">
                {formatCurrency(stats.totalRTOAmount)}
              </div>
              <p className="text-sm text-gray-600">Total RTO Amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RTO Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending RTOs</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingRTOs}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processed RTOs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processedRTOs}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed RTOs</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedRTOs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageProcessingTime} days</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">RTO Tracking</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
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
                    placeholder="Search RTOs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Reasons</option>
                    <option value="Customer Not Available">Customer Not Available</option>
                    <option value="Wrong Address">Wrong Address</option>
                    <option value="Customer Refused">Customer Refused</option>
                    <option value="Damaged Package">Damaged Package</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RTO List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>RTO Overview ({filteredRTOs.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRTOs.map((rto) => (
                  <div key={rto._id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <RotateCcw className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{rto.orderNumber}</h4>
                          <p className="text-sm text-gray-500">{rto.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRTOStatusBadge(rto.rtoStatus)}
                        {getRefundStatusBadge(rto.refundStatus)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">RTO Amount</p>
                        <p className="font-medium text-red-600">{formatCurrency(rto.rtoAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">RTO Date</p>
                        <p className="font-medium">{formatDate(rto.rtoDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Return Tracking</p>
                        <p className="font-medium">{rto.returnTrackingNumber}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">RTO Reason</p>
                      <p className="text-sm font-medium">{rto.rtoReason}</p>
                      {rto.returnNotes && (
                        <p className="text-sm text-gray-500 mt-1">{rto.returnNotes}</p>
                      )}
                    </div>

                    {/* Processing Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Processing Progress</span>
                        <span>{getProcessingProgress(rto as RTODetails)}%</span>
                      </div>
                      <Progress value={getProcessingProgress(rto as RTODetails)} className="h-2" />
                    </div>

                    {/* Return Details */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Return Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Courier:</span> {rto.courierName}
                        </div>
                        <div>
                          <span className="text-gray-600">Location:</span> {rto.returnLocation}
                        </div>
                        <div>
                          <span className="text-gray-600">Contact:</span> {rto.returnContactPerson}
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span> {rto.returnContactPhone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRTO(rto as RTODetails)
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
                        Last updated: {formatDate(rto.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RTO Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending RTOs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Pending RTOs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rtoDetails.filter(r => r.rtoStatus === 'pending').map((rto) => (
                    <div key={rto._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rto.orderNumber}</h4>
                        {getRTOStatusBadge(rto.rtoStatus)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rto.customerName}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>📦 Amount: {formatCurrency(rto.rtoAmount)}</p>
                        <p>📅 RTO Date: {formatDate(rto.rtoDate)}</p>
                        <p>🚚 Courier: {rto.courierName}</p>
                        <p>📍 Return to: {rto.returnLocation}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm">Process RTO</Button>
                        <Button size="sm" variant="outline">Update Status</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Processed RTOs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Processed RTOs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rtoDetails.filter(r => r.rtoStatus === 'processed').map((rto) => (
                    <div key={rto._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rto.orderNumber}</h4>
                        {getRTOStatusBadge(rto.rtoStatus)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rto.customerName}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>📦 Amount: {formatCurrency(rto.rtoAmount)}</p>
                        <p>📅 Processed: {formatDate(rto.updatedAt)}</p>
                        <p>📍 Current Location: {rto.returnLocation}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm">Mark Complete</Button>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Refund Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rtoDetails.map((rto) => (
                  <div key={rto._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{rto.orderNumber}</h4>
                        <p className="text-sm text-gray-500">{rto.customerName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRefundStatusBadge(rto.refundStatus)}
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(rto.refundAmount)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Refund Method</p>
                        <p className="font-medium">{rto.refundMethod}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Refund Status</p>
                        <p className="font-medium capitalize">{rto.refundStatus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Refund Date</p>
                        <p className="font-medium">
                          {rto.refundDate ? formatDate(rto.refundDate) : 'Pending'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Customer: {rto.customerEmail} | {rto.customerPhone}
                      </div>
                      <div className="flex space-x-2">
                        {rto.refundStatus === 'pending' && (
                          <Button size="sm">Process Refund</Button>
                        )}
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
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
            {/* RTO Reasons */}
            <Card>
              <CardHeader>
                <CardTitle>RTO Reasons Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.rtoByReason.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{reason.reason}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{reason.count}</span>
                        <span className="text-xs text-gray-500">({reason.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* RTO Status */}
            <Card>
              <CardHeader>
                <CardTitle>RTO Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.rtoByStatus.map((status, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{status.status}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{status.count}</span>
                        <span className="text-xs text-gray-500">({status.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(stats.totalRTOAmount)}
                  </div>
                  <p className="text-sm text-gray-600">Total RTO Amount</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(stats.totalRefundAmount)}
                  </div>
                  <p className="text-sm text-gray-600">Total Refunded</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {formatCurrency(stats.totalRTOAmount - stats.totalRefundAmount)}
                  </div>
                  <p className="text-sm text-gray-600">Pending Refunds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals would go here */}
      {/* RTO Details Modal */}
      {/* Edit RTO Modal */}
      {/* Process Refund Modal */}
    </div>
  )
}
