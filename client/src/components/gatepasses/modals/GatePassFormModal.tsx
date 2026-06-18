import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  X,
  Car,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Phone,
  User,
  FileText,
  Plus,
  Minus
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  GatePass,
  CreateGatePassRequest,
  useCreateGatePassMutation,
  useUpdateGatePassMutation
} from '@/lib/features/gatepasses/gatepassesApi'
import { useGetAllVehiclesQuery } from '@/lib/features/vehicles/vehiclesApi'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { selectTheme } from '@/lib/features/ui/uiSlice'

interface GatePassFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  gatePass?: GatePass
}

interface FormData {
  vehicleId: string
  vehicleNumber: string
  driverName: string
  driverPhone: string
  driverIdNumber: string
  driverLicenseNumber: string
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other'
  reason: string
  personToMeet: string
  department: string
  securityNotes: string
  items: {
    description: string
    quantity: number
    value?: number
  }[]
  images: File[]
  companyId: string
}

const getInitialFormData = (): FormData => ({
  vehicleId: '',
  vehicleNumber: '',
  driverName: '',
  driverPhone: '',
  driverIdNumber: '',
  driverLicenseNumber: '',
  purpose: 'delivery',
  reason: '',
  personToMeet: '',
  department: '',
  securityNotes: '',
  items: [],
  images: [],
  companyId: ''
})

