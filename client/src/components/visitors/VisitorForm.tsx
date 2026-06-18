'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/ui/FileUpload'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import { User, Building2, Phone, Mail, Calendar, Camera, FileText, Save, X } from 'lucide-react'

interface VisitorFormProps {
  visitor?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function VisitorForm({ visitor, onSubmit, onCancel, loading = false }: VisitorFormProps) {
  const [formData, setFormData] = useState({
    // Personal Information
    personalInfo: {
      firstName: '',
      lastName: '',
      fullName: '',
      dateOfBirth: '',
      gender: 'male',
      nationality: 'Indian'
    },
    // Contact Information
    contactInfo: {
      primaryPhone: '',
      secondaryPhone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      }
    },
    // Company Information
    companyInfo: {
      companyName: '',
      designation: '',
      department: '',
      employeeId: ''
    },
    // Visit Information
    visitInfo: {
      purpose: '',
      visitType: 'business',
      scheduledArrivalTime: '',
      scheduledDepartureTime: '',
      expectedDuration: 60,
      vehicleNumber: '',
      accompaniedBy: []
    },
    // Host Information
    hostInfo: {
      hostName: '',
      hostDepartment: '',
      hostPhone: '',
      hostEmail: '',
      meetingLocation: ''
    },
    // Security Information
    securityInfo: {
      riskLevel: 'low',
      specialInstructions: '',
      accessAreas: [],
      escortRequired: false
    }
  })

  const [files, setFiles] = useState<{
    entryPhoto: File[]
    documents: File[]
    attachments: File[]
  }>({
    entryPhoto: [],
    documents: [],
    attachments: []
  })

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({})

  useEffect(() => {
    if (visitor) {
      setFormData({
        personalInfo: visitor.personalInfo || formData.personalInfo,
        contactInfo: visitor.contactInfo || formData.contactInfo,
        companyInfo: visitor.companyInfo || formData.companyInfo,
        visitInfo: visitor.visitInfo || formData.visitInfo,
        hostInfo: visitor.hostInfo || formData.hostInfo,
        securityInfo: visitor.securityInfo || formData.securityInfo
      })
    }
  }, [visitor])

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const handleNestedInputChange = (section: string, subsection: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)[subsection],
          [field]: value
        }
      }
    }))
  }

  const handleFileSelect = (fileType: 'entryPhoto' | 'documents' | 'attachments', newFiles: File[]) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: fileType === 'entryPhoto' ? [newFiles[0]] : [...prev[fileType], ...newFiles]
    }))
  }

  const handleFileRemove = (fileType: 'entryPhoto' | 'documents' | 'attachments', index: number) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Update full name
    const updatedFormData = {
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        fullName: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim()
      }
    }

    // Prepare form data with files
    const submitData = {
      ...updatedFormData,
      files
    }

    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <User className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <Input
              value={formData.personalInfo.firstName}
              onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <Input
              value={formData.personalInfo.lastName}
              onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <Input
              type="date"
              value={formData.personalInfo.dateOfBirth}
              onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.personalInfo.gender}
              onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </ResponsiveCard>

      {/* Contact Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <Phone className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone *</label>
            <Input
              value={formData.contactInfo.primaryPhone}
              onChange={(e) => handleInputChange('contactInfo', 'primaryPhone', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <Input
              value={formData.contactInfo.address.street}
              onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'street', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Input
              value={formData.contactInfo.address.city}
              onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'city', e.target.value)}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Company Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <Input
              value={formData.companyInfo.companyName}
              onChange={(e) => handleInputChange('companyInfo', 'companyName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <Input
              value={formData.companyInfo.designation}
              onChange={(e) => handleInputChange('companyInfo', 'designation', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <Input
              value={formData.companyInfo.department}
              onChange={(e) => handleInputChange('companyInfo', 'department', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <Input
              value={formData.companyInfo.employeeId}
              onChange={(e) => handleInputChange('companyInfo', 'employeeId', e.target.value)}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Visit Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Visit Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit *</label>
            <Input
              value={formData.visitInfo.purpose}
              onChange={(e) => handleInputChange('visitInfo', 'purpose', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
            <select
              value={formData.visitInfo.visitType}
              onChange={(e) => handleInputChange('visitInfo', 'visitType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="business">Business</option>
              <option value="personal">Personal</option>
              <option value="interview">Interview</option>
              <option value="delivery">Delivery</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Arrival</label>
            <Input
              type="datetime-local"
              value={formData.visitInfo.scheduledArrivalTime}
              onChange={(e) => handleInputChange('visitInfo', 'scheduledArrivalTime', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Duration (minutes)</label>
            <Input
              type="number"
              value={formData.visitInfo.expectedDuration}
              onChange={(e) => handleInputChange('visitInfo', 'expectedDuration', parseInt(e.target.value))}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Host Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <User className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Host Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host Name *</label>
            <Input
              value={formData.hostInfo.hostName}
              onChange={(e) => handleInputChange('hostInfo', 'hostName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host Department</label>
            <Input
              value={formData.hostInfo.hostDepartment}
              onChange={(e) => handleInputChange('hostInfo', 'hostDepartment', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host Phone</label>
            <Input
              value={formData.hostInfo.hostPhone}
              onChange={(e) => handleInputChange('hostInfo', 'hostPhone', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Location</label>
            <Input
              value={formData.hostInfo.meetingLocation}
              onChange={(e) => handleInputChange('hostInfo', 'meetingLocation', e.target.value)}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* File Uploads */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">File Uploads</h3>
        </div>
        <div className="space-y-6">
          {/* Entry Photo */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Entry Photo
            </h4>
            <FileUpload
              onFileSelect={(newFiles) => handleFileSelect('entryPhoto', newFiles)}
              onFileRemove={(index) => handleFileRemove('entryPhoto', index)}
              accept="image/*"
              multiple={false}
              maxFiles={1}
              maxSize={5}
              files={files.entryPhoto}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>

          {/* Documents */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Documents (ID, Business Card, etc.)
            </h4>
            <FileUpload
              onFileSelect={(newFiles) => handleFileSelect('documents', newFiles)}
              onFileRemove={(index) => handleFileRemove('documents', index)}
              accept="image/*,.pdf"
              multiple={true}
              maxFiles={5}
              maxSize={10}
              files={files.documents}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>

          {/* Attachments */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Additional Attachments
            </h4>
            <FileUpload
              onFileSelect={(newFiles) => handleFileSelect('attachments', newFiles)}
              onFileRemove={(index) => handleFileRemove('attachments', index)}
              accept="*"
              multiple={true}
              maxFiles={3}
              maxSize={10}
              files={files.attachments}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : visitor ? 'Update Visitor' : 'Create Visitor'}
        </Button>
      </div>
    </form>
  )
}
