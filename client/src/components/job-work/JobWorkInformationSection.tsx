'use client'

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/Button'
import { CreateJobWorkRequest } from '@/lib/api/jobWorkApi'
import { useGetJobWorkTypesQuery } from '@/lib/api/jobWorkTypeApi'
import { JobWorkFormErrors } from './types'
import { QuickCreateJobWorkType } from './QuickCreateJobWorkType'
import { Plus } from 'lucide-react'

interface JobWorkInformationSectionProps {
    formData: CreateJobWorkRequest
    suppliers: any[] // Job Workers
    errors: JobWorkFormErrors
    onInputChange: (field: keyof CreateJobWorkRequest, value: any) => void
    onJobWorkerSelect: (workerId: string) => void
    isLoading?: boolean
}

export function JobWorkInformationSection({
    formData,
    suppliers,
    errors,
    onInputChange,
    onJobWorkerSelect,
    isLoading = false
}: JobWorkInformationSectionProps) {
    const theme = useSelector((state: RootState) => state.ui.theme)
    const [showCreateJobWorkType, setShowCreateJobWorkType] = useState(false)
    
    const { data: jobWorkTypesData, isLoading: jobWorkTypesLoading, refetch: refetchJobWorkTypes } = useGetJobWorkTypesQuery({})
    const jobWorkTypes = jobWorkTypesData?.data || []

    return (
        <div className="space-y-4">
            <h3 className={`text-lg font-semibold border-b pb-2 ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>Job Work Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="jobWorkerId" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Job Worker <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.jobWorkerId}
                        onValueChange={onJobWorkerSelect}
                    >
                        <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                            <SelectValue placeholder="Select Job Worker" />
                        </SelectTrigger>
                        <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                            {isLoading ? (
                                <div className="px-2 py-1.5 text-sm text-gray-500">Loading workers...</div>
                            ) : suppliers.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-gray-500">No workers available</div>
                            ) : (
                                suppliers.map((worker: any) => (
                                    <SelectItem key={worker._id} value={worker._id} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{worker.name || worker.workerCode}</span>
                                            <span className="text-xs text-gray-500">
                                                {worker.workerCode}
                                                {worker.phoneNumber && ` • ${worker.phoneNumber}`}
                                                {worker.specialization && worker.specialization.length > 0 && (
                                                    <span> • {worker.specialization.slice(0, 2).join(', ')}</span>
                                                )}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors.jobWorkerId && (
                        <p className="text-red-500 text-sm mt-1">{errors.jobWorkerId}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="jobWorkerName" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Job Worker Name
                    </Label>
                    <Input
                        id="jobWorkerName"
                        value={formData.jobWorkerName}
                        onChange={(e) => onInputChange('jobWorkerName', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Job Worker Name"
                    />
                    {errors.jobWorkerName && (
                        <p className="text-red-500 text-sm mt-1">{errors.jobWorkerName}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="jobWorkerRate" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Job Worker Rate (per unit)
                    </Label>
                    <Input
                        id="jobWorkerRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.jobWorkerRate}
                        onChange={(e) => onInputChange('jobWorkerRate', parseFloat(e.target.value) || 0)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="0.00"
                    />
                    {errors.jobWorkerRate && (
                        <p className="text-red-500 text-sm mt-1">{errors.jobWorkerRate}</p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="jobWorkType" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Job Work Type
                        </Label>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCreateJobWorkType(true)}
                            className={`h-7 px-2 ${theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}`}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            New
                        </Button>
                    </div>
                    <Select
                        value={formData.jobWorkType}
                        onValueChange={(value) => onInputChange('jobWorkType', value)}
                    >
                        <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                            {jobWorkTypesLoading ? (
                                <div className="px-2 py-1.5 text-sm text-gray-500">Loading types...</div>
                            ) : jobWorkTypes.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-gray-500">No types available</div>
                            ) : (
                                jobWorkTypes
                                    .filter((type: any) => type.isActive)
                                    .map((type: any) => (
                                        <SelectItem 
                                            key={type._id} 
                                            value={type.name} 
                                            className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}
                                        >
                                            <div className="flex items-center gap-2">
                                                {type.color && (
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: type.color }}
                                                    />
                                                )}
                                                <span>{type.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors.jobWorkType && (
                        <p className="text-red-500 text-sm mt-1">{errors.jobWorkType}</p>
                    )}
                </div>
                
                <QuickCreateJobWorkType
                    open={showCreateJobWorkType}
                    onOpenChange={setShowCreateJobWorkType}
                    onJobWorkTypeCreated={async (jobWorkTypeId) => {
                        const { data: refetchedData } = await refetchJobWorkTypes()
                        // Find the created type and set it
                        const createdType = refetchedData?.data?.find((t: any) => t._id === jobWorkTypeId)
                        if (createdType) {
                            onInputChange('jobWorkType', createdType.name)
                        }
                    }}
                />

                <div>
                    <Label htmlFor="expectedDelivery" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Expected Delivery Date
                    </Label>
                    <Input
                        id="expectedDelivery"
                        type="date"
                        value={formData.expectedDelivery}
                        onChange={(e) => onInputChange('expectedDelivery', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                    />
                    {errors.expectedDelivery && (
                        <p className="text-red-500 text-sm mt-1">{errors.expectedDelivery}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