export default function GatePassFormModal({ isOpen, onClose, onSuccess, gatePass }: GatePassFormModalProps) {
  const theme = useSelector(selectTheme)
  const [formData, setFormData] = useState<FormData>(getInitialFormData())
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [createGatePass, { isLoading: isCreating }] = useCreateGatePassMutation()
  const [updateGatePass, { isLoading: isUpdating }] = useUpdateGatePassMutation()
  
  const { data: companiesResponse } = useGetAllCompaniesQuery()
  const companies = companiesResponse?.data || []

  // Get today's vehicles for the selected company
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const { data: todayVehiclesResponse, isLoading: isLoadingTodayVehicles, error: todayVehiclesError } = useGetAllVehiclesQuery({
    page: 1,
    limit: 1000,
    companyId: formData.companyId,
    dateFrom: todayStart.toISOString(),
    dateTo: todayEnd.toISOString(),
    sortBy: 'timeIn',
    sortOrder: 'desc'
  }, {
    skip: !formData.companyId // Skip query if no company selected
  })

  const { data: vehiclesResponse, isLoading: isLoadingVehicles, error: vehiclesError } = useGetAllVehiclesQuery({
    page: 1,
    limit: 100,
    status: 'in',
    companyId: formData.companyId
  }, {
    skip: !formData.companyId // Skip query if no company selected
  })

  // Debug vehicles query
  console.log('GatePassFormModal: Vehicles query state:', {
    companyId: formData.companyId,
    isLoadingVehicles,
    vehiclesError,
    vehiclesResponse,
    skipQuery: !formData.companyId
  })

  const currentUser = useSelector(selectCurrentUser)
  const vehicles = vehiclesResponse?.data || []
  const todayVehicles = todayVehiclesResponse?.data || []
  
  // Debug vehicle data
  console.log('GatePassFormModal: Vehicle data loaded:', {
    vehiclesResponse,
    vehicles,
    vehiclesLength: vehicles.length,
    todayVehiclesResponse,
    todayVehicles,
    todayVehiclesLength: todayVehicles.length
  })
  const isEditing = !!gatePass
  const isLoading = isCreating || isUpdating

  // Debug logging
  console.log('GatePassFormModal Debug:', {
    formDataCompanyId: formData.companyId,
    todayStart: todayStart.toISOString(),
    todayEnd: todayEnd.toISOString(),
    todayVehiclesResponse,
    todayVehicles,
    todayVehiclesLength: todayVehicles.length,
    isLoadingTodayVehicles,
    todayVehiclesError,
    vehiclesResponse,
    vehicles,
    vehiclesLength: vehicles.length,
    vehiclesQuery: {
      page: 1,
      limit: 100,
      status: 'in',
      companyId: formData.companyId
    }
  })

  useEffect(() => {
    if (gatePass) {
      setFormData({
        vehicleId: gatePass.vehicleId || '',
        vehicleNumber: gatePass.vehicleNumber || '',
        driverName: gatePass.driverName || '',
        driverPhone: gatePass.driverPhone || '',
        driverIdNumber: gatePass.driverIdNumber || '',
        driverLicenseNumber: gatePass.driverLicenseNumber || '',
        purpose: gatePass.purpose || 'delivery',
        reason: gatePass.reason || '',
        personToMeet: gatePass.personToMeet || '',
        department: gatePass.department || '',
        securityNotes: gatePass.securityNotes || '',
        items: gatePass.items || [],
        images: [],
        companyId: gatePass.companyId || ''
      })
    } else {
      setFormData(getInitialFormData())
    }
    setErrors({})
    setSelectedImages([])
    setPreviewImages([])
  }, [gatePass, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.vehicleId) newErrors.vehicleId = 'Vehicle is required'
    if (!formData.driverName.trim()) newErrors.driverName = 'Driver name is required'
    if (!formData.driverPhone.trim()) newErrors.driverPhone = 'Driver phone is required'
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast.error('Please select valid image files')
      return
    }

    setSelectedImages(prev => [...prev, ...imageFiles])
    
    // Create preview URLs
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file))
    setPreviewImages(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setPreviewImages(prev => {
      const newPreviews = prev.filter((_, i) => i !== index)
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index])
      return newPreviews
    })
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, value: 0 }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: keyof FormData['items'][0], value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v._id === vehicleId)
    if (vehicle) {
      setFormData(prev => ({
        ...prev,
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const gatePassData: CreateGatePassRequest = {
        vehicleId: formData.vehicleId,
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        driverIdNumber: formData.driverIdNumber || undefined,
        driverLicenseNumber: formData.driverLicenseNumber || undefined,
        purpose: formData.purpose,
        reason: formData.reason,
        personToMeet: formData.personToMeet || undefined,
        department: formData.department || undefined,
        companyId: formData.companyId,
        securityNotes: formData.securityNotes || undefined,
        items: formData.items.length > 0 ? formData.items : undefined
      }

      if (isEditing && gatePass) {
        await updateGatePass({
          id: gatePass._id,
          gatePass: gatePassData
        }).unwrap()
      } else {
        await createGatePass(gatePassData).unwrap()
      }
      
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} gate pass`)
    }
  }

  const updateFormData = (updates: Partial<FormData>) => {
    console.log('GatePassFormModal: Updating form data:', updates)
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key as keyof FormData]
    })
    setErrors(newErrors)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-[60] p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {isEditing ? 'Edit Gate Pass' : 'Create New Gate Pass'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {isEditing ? 'Update gate pass information' : 'Generate a new gate pass for vehicle entry'}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]">
          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Company *
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => updateFormData({ companyId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.companyId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.companyName}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.companyId}</p>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Vehicle *
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => handleVehicleSelect(e.target.value)}
                disabled={isLoadingVehicles}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.vehicleId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } ${isLoadingVehicles ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {isLoadingVehicles ? 'Loading vehicles...' : 'Select a vehicle'}
                </option>
                {vehicles.map((vehicle: any) => {
                  console.log('GatePassFormModal: Rendering vehicle option:', vehicle)
                  return (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleNumber} - {vehicle.driverName}
                    </option>
                  )
                })}
              </select>
              {errors.vehicleId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vehicleId}</p>
              )}
              {vehiclesError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Error loading vehicles: {'message' in vehiclesError ? vehiclesError.message : 'Unknown error'}
                </p>
              )}
              {formData.companyId && !isLoadingVehicles && vehicles.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  No vehicles found for this company with status 'in'
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vehicle Number
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => updateFormData({ vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                readOnly
              />
            </div>
          </div>

          {/* Today's Vehicles for Selected Company */}
          {formData.companyId && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <Car className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                Today's Vehicles ({todayVehicles.length})
                {isLoadingTodayVehicles && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Loading...)</span>}
              </h3>
              
              {isLoadingTodayVehicles ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 dark:border-yellow-400 mx-auto mb-2"></div>
                  <p>Loading today's vehicles...</p>
                </div>
              ) : todayVehiclesError ? (
                <div className="text-center py-4 text-red-500 dark:text-red-400">
                  <p>Error loading vehicles: {'message' in todayVehiclesError ? todayVehiclesError.message : 'Unknown error'}</p>
                </div>
              ) : todayVehicles.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Click on a vehicle to auto-fill the form
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {todayVehicles.map((vehicle) => (
                      <div
                        key={vehicle._id}
                        className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600 transition-colors cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            vehicleId: vehicle._id,
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
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Car className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                  <p>No vehicles entered today for this company</p>
                </div>
              )}
            </div>
          )}

          {/* Driver Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Name *
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => updateFormData({ driverName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.driverName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter driver name"
              />
              {errors.driverName && (
                <p className="mt-1 text-sm text-red-600">{errors.driverName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Phone *
              </label>
              <input
                type="tel"
                value={formData.driverPhone}
                onChange={(e) => updateFormData({ driverPhone: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.driverPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter driver phone"
              />
              {errors.driverPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.driverPhone}</p>
              )}
            </div>
          </div>

          {/* Driver ID and License */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver ID Number
              </label>
              <input
                type="text"
                value={formData.driverIdNumber}
                onChange={(e) => updateFormData({ driverIdNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter driver ID number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver License Number
              </label>
              <input
                type="text"
                value={formData.driverLicenseNumber}
                onChange={(e) => updateFormData({ driverLicenseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter license number"
              />
            </div>
          </div>

          {/* Purpose and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose *
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => updateFormData({ purpose: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => updateFormData({ reason: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.reason ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter reason for visit"
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>
          </div>

          {/* Person to Meet and Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Person to Meet
              </label>
              <input
                type="text"
                value={formData.personToMeet}
                onChange={(e) => updateFormData({ personToMeet: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter person to meet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => updateFormData({ department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter department"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Items (Optional)
              </label>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Item description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => removeItem(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Security Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Notes
            </label>
            <textarea
              value={formData.securityNotes}
              onChange={(e) => updateFormData({ securityNotes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any security notes or special instructions"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Gate Pass' : 'Create Gate Pass'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
