'use client'

import React, { useState } from 'react'
import {
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  MapPin,
  Mail,
  Building2,
  Users,
  TrendingUp,
  Grid3X3,
  List,
  Package,
  DollarSign,
  Phone,
  Globe
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/Button'
import { useGetCompanyDetailedStatsQuery, useGetBatchCompanyStatsQuery } from '@/lib/features/companies/companiesApi'
interface CompanyListProps {
  companies: any[]
  isLoading?: boolean
  onView: (company: any) => void
  onEdit: (company: any) => void
  onDelete: (company: any) => void
  realStats?: {
    totalUsers: number
    totalRevenue: number
    totalProduction: number
    totalOrders: number
    totalCustomers: number
  }
}

// Component to display individual company stats
const CompanyStatsCard: React.FC<{ companyId: string; company: any; batchStats?: any }> = ({ companyId, company, batchStats }) => {
  const { data: statsData, isLoading: statsLoading } = useGetCompanyDetailedStatsQuery(companyId)
  
  if (statsLoading) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-12 animate-pulse"></div>
        ))}
      </div>
    )
  }

  // Use batch stats if available, otherwise fall back to individual API call
  const stats = batchStats || statsData?.data || {
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProduction: 0,
    totalInventory: 0
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
        <Users className="w-3 h-3 text-blue-500" />
        <span className="font-medium text-blue-700 dark:text-blue-300">{stats.totalUsers}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
        <Package className="w-3 h-3 text-green-500" />
        <span className="font-medium text-green-700 dark:text-green-300">{stats.totalProduction}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
        <TrendingUp className="w-3 h-3 text-yellow-500" />
        <span className="font-medium text-yellow-700 dark:text-yellow-300">{stats.totalOrders}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-full">
        <Package className="w-3 h-3 text-orange-500" />
        <span className="font-medium text-orange-700 dark:text-orange-300">{stats.totalInventory}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full">
        <DollarSign className="w-3 h-3 text-purple-500" />
        <span className="font-medium text-purple-700 dark:text-purple-300">₹{(stats.totalRevenue || 0).toLocaleString()}</span>
      </div>
    </div>
  )
}

const CompanyList: React.FC<CompanyListProps> = ({
  companies,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  realStats
}) => {
  // Get company IDs for batch stats
  const companyIds = companies.map(company => company._id)
  
  // Fetch batch stats for all companies
  const { data: batchStatsData, isLoading: batchStatsLoading } = useGetBatchCompanyStatsQuery(companyIds, {
    skip: companyIds.length === 0
  })
  
  // Create a map of company stats for easy lookup
  const statsMap = batchStatsData?.data?.reduce((acc, item) => {
    acc[item.companyId] = item.stats
    return acc
  }, {} as Record<string, any>) || {}
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getCompletionPercentage = (company: any) => {
    const requiredFields = [
      company.companyName,
      company.legalName,
      company.companyCode,
      company.registrationDetails?.gstin,
      company.registrationDetails?.pan,
      company.addresses?.registeredOffice?.street,
      company.addresses?.registeredOffice?.city,
      company.contactInfo?.emails?.length > 0,
      company.contactInfo?.phones?.length > 0
    ]

    const completedFields = requiredFields.filter(Boolean).length
    return Math.round((completedFields / requiredFields.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-4 transition-all duration-300">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {companies.length} {companies.length === 1 ? 'Company' : 'Companies'}
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {companies.filter(c => c.isActive).length} active
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            className={clsx(
              'px-4 py-2 rounded-xl',
              viewMode === 'grid'
                ? 'bg-sky-500 text-white'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'outline'}
            className={clsx(
              'px-4 py-2 rounded-xl',
              viewMode === 'list'
                ? 'bg-sky-500 text-white'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Companies Grid/List */}
      <div className={clsx(
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
          : 'space-y-4'
      )}>
        {companies.map((company) => {
          const completionPercentage = getCompletionPercentage(company)

          // Use real stats from API or fallback to company data
          const stats = {
            totalUsers: realStats?.totalUsers || company.userCount || 0,
            totalProducts: 0,
            totalOrders: realStats?.totalOrders || 0,
            monthlyRevenue: realStats?.totalRevenue || 0,
            totalProduction: realStats?.totalProduction || 0,
            activeProjects: 0,
            completedOrders: 0,
            pendingOrders: 0
          }

          if (viewMode === 'list') {
            return (
              <div
                key={company._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-300 group p-4 lg:p-6"
              >
                {/* Mobile Layout */}
                <div className="block lg:hidden">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-sky-500 rounded-xl flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-1">
                        {company.companyName}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 px-2 py-1 rounded-full">
                          {company.companyCode}
                        </span>
                        <div className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                          company.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}>
                          {company.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </div>
                      </div>

                      {/* Mobile Info */}
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {company.legalName && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                            <span className="truncate">{company.legalName}</span>
                          </div>
                        )}
                        {company.addresses?.registeredOffice?.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <span className="truncate">{company.addresses.registeredOffice.city}, {company.addresses.registeredOffice.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 mb-1">
                        <Users className="w-3 h-3" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.totalUsers}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Users</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                        <Package className="w-3 h-3" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.totalProducts}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Products</p>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={clsx(
                            'h-2 rounded-full transition-all duration-500',
                            completionPercentage >= 80 ? 'bg-green-500' :
                            completionPercentage >= 60 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          )}
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onView(company)}
                        className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => onEdit(company)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg"
                        title="Edit Company"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => onDelete(company)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                        title="Delete Company"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Company Icon */}
                      <div className="p-3 bg-sky-500 rounded-xl flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0 max-w-md">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {company.companyName}
                          </h3>
                          <span className="text-xs font-mono bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 px-2 py-1 rounded-full border border-sky-200 dark:border-sky-700 flex-shrink-0">
                            {company.companyCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className={clsx(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                            company.isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                          )}>
                            {company.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </div>
                          {company.status && (
                            <div className={clsx(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                              company.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700' :
                              company.status === 'suspended' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700' :
                              company.status === 'pending_approval' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700' :
                              company.status === 'under_review' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-700' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                            )}>
                              {company.status === 'active' ? 'Active' :
                               company.status === 'suspended' ? 'Suspended' :
                               company.status === 'pending_approval' ? 'Pending Approval' :
                               company.status === 'under_review' ? 'Under Review' :
                               'Inactive'}
                            </div>
                          )}
                          <CompanyStatsCard 
                            companyId={company._id} 
                            company={company} 
                            batchStats={statsMap[company._id]}
                          />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                          {company.contactInfo?.emails?.[0]?.type && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              <span className="truncate max-w-[150px]">{company.contactInfo.emails[0].type}</span>
                            </div>
                          )}
                          {company.contactInfo?.phones?.[0]?.type && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              <span className="truncate">{company.contactInfo.phones[0].type}</span>
                            </div>
                          )}
                          {company.contactInfo?.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              <span className="truncate max-w-[100px]">Website</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-base font-bold text-gray-900 dark:text-white">{company.userCount || stats.totalUsers}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Users</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
                            <Package className="w-4 h-4" />
                            <span className="text-base font-bold text-gray-900 dark:text-white">{stats.totalProduction}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Production</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-base font-bold text-gray-900 dark:text-white">{stats.completedOrders}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Completed</p>
                        </div>
                      </div>

                      {/* Completion */}
                      <div className="text-center min-w-[80px] flex-shrink-0">
                        <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mx-auto mb-1">
                          <div
                            className={clsx(
                              'h-2 rounded-full transition-all duration-500',
                              completionPercentage >= 80 ? 'bg-green-500' :
                              completionPercentage >= 60 ? 'bg-yellow-500' :
                              'bg-gray-400'
                            )}
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {completionPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <Button
                        onClick={() => onView(company)}
                        className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onEdit(company)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg"
                        title="Edit Company"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onDelete(company)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                        title="Delete Company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          // Grid view (card)
          return (
            <div
              key={company._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-300 group overflow-hidden transform hover:-translate-y-1"
            >
            {/* Header with sky blue background */}
            <div className="bg-sky-500 p-6 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sky-100 transition-colors">
                    {company.companyName}
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-sky-100 text-sm font-semibold font-mono bg-white/20 px-3 py-1.5 rounded-full">
                      {company.companyCode}
                    </p>
                    <span className="text-sky-100 text-sm">
                      {company.userCount || 0} users
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-2">
                  <Button
                    onClick={() => onView(company)}
                    className="p-2 text-white hover:text-sky-200 hover:bg-white/20 rounded-xl transition-colors bg-transparent border-0"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onEdit(company)}
                    className="p-2 text-white hover:text-yellow-200 hover:bg-white/20 rounded-xl transition-colors bg-transparent border-0"
                    title="Edit Company"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(company)}
                    className="p-2 text-white hover:text-red-300 hover:bg-white/20 rounded-xl transition-colors bg-transparent border-0"
                    title="Delete Company"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Status and Completion */}
              <div className="flex items-center justify-between mb-6">
                <div className={clsx(
                  'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm',
                  company.isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                )}>
                  {company.isActive ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Inactive
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className={clsx(
                        'h-3 rounded-full transition-all duration-500',
                        completionPercentage >= 80 ? 'bg-green-500' :
                        completionPercentage >= 60 ? 'bg-yellow-500' :
                        'bg-gray-400'
                      )}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[3rem]">
                    {completionPercentage}%
                  </span>
                </div>
              </div>

              {/* Company Stats */}
              <div className="mb-6">
                <CompanyStatsCard 
                  companyId={company._id} 
                  company={company} 
                  batchStats={statsMap[company._id]}
                />
              </div>

              {/* Company Details */}
              <div className="space-y-3">
                {company.legalName && (
                  <div className="flex items-center gap-3 p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                    <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">Legal Name</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{company.legalName}</p>
                    </div>
                  </div>
                )}

                {company.registrationDetails?.gstin && (
                  <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Building2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">GSTIN</p>
                      <p className="font-mono font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {company.registrationDetails.gstin}
                      </p>
                    </div>
                  </div>
                )}

                {company.addresses?.registeredOffice?.city && (
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <MapPin className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Location</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {company.addresses.registeredOffice.city}, {company.addresses.registeredOffice.state}
                      </p>
                    </div>
                  </div>
                )}

                {company.contactInfo?.emails?.[0]?.email && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {company.contactInfo.emails[0].email}
                      </p>
                    </div>
                  </div>
                )}

                {company.contactInfo?.phones?.[0]?.number && (
                  <div className="flex items-center gap-3 p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                    <Phone className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">Phone</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {company.contactInfo.phones[0].number || company.contactInfo.phones[0].phone}
                      </p>
                    </div>
                  </div>
                )}

                {company.contactInfo?.website && (
                  <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Globe className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Website</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {company.contactInfo.website}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Created</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDate(company.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Stats (if available) */}
              {company.stats && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Users</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {company.stats.totalUsers || 0}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Revenue</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₹{(company.stats.monthlyRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <FileText className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Orders</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {company.stats.totalOrders || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    ID: {company._id.slice(-8).toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {formatDate(company.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

export default CompanyList
