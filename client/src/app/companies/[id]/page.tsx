'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  Building2,
  Edit,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  MapPin,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Calendar,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  Shield,
  AlertCircle
} from 'lucide-react'
import { useSelector } from 'react-redux'

import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { selectIsSuperAdmin, selectCurrentCompanyId } from '@/lib/features/auth/authSlice'
import { useGetCompanyByIdQuery, useUpdateCompanyMutation, useGetCompanyDetailedStatsQuery } from '@/lib/features/companies/companiesApi'

// Helper functions for company status with dark mode support
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
    case 'inactive':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    case 'suspended':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
    case 'pending_approval':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
    case 'under_review':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  }
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
    case 'inactive':
      return <XCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    case 'suspended':
      return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
    case 'pending_approval':
      return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
    case 'under_review':
      return <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    default:
      return <XCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'suspended':
      return 'Suspended'
    case 'pending_approval':
      return 'Pending Approval'
    case 'under_review':
      return 'Under Review'
    default:
      return 'Unknown'
  }
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const currentCompanyId = useSelector(selectCurrentCompanyId)
  const companyId = params.id as string

  const { data: companyData, isLoading, error, refetch } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId
  })

  const { data: statsData, isLoading: statsLoading } = useGetCompanyDetailedStatsQuery(companyId, {
    skip: !companyId
  })

  const [updateCompany, { isLoading: updateLoading }] = useUpdateCompanyMutation()

  const company = companyData?.data

  // Access control: non-superadmin can only view their own company
  if (!isSuperAdmin && currentCompanyId && companyId !== currentCompanyId) {
    useEffect(() => {
      router.replace(`/companies/${currentCompanyId}`)
    }, [router, currentCompanyId])
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Shield className="h-12 w-12 text-sky-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loading your company…</h2>
              <p className="text-gray-600 dark:text-gray-400">Redirecting to your company details</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }
  if (!isSuperAdmin && !currentCompanyId) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Shield className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Company Access Required</h2>
              <p className="text-gray-600 dark:text-gray-300">Your account doesn’t have a company assigned.</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-6 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error || !company) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-6 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 dark:text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Company</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">There was an error loading the company data.</p>
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
        </div>
      </AppLayout>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'inactive':
        return <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      case 'suspended':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      case 'under_review':
        return <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
      case 'suspended':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
      case 'pending_approval':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
      case 'under_review':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'suspended':
        return 'Suspended'
      case 'pending_approval':
        return 'Pending Approval'
      case 'under_review':
        return 'Under Review'
      default:
        return 'Unknown'
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-6 sm:p-8 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                    {company.companyName}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-600 dark:text-gray-300 font-mono">
                      {company.companyCode}
                    </span>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(company.status || 'unknown')}`}>
                      {getStatusIcon(company.status || 'unknown')}
                      {getStatusText(company.status || 'unknown')}
                    </div>
                  </div>
                </div>
              </div>
              {isSuperAdmin && (
                <Button
                  onClick={() => router.push(`/companies/${company._id}/edit`)}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-semibold rounded-xl"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Company
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-sky-600 dark:text-sky-400" />
                  Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Company Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{company.companyName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Legal Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{company.legalName || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Company Code</label>
                    <p className="text-gray-900 dark:text-white font-mono">{company.companyCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(company.status || 'unknown')}`}>
                      {getStatusIcon(company.status || 'unknown')}
                      {getStatusText(company.status || 'unknown')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Company Statistics
                </h2>
                {statsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Users</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{statsData?.data?.totalUsers || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">Production</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{statsData?.data?.totalProduction || 0}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{statsData?.data?.totalOrders || 0}</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Stock Items</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{statsData?.data?.totalInventory || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">₹{(statsData?.data?.totalRevenue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Registration Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">GSTIN</label>
                    <p className="text-gray-900 dark:text-white font-mono">{company.registrationDetails?.gstin || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">PAN</label>
                    <p className="text-gray-900 dark:text-white font-mono">{company.registrationDetails?.pan || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">CIN</label>
                    <p className="text-gray-900 dark:text-white font-mono">{company.registrationDetails?.cin || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Registration Date</label>
                    <p className="text-gray-900 dark:text-white">
                      {company.registrationDetails?.registrationDate
                        ? new Date(company.registrationDetails.registrationDate).toLocaleDateString('en-IN')
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {company.contactInfo?.emails?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email Addresses</label>
                      <div className="space-y-2">
                        {company.contactInfo.emails.map((email: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-900 dark:text-white">{email.type}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {email.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {company.contactInfo?.phones?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Phone Numbers</label>
                      <div className="space-y-2">
                        {company.contactInfo.phones.map((phone: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-900 dark:text-white">{phone.type}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {phone.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {company.contactInfo?.website && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Website</label>
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <a
                          href={company.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        >
                          {company.contactInfo.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.contactInfo?.socialMedia?.linkedin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">LinkedIn</label>
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <a
                          href={company.contactInfo.socialMedia.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        >
                          {company.contactInfo.socialMedia.linkedin}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                  Addresses
                </h2>
                <div className="space-y-6">
                  {/* Registered Office */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Registered Office</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Street</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.registeredOffice?.street || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Area</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.registeredOffice?.area || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.registeredOffice?.city || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">State</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.registeredOffice?.state || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pincode</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.registeredOffice?.pincode || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Country</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.registeredOffice?.country || 'India'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Factory Address */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Factory Address</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Street</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.factoryAddress?.street || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Area</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.factoryAddress?.area || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.factoryAddress?.city || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">State</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.factoryAddress?.state || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pincode</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.factoryAddress?.pincode || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Country</label>
                          <p className="text-gray-900 dark:text-white">{company.addresses?.factoryAddress?.country || 'India'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Addresses */}
                  {company.addresses?.warehouseAddresses && company.addresses.warehouseAddresses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Warehouse Addresses</h3>
                      <div className="space-y-4">
                        {company.addresses.warehouseAddresses.map((warehouse: any, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">{warehouse.warehouseName}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Street</label>
                                <p className="text-gray-900 dark:text-white">{warehouse.street || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Area</label>
                                <p className="text-gray-900 dark:text-white">{warehouse.area || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
                                <p className="text-gray-900 dark:text-white">{warehouse.city || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">State</label>
                                <p className="text-gray-900 dark:text-white">{warehouse.state || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pincode</label>
                                <p className="text-gray-900 dark:text-white">{warehouse.pincode || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {company.updatedAt ? new Date(company.updatedAt).toLocaleDateString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(company.status || 'unknown')}`}>
                      {getStatusIcon(company.status || 'unknown')}
                      {getStatusText(company.status || 'unknown')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  {isSuperAdmin && (
                    <Button
                      onClick={() => router.push(`/companies/${company._id}/edit`)}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Company
                    </Button>
                  )}
                  <Button
                    onClick={() => router.push('/companies')}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Companies
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
