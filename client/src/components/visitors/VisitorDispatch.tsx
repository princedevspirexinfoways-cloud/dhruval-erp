'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  Camera, 
  FileText, 
  Save, 
  X,
  Truck,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface VisitorDispatchProps {
  visitor?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function VisitorDispatch({ 
  visitor, 
  onSubmit, 
  onCancel, 
  loading = false 
}: VisitorDispatchProps) {
  const [formData, setFormData] = useState({
    // Dispatch Information
    dispatchInfo: {
      dispatchNumber: '',
      dispatchDate: new Date().toISOString().split('T')[0],
      dispatchTime: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      priority: 'normal',
      status: 'pending'
    },
    // Vehicle Information
    vehicleInfo: {
      vehicleNumber: '',
      vehicleType: '',
      driverName: '',
      driverPhone: '',
      driverLicense: ''
    },
    // Route Information
    routeInfo: {
      pickupLocation: '',
      deliveryLocation: '',
      estimatedDuration: 60,
      routeNotes: ''
    },
    // Cargo Information
    cargoInfo: {
      cargoType: '',
      weight: '',
      dimensions: '',
      specialHandling: false,
      handlingNotes: ''
    },
    // Security Information
    securityInfo: {
      escortRequired: false,
      securityClearance: 'standard',
      accessAreas: [],
      specialInstructions: ''
    }
  })

  const [images, setImages] = useState<{
    dispatchPhotos: File[]
    cargoPhotos: File[]
    vehiclePhotos: File[]
    documents: File[]
  }>({
    dispatchPhotos: [],
    cargoPhotos: [],
    vehiclePhotos: [],
    documents: []
  })

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({})

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const handleImageSelect = (type: string, files: File[]) => {
    setImages(prev => ({
      ...prev,
      [type]: [...prev[type as keyof typeof prev], ...files]
    }))
  }

  const handleImageRemove = (type: string, index: number) => {
    setImages(prev => ({
      ...prev,
      [type]: prev[type as keyof typeof prev].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      images: {
        dispatchPhotos: images.dispatchPhotos,
        cargoPhotos: images.cargoPhotos,
        vehiclePhotos: images.vehiclePhotos,
        documents: images.documents
      },
      uploadProgress,
      uploadStatus
    }

    onSubmit(submitData)
  }

  const generateDispatchNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `DISP-${year}${month}${day}-${random}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dispatch Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <Truck className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Dispatch Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dispatch Number
            </label>
            <Input
              value={formData.dispatchInfo.dispatchNumber || generateDispatchNumber()}
              onChange={(e) => handleInputChange('dispatchInfo', 'dispatchNumber', e.target.value)}
              placeholder="Auto-generated"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dispatch Date
            </label>
            <Input
              type="date"
              value={formData.dispatchInfo.dispatchDate}
              onChange={(e) => handleInputChange('dispatchInfo', 'dispatchDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dispatch Time
            </label>
            <Input
              type="time"
              value={formData.dispatchInfo.dispatchTime}
              onChange={(e) => handleInputChange('dispatchInfo', 'dispatchTime', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Select
              value={formData.dispatchInfo.priority}
              onValueChange={(value) => handleInputChange('dispatchInfo', 'priority', value)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={formData.dispatchInfo.status}
              onValueChange={(value) => handleInputChange('dispatchInfo', 'status', value)}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>
      </ResponsiveCard>

      {/* Vehicle Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <Truck className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <Input
              value={formData.vehicleInfo.vehicleNumber}
              onChange={(e) => handleInputChange('vehicleInfo', 'vehicleNumber', e.target.value)}
              placeholder="Enter vehicle number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <Select
              value={formData.vehicleInfo.vehicleType}
              onValueChange={(value) => handleInputChange('vehicleInfo', 'vehicleType', value)}
            >
              <option value="">Select vehicle type</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="other">Other</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <Input
              value={formData.vehicleInfo.driverName}
              onChange={(e) => handleInputChange('vehicleInfo', 'driverName', e.target.value)}
              placeholder="Enter driver name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Phone
            </label>
            <Input
              value={formData.vehicleInfo.driverPhone}
              onChange={(e) => handleInputChange('vehicleInfo', 'driverPhone', e.target.value)}
              placeholder="Enter driver phone"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver License
            </label>
            <Input
              value={formData.vehicleInfo.driverLicense}
              onChange={(e) => handleInputChange('vehicleInfo', 'driverLicense', e.target.value)}
              placeholder="Enter driver license"
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Route Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Route Information</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location
            </label>
            <Input
              value={formData.routeInfo.pickupLocation}
              onChange={(e) => handleInputChange('routeInfo', 'pickupLocation', e.target.value)}
              placeholder="Enter pickup location"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Location
            </label>
            <Input
              value={formData.routeInfo.deliveryLocation}
              onChange={(e) => handleInputChange('routeInfo', 'deliveryLocation', e.target.value)}
              placeholder="Enter delivery location"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration (minutes)
              </label>
              <Input
                type="number"
                value={formData.routeInfo.estimatedDuration}
                onChange={(e) => handleInputChange('routeInfo', 'estimatedDuration', parseInt(e.target.value))}
                min="1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route Notes
            </label>
            <Textarea
              value={formData.routeInfo.routeNotes}
              onChange={(e) => handleInputChange('routeInfo', 'routeNotes', e.target.value)}
              placeholder="Enter route notes"
              rows={3}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Cargo Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Cargo Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo Type
            </label>
            <Input
              value={formData.cargoInfo.cargoType}
              onChange={(e) => handleInputChange('cargoInfo', 'cargoType', e.target.value)}
              placeholder="Enter cargo type"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight
            </label>
            <Input
              value={formData.cargoInfo.weight}
              onChange={(e) => handleInputChange('cargoInfo', 'weight', e.target.value)}
              placeholder="Enter weight"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensions
            </label>
            <Input
              value={formData.cargoInfo.dimensions}
              onChange={(e) => handleInputChange('cargoInfo', 'dimensions', e.target.value)}
              placeholder="L x W x H"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="specialHandling"
              checked={formData.cargoInfo.specialHandling}
              onChange={(e) => handleInputChange('cargoInfo', 'specialHandling', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="specialHandling" className="text-sm font-medium text-gray-700">
              Special Handling Required
            </label>
          </div>
        </div>
        
        {formData.cargoInfo.specialHandling && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handling Notes
            </label>
            <Textarea
              value={formData.cargoInfo.handlingNotes}
              onChange={(e) => handleInputChange('cargoInfo', 'handlingNotes', e.target.value)}
              placeholder="Enter special handling instructions"
              rows={3}
            />
          </div>
        )}
      </ResponsiveCard>

      {/* Image Uploads */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <Camera className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Photos & Documents</h3>
        </div>
        
        <div className="space-y-6">
          {/* Dispatch Photos */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Dispatch Photos
            </h4>
            <ImageUpload
              onImagesSelect={(files) => handleImageSelect('dispatchPhotos', files)}
              onImagesRemove={(index) => handleImageRemove('dispatchPhotos', index)}
              images={images.dispatchPhotos}
              maxFiles={3}
              maxSize={5}
              accept={['image/jpeg', 'image/png', 'image/gif']}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>

          {/* Cargo Photos */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Cargo Photos
            </h4>
            <ImageUpload
              onImagesSelect={(files) => handleImageSelect('cargoPhotos', files)}
              onImagesRemove={(index) => handleImageRemove('cargoPhotos', index)}
              images={images.cargoPhotos}
              maxFiles={5}
              maxSize={5}
              accept={['image/jpeg', 'image/png', 'image/gif']}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>

          {/* Vehicle Photos */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Truck className="h-4 w-4 mr-2" />
              Vehicle Photos
            </h4>
            <ImageUpload
              onImagesSelect={(files) => handleImageSelect('vehiclePhotos', files)}
              onImagesRemove={(index) => handleImageRemove('vehiclePhotos', index)}
              images={images.vehiclePhotos}
              maxFiles={3}
              maxSize={5}
              accept={['image/jpeg', 'image/png', 'image/gif']}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>

          {/* Documents */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </h4>
            <ImageUpload
              onImagesSelect={(files) => handleImageSelect('documents', files)}
              onImagesRemove={(index) => handleImageRemove('documents', index)}
              images={images.documents}
              maxFiles={5}
              maxSize={10}
              accept={['image/jpeg', 'image/png', 'image/gif', 'application/pdf']}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Security Information */}
      <ResponsiveCard>
        <div className="mb-4 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Security Information</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="escortRequired"
              checked={formData.securityInfo.escortRequired}
              onChange={(e) => handleInputChange('securityInfo', 'escortRequired', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="escortRequired" className="text-sm font-medium text-gray-700">
              Escort Required
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Security Clearance
            </label>
            <Select
              value={formData.securityInfo.securityClearance}
              onValueChange={(value) => handleInputChange('securityInfo', 'securityClearance', value)}
            >
              <option value="standard">Standard</option>
              <option value="enhanced">Enhanced</option>
              <option value="restricted">Restricted</option>
              <option value="confidential">Confidential</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions
            </label>
            <Textarea
              value={formData.securityInfo.specialInstructions}
              onChange={(e) => handleInputChange('securityInfo', 'specialInstructions', e.target.value)}
              placeholder="Enter special security instructions"
              rows={3}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
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
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Creating Dispatch...' : 'Create Dispatch'}
        </Button>
      </div>
    </form>
  )
}
