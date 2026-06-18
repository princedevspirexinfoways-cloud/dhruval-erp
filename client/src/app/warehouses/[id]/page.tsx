'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetWarehouseByIdQuery, useDeleteWarehouseMutation } from '@/lib/api/warehousesApi'
import { useGetCompanyByIdQuery } from '@/lib/features/companies/companiesApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Warehouse, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Package, 
  Users, 
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  BarChart3,
  Settings,
  Download,
  Share2,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Activity,
  Thermometer,
  Zap,
  Shield,
  Truck,
  Forklift,
  Palette,
  Tag,
  FileText,
  Database,
  HardDrive,
  Layers,
  Grid3X3,
  List,
  PieChart,
  LineChart,
  Weight,
  Loader2,
  Globe,
  CheckSquare,
  Square
} from 'lucide-react'
import { toast } from 'sonner'
import { Can } from '@/lib/casl/Can'

export default function WarehouseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const warehouseId = params.id as string
  
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)

  const [viewMode, setViewMode] = useState<'overview' | 'stock' | 'operations' | 'analytics'>('overview')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch warehouse data
  const { data: warehouseData, isLoading, error, refetch } = useGetWarehouseByIdQuery(warehouseId)
  const [deleteWarehouse] = useDeleteWarehouseMutation()

  const warehouse = warehouseData?.data

  // Fetch company data if warehouse has companyId
  const { data: companyData, isLoading: companyLoading } = useGetCompanyByIdQuery(
    warehouse?.companyId || '',
    { skip: !warehouse?.companyId }
  )
  
  const company = companyData?.data

  const handleEdit = () => {
    router.push(`/warehouses/${warehouseId}/edit`)
  }

  const handleDelete = async () => {
    try {
      await deleteWarehouse(warehouseId).unwrap()
      toast.success('Warehouse deleted successfully')
      router.push('/warehouses')
    } catch (error) {
      toast.error('Failed to delete warehouse')
      console.error('Error:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'inactive':
        return <XCircle className="w-4 h-4" />
      case 'maintenance':
        return <Wrench className="w-4 h-4" />
      case 'closed':
        return <XCircle className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'distribution':
        return '🚚'
      case 'manufacturing':
        return '🏭'
      case 'retail':
        return '🛍️'
      case 'cold_storage':
        return '❄️'
      case 'hazardous':
        return '⚠️'
      case 'bonded':
        return '🔒'
      case 'transit':
        return '🚛'
      case 'cross_dock':
        return '🔄'
      default:
        return '🏠'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const getUtilizationPercentage = (current: number, max: number) => {
    if (max === 0) return 0
    return Math.round((current / max) * 100)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-sky-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading warehouse details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !warehouse) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Warehouse</h2>
            <p className="text-gray-600 mb-4">There was an error loading the warehouse data.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">{getTypeIcon(warehouse.warehouseType)}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{warehouse.warehouseName}</h1>
                  <Badge className={getStatusColor(warehouse.status)}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(warehouse.status)}
                      <span className="capitalize">{warehouse.status}</span>
                    </span>
                  </Badge>
                  {warehouse.warehouseCode && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      {warehouse.warehouseCode}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-lg mb-3">
                  {warehouse.description || 'No description available'}
                </p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>{warehouse.warehouseType?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>{warehouse.ownershipType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(warehouse.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <Can I="update" a="Warehouse">
                <Button onClick={handleEdit} className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
              </Can>
              
              <Can I="delete" a="Warehouse">
                <Button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </Button>
              </Can>
              
              <Button onClick={() => router.push('/warehouses')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Area</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouse.specifications?.totalArea ? 
                    `${formatNumber(warehouse.specifications.totalArea)} sq ft` : 'N/A'
                  }
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Warehouse className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouse.currentUtilization && warehouse.capacity ? 
                    `${getUtilizationPercentage(warehouse.currentUtilization.currentWeight, warehouse.capacity.maxWeight)}%` : 'N/A'
                  }
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouse.management?.totalStaff || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Max Weight</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouse.capacity?.maxWeight ? 
                    `${formatNumber(warehouse.capacity.maxWeight)} kg` : 'N/A'
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Weight className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setViewMode('stock')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'stock'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Stock & Inventory</span>
            </button>
            <button
              onClick={() => setViewMode('operations')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'operations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Operations</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Content Based on View Mode */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {viewMode === 'overview' && (
            <div className="p-6 space-y-8">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-sky-600" />
                  <span>Company Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Company:</span>
                      <span className="text-sm text-gray-900">
                        {companyLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : company ? (
                          <span className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-sky-600" />
                            <span>{company.companyName}</span>
                            <Badge variant="outline" className="text-xs">
                              {company.companyCode}
                            </Badge>
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Warehouse ID:</span>
                      <span className="text-sm text-gray-900 font-mono">{warehouse._id}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Status:</span>
                      <Badge className={getStatusColor(warehouse.status)}>
                        {getStatusIcon(warehouse.status)}
                        <span className="ml-1 capitalize">{warehouse.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Type:</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {warehouse.warehouseType?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Ownership:</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {warehouse.ownershipType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Operation:</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {warehouse.operationType || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-sky-600" />
                  <span>Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Primary Phone:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.contactInfo?.primaryPhone || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Alternate Phone:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.contactInfo?.alternatePhone || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Email:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.contactInfo?.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Fax:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.contactInfo?.fax || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-sky-600" />
                  <span>Address Information</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-24">Address:</span>
                    <span className="text-sm text-gray-900">
                      {warehouse.address?.addressLine1 || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-24">City:</span>
                    <span className="text-sm text-gray-900">
                      {warehouse.address?.city || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-24">State:</span>
                    <span className="text-sm text-gray-900">
                      {warehouse.address?.state || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-24">Pincode:</span>
                    <span className="text-sm text-gray-900">
                      {warehouse.address?.pincode || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-24">Country:</span>
                    <span className="text-sm text-gray-900">
                      {warehouse.address?.country || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-sky-600" />
                  <span>Physical Specifications</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Total Area:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.specifications?.totalArea ? 
                          `${formatNumber(warehouse.specifications.totalArea)} sq ft` : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Storage Area:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.specifications?.storageArea ? 
                          `${formatNumber(warehouse.specifications.storageArea)} sq ft` : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Height:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.specifications?.height ? 
                          `${formatNumber(warehouse.specifications.height)} ft` : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Office Area:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.specifications?.officeArea ? 
                          `${formatNumber(warehouse.specifications.officeArea)} sq ft` : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Dock Doors:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.specifications?.dockDoors || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Floors:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.specifications?.floors || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Management Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  <span>Management Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Manager:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.management?.warehouseManagerName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Assistant:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.management?.assistantManagerName || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Total Staff:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.management?.totalStaff || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-24">Supervisors:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.management?.supervisorIds?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'stock' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Package className="w-5 h-5 text-sky-600" />
                <span>Stock & Inventory</span>
              </h3>
              
              {/* Current Utilization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Weight Utilization</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {warehouse.currentUtilization && warehouse.capacity ? 
                        `${getUtilizationPercentage(warehouse.currentUtilization.currentWeight, warehouse.capacity.maxWeight)}%` : '0%'
                      }
                    </span>
                    <Weight className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {warehouse.currentUtilization?.currentWeight || 0} / {warehouse.capacity?.maxWeight || 0} kg
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Volume Utilization</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {warehouse.currentUtilization && warehouse.capacity ? 
                        `${getUtilizationPercentage(warehouse.currentUtilization.currentVolume, warehouse.capacity.maxVolume)}%` : '0%'
                      }
                    </span>
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {warehouse.currentUtilization?.currentVolume || 0} / {warehouse.capacity?.maxVolume || 0} m³
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Pallets Utilization</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {warehouse.currentUtilization && warehouse.capacity ? 
                        `${getUtilizationPercentage(warehouse.currentUtilization.currentPallets, warehouse.capacity.maxPallets || 0)}%` : '0%'
                      }
                    </span>
                    <Layers className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {warehouse.currentUtilization?.currentPallets || 0} / {warehouse.capacity?.maxPallets || 0}
                  </div>
                </div>
              </div>

              {/* Capacity vs Utilization Chart Placeholder */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">Capacity vs Utilization</h4>
                <p className="text-gray-500">Interactive chart showing capacity utilization over time</p>
              </div>

              {/* Stock Items Placeholder */}
              <div className="mt-8 bg-gray-50 rounded-lg p-8 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">Stock Items</h4>
                <p className="text-gray-500">Detailed inventory items will be displayed here</p>
              </div>
            </div>
          )}

          {viewMode === 'operations' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-sky-600" />
                <span>Operations</span>
              </h3>
              
              {/* Staff Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Staff Overview</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Staff:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {warehouse.management?.totalStaff || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Warehouse Manager:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.management?.warehouseManagerName || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Assistant Manager:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.management?.assistantManagerName || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Supervisors:</span>
                      <span className="text-sm text-gray-900">
                        {warehouse.management?.supervisorIds?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Working Hours</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Operation Type:</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {warehouse.operationType || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Working Days:</span>
                      <span className="text-sm text-gray-900">Monday - Friday</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Shift Hours:</span>
                      <span className="text-sm text-gray-900">8:00 AM - 6:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities Placeholder */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">Recent Activities</h4>
                <p className="text-gray-500">Recent warehouse operations and activities will be displayed here</p>
              </div>
            </div>
          )}

          {viewMode === 'analytics' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                <span>Analytics</span>
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">Performance Analytics</h4>
                <p className="text-gray-500">Comprehensive analytics and performance metrics will be displayed here</p>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Warehouse</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{warehouse.warehouseName}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
