'use client'

import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { JobWork, CreateJobWorkRequest, UpdateJobWorkRequest } from '@/lib/api/jobWorkApi'
import { useJobWorkForm } from './useJobWorkForm'
import { ChallanInformationSection } from './ChallanInformationSection'
import { PartyDetailsSection } from './PartyDetailsSection'
import { TransportDetailsSection } from './TransportDetailsSection'
import { JobWorkInformationSection } from './JobWorkInformationSection'
import { MaterialProvidedSection } from './MaterialProvidedSection'
import { AdditionalInformationSection } from './AdditionalInformationSection'

interface JobWorkFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CreateJobWorkRequest | UpdateJobWorkRequest) => Promise<void>
    jobWork?: JobWork | null
    isLoading?: boolean
}

export function JobWorkFormModal({
    isOpen,
    onClose,
    onSubmit,
    jobWork,
    isLoading = false
}: JobWorkFormModalProps) {
    const isEditing = !!jobWork
    const theme = useSelector((state: RootState) => state.ui.theme)

    const {
        formData,
        challanData,
        partyData,
        transportData,
        materialProvided,
        errors,
        suppliers,
        workersLoading,
        inventoryItems,
        categories,
        subcategories,
        units,
        setFormData,
        setChallanData,
        setPartyData,
        setTransportData,
        setMaterialProvided,
        setErrors,
        handleMaterialChange,
        validateForm,
        getSubmitData,
        refetchCategories,
        refetchSubcategories,
        refetchUnits
    } = useJobWorkForm(jobWork, isOpen)

    const handleInputChange = (field: keyof CreateJobWorkRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const handleChallanChange = (field: keyof typeof challanData, value: any) => {
        setChallanData(prev => ({
            ...prev,
            [field]: value
        }))
        // Clear error
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const handlePartyChange = (field: keyof typeof partyData, value: string) => {
        setPartyData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleTransportChange = (field: keyof typeof transportData, value: string) => {
        setTransportData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleCategoryChange = (value: string) => {
        handleChallanChange('category', value)
        handleChallanChange('subcategory', '')
    }

    const handleSubcategoryChange = (value: string) => {
        handleChallanChange('subcategory', value)
    }

    const handleJobWorkerSelect = (supplierId: string) => {
        handleInputChange('jobWorkerId', supplierId)
    }

    const handleAddMaterial = () => {
        setMaterialProvided(prev => [
            ...prev,
            { itemId: '', itemName: '', quantity: 0, unit: 'meters', rate: 0 }
        ])
    }

    const handleRemoveMaterial = (index: number) => {
        setMaterialProvided(prev => prev.filter((_, i) => i !== index))
    }

    const handleQuantityChange = (value: number) => {
        handleInputChange('quantity', value)
    }

    const handleUnitChange = (value: string) => {
        handleInputChange('unit', value)
    }

    const handleCategoryCreated = async (categoryId: string) => {
        await refetchCategories()
    }

    const handleSubcategoryCreated = async (subcategoryId: string) => {
        await refetchSubcategories()
    }

    const handleUnitCreated = async (unitId: string) => {
        const result = await refetchUnits()
        // Find the newly created unit and set it
        if (result.data?.data) {
            const newUnit = result.data.data.find((u: any) => u._id === unitId)
            if (newUnit) {
                // Use name property from Unit type
                handleUnitChange(newUnit.name || unitId)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const submitData = getSubmitData()

        try {
            await onSubmit(submitData)
            onClose()
        } catch (error) {
            console.error('Error submitting job work:', error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <DialogHeader>
                    <DialogTitle className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {isEditing ? 'Edit Job Work' : 'Create New Job Work'}
                    </DialogTitle>
                    <DialogDescription className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        {isEditing ? 'Update job work details' : 'Fill in the details to create a new job work assignment'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <ChallanInformationSection
                        challanData={challanData}
                        quantity={formData.quantity}
                        unit={formData.unit}
                        categories={categories}
                        subcategories={subcategories}
                        units={units}
                        errors={errors}
                        onChallanChange={handleChallanChange}
                        onQuantityChange={handleQuantityChange}
                        onUnitChange={handleUnitChange}
                        onCategoryChange={handleCategoryChange}
                        onSubcategoryChange={handleSubcategoryChange}
                        onCategoryCreated={handleCategoryCreated}
                        onSubcategoryCreated={handleSubcategoryCreated}
                        onUnitCreated={handleUnitCreated}
                    />

                    <PartyDetailsSection
                        partyData={partyData}
                        onPartyChange={handlePartyChange}
                    />

                    <TransportDetailsSection
                        transportData={transportData}
                        onTransportChange={handleTransportChange}
                    />

                    <JobWorkInformationSection
                        formData={formData}
                        suppliers={suppliers}
                        errors={errors}
                        onInputChange={handleInputChange}
                        onJobWorkerSelect={handleJobWorkerSelect}
                        isLoading={workersLoading}
                    />

                    <MaterialProvidedSection
                        materials={materialProvided}
                        inventoryItems={inventoryItems}
                        onAddMaterial={handleAddMaterial}
                        onRemoveMaterial={handleRemoveMaterial}
                        onMaterialChange={handleMaterialChange}
                    />

                    <AdditionalInformationSection
                        qualityAgreement={formData.qualityAgreement ?? ''}
                        remarks={formData.remarks ?? ''}
                        onQualityAgreementChange={(value) => handleInputChange('qualityAgreement', value)}
                        onRemarksChange={(value) => handleInputChange('remarks', value)}
                    />

                    <DialogFooter className={`flex justify-end gap-2 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-sky-600 hover:bg-sky-700 text-white"
                        >
                            {isLoading ? 'Saving...' : isEditing ? 'Update Job Work' : 'Create Job Work'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
