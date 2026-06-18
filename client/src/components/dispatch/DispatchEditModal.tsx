'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUploader } from './ImageUploader'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { useGetWarehousesQuery } from '@/lib/api/warehousesApi'
import { useGetCustomersQuery } from '@/lib/api/customersApi'
import { useGetSalesOrdersQuery } from '@/lib/api/salesApi'
import { useUpdateDispatchMutation, useGetUploadUrlMutation, useUploadToS3Mutation } from '@/lib/api/enhancedDispatchApi'
import { Dispatch, UpdateDispatchRequest } from '@/lib/api/enhancedDispatchApi'
import toast from 'react-hot-toast'
import { compressImage, validateImageFile } from '@/utils/imageCompression'
import { Save, X, Loader2, Edit3, Clock, AlertCircle } from 'lucide-react'

interface DispatchEditModalProps {
  isOpen: boolean
  onClose: () => void
  dispatch: Dispatch | null
  onSuccess?: (dispatch: Dispatch) => void
  userCompanyId?: string
}

export const DispatchEditModal = ({
  isOpen,
  onClose,
  dispatch,
  onSuccess,
  userCompanyId
}: DispatchEditModalProps) => {
  const [formData, setFormData] = useState<Partial<UpdateDispatchRequest>>({})
  const [hasChanges, setHasChanges] = useState(false)
  
  // Image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [fileName: string]: 'uploading' | 'success' | 'error' }>({})

  // RTK Query hooks
  const { data: companies = [] } = useGetAllCompaniesQuery()
  const { data: warehousesData } = useGetWarehousesQuery({ 
    companyId: formData.companyId || userCompanyId,
    limit: 100 
  })
  const warehouses = warehousesData?.data || []
  
  const { data: customersData } = useGetCustomersQuery({ 
    companyId: formData.companyId || userCompanyId,
    limit: 100 
  })
  const customers = customersData?.data || []
  
  const { data: salesOrdersData } = useGetSalesOrdersQuery({ 
    status: 'pending',
    limit: 100 
  })
  const salesOrders = salesOrdersData?.data?.orders || []

  // Mutations
  const [updateDispatch, { isLoading: updating }] = useUpdateDispatchMutation()
  const [getUploadUrl] = useGetUploadUrlMutation()
  const [uploadToS3] = useUploadToS3Mutation()

  // Initialize form data when dispatch changes
  useEffect(() => {
    if (isOpen && dispatch) {
      const initialFormData = {
        id: dispatch._id,
        dispatchNumber: dispatch.dispatchNumber,
        dispatchDate: dispatch.dispatchDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        dispatchType: dispatch.dispatchType,
        priority: dispatch.priority,
        status: dispatch.status,
        sourceWarehouseId: typeof dispatch.sourceWarehouseId === 'object' ? dispatch.sourceWarehouseId._id : dispatch.sourceWarehouseId,
        customerOrderId: typeof dispatch.customerOrderId === 'object' ? dispatch.customerOrderId._id : dispatch.customerOrderId,
        vehicleNumber: dispatch.vehicleNumber || '',
        deliveryPersonName: dispatch.deliveryPersonName || '',
        deliveryPersonNumber: dispatch.deliveryPersonNumber || '',
        notes: dispatch.notes || ''
      }
      
      setFormData(initialFormData)
      setHasChanges(false)
      setSelectedImages([])
      setImagePreviews([])
      setUploadProgress({})
      setUploadStatus({})
    }
  }, [isOpen, dispatch])

  // Track form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
  }

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setSelectedImages(prev => [...prev, ...validFiles])

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
    setHasChanges(true)
  }

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index)
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index])
      return newPreviews
    })
    setHasChanges(true)
  }

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return []

    const uploadedKeys: string[] = []

    for (const file of selectedImages) {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }))

        // Validate file
        if (!validateImageFile(file)) {
          throw new Error('Invalid file type or size too large')
        }

        // Compress image before upload
        const compressedFile = await compressImage(file, 1200, 0.8)
        
        // Get presigned URL
        const response = await getUploadUrl({
          fileName: compressedFile.name,
          contentType: compressedFile.type,
          fileType: 'dispatch-photos',
        }).unwrap()

        // Use the upload URL directly from the response
        const actualUploadUrl = response.uploadUrl
        const publicUrl = response.publicUrl
        const key = response.key

        if (!actualUploadUrl) {
          throw new Error('No upload URL received')
        }

        // Upload to S3
        await uploadToS3({
          uploadUrl: actualUploadUrl,
          file: compressedFile,
          onProgress: (progress: number) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
          },
        }).unwrap()

        uploadedKeys.push(publicUrl)
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }))
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }))
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    return uploadedKeys
  }

  const handleUpdate = async () => {
    if (!dispatch || !hasChanges) {
      onClose()
      return
    }

    try {
      // Upload new images if any
      const uploadedKeys = await uploadImages()
      
      // Prepare update data
      const updateData: Partial<UpdateDispatchRequest> = { ...formData }
      
      // Add new photos to existing ones
      if (uploadedKeys.length > 0) {
        const existingPhotos = dispatch.documents?.photos || []
        updateData.documents = {
          photos: [...existingPhotos, ...uploadedKeys]
        }
      }

      // Remove id from update data as it's used in the URL
      delete updateData.id

      const result = await updateDispatch({
        id: dispatch._id,
        ...updateData
      }).unwrap()
      
      toast.success('Dispatch updated successfully!')
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to update dispatch:', error)
      toast.error('Failed to update dispatch')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
      case 'in-progress': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
      case 'completed': return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
      case 'delivered': return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
      case 'cancelled': return 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
      default: return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white'
      case 'medium': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
      case 'high': return 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
      case 'urgent': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-pulse'
      default: return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white'
    }
  }

  if (!dispatch) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Edit3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Dispatch</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">#{dispatch.dispatchNumber}</p>
          </div>
        </div>
      }
      size="xl"
    >
      <div className="max-h-[90vh] overflow-y-auto space-y-6">
        {/* Current Status Header */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(dispatch.status)}`}>
                  {dispatch.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(dispatch.priority)}`}>
                  {dispatch.priority}
                </span>
              </div>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dispatch Number</label>
              <Input
                value={formData.dispatchNumber || ''}
                onChange={(e) => handleFormChange('dispatchNumber', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dispatch Date *</label>
              <Input
                type="date"
                value={formData.dispatchDate || ''}
                onChange={(e) => handleFormChange('dispatchDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
              <select
                value={formData.status || ''}
                onChange={(e) => handleFormChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="draft">📝 Draft</option>
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="delivered">📦 Delivered</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dispatch Type *</label>
              <select
                value={formData.dispatchType || ''}
                onChange={(e) => handleFormChange('dispatchType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pickup">📦 Pickup</option>
                <option value="delivery">🚚 Delivery</option>
                <option value="transfer">🔄 Transfer</option>
                <option value="return">↩️ Return</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
              <select
                value={formData.priority || ''}
                onChange={(e) => handleFormChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Source Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏭 Source Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Warehouse</label>
              <Input
                value={typeof dispatch.sourceWarehouseId === 'object' ? dispatch.sourceWarehouseId.warehouseName : 'N/A'}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Order</label>
              <Input
                value={typeof dispatch.customerOrderId === 'object' ? `#${dispatch.customerOrderId.orderNumber}` : 'N/A'}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🚚 Delivery Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Number</label>
              <Input
                value={formData.vehicleNumber || ''}
                onChange={(e) => handleFormChange('vehicleNumber', e.target.value)}
                placeholder="Enter vehicle number"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Person Name</label>
              <Input
                value={formData.deliveryPersonName || ''}
                onChange={(e) => handleFormChange('deliveryPersonName', e.target.value)}
                placeholder="Enter delivery person name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Person Number</label>
              <Input
                value={formData.deliveryPersonNumber || ''}
                onChange={(e) => handleFormChange('deliveryPersonNumber', e.target.value)}
                placeholder="Enter delivery person number"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📝 Notes</h3>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Image Upload */}
        <ImageUploader
          selectedImages={selectedImages}
          imagePreviews={imagePreviews}
          uploadProgress={uploadProgress}
          uploadStatus={uploadStatus}
          onImageSelect={handleImageSelect}
          onRemoveImage={removeSelectedImage}
        />

        {/* Existing Photos */}
        {dispatch.documents?.photos && dispatch.documents.photos.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📸 Existing Photos</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {dispatch.documents.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Dispatch photo ${index + 1}`}
                    className="w-full h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {hasChanges ? 'You have unsaved changes' : 'No changes made'}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updating || !hasChanges}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}