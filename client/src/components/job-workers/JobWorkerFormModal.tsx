'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { JobWorker, CreateJobWorkerRequest } from '@/lib/api/jobWorkerApi'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import { useGetJobWorkTypesQuery } from '@/lib/api/jobWorkTypeApi'
import { QuickCreateJobWorkType } from '@/components/job-work/QuickCreateJobWorkType'

interface JobWorkerFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CreateJobWorkerRequest) => Promise<void>
    worker?: JobWorker
    isEdit?: boolean
    isLoading?: boolean
}

const SPECIALIZATIONS = [
    'printing',
    'dyeing',
    'washing',
    'finishing',
    'cutting',
    'packing',
    'stitching',
    'quality_check',
    'other'
]

const SKILL_LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
]

export const JobWorkerFormModal: React.FC<JobWorkerFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    worker,
    isEdit = false,
    isLoading = false
}) => {
    const theme = useSelector(selectTheme)
    const [showJobTypeModal, setShowJobTypeModal] = useState(false)

    // Dynamic job types for specialization
    const { data: jobWorkTypesResponse } = useGetJobWorkTypesQuery({ isActive: true })
    const jobWorkTypes = jobWorkTypesResponse?.data || []
    const [formData, setFormData] = useState<CreateJobWorkerRequest>({
        name: '',
        phoneNumber: '',
        alternatePhoneNumber: '',
        email: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
            fullAddress: ''
        },
        aadharNumber: '',
        panNumber: '',
        gstNumber: '',
        bankDetails: {
            accountNumber: '',
            ifscCode: '',
            bankName: '',
            branchName: ''
        },
        specialization: [],
        experience: 0,
        skillLevel: 'intermediate',
        hourlyRate: 0,
        dailyRate: 0,
        status: 'active',
        notes: '',
        tags: []
    })

    useEffect(() => {
        if (worker && isEdit) {
            setFormData({
                name: worker.name || '',
                phoneNumber: worker.phoneNumber || '',
                alternatePhoneNumber: worker.alternatePhoneNumber || '',
                email: worker.email || '',
                address: worker.address || {
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                    fullAddress: ''
                },
                aadharNumber: worker.aadharNumber || '',
                panNumber: worker.panNumber || '',
                gstNumber: worker.gstNumber || '',
                bankDetails: worker.bankDetails || {
                    accountNumber: '',
                    ifscCode: '',
                    bankName: '',
                    branchName: ''
                },
                specialization: worker.specialization || [],
                experience: worker.experience || 0,
                skillLevel: worker.skillLevel || 'intermediate',
                hourlyRate: worker.hourlyRate || 0,
                dailyRate: worker.dailyRate || 0,
                status: worker.status || 'active',
                notes: worker.notes || '',
                tags: worker.tags || []
            })
        } else {
            // Reset form
            setFormData({
                name: '',
                phoneNumber: '',
                alternatePhoneNumber: '',
                email: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                    fullAddress: ''
                },
                aadharNumber: '',
                panNumber: '',
                gstNumber: '',
                bankDetails: {
                    accountNumber: '',
                    ifscCode: '',
                    bankName: '',
                    branchName: ''
                },
                specialization: [],
                experience: 0,
                skillLevel: 'intermediate',
                hourlyRate: 0,
                dailyRate: 0,
                status: 'active',
                notes: '',
                tags: []
            })
        }
    }, [worker, isEdit, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.phoneNumber) {
            return
        }
        await onSubmit(formData)
    }

    const handleSpecializationToggle = (spec: string) => {
        setFormData(prev => ({
            ...prev,
            specialization: prev.specialization?.includes(spec)
                ? prev.specialization.filter(s => s !== spec)
                : [...(prev.specialization || []), spec]
        }))
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Worker' : 'Add New Worker'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Name *
                                </label>
                                <Input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number *
                                </label>
                                <Input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Alternate Phone
                                </label>
                                <Input
                                    type="tel"
                                    value={formData.alternatePhoneNumber}
                                    onChange={(e) => setFormData({ ...formData, alternatePhoneNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Full Address
                                </label>
                                <textarea
                                    value={formData.address?.fullAddress || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, fullAddress: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    City
                                </label>
                                <Input
                                    type="text"
                                    value={formData.address?.city || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, city: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    State
                                </label>
                                <Input
                                    type="text"
                                    value={formData.address?.state || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, state: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Pincode
                                </label>
                                <Input
                                    type="text"
                                    value={formData.address?.pincode || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, pincode: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Work Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Work Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Specialization (Job Types)
                                    </label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowJobTypeModal(true)}
                                        className="text-xs px-2 py-1"
                                    >
                                        + New Job Type
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(jobWorkTypes.length > 0
                                        ? jobWorkTypes.map(t => t.name)
                                        : SPECIALIZATIONS
                                    ).map((spec) => (
                                        <button
                                            key={spec}
                                            type="button"
                                            onClick={() => handleSpecializationToggle(spec)}
                                            className={`px-3 py-1 text-sm rounded-full ${
                                                formData.specialization?.includes(spec)
                                                    ? 'bg-sky-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Skill Level
                                </label>
                                <select
                                    value={formData.skillLevel}
                                    onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    {SKILL_LEVELS.map((level) => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Experience (Years)
                                </label>
                                <Input
                                    type="number"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                                    min={0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Hourly Rate
                                </label>
                                <Input
                                    type="number"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                                    min={0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Daily Rate
                                </label>
                                <Input
                                    type="number"
                                    value={formData.dailyRate}
                                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                                    min={0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bank Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Account Number
                                </label>
                                <Input
                                    type="text"
                                    value={formData.bankDetails?.accountNumber || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    IFSC Code
                                </label>
                                <Input
                                    type="text"
                                    value={formData.bankDetails?.ifscCode || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bank Name
                                </label>
                                <Input
                                    type="text"
                                    value={formData.bankDetails?.bankName || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Branch Name
                                </label>
                                <Input
                                    type="text"
                                    value={formData.bankDetails?.branchName || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, branchName: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Additional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Aadhar Number
                                </label>
                                <Input
                                    type="text"
                                    value={formData.aadharNumber}
                                    onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    PAN Number
                                </label>
                                <Input
                                    type="text"
                                    value={formData.panNumber}
                                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    GST Number
                                </label>
                                <Input
                                    type="text"
                                    value={formData.gstNumber}
                                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.name || !formData.phoneNumber}
                            className="bg-sky-600 hover:bg-sky-700 text-white"
                        >
                            {isLoading ? 'Saving...' : isEdit ? 'Update Worker' : 'Create Worker'}
                        </Button>
                    </div>
                </form>
            </div>
            {/* Quick create job work type modal for dynamic specialization options */}
            <QuickCreateJobWorkType
                open={showJobTypeModal}
                onOpenChange={setShowJobTypeModal}
                onJobWorkTypeCreated={(jobWorkTypeId) => {
                    const createdType = jobWorkTypes.find(t => t._id === jobWorkTypeId)
                    if (createdType?.name) {
                        setFormData(prev => ({
                            ...prev,
                            specialization: prev.specialization?.includes(createdType.name)
                                ? prev.specialization
                                : [...(prev.specialization || []), createdType.name]
                        }))
                    }
                }}
            />
        </div>
    )
}

