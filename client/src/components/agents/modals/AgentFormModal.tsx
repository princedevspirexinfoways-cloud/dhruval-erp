import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
    X,
    User,
    Phone,
    MapPin,
    Save,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Agent,
    useCreateAgentMutation,
    useUpdateAgentMutation
} from '@/lib/api/agentsApi'
import { useGetAllCompaniesQuery } from '@/lib/api/authApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'

interface AgentFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    agent?: Agent | null
}

interface FormData {
    companyId: string
    agentName: string // Firm Name
    contactPersonName: string // Contact Person Name
    primaryPhone: string // Contact Number
    whatsapp: string // WhatsApp Number
    primaryEmail: string // Email Address
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    pincode: string
    country: string
    gstin: string
    pan: string
    notes: string
    isActive: boolean
}

const initialFormData: FormData = {
    companyId: '',
    agentName: '',
    contactPersonName: '',
    primaryPhone: '',
    whatsapp: '',
    primaryEmail: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    gstin: '',
    pan: '',
    notes: '',
    isActive: true
}

export function AgentFormModal({ isOpen, onClose, onSuccess, agent }: AgentFormModalProps) {
    const [formData, setFormData] = useState<FormData>(initialFormData)
    const [errors, setErrors] = useState<Partial<FormData>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const user = useSelector(selectCurrentUser)
    const isSuperAdmin = useSelector(selectIsSuperAdmin)
    const userCompanyId = user?.companyId as string

    const { data: companiesData } = useGetAllCompaniesQuery(undefined, {
        skip: !isSuperAdmin
    })

    const companies = companiesData?.data || []
    const [createAgent] = useCreateAgentMutation()
    const [updateAgent] = useUpdateAgentMutation()

    const isEditing = !!agent

    useEffect(() => {
        if (isOpen) {
            if (agent) {
                // Edit mode - populate with existing data
                setFormData({
                    companyId: userCompanyId || '',
                    agentName: agent.agentName || '',
                    contactPersonName: agent.contactPersonName || '',
                    primaryPhone: agent.contactInfo?.primaryPhone || '',
                    whatsapp: agent.contactInfo?.whatsapp || '',
                    primaryEmail: agent.contactInfo?.primaryEmail || '',
                    addressLine1: agent.addresses?.[0]?.addressLine1 || '',
                    addressLine2: agent.addresses?.[0]?.addressLine2 || '',
                    city: agent.addresses?.[0]?.city || '',
                    state: agent.addresses?.[0]?.state || '',
                    pincode: agent.addresses?.[0]?.pincode || '',
                    country: agent.addresses?.[0]?.country || 'India',
                    gstin: agent.registrationDetails?.gstin || '',
                    pan: agent.registrationDetails?.pan || '',
                    notes: agent.notes || '',
                    isActive: agent.isActive !== false
                })
            } else {
                // Create mode - set defaults
                setFormData({
                    ...initialFormData,
                    companyId: isSuperAdmin ? '' : userCompanyId || ''
                })
            }
            setErrors({})
        }
    }, [isOpen, agent, userCompanyId, isSuperAdmin])

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {}

        // Required fields validation
        if (!formData.companyId && isSuperAdmin) {
            newErrors.companyId = 'Company is required'
        }
        if (!formData.agentName.trim()) {
            newErrors.agentName = 'Firm name is required'
        }
        if (!formData.contactPersonName.trim()) {
            newErrors.contactPersonName = 'Contact person name is required'
        }
        // Agent code will be auto-generated on server side - no validation needed
        if (!formData.primaryPhone.trim()) {
            newErrors.primaryPhone = 'Contact number is required'
        }
        if (!formData.primaryEmail.trim()) {
            newErrors.primaryEmail = 'Email address is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
            newErrors.primaryEmail = 'Invalid email format'
        }

        // Address validation
        if (!formData.addressLine1.trim()) {
            newErrors.addressLine1 = 'Address is required'
        }
        if (!formData.city.trim()) {
            newErrors.city = 'City is required'
        }
        if (!formData.state.trim()) {
            newErrors.state = 'State is required'
        }
        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required'
        }

        // Phone validation
        if (formData.primaryPhone && !/^[6-9]\d{9}$/.test(formData.primaryPhone.replace(/\D/g, ''))) {
            newErrors.primaryPhone = 'Invalid phone number format'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Please fix the validation errors')
            return
        }

        setIsSubmitting(true)

        try {
            // Auto-generate agent code (not shown to user, internal use only)
            const autoGeneratedCode = `AGT${Date.now().toString().slice(-6)}`

            const agentData: Agent = {
                agentCode: autoGeneratedCode, // Auto-generated internally
                agentName: formData.agentName.trim(), // Firm Name
                contactPersonName: formData.contactPersonName.trim(),
                firmName: formData.agentName.trim(),
                companyId: formData.companyId,
                contactInfo: {
                    primaryPhone: formData.primaryPhone.trim(),
                    primaryEmail: formData.primaryEmail.trim(),
                    whatsapp: formData.whatsapp.trim()
                },
                addresses: [{
                    addressLine1: formData.addressLine1.trim(),
                    addressLine2: formData.addressLine2.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    pincode: formData.pincode.trim(),
                    country: formData.country.trim()
                }],
                registrationDetails: {
                    gstin: formData.gstin.trim() || undefined,
                    pan: formData.pan.trim() || undefined
                },
                notes: formData.notes.trim(),
                isActive: formData.isActive
            }

            if (isEditing && agent && agent._id) {
                await updateAgent({
                    id: agent._id,
                    data: agentData
                }).unwrap()
                toast.success('Agent updated successfully!')
            } else {
                await createAgent(agentData).unwrap()
                toast.success('Agent created successfully!')
            }

            onSuccess()
            onClose()
        } catch (error: any) {
            console.error('Error saving agent:', error)
            toast.error(error?.data?.message || 'Failed to save agent')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 dark:bg-black/70 flex items-center justify-center p-1 sm:p-2 md:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transition-theme">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {isEditing ? 'Edit Agent' : 'Add New Agent'}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {isEditing ? 'Update agent information' : 'Fill in the details to create a new agent'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors bg-transparent border-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {/* Company Selection (Super Admin Only) */}
                        {isSuperAdmin && (
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-gray-900 dark:text-white">
                                        Company Selection
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label>Select Company *</Label>
                                        <select
                                            value={formData.companyId}
                                            onChange={(e) => handleInputChange('companyId', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg ${errors.companyId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                        >
                                            <option value="">Select a company</option>
                                            {companies.map((company: any) => (
                                                <option key={company._id} value={company._id}>
                                                    {company.companyName}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.companyId && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.companyId}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Basic Information */}
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
                                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Firm Name *</Label>
                                        <Input
                                            value={formData.agentName}
                                            onChange={(e) => handleInputChange('agentName', e.target.value)}
                                            placeholder="Enter Firm Name"
                                            className={errors.agentName ? 'border-red-500' : ''}
                                        />
                                        {errors.agentName && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.agentName}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Contact Person Name *</Label>
                                        <Input
                                            value={formData.contactPersonName}
                                            onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                                            placeholder="Enter Contact Person Name"
                                            className={errors.contactPersonName ? 'border-red-500' : ''}
                                        />
                                        {errors.contactPersonName && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.contactPersonName}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
                                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Contact Number *</Label>
                                        <Input
                                            value={formData.primaryPhone}
                                            onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
                                            placeholder="Enter Contact Number"
                                            className={errors.primaryPhone ? 'border-red-500' : ''}
                                        />
                                        {errors.primaryPhone && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.primaryPhone}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>WhatsApp Number</Label>
                                        <Input
                                            value={formData.whatsapp}
                                            onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                                            placeholder="Enter WhatsApp Number"
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Email Address *</Label>
                                        <Input
                                            type="email"
                                            value={formData.primaryEmail}
                                            onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                                            placeholder="Enter Email Address"
                                            className={errors.primaryEmail ? 'border-red-500' : ''}
                                        />
                                        {errors.primaryEmail && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.primaryEmail}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address Information */}
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
                                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Address Information *
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Address *</Label>
                                        <Input
                                            value={formData.addressLine1}
                                            onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                                            placeholder="Enter Address"
                                            className={errors.addressLine1 ? 'border-red-500' : ''}
                                        />
                                        {errors.addressLine1 && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.addressLine1}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Address Line 2</Label>
                                        <Input
                                            value={formData.addressLine2}
                                            onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                                            placeholder="Enter Address Line 2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>City *</Label>
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                placeholder="Enter City"
                                                className={errors.city ? 'border-red-500' : ''}
                                            />
                                            {errors.city && (
                                                <p className="text-sm text-red-600 dark:text-red-400">{errors.city}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>State *</Label>
                                            <Input
                                                value={formData.state}
                                                onChange={(e) => handleInputChange('state', e.target.value)}
                                                placeholder="Enter State"
                                                className={errors.state ? 'border-red-500' : ''}
                                            />
                                            {errors.state && (
                                                <p className="text-sm text-red-600 dark:text-red-400">{errors.state}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Pincode *</Label>
                                            <Input
                                                value={formData.pincode}
                                                onChange={(e) => handleInputChange('pincode', e.target.value)}
                                                placeholder="Enter Pincode"
                                                className={errors.pincode ? 'border-red-500' : ''}
                                            />
                                            {errors.pincode && (
                                                <p className="text-sm text-red-600 dark:text-red-400">{errors.pincode}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input
                                            value={formData.country}
                                            onChange={(e) => handleInputChange('country', e.target.value)}
                                            placeholder="Enter Country"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Registration Details */}
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-gray-900 dark:text-white">
                                    Registration Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>GST Number</Label>
                                        <Input
                                            value={formData.gstin}
                                            onChange={(e) => handleInputChange('gstin', e.target.value)}
                                            placeholder="Enter GST Number"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>PAN</Label>
                                        <Input
                                            value={formData.pan}
                                            onChange={(e) => handleInputChange('pan', e.target.value)}
                                            placeholder="Enter PAN"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-gray-900 dark:text-white">
                                    Additional Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        placeholder="Enter Remarks / Notes"
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEditing ? 'Update Agent' : 'Create Agent'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

