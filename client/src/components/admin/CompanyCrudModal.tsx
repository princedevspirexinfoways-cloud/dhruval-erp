'use client'

import { useState, useEffect } from 'react'
import { X, Building2, Save, Trash2, MapPin, Phone, Mail, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import toast from 'react-hot-toast'

interface CompanyFormData {
  companyName: string
  companyCode: string
  legalName: string
  registrationNumber: string
  taxId: string
  email: string
  phone: string
  website: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  isActive: boolean
}

interface CompanyCrudModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  company?: any // For edit mode
  mode: 'create' | 'edit'
}

export function CompanyCrudModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  company, 
  mode 
}: CompanyCrudModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    companyCode: '',
    legalName: '',
    registrationNumber: '',
    taxId: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    },
    isActive: true
  })

  useEffect(() => {
    if (isOpen && mode === 'edit' && company) {
      setFormData({
        companyName: company.companyName || '',
        companyCode: company.companyCode || '',
        legalName: company.legalName || '',
        registrationNumber: company.registrationNumber || '',
        taxId: company.taxId || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        address: {
          street: company.address?.street || '',
          city: company.address?.city || '',
          state: company.address?.state || '',
          postalCode: company.address?.postalCode || '',
          country: company.address?.country || 'India'
        },
        isActive: company.isActive ?? true
      })
    } else if (isOpen && mode === 'create') {
      setFormData({
        companyName: '',
        companyCode: '',
        legalName: '',
        registrationNumber: '',
        taxId: '',
        email: '',
        phone: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India'
        },
        isActive: true
      })
    }
  }, [isOpen, mode, company])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const url = mode === 'create' ? '/api/admin/companies' : `/api/admin/companies/${company._id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Company ${mode === 'create' ? 'created' : 'updated'} successfully`)
        onSuccess()
        onClose()
      } else {
        toast.error(result.message || `Failed to ${mode} company`)
      }
    } catch (error) {
      toast.error(`Failed to ${mode} company`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete company ${company?.companyName}? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/companies/${company._id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Company deleted successfully')
        onSuccess()
        onClose()
      } else {
        toast.error(result.message || 'Failed to delete company')
      }
    } catch (error) {
      toast.error('Failed to delete company')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <ResponsiveCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-sky-600" />
            {mode === 'create' ? 'Create New Company' : 'Edit Company'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name *
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Code *
              </label>
              <Input
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                placeholder="Enter company code (e.g., ABC123)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Legal Name
              </label>
              <Input
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="Enter legal company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Registration Number
              </label>
              <Input
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="Enter registration number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tax ID / GST Number
              </label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Enter tax ID or GST number"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="Enter website URL"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Address Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Street Address
                </label>
                <Input
                  value={formData.address.street}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, street: e.target.value }
                  })}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City
                  </label>
                  <Input
                    value={formData.address.city}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, city: e.target.value }
                    })}
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    State
                  </label>
                  <Input
                    value={formData.address.state}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, state: e.target.value }
                    })}
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Postal Code
                  </label>
                  <Input
                    value={formData.address.postalCode}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, postalCode: e.target.value }
                    })}
                    placeholder="Enter postal code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={formData.address.country}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, country: e.target.value }
                    })}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3 pt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Active Company
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div>
              {mode === 'edit' && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Company
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === 'create' ? 'Create Company' : 'Update Company'}
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveCard>
    </div>
  )
}
