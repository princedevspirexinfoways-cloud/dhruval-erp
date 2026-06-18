import React, { useState, useEffect } from 'react'
import { X, Users, User, Phone, Calendar, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { 
  CustomerVisit, 
  CreateCustomerVisitRequest,
  useCreateCustomerVisitMutation,
  useUpdateCustomerVisitMutation
} from '@/lib/features/hospitality/hospitalityApi'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { toast } from 'react-hot-toast'

interface CustomerVisitFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  visit?: CustomerVisit
}

interface FormData {
  partyName: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
  visitDate: string
  purpose: CustomerVisit['purpose']
  purposeDescription: string
  travelType: CustomerVisit['travelType']
  origin: string
  destination: string
  travelMode: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'other'
  companyId: string
  visitOutcomeStatus: string
  visitOutcomeNotes: string
}

export default function CustomerVisitFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  visit 
}: CustomerVisitFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    partyName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    visitDate: '',
    purpose: 'meeting',
    purposeDescription: '',
    travelType: 'local',
    origin: '',
    destination: '',
    travelMode: 'car',
    companyId: '',
    visitOutcomeStatus: 'pending',
    visitOutcomeNotes: 'Visit scheduled'
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const { data: companiesResponse } = useGetAllCompaniesQuery()
  const companies = companiesResponse?.data || []

  const [createVisit, { isLoading: isCreating }] = useCreateCustomerVisitMutation()
  const [updateVisit, { isLoading: isUpdating }] = useUpdateCustomerVisitMutation()

  const isEditing = !!visit
  const isLoading = isCreating || isUpdating

  useEffect(() => {
    if (visit) {
      setFormData({
        partyName: visit.partyName || '',
        contactPerson: visit.contactPerson || '',
        contactPhone: visit.contactPhone || '',
        contactEmail: visit.contactEmail || '',
        visitDate: visit.visitDate ? visit.visitDate.split('T')[0] : '',
        purpose: visit.purpose || 'business_meeting',
        purposeDescription: visit.purposeDescription || '',
        travelType: visit.travelType || 'local',
        origin: visit.travelDetails?.origin || '',
        destination: visit.travelDetails?.destination || '',
        travelMode: visit.travelDetails?.travelMode || 'car',
        companyId: visit.companyId || '',
        visitOutcomeStatus: (typeof visit.visitOutcome === 'object' ? visit.visitOutcome?.status : 'pending') || 'pending',
        visitOutcomeNotes: (typeof visit.visitOutcome === 'object' ? visit.visitOutcome?.notes : '') || ''
      })
    } else {
      setFormData({
        partyName: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        visitDate: '',
        purpose: 'meeting',
        purposeDescription: '',
        travelType: 'local',
        origin: '',
        destination: '',
        travelMode: 'car',
        companyId: '',
        visitOutcomeStatus: 'pending',
        visitOutcomeNotes: 'Visit scheduled'
      })
    }
    setErrors({})
  }, [visit, isOpen])

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear errors for updated fields
    const updatedFields = Object.keys(updates)
    setErrors(prev => {
      const newErrors = { ...prev }
      updatedFields.forEach(field => {
        delete newErrors[field as keyof FormData]
      })
      return newErrors
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.partyName.trim()) {
      newErrors.partyName = 'Party name is required'
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required'
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required'
    }

    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required'
    }

    if (!formData.purposeDescription.trim()) {
      newErrors.purposeDescription = 'Purpose description is required'
    }

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required'
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required'
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      const visitData: CreateCustomerVisitRequest = {
        partyName: formData.partyName,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail || undefined,
        visitDate: formData.visitDate,
        purpose: formData.purpose,
        purposeDescription: formData.purposeDescription,
        travelType: formData.travelType,
        travelDetails: {
          origin: formData.origin,
          destination: formData.destination,
          travelMode: formData.travelMode
        },
        visitOutcome: {
          status: formData.visitOutcomeStatus as 'successful' | 'partially_successful' | 'unsuccessful' | 'follow_up_required',
          notes: formData.visitOutcomeNotes
        },
        companyId: formData.companyId
      }

      if (isEditing) {
        await updateVisit({ id: visit._id, data: visitData }).unwrap()
      } else {
        await createVisit(visitData).unwrap()
      }

      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} customer visit`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Customer Visit' : 'Add Customer Visit'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Update customer visit information' : 'Create a new customer visit record'}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.partyName}
                  onChange={(e) => updateFormData({ partyName: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.partyName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Company or party name"
                />
                {errors.partyName && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.partyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => updateFormData({ contactPerson: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.contactPerson ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Contact person name"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => updateFormData({ contactPhone: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.contactPhone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Contact phone number"
                  />
                </div>
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.contactPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateFormData({ contactEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.visitDate}
                    onChange={(e) => updateFormData({ visitDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.visitDate ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                  />
                </div>
                {errors.visitDate && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.visitDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <select
                  required
                  value={formData.companyId}
                  onChange={(e) => updateFormData({ companyId: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.companyId ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.companyId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Visit Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose *
                </label>
                <select
                  required
                  value={formData.purpose}
                  onChange={(e) => updateFormData({ purpose: e.target.value as CustomerVisit['purpose'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="business_meeting">Business Meeting</option>
                  <option value="product_demo">Product Demo</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="site_visit">Site Visit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Type *
                </label>
                <select
                  required
                  value={formData.travelType}
                  onChange={(e) => updateFormData({ travelType: e.target.value as CustomerVisit['travelType'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="local">Local</option>
                  <option value="outstation">Outstation</option>
                  <option value="international">International</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.purposeDescription}
                  onChange={(e) => updateFormData({ purposeDescription: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                    errors.purposeDescription ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Detailed description of the visit purpose..."
                />
                {errors.purposeDescription && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.purposeDescription}</p>
                )}
              </div>
            </div>
          </div>

          {/* Travel Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              Travel Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin *
                </label>
                <input
                  type="text"
                  required
                  value={formData.origin}
                  onChange={(e) => updateFormData({ origin: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.origin ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Starting location"
                />
                {errors.origin && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.origin}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => updateFormData({ destination: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.destination ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Destination location"
                />
                {errors.destination && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.destination}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Mode
                </label>
                <select
                  value={formData.travelMode}
                  onChange={(e) => updateFormData({ travelMode: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                  <option value="car">Car</option>
                  <option value="taxi">Taxi</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Visit' : 'Create Visit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
