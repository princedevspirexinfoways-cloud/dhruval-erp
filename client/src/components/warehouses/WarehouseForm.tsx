'use client'

import { useState, useEffect } from 'react'
import { useCreateWarehouseMutation, useUpdateWarehouseMutation } from '@/lib/api/warehousesApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  MapPin,
  Building2,
  Package,
  Users,
  Calendar,
  Clock,
  Phone,
  Mail,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'

interface WarehouseFormProps {
  warehouse?: any
  companyId: string
  onClose: () => void
  onSubmit: () => void
}

interface Company {
  _id: string
  name: string
  companyCode: string
}

export function WarehouseForm({ warehouse, companyId, onClose, onSubmit }: WarehouseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId === 'all' ? '' : companyId)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)

  const [formData, setFormData] = useState({
    warehouseName: '',
    warehouseCode: '',
    description: '',
    address: {
      addressLine1: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    contactInfo: {
      primaryPhone: '',
      email: ''
    },
    warehouseType: 'distribution' as const,
    ownershipType: 'owned' as const,
    operationType: 'manual' as const,
    specifications: {
      totalArea: '',
      storageArea: '',
      height: ''
    },
    capacity: {
      maxWeight: '',
      maxVolume: ''
    },
    management: {
      totalStaff: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate warehouse code and set defaults
  useEffect(() => {
    if (warehouse) {
      // Edit mode - populate with existing data
      setFormData({
        warehouseName: warehouse.warehouseName || '',
        warehouseCode: warehouse.warehouseCode || '',
        description: warehouse.description || '',
        address: {
          addressLine1: warehouse.address?.addressLine1 || '',
          city: warehouse.address?.city || '',
          state: warehouse.address?.state || '',
          pincode: warehouse.address?.pincode || '',
          country: warehouse.address?.country || 'India'
        },
        contactInfo: {
          primaryPhone: warehouse.contactInfo?.primaryPhone || '',
          email: warehouse.contactInfo?.email || ''
        },
        warehouseType: warehouse.warehouseType || 'distribution',
        ownershipType: warehouse.ownershipType || 'owned',
        operationType: warehouse.operationType || 'manual',
        specifications: {
          totalArea: warehouse.specifications?.totalArea?.toString() || '',
          storageArea: warehouse.specifications?.storageArea?.toString() || '',
          height: warehouse.specifications?.height?.toString() || ''
        },
        capacity: {
          maxWeight: warehouse.capacity?.maxWeight?.toString() || '',
          maxVolume: warehouse.capacity?.maxVolume?.toString() || ''
        },
        management: {
          totalStaff: warehouse.management?.totalStaff?.toString() || ''
        }
      })
    } else {
      // Create mode - auto-generate warehouse code
      const timestamp = Date.now().toString().slice(-6)
      const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase()
      setFormData(prev => ({
        ...prev,
        warehouseCode: `WH${timestamp}${randomCode}`,
        country: 'India',
        state: 'Gujarat'
      }))
    }
  }, [warehouse])

  // Fetch companies for super admin
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isSuperAdmin) return

      setLoadingCompanies(true)
      try {
        // Use the correct API URL from environment variable
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
        const response = await fetch(`${apiUrl}/companies`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCompanies(data.data || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      } finally {
        setLoadingCompanies(false)
      }
    }

    fetchCompanies()
  }, [isSuperAdmin])

  const [createWarehouse] = useCreateWarehouseMutation()
  const [updateWarehouse] = useUpdateWarehouseMutation()

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any || {}),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Check if companyId is valid
    if (!selectedCompanyId) {
      newErrors.companyId = 'Please select a company'
    }

    if (!formData.warehouseName.trim()) {
      newErrors.warehouseName = 'Warehouse name is required'
    }
    if (!formData.warehouseCode.trim()) {
      newErrors.warehouseCode = 'Warehouse code is required'
    }
    if (!formData.address.addressLine1.trim()) {
      newErrors['address.addressLine1'] = 'Address is required'
    }
    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required'
    }
    if (!formData.address.pincode.trim()) {
      newErrors['address.pincode'] = 'Pincode is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const warehouseData = {
        companyId: selectedCompanyId, // Use selectedCompanyId instead of companyId prop
        warehouseName: formData.warehouseName.trim(),
        warehouseCode: formData.warehouseCode.trim(),
        description: formData.description.trim() || undefined,
        address: {
          addressLine1: formData.address.addressLine1.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
          country: formData.address.country
        },
        contactInfo: {
          primaryPhone: formData.contactInfo.primaryPhone.trim() || '',
          email: formData.contactInfo.email.trim() || undefined
        },
        warehouseType: formData.warehouseType,
        ownershipType: formData.ownershipType,
        operationType: formData.operationType,
        specifications: {
          totalArea: formData.specifications.totalArea ? parseFloat(formData.specifications.totalArea) : 0,
          storageArea: formData.specifications.storageArea ? parseFloat(formData.specifications.storageArea) : 0,
          height: formData.specifications.height ? parseFloat(formData.specifications.height) : 0
        },
        capacity: {
          maxWeight: formData.capacity.maxWeight ? parseFloat(formData.capacity.maxWeight) : 0,
          maxVolume: formData.capacity.maxVolume ? parseFloat(formData.capacity.maxVolume) : 0
        },
        management: {
          totalStaff: formData.management.totalStaff ? parseInt(formData.management.totalStaff) : 0
        }
      }

      if (warehouse) {
        await updateWarehouse({ warehouseId: warehouse._id, warehouseData }).unwrap()
        toast.success('Warehouse updated successfully!')
      } else {
        await createWarehouse(warehouseData).unwrap()
        toast.success('Warehouse created successfully!')
      }

      onSubmit()
    } catch (error: any) {
      console.error('Warehouse operation failed:', error)
      toast.error(error?.data?.message || 'Operation failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {warehouse ? 'Edit Warehouse' : 'Create New Warehouse'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Company ID Validation */}
          {(!selectedCompanyId || companyId === 'all') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Company Selection Required</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Please select a specific company before creating a warehouse.
                The "All Companies" view is only for browsing and cannot be used for creation.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Selection (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Company *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                >
                  <span>
                    {selectedCompanyId ?
                      companies.find(c => c._id === selectedCompanyId)?.name || 'Select Company' :
                      'Select Company'
                    }
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>

                {showCompanyDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {loadingCompanies ? (
                      <div className="p-3 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading companies...
                      </div>
                    ) : companies.length > 0 ? (
                      companies.map(company => (
                        <button
                          key={company._id}
                          type="button"
                          onClick={() => {
                            setSelectedCompanyId(company._id)
                            setShowCompanyDropdown(false)
                          }}
                          className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{company.name} ({company.companyCode})</span>
                          {selectedCompanyId === company._id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No companies found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse Name *
              </label>
              <Input
                type="text"
                value={formData.warehouseName}
                onChange={(e) => handleInputChange('warehouseName', e.target.value)}
                placeholder="Enter warehouse name"
                className={errors.warehouseName ? 'border-red-500' : ''}
              />
              {errors.warehouseName && (
                <p className="mt-1 text-sm text-red-600">{errors.warehouseName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse Code *
              </label>
              <Input
                type="text"
                value={formData.warehouseCode}
                onChange={(e) => handleInputChange('warehouseCode', e.target.value)}
                placeholder="Auto-generated code"
                className={errors.warehouseCode ? 'border-red-500' : ''}
              />
              {errors.warehouseCode && (
                <p className="mt-1 text-sm text-red-600">{errors.warehouseCode}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter warehouse description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <Input
                  type="text"
                  value={formData.address.addressLine1}
                  onChange={(e) => handleInputChange('address.addressLine1', e.target.value)}
                  placeholder="Enter address"
                  className={errors['address.addressLine1'] ? 'border-red-500' : ''}
                />
                {errors['address.addressLine1'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['address.addressLine1']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <Input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  placeholder="Enter city"
                  className={errors['address.city'] ? 'border-red-500' : ''}
                />
                {errors['address.city'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <Input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <Input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                  placeholder="Enter pincode"
                  className={errors['address.pincode'] ? 'border-red-500' : ''}
                />
                {errors['address.pincode'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['address.pincode']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <Input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-green-600" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Phone
                </label>
                <Input
                  type="tel"
                  value={formData.contactInfo.primaryPhone}
                  onChange={(e) => handleInputChange('contactInfo.primaryPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          {/* Warehouse Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-purple-600" />
              Warehouse Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Type
                </label>
                <select
                  value={formData.warehouseType}
                  onChange={(e) => handleInputChange('warehouseType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="distribution">Distribution</option>
                  <option value="production">Production</option>
                  <option value="storage">Storage</option>
                  <option value="cold_storage">Cold Storage</option>
                  <option value="hazardous">Hazardous</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ownership Type
                </label>
                <select
                  value={formData.ownershipType}
                  onChange={(e) => handleInputChange('ownershipType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="owned">Owned</option>
                  <option value="leased">Leased</option>
                  <option value="rented">Rented</option>
                  <option value="shared">Shared</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation Type
                </label>
                <select
                  value={formData.operationType}
                  onChange={(e) => handleInputChange('operationType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="manual">Manual</option>
                  <option value="automated">Automated</option>
                  <option value="semi_automated">Semi-Automated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-orange-600" />
              Specifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Area (sq ft)
                </label>
                <Input
                  type="number"
                  value={formData.specifications.totalArea}
                  onChange={(e) => handleInputChange('specifications.totalArea', e.target.value)}
                  placeholder="Enter total area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Area (sq ft)
                </label>
                <Input
                  type="number"
                  value={formData.specifications.storageArea}
                  onChange={(e) => handleInputChange('specifications.storageArea', e.target.value)}
                  placeholder="Enter storage area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (ft)
                </label>
                <Input
                  type="number"
                  value={formData.specifications.height}
                  onChange={(e) => handleInputChange('specifications.height', e.target.value)}
                  placeholder="Enter height"
                />
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-indigo-600" />
              Capacity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Weight (tons)
                </label>
                <Input
                  type="number"
                  value={formData.capacity.maxWeight}
                  onChange={(e) => handleInputChange('capacity.maxWeight', e.target.value)}
                  placeholder="Enter max weight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Volume (cubic ft)
                </label>
                <Input
                  type="number"
                  value={formData.capacity.maxVolume}
                  onChange={(e) => handleInputChange('capacity.maxVolume', e.target.value)}
                  placeholder="Enter max volume"
                />
              </div>
            </div>
          </div>

          {/* Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-teal-600" />
              Management
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Staff
              </label>
              <Input
                type="number"
                value={formData.management.totalStaff}
                onChange={(e) => handleInputChange('management.totalStaff', e.target.value)}
                placeholder="Enter total staff count"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedCompanyId}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {warehouse ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {warehouse ? 'Update Warehouse' : 'Create Warehouse'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
