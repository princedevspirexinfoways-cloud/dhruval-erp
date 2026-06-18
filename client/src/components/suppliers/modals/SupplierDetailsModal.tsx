'use client'

import { useState } from 'react'
import {
  X,
  Phone,
  Mail,
  MapPin,
  Building,
  DollarSign,
  Package,
  Star,
  Clock,
  Shield,
  CheckCircle,
  Factory,
  Briefcase,
  Settings,
  Globe,
  Truck,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

interface SupplierDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: any
  onEdit?: () => void
}

export function SupplierDetailsModal({ isOpen, onClose, supplier, onEdit }: SupplierDetailsModalProps) {
  if (!isOpen || !supplier) return null

  // Helper functions
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      case 'blacklisted':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'approved':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'preferred':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
      case 'strategic':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
      case 'conditional':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getIndustryIcon = (industry: string) => {
    switch (industry?.toLowerCase()) {
      case 'automotive':
        return <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'manufacturing':
        return <Factory className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      case 'electronics':
        return <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      case 'food processing':
        return <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
      default:
        return <Building className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {supplier.supplierName?.charAt(0)?.toUpperCase() || 'S'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{supplier.supplierName}</h2>
                  <p className="text-sky-100">{supplier.supplierCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    onClick={onEdit}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-4 py-2 rounded-xl font-medium transition-all duration-200"
                  >
                    Edit
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 p-2 rounded-xl transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Status & Category */}
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getStatusColor(supplier.isActive ? 'active' : 'inactive')
                  )}>
                    {supplier.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span className={clsx(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getCategoryColor(supplier.relationship?.supplierCategory)
                  )}>
                    {supplier.relationship?.supplierCategory?.toUpperCase()}
                  </span>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{supplier.contactInfo?.primaryEmail || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{supplier.contactInfo?.primaryPhone || 'N/A'}</span>
                    </div>
                    {supplier.addresses?.[0] && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {supplier.addresses[0].city}, {supplier.addresses[0].state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Building className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Business Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getIndustryIcon(supplier.businessInfo?.industry)}
                      <span className="text-sm text-gray-600 dark:text-gray-300">{supplier.businessInfo?.industry || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Type:</span> {supplier.businessInfo?.businessType || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">GSTIN:</span> {supplier.registrationDetails?.gstin || 'N/A'}
                    </div>
                    {supplier.businessInfo?.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <a 
                          href={supplier.businessInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {supplier.businessInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 text-center">
                    <Package className="h-5 w-5 text-sky-600 dark:text-sky-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{supplier.supplyHistory?.totalOrders || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Orders</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(supplier.supplyHistory?.totalOrderValue || 0)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Total Spend</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{supplier.supplyHistory?.averageLeadTime || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Lead Time</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                    <Star className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{supplier.quality?.qualityRating || 0}%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Quality</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Performance
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">On-time Delivery</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{supplier.supplyHistory?.onTimeDeliveryRate || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Quality Rating</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{supplier.quality?.qualityRating || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Rejection Rate</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{supplier.supplyHistory?.qualityRejectionRate || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Financial
                  </h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Payment Terms:</span> {supplier.financialInfo?.paymentTerms || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Credit Days:</span> {supplier.financialInfo?.creditDays || 0} days
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Outstanding:</span> {formatCurrency(supplier.financialInfo?.outstandingPayable || 0)}
                    </div>
                  </div>
                </div>

                {/* Relationship Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Relationship
                  </h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Type:</span> {supplier.relationship?.supplierType || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Priority:</span> {supplier.relationship?.priority || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Since:</span> {formatDate(supplier.relationship?.supplierSince)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Strategic:</span> {supplier.relationship?.strategicPartner ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Compliance
                  </h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Status:</span> {supplier.compliance?.vendorApprovalStatus || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Risk:</span> {supplier.compliance?.riskCategory || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Blacklisted:</span> {supplier.compliance?.blacklisted ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Last updated: {formatDate(supplier.updatedAt)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                className="bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
