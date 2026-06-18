import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useGetWorkersQuery } from '@/lib/api/jobWorkerApi'
import { useGetInventoryItemsQuery } from '@/lib/api/inventoryApi'
import { useGetCategoriesQuery } from '@/features/category/api/categoryApi'
import { useGetSubcategoriesByCategoryQuery } from '@/features/subcategory/api/subcategoryApi'
import { useGetUnitsQuery } from '@/features/unit/api/unitApi'
import { useGetJobWorkTypesQuery } from '@/lib/api/jobWorkTypeApi'
import { selectCurrentCompanyId, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { JobWork, CreateJobWorkRequest } from '@/lib/api/jobWorkApi'
import { ChallanFormData, PartyFormData, TransportFormData, MaterialItem, JobWorkFormErrors } from './types'

export function useJobWorkForm(jobWork: JobWork | null | undefined, isOpen: boolean) {
    const companyId = useSelector((state: RootState) => state.auth.user?.companyAccess?.[0]?.companyId)
    const currentCompanyId = useSelector(selectCurrentCompanyId)
    const isSuperAdmin = useSelector(selectIsSuperAdmin)

    const [formData, setFormData] = useState<CreateJobWorkRequest>({
        jobWorkerId: '',
        jobWorkerName: '',
        jobWorkerRate: 0,
        expectedDelivery: '',
        jobWorkType: '',
        quantity: 0,
        unit: 'meters',
        productionOrderId: '',
        batchId: '',
        materialProvided: [],
        qualityAgreement: '',
        remarks: ''
    })

    const [challanData, setChallanData] = useState<ChallanFormData>({
        challanNumber: '',
        challanDate: new Date().toISOString().split('T')[0],
        category: '',
        subcategory: '',
        itemName: '',
        attributeName: '',
        price: 0,
        lotNumber: ''
    })

    const [partyData, setPartyData] = useState<PartyFormData>({
        partyName: '',
        partyGstNumber: '',
        partyAddress: ''
    })

    const [transportData, setTransportData] = useState<TransportFormData>({
        transportName: '',
        transportNumber: ''
    })

    const [materialProvided, setMaterialProvided] = useState<MaterialItem[]>([])
    const [errors, setErrors] = useState<JobWorkFormErrors>({})

    // Get company ID for filtering - backend will also check X-Company-ID header
    // So we can pass companyId in query or rely on header
    const filterCompanyId = currentCompanyId || companyId?.toString()

    // Fetch data - Job Workers instead of Suppliers
    // Backend will get companyId from query param OR from X-Company-ID header OR from user object
    const { data: workersData, isLoading } = useGetWorkersQuery(
        {
            limit: 1000
            // Don't pass companyId in query - let backend use X-Company-ID header or user.companyId
            // This ensures consistency with other API calls
        },
        {
            skip: false
        }
    )
    const workers = workersData?.data || []
    const workersLoading = isLoading || false

    const { data: inventoryData } = useGetInventoryItemsQuery({
        page: 1,
        limit: 1000
    })
    const inventoryItems = inventoryData?.data?.data || []

    const { data: categoriesData, refetch: refetchCategories } = useGetCategoriesQuery(
        companyId ? { companyId: companyId.toString() } : {},
        { skip: !companyId }
    )
    const categories = categoriesData?.data || []

    const { data: subcategoriesData, refetch: refetchSubcategories } = useGetSubcategoriesByCategoryQuery(
        challanData.category || '',
        { skip: !challanData.category }
    )
    const subcategories = subcategoriesData?.data || []

    const { data: unitsData, refetch: refetchUnits } = useGetUnitsQuery(
        companyId ? { companyId: companyId.toString() } : {},
        { skip: !companyId }
    )
    const units = unitsData?.data || []

    const { data: jobWorkTypesData, refetch: refetchJobWorkTypes } = useGetJobWorkTypesQuery(
        companyId ? { companyId: companyId.toString() } : {},
        { skip: !companyId }
    )
    const jobWorkTypes = jobWorkTypesData?.data || []

    // Initialize form
    useEffect(() => {
        if (jobWork && isOpen) {
            setFormData({
                jobWorkerId: jobWork.jobWorkerId || '',
                jobWorkerName: jobWork.jobWorkerName || '',
                jobWorkerRate: jobWork.jobWorkerRate || 0,
                expectedDelivery: jobWork.expectedDelivery ? new Date(jobWork.expectedDelivery).toISOString().split('T')[0] : '',
                jobWorkType: jobWork.jobWorkType || '',
                quantity: jobWork.quantity || 0,
                unit: jobWork.unit || 'meters',
                productionOrderId: jobWork.productionOrderId || '',
                batchId: jobWork.batchId || '',
                materialProvided: jobWork.materialProvided || [],
                qualityAgreement: jobWork.qualityAgreement || '',
                remarks: jobWork.remarks || ''
            })
            setMaterialProvided(jobWork.materialProvided || [])

            // Get category/subcategory IDs - handle both populated and string formats
            const categoryId = typeof jobWork.categoryId === 'object' 
                ? jobWork.categoryId._id 
                : jobWork.categoryId || ''
            const subcategoryId = typeof jobWork.subcategoryId === 'object' 
                ? jobWork.subcategoryId._id 
                : jobWork.subcategoryId || ''

            // Check if challan data is stored directly in model fields (new format)
            if (jobWork.challanNumber || jobWork.itemName || categoryId) {
                setChallanData({
                    challanNumber: jobWork.challanNumber || '',
                    challanDate: jobWork.challanDate 
                        ? new Date(jobWork.challanDate).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                    category: categoryId,
                    subcategory: subcategoryId,
                    itemName: jobWork.itemName || '',
                    attributeName: jobWork.attributeName || '',
                    price: jobWork.price || 0,
                    lotNumber: jobWork.lotNumber || ''
                })
                setPartyData({
                    partyName: jobWork.partyName || '',
                    partyGstNumber: jobWork.partyGstNumber || '',
                    partyAddress: jobWork.partyAddress || ''
                })
                setTransportData({
                    transportName: jobWork.transportName || '',
                    transportNumber: jobWork.transportNumber || ''
                })
            } else if (jobWork.remarks) {
                // Fallback: Parse additional fields from remarks (old format)
                try {
                    const parsed = JSON.parse(jobWork.remarks)
                    setChallanData({
                        challanNumber: parsed.challanNumber || '',
                        challanDate: parsed.challanDate || new Date().toISOString().split('T')[0],
                        category: parsed.category || '',
                        subcategory: parsed.subcategory || '',
                        itemName: parsed.itemName || '',
                        attributeName: parsed.attributeName || '',
                        price: parsed.price || 0,
                        lotNumber: parsed.lotNumber || ''
                    })
                    setPartyData({
                        partyName: parsed.partyName || '',
                        partyGstNumber: parsed.partyGstNumber || '',
                        partyAddress: parsed.partyAddress || ''
                    })
                    setTransportData({
                        transportName: parsed.transportName || '',
                        transportNumber: parsed.transportNumber || ''
                    })
                    if (parsed.originalRemarks) {
                        setFormData(prev => ({ ...prev, remarks: parsed.originalRemarks }))
                    }
                } catch (e) {
                    // If not JSON, keep as is
                }
            }
        } else if (!jobWork && isOpen) {
            // Reset form
            setFormData({
                jobWorkerId: '',
                jobWorkerName: '',
                jobWorkerRate: 0,
                expectedDelivery: '',
                jobWorkType: '',
                quantity: 0,
                unit: 'meters',
                productionOrderId: '',
                batchId: '',
                materialProvided: [],
                qualityAgreement: '',
                remarks: ''
            })
            setChallanData({
                challanNumber: '',
                challanDate: new Date().toISOString().split('T')[0],
                category: '',
                subcategory: '',
                itemName: '',
                attributeName: '',
                price: 0,
                lotNumber: ''
            })
            setPartyData({
                partyName: '',
                partyGstNumber: '',
                partyAddress: ''
            })
            setTransportData({
                transportName: '',
                transportNumber: ''
            })
            setMaterialProvided([])
            setErrors({})
        }
    }, [jobWork, isOpen])

    // Reset subcategory when category changes
    useEffect(() => {
        if (!challanData.category) {
            setChallanData(prev => ({ ...prev, subcategory: '' }))
        }
    }, [challanData.category])

    // Auto-fill job worker name and rate
    useEffect(() => {
        if (formData.jobWorkerId) {
            const worker = workers.find((w: any) => w._id === formData.jobWorkerId)
            if (worker) {
                setFormData(prev => ({
                    ...prev,
                    jobWorkerName: worker.name || '',
                    jobWorkerRate: worker.hourlyRate || worker.dailyRate || prev.jobWorkerRate || 0
                }))
            }
        }
    }, [formData.jobWorkerId, workers])

    // Set default job work type when types are loaded and form is empty
    useEffect(() => {
        if (isOpen && !jobWork && jobWorkTypes.length > 0 && !formData.jobWorkType) {
            const firstActiveType = jobWorkTypes.find((t: any) => t.isActive)
            if (firstActiveType) {
                setFormData(prev => {
                    // Only update if jobWorkType is still empty to prevent infinite loop
                    if (!prev.jobWorkType) {
                        return {
                            ...prev,
                            jobWorkType: firstActiveType.name
                        }
                    }
                    return prev
                })
            }
        }
    }, [isOpen, jobWork, jobWorkTypes.length]) // Removed formData.jobWorkType from dependencies

    // Auto-fill item name and details when material item is selected
    const handleMaterialChange = (index: number, field: keyof MaterialItem, value: any) => {
        setMaterialProvided(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }

            if (field === 'itemId' && value) {
                const item = inventoryItems.find((i: any) => i._id === value) as any
                if (item) {
                    updated[index].itemName = item.itemName || item.itemCode || ''
                    updated[index].unit = item.stock?.unit || updated[index].unit || 'meters'
                    // Auto-fill rate from item cost price if available
                    if (item.pricing?.costPrice && !updated[index].rate) {
                        updated[index].rate = item.pricing.costPrice
                    }
                }
            }

            return updated
        })
    }

    const validateForm = (): boolean => {
        const newErrors: JobWorkFormErrors = {}

        // Only validate essential fields - make most fields optional
        // Job Worker is the only required field for job work
        if (!formData.jobWorkerId) {
            newErrors.jobWorkerId = 'Job Worker is required'
        }

        // If quantity is provided, it should be valid
        if (formData.quantity && formData.quantity < 0) {
            newErrors.quantity = 'Quantity cannot be negative'
        }

        // If job worker rate is provided, it should be valid
        if (formData.jobWorkerRate && formData.jobWorkerRate < 0) {
            newErrors.jobWorkerRate = 'Job Worker Rate cannot be negative'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const getSubmitData = (): CreateJobWorkRequest => {
        const additionalInfo = {
            ...challanData,
            ...partyData,
            ...transportData,
            originalRemarks: formData.remarks
        }

        return {
            ...formData,
            materialProvided: materialProvided.filter(m => m.itemId && m.quantity > 0),
            remarks: JSON.stringify(additionalInfo)
        } as CreateJobWorkRequest
    }

    return {
        formData,
        challanData,
        partyData,
        transportData,
        materialProvided,
        errors,
        workers,
        suppliers: workers, // Keep for backward compatibility
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
        refetchUnits,
        refetchJobWorkTypes,
        jobWorkTypes
    }
}

