import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import {
  X,
  Car,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Phone
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Vehicle,
  CreateVehicleRequest,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useUploadVehicleImagesMutation,
  useDeleteVehicleImageMutation
} from '@/lib/features/vehicles/vehiclesApi'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { useGetAllVehiclesQuery } from '@/lib/features/vehicles/vehiclesApi'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'


interface VehicleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vehicle?: Vehicle
}

interface FormData {
  vehicleNumber: string
  driverName: string
  driverPhone: string
  purpose: Vehicle['purpose']
  reason: string
  companyId: string
}

const getInitialFormData = (): FormData => ({
  vehicleNumber: '',
  driverName: '',
  driverPhone: '',
  purpose: 'delivery',
  reason: '',
  companyId: ''
})

export default function VehicleFormModal({ isOpen, onClose, onSuccess, vehicle }: VehicleFormModalProps) {
  const theme = useSelector(selectTheme)
  const [formData, setFormData] = useState<FormData>(getInitialFormData())

  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [createVehicle, { isLoading: isCreating }] = useCreateVehicleMutation()
  const [updateVehicle, { isLoading: isUpdating }] = useUpdateVehicleMutation()
  const [uploadImages, { isLoading: isUploading }] = useUploadVehicleImagesMutation()
  const [deleteImage] = useDeleteVehicleImageMutation()

  const { data: companiesResponse } = useGetAllCompaniesQuery()
  const companies = companiesResponse?.data || []

  // Get today's vehicles for the selected company
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const { data: todayVehiclesResponse } = useGetAllVehiclesQuery({
    page: 1,
    limit: 1000,
    companyId: formData.companyId,
    dateFrom: todayStart.toISOString(),
    dateTo: todayEnd.toISOString(),
    sortBy: 'timeIn',
    sortOrder: 'desc'
  })
  const todayVehicles = todayVehiclesResponse?.data || []

  const isEditing = !!vehicle
  const isLoading = isCreating || isUpdating || isUploading

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleNumber: vehicle.vehicleNumber || '',
        driverName: vehicle.driverName || '',
        driverPhone: vehicle.driverPhone || '',
        purpose: vehicle.purpose || 'delivery',
        reason: vehicle.reason || '',
        companyId: vehicle.companyId || ''
      })
      setExistingImages(vehicle.images || [])
    } else {
      // Reset form for new vehicle
      setFormData(getInitialFormData())
      setExistingImages([])
    }
    setErrors({})
    setSelectedImages([])
    setPreviewImages([])
  }, [vehicle, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required'
    }

    if (!formData.driverName.trim()) {
      newErrors.driverName = 'Driver name is required'
    }

    if (!formData.driverPhone.trim()) {
      newErrors.driverPhone = 'Driver phone is required'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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
    setPreviewImages(prev => [...prev, ...newPreviews])
  }

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setPreviewImages(prev => {
      const newPreviews = prev.filter((_, i) => i !== index)
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index])
      return newPreviews
    })
  }

  const removeExistingImage = async (imageUrl: string) => {
    if (!vehicle) return
    
    try {
      await deleteImage({ vehicleId: vehicle._id, imageUrl }).unwrap()
      setExistingImages(prev => prev.filter(url => url !== imageUrl))
      toast.success('Image deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const vehicleData: CreateVehicleRequest = {
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        purpose: formData.purpose,
        reason: formData.reason,
        companyId: formData.companyId
      }

      let savedVehicle: Vehicle
      if (isEditing && vehicle) {
        savedVehicle = await updateVehicle({
          id: vehicle._id,
          vehicle: vehicleData
        }).unwrap()
      } else {
        savedVehicle = await createVehicle(vehicleData).unwrap()
      }

      // Upload images if any are selected
      if (selectedImages.length > 0) {
        await uploadImages({
          vehicleId: savedVehicle._id,
          images: selectedImages
        }).unwrap()
      }
      
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} vehicle`)
    }
  }

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key as keyof FormData]
    })
    setErrors(newErrors)
  }

  // Remove unused function

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-blue-500 p-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <p className="text-blue-100">
                  {isEditing ? 'Update vehicle information' : 'Add a new vehicle to the fleet'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors bg-transparent border-0"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Vehicle Gate Pass Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Vehicle Gate Pass Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-gray-100 mb-2">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => updateFormData({ vehicleNumber: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.vehicleNumber ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="e.g., MH01AB1234"
                  />
                  {errors.vehicleNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.vehicleNumber}</p>
                  )}
                </div>


                <div>
                  <label className="block text-sm font-semibold text-black dark:text-gray-100 mb-2">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.driverName}
                    onChange={(e) => updateFormData({ driverName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.driverName ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Driver full name"
                  />
                  {errors.driverName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.driverName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-gray-100 mb-2">
                    Driver Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      required
                      value={formData.driverPhone}
                      onChange={(e) => updateFormData({ driverPhone: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.driverPhone ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                      placeholder="Driver phone number"
                    />
                  </div>
                  {errors.driverPhone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.driverPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-gray-100 mb-2">
                    Purpose of Visit *
                  </label>
                  <select
                    required
                    value={formData.purpose}
                    onChange={(e) => updateFormData({ purpose: e.target.value as Vehicle['purpose'] })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-gray-100 mb-2">
                    Company *
                  </label>
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => updateFormData({ companyId: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.companyId ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100`}
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.companyId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.companyId}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-gray-100 mb-2">
                    Reason for Visit *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => updateFormData({ reason: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                      errors.reason ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Please provide detailed reason for the visit..."
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.reason}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Today's Vehicles for Selected Company */}
            {formData.companyId && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Today's Vehicles ({todayVehicles.length})
                </h3>
                
                {todayVehicles.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Showing vehicles that entered today for the selected company
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {todayVehicles.map((vehicle) => (
                        <div
                          key={vehicle._id}
                          className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-yellow-600 transition-colors cursor-pointer"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              vehicleNumber: vehicle.vehicleNumber,
                              driverName: vehicle.driverName,
                              driverPhone: vehicle.driverPhone,
                              purpose: vehicle.purpose,
                              reason: vehicle.reason
                            }))
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{vehicle.vehicleNumber}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.status === 'in' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              vehicle.status === 'out' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                              'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {vehicle.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Driver: {vehicle.driverName}</div>
                            <div>Phone: {vehicle.driverPhone}</div>
                            <div>Purpose: {vehicle.purpose}</div>
                            <div>Time In: {new Date(vehicle.timeIn).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Car className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>No vehicles entered today for this company</p>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle Images */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Vehicle Images
              </h3>
              
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Click to upload vehicle images</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">PNG, JPG, GIF up to 5MB each</p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Images
                  </Button>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black dark:text-gray-100 mb-2">Current Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Vehicle ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(imageUrl)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Images Preview */}
                {previewImages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black dark:text-gray-100 mb-2">New Images to Upload</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {previewImages.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
