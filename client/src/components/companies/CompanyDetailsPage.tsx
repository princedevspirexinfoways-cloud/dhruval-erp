'use client'

import React from 'react'
import { 
  ArrowLeft,
  Building2, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Calendar, 
  MapPin,
  Mail,
  Phone,
  Users,
  TrendingUp,
  Package,
  DollarSign,
  Globe,
  Edit,
  Trash2,

  Share2
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/Button'

interface CompanyDetailsPageProps {
  company: any
  onBack: () => void
  onEdit: (company: any) => void
  onDelete: (company: any) => void
}

const CompanyDetailsPage: React.FC<CompanyDetailsPageProps> = ({
  company,
  onBack,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getCompletionPercentage = () => {
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

  const completionPercentage = getCompletionPercentage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-sky-300 text-sky-600 hover:bg-sky-50 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-sky-200 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6">
              {/* Mobile/Tablet Header */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 sm:p-4 bg-sky-500 rounded-2xl flex-shrink-0">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2 break-words">
                      {company.companyName}
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-3 break-words">{company.legalName}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-xs sm:text-sm font-mono bg-sky-100 text-sky-800 px-2 sm:px-3 py-1 rounded-full border border-sky-200">
                        {company.companyCode}
                      </span>
                      <div className={clsx(
                        'inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold',
                        company.isActive
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      )}>
                        {company.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Inactive
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
                  <Button
                    onClick={() => onEdit(company)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onDelete(company)}
                    className="border-red-300 text-red-600 hover:bg-red-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-sky-50 rounded-xl border border-sky-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-black">Profile Completion</h3>
                <span className="text-xl sm:text-2xl font-bold text-sky-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                <div
                  className={clsx(
                    'h-2 sm:h-3 rounded-full transition-all duration-500',
                    completionPercentage >= 80 ? 'bg-green-500' :
                    completionPercentage >= 60 ? 'bg-yellow-500' :
                    'bg-gray-400'
                  )}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                Complete your company profile to unlock all features
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-sky-200 p-4 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Active Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-black truncate">{company.userCount || 25}</p>
                <p className="text-xs text-green-600 font-medium">+12% this month</p>
              </div>
              <div className="p-2 sm:p-3 bg-sky-100 rounded-xl flex-shrink-0 ml-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-4 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Production Units</p>
                <p className="text-2xl sm:text-3xl font-bold text-black truncate">{company.stats?.totalProduction || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-xl flex-shrink-0 ml-2">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-yellow-200 p-4 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Completed Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-black truncate">{company.stats?.completedOrders || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-xl flex-shrink-0 ml-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Monthly Revenue</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-black truncate">₹{(company.stats?.monthlyRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="p-2 sm:p-3 bg-gray-100 rounded-xl flex-shrink-0 ml-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Company Information */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Registration Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-black mb-4 sm:mb-6 flex items-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-green-600" />
                Registration Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {company.registrationDetails?.gstin && (
                  <div className="p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-xs sm:text-sm font-semibold text-green-600 mb-1">GSTIN</p>
                    <p className="font-mono text-black font-semibold text-sm sm:text-base break-all">{company.registrationDetails.gstin}</p>
                  </div>
                )}
                {company.registrationDetails?.pan && (
                  <div className="p-3 sm:p-4 bg-sky-50 rounded-xl border border-sky-200">
                    <p className="text-xs sm:text-sm font-semibold text-sky-600 mb-1">PAN</p>
                    <p className="font-mono text-black font-semibold text-sm sm:text-base break-all">{company.registrationDetails.pan}</p>
                  </div>
                )}
                {company.registrationDetails?.cin && (
                  <div className="p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-xs sm:text-sm font-semibold text-yellow-600 mb-1">CIN</p>
                    <p className="font-mono text-black font-semibold text-sm sm:text-base break-all">{company.registrationDetails.cin}</p>
                  </div>
                )}
                {company.registrationDetails?.udyogAadhar && (
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Udyog Aadhar</p>
                    <p className="font-mono text-black font-semibold text-sm sm:text-base break-all">{company.registrationDetails.udyogAadhar}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-yellow-200 p-6">
              <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-yellow-600" />
                Address Information
              </h3>
              <div className="space-y-6">
                {company.addresses?.registeredOffice && (
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <h4 className="font-semibold text-yellow-600 mb-3">Registered Office</h4>
                    <div className="text-black">
                      {company.addresses.registeredOffice.street && (
                        <p>{company.addresses.registeredOffice.street}</p>
                      )}
                      {company.addresses.registeredOffice.area && (
                        <p>{company.addresses.registeredOffice.area}</p>
                      )}
                      <p>
                        {company.addresses.registeredOffice.city}, {company.addresses.registeredOffice.state}
                      </p>
                      <p>{company.addresses.registeredOffice.pincode} - {company.addresses.registeredOffice.country}</p>
                    </div>
                  </div>
                )}
                {company.addresses?.factoryAddress && (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                    <h4 className="font-semibold text-sky-600 mb-3">Factory Address</h4>
                    <div className="text-black">
                      {company.addresses.factoryAddress.street && (
                        <p>{company.addresses.factoryAddress.street}</p>
                      )}
                      {company.addresses.factoryAddress.area && (
                        <p>{company.addresses.factoryAddress.area}</p>
                      )}
                      <p>
                        {company.addresses.factoryAddress.city}, {company.addresses.factoryAddress.state}
                      </p>
                      <p>{company.addresses.factoryAddress.pincode} - {company.addresses.factoryAddress.country}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Additional Info */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-sky-200 p-6">
              <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                <Phone className="w-6 h-6 mr-3 text-sky-600" />
                Contact Information
              </h3>
              <div className="space-y-4">
                {company.contactInfo?.emails?.map((email: any, index: number) => (
                  <div key={index} className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-sky-600" />
                      <div>
                        <p className="text-sm font-semibold text-sky-600">{email.label}</p>
                        <p className="text-black font-medium">{email.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {company.contactInfo?.phones?.map((phone: any, index: number) => (
                  <div key={index} className="p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-green-600">{phone.label}</p>
                        <p className="text-black font-medium">{phone.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {company.contactInfo?.website && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Website</p>
                        <a
                          href={company.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 font-medium hover:underline break-all"
                        >
                          {company.contactInfo.website}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                {company.contactInfo?.socialMedia?.linkedin && (
                  <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-600">LinkedIn</p>
                        <a
                          href={company.contactInfo.socialMedia.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 font-medium hover:underline break-all"
                        >
                          {company.contactInfo.socialMedia.linkedin}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-gray-600" />
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-black">Company Created</p>
                    <p className="text-sm text-gray-600">{formatDate(company.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-sky-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-black">Last Updated</p>
                    <p className="text-sm text-gray-600">{formatDate(company.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyDetailsPage
