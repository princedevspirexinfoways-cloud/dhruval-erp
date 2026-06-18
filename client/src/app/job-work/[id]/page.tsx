'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import {
    ArrowLeft,
    Edit,
    Package,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    Briefcase,
    Calendar,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Plus,
    Minus,
    Save,
    Truck
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import {
    useGetJobWorkByIdQuery,
    useUpdateJobWorkMutation,
    type JobWork,
    type UpdateJobWorkRequest
} from '@/lib/api/jobWorkApi'
import { selectTheme } from '@/lib/features/ui/uiSlice'

export default function JobWorkDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const theme = useSelector(selectTheme)
    const jobWorkId = params.id as string

    const [materialUsed, setMaterialUsed] = useState<Record<string, number>>({})
    const [materialReturned, setMaterialReturned] = useState<Record<string, number>>({})
    const [materialWasted, setMaterialWasted] = useState<Record<string, number>>({})
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [showUsedModal, setShowUsedModal] = useState(false)
    const [showWasteModal, setShowWasteModal] = useState(false)
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<string>('pending')
    const [paymentAmount, setPaymentAmount] = useState<number>(0)

    const { data: jobWorkData, isLoading, refetch } = useGetJobWorkByIdQuery(jobWorkId)
    const [updateJobWork, { isLoading: isUpdating }] = useUpdateJobWorkMutation()

    const jobWork = jobWorkData?.data

    // Initialize material tracking from job work data
    useEffect(() => {
        if (jobWork) {
            // Initialize used materials
            const usedMap: Record<string, number> = {}
            jobWork.materialUsed?.forEach(m => {
                usedMap[m.itemId] = m.quantity
            })
            setMaterialUsed(usedMap)

            // Initialize returned materials
            const returnedMap: Record<string, number> = {}
            jobWork.materialReturned?.forEach(m => {
                returnedMap[m.itemId] = m.quantity
            })
            setMaterialReturned(returnedMap)

            // Initialize wasted materials
            const wastedMap: Record<string, number> = {}
            jobWork.materialWasted?.forEach(m => {
                wastedMap[m.itemId] = m.quantity
            })
            setMaterialWasted(wastedMap)

            // Initialize payment info
            setPaymentStatus(jobWork.paymentStatus || 'pending')
            setPaymentAmount(jobWork.paymentAmount || 0)
        }
    }, [jobWork])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const handleMaterialUsed = async (materialId: string, quantity: number) => {
        if (!jobWork || !quantity || quantity <= 0) {
            toast.error('Please enter a valid quantity')
            return
        }

        const material = jobWork.materialProvided?.find(m => m.itemId === materialId)
        if (!material) {
            toast.error('Material not found')
            return
        }

        const alreadyUsed = materialUsed[materialId] || 0
        const totalUsed = alreadyUsed + quantity
        const providedQty = material.quantity
        const alreadyReturned = materialReturned[materialId] || 0
        const maxAvailable = providedQty - alreadyReturned

        if (totalUsed > maxAvailable) {
            toast.error(`Cannot use more than available quantity (${maxAvailable} ${material.unit}). Already returned: ${alreadyReturned}`)
            return
        }

        try {
            // Update local state
            setMaterialUsed(prev => ({
                ...prev,
                [materialId]: totalUsed
            }))

            // Update job work with used materials - immediate API call
            const currentUsed = jobWork.materialUsed ? [...jobWork.materialUsed] : []
            const materialUseIndex = currentUsed.findIndex(m => {
                const existingId = m.itemId?.toString() || m.itemId
                const newId = materialId?.toString() || materialId
                return existingId === newId
            })

            if (materialUseIndex >= 0) {
                // Update existing entry
                currentUsed[materialUseIndex] = {
                    ...currentUsed[materialUseIndex],
                    quantity: totalUsed,
                    itemName: material.itemName,
                    unit: material.unit
                }
            } else {
                // Add new entry
                currentUsed.push({
                    itemId: materialId,
                    itemName: material.itemName,
                    quantity: totalUsed,
                    unit: material.unit
                })
            }

            await updateJobWork({
                id: jobWorkId,
                data: {
                    materialUsed: currentUsed
                }
            }).unwrap()

            toast.success(`Marked ${quantity} ${material.unit} as used successfully.`)
            setShowUsedModal(false)
            setSelectedMaterial(null)
            refetch()
        } catch (error: any) {
            console.error('Error updating material usage:', error)
            const errorMessage = error?.data?.message || error?.message || 'Failed to update material usage'
            toast.error(errorMessage)
        }
    }

    const handleMaterialReturn = async (materialId: string, quantity: number) => {
        if (!jobWork || !quantity || quantity <= 0) {
            toast.error('Please enter a valid quantity')
            return
        }

        const material = jobWork.materialProvided?.find(m => m.itemId === materialId)
        if (!material) {
            toast.error('Material not found')
            return
        }

        const alreadyReturned = materialReturned[materialId] || 0
        const totalReturned = alreadyReturned + quantity
        const providedQty = material.quantity
        const usedQty = materialUsed[materialId] || 0
        const wastedQty = materialWasted[materialId] || 0
        const remaining = providedQty - usedQty - alreadyReturned - wastedQty

        if (quantity > remaining) {
            toast.error(`Cannot return more than remaining quantity (${remaining} ${material.unit})`)
            return
        }

        try {
            setMaterialReturned(prev => ({
                ...prev,
                [materialId]: totalReturned
            }))

            // Update job work with returned materials - create new array to avoid mutation
            const currentReturned = jobWork.materialReturned ? [...jobWork.materialReturned] : []
            const materialReturnIndex = currentReturned.findIndex(m => {
                const existingId = m.itemId?.toString() || m.itemId
                const newId = materialId?.toString() || materialId
                return existingId === newId
            })

            if (materialReturnIndex >= 0) {
                // Update existing entry
                currentReturned[materialReturnIndex] = {
                    ...currentReturned[materialReturnIndex],
                    quantity: totalReturned,
                    itemName: material.itemName,
                    unit: material.unit
                }
            } else {
                // Add new entry
                currentReturned.push({
                    itemId: materialId,
                    itemName: material.itemName,
                    quantity: totalReturned,
                    unit: material.unit
                })
            }

            await updateJobWork({
                id: jobWorkId,
                data: {
                    materialReturned: currentReturned
                }
            }).unwrap()

            toast.success(`Returned ${quantity} ${material.unit} successfully. Stock has been updated.`)
            setShowReturnModal(false)
            setSelectedMaterial(null)
            refetch()
        } catch (error: any) {
            console.error('Error returning material:', error)
            const errorMessage = error?.data?.message || error?.message || 'Failed to return material'
            toast.error(errorMessage)
        }
    }

    const handleMaterialWaste = async (materialId: string, quantity: number) => {
        if (!jobWork || !quantity || quantity <= 0) {
            toast.error('Please enter a valid quantity')
            return
        }

        const material = jobWork.materialProvided?.find(m => m.itemId === materialId)
        if (!material) {
            toast.error('Material not found')
            return
        }

        const alreadyWasted = materialWasted[materialId] || 0
        const totalWasted = alreadyWasted + quantity
        const providedQty = material.quantity
        const usedQty = materialUsed[materialId] || 0
        const returnedQty = materialReturned[materialId] || 0
        const remaining = providedQty - usedQty - returnedQty - alreadyWasted

        if (quantity > remaining) {
            toast.error(`Cannot waste more than remaining quantity (${remaining} ${material.unit})`)
            return
        }

        try {
            setMaterialWasted(prev => ({
                ...prev,
                [materialId]: totalWasted
            }))

            // Update job work with wasted materials
            const currentWasted = jobWork.materialWasted ? [...jobWork.materialWasted] : []
            const materialWasteIndex = currentWasted.findIndex(m => {
                const existingId = m.itemId?.toString() || m.itemId
                const newId = materialId?.toString() || materialId
                return existingId === newId
            })

            if (materialWasteIndex >= 0) {
                // Update existing entry
                currentWasted[materialWasteIndex] = {
                    ...currentWasted[materialWasteIndex],
                    quantity: totalWasted,
                    itemName: material.itemName,
                    unit: material.unit
                }
            } else {
                // Add new entry
                currentWasted.push({
                    itemId: materialId,
                    itemName: material.itemName,
                    quantity: totalWasted,
                    unit: material.unit
                })
            }

            await updateJobWork({
                id: jobWorkId,
                data: {
                    materialWasted: currentWasted
                }
            }).unwrap()

            toast.success(`Marked ${quantity} ${material.unit} as wasted successfully.`)
            setShowWasteModal(false)
            setSelectedMaterial(null)
            refetch()
        } catch (error: any) {
            console.error('Error marking material as wasted:', error)
            const errorMessage = error?.data?.message || error?.message || 'Failed to mark material as wasted'
            toast.error(errorMessage)
        }
    }

    const handleSaveAllChanges = async () => {
        try {
            const updateData: UpdateJobWorkRequest = {}
            let hasChanges = false

            // Add used materials tracking if any
            if (Object.keys(materialUsed).length > 0) {
                const usedMaterials = jobWork?.materialProvided
                    ?.filter(m => materialUsed[m.itemId] && materialUsed[m.itemId] > 0)
                    .map(m => ({
                        itemId: m.itemId,
                        itemName: m.itemName,
                        quantity: materialUsed[m.itemId],
                        unit: m.unit
                    })) || []

                if (usedMaterials.length > 0) {
                    updateData.materialUsed = usedMaterials
                    hasChanges = true
                }
            }

            // Add returned materials
            if (Object.keys(materialReturned).length > 0) {
                const currentReturned = jobWork?.materialReturned || []
                const updatedReturned = [...currentReturned]

                Object.entries(materialReturned).forEach(([materialId, quantity]) => {
                    const material = jobWork?.materialProvided?.find(m => m.itemId === materialId)
                    if (material && quantity > 0) {
                        const existing = updatedReturned.find(m => m.itemId === materialId)
                        if (existing) {
                            existing.quantity = quantity
                        } else {
                            updatedReturned.push({
                                itemId: materialId,
                                itemName: material.itemName,
                                quantity,
                                unit: material.unit
                            })
                        }
                    }
                })

                updateData.materialReturned = updatedReturned
                hasChanges = true
            }

            // Add wasted materials
            if (Object.keys(materialWasted).length > 0) {
                const currentWasted = jobWork?.materialWasted || []
                const updatedWasted = [...currentWasted]

                Object.entries(materialWasted).forEach(([materialId, quantity]) => {
                    const material = jobWork?.materialProvided?.find(m => m.itemId === materialId)
                    if (material && quantity > 0) {
                        const existing = updatedWasted.find(m => m.itemId === materialId)
                        if (existing) {
                            existing.quantity = quantity
                        } else {
                            updatedWasted.push({
                                itemId: materialId,
                                itemName: material.itemName,
                                quantity,
                                unit: material.unit
                            })
                        }
                    }
                })

                updateData.materialWasted = updatedWasted
                hasChanges = true
            }

            if (hasChanges) {
                await updateJobWork({
                    id: jobWorkId,
                    data: updateData
                }).unwrap()
                toast.success('Changes saved successfully')
                refetch()
            } else {
                toast('No changes to save')
            }
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to save changes')
        }
    }

    const getMaterialStatus = (material: any) => {
        const providedQty = material.quantity
        const usedQty = materialUsed[material.itemId] || 0
        const returnedQty = materialReturned[material.itemId] || 0
        const wastedQty = materialWasted[material.itemId] || 0
        const remaining = providedQty - usedQty - returnedQty - wastedQty

        return {
            provided: providedQty,
            used: usedQty,
            returned: returnedQty,
            wasted: wastedQty,
            remaining: Math.max(0, remaining)
        }
    }

    const handlePaymentUpdate = async () => {
        if (!jobWork) return

        try {
            const updateData: UpdateJobWorkRequest = {
                paymentStatus: paymentStatus as any,
                paymentAmount
            }

            await updateJobWork({
                id: jobWorkId,
                data: updateData
            }).unwrap()

            toast.success('Payment status updated successfully')
            refetch()
        } catch (error: any) {
            console.error('Error updating payment status:', error)
            toast.error(error?.data?.message || 'Failed to update payment status')
        }
    }

    if (isLoading) {
        return (
            <AppLayout>
                <div className={`flex items-center justify-center h-64`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 dark:border-sky-400"></div>
                </div>
            </AppLayout>
        )
    }

    if (!jobWork) {
        return (
            <AppLayout>
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Job Work Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">The job work you're looking for doesn't exist.</p>
                    <Button
                        onClick={() => router.push('/job-work')}
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Job Works
                    </Button>
                </div>
            </AppLayout>
        )
    }

    const STATUS_COLORS = {
        pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
        in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
        completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
        on_hold: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
        cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        quality_check: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    }

    return (
        <AppLayout>
            <div
                className={`p-3 sm:p-4 lg:p-6 space-y-6 min-h-screen transition-theme ${theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                    : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
                    }`}
            >
                <PageHeader
                    title="Job Work Details"
                    description={`Job Work #${jobWork._id.slice(-8)}`}
                    icon={<Briefcase className="h-6 w-6" />}
                    variant="indigo"
                >
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/job-work')}
                            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSaveAllChanges}
                            disabled={isUpdating}
                            className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-700"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </PageHeader>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-2 border-sky-500 dark:border-sky-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge className={`${STATUS_COLORS[jobWork.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'} font-medium capitalize`}>
                                {jobWork.status.replace('_', ' ')}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-blue-500 dark:border-blue-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                Job Work Type
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 capitalize">{jobWork.jobWorkType}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-500 dark:border-green-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <Package className="h-4 w-4 text-green-500 dark:text-green-400" />
                                Quantity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                {jobWork.quantity} {jobWork.unit}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-500 dark:border-orange-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                Cost
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                {formatCurrency(jobWork.jobWorkCost || 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Job Work Information */}
                    <Card className="border-2 border-sky-500 dark:border-sky-400">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Job Work Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">Worker Name</Label>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{jobWork.jobWorkerName}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">Rate</Label>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(jobWork.jobWorkerRate)}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">Expected Delivery</Label>
                                    <div className="text-gray-900 dark:text-white">{formatDate(jobWork.expectedDelivery)}</div>
                                </div>
                                {jobWork.actualDelivery && (
                                    <div>
                                        <Label className="text-sm text-gray-600 dark:text-gray-300">Actual Delivery</Label>
                                        <div className="text-gray-900 dark:text-white">{formatDate(jobWork.actualDelivery)}</div>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">Current Payment Status</Label>
                                    <div className="mt-1">
                                        <Badge
                                            variant={
                                                jobWork.paymentStatus === 'paid'
                                                    ? 'default'
                                                    : jobWork.paymentStatus === 'partial'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {jobWork.paymentStatus}
                                        </Badge>
                                    </div>
                                </div>
                                {jobWork.paymentAmount > 0 && (
                                    <div>
                                        <Label className="text-sm text-gray-600 dark:text-gray-300">Current Payment Amount</Label>
                                        <div className="text-gray-900 dark:text-white font-semibold">
                                            {formatCurrency(jobWork.paymentAmount)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Update Controls */}
                            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                                <Label className="text-sm text-gray-700 dark:text-gray-200">Update Payment</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <Label className="text-xs text-gray-500 dark:text-gray-400">New Status</Label>
                                        <select
                                            value={paymentStatus}
                                            onChange={(e) => setPaymentStatus(e.target.value)}
                                            className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="partial">Partial</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500 dark:text-gray-400">Amount (₹)</Label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                            className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            onClick={handlePaymentUpdate}
                                            disabled={isUpdating}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Update Payment
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Material Tracking - Per Material Cards */}
                    <Card className="border-2 border-sky-500 dark:border-sky-400">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
                                <span>Material Tracking</span>
                                <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!jobWork.materialProvided || jobWork.materialProvided.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                    <p>No materials provided</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {jobWork.materialProvided.map((material, index) => {
                                        const status = getMaterialStatus(material)
                                        return (
                                            <div
                                                key={index}
                                                className="border-2 border-sky-200 dark:border-sky-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{material.itemName}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Item ID: {material.itemId.slice(-8)}</p>
                                                    </div>
                                                    <Badge variant="outline">{material.unit}</Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">Provided</div>
                                                        <div className="font-semibold text-blue-600 dark:text-blue-300">{status.provided}</div>
                                                    </div>
                                                    <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded">
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">Used</div>
                                                        <div className="font-semibold text-green-600 dark:text-green-300">{status.used}</div>
                                                    </div>
                                                    <div className="bg-orange-50 dark:bg-orange-900/30 p-2 rounded">
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">Returned</div>
                                                        <div className="font-semibold text-orange-600 dark:text-orange-300">{status.returned}</div>
                                                    </div>
                                                    <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded">
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">Wasted</div>
                                                        <div className="font-semibold text-red-600 dark:text-red-300">{status.wasted}</div>
                                                    </div>
                                                    <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded col-span-2">
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">Remaining</div>
                                                        <div className="font-semibold text-purple-600 dark:text-purple-300">{status.remaining}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedMaterial(material.itemId)
                                                            setShowUsedModal(true)
                                                        }}
                                                        className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-300 dark:border-green-700"
                                                    >
                                                        <TrendingUp className="h-4 w-4 mr-1" />
                                                        Mark Used
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedMaterial(material.itemId)
                                                            setShowReturnModal(true)
                                                        }}
                                                        className="flex-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-orange-300 dark:border-orange-700"
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-1" />
                                                        Quick Return
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedMaterial(material.itemId)
                                                            setShowWasteModal(true)
                                                        }}
                                                        className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Mark Waste
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Combined Material Summary Table */}
                {jobWork.materialProvided && jobWork.materialProvided.length > 0 && (
                    <Card className="border-2 border-emerald-500 dark:border-emerald-400">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
                                <span>Complete Material Summary</span>
                                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                            #
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                            Item
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-blue-700 dark:text-blue-300 border-b border-gray-200 dark:border-gray-700">
                                            Provided
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-green-700 dark:text-green-300 border-b border-gray-200 dark:border-gray-700">
                                            Used
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-orange-700 dark:text-orange-300 border-b border-gray-200 dark:border-gray-700">
                                            Returned
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-red-700 dark:text-red-300 border-b border-gray-200 dark:border-gray-700">
                                            Wasted
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-purple-700 dark:text-purple-300 border-b border-gray-200 dark:border-gray-700">
                                            Remaining
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                            Usage %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-950">
                                    {jobWork.materialProvided.map((material, index) => {
                                        const status = getMaterialStatus(material)
                                        const usedPlusWaste = status.used + status.wasted
                                        const usagePercent =
                                            status.provided > 0 ? ((usedPlusWaste / status.provided) * 100).toFixed(1) : '0.0'

                                        return (
                                            <tr
                                                key={material.itemId}
                                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                                            >
                                                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {material.itemName}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                        ID: {material.itemId.slice(-8)} · Unit: {material.unit}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-right font-semibold text-blue-700 dark:text-blue-300">
                                                    {status.provided}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-right font-semibold text-green-700 dark:text-green-300">
                                                    {status.used}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-right font-semibold text-orange-700 dark:text-orange-300">
                                                    {status.returned}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-right font-semibold text-red-700 dark:text-red-300">
                                                    {status.wasted}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-right font-semibold text-purple-700 dark:text-purple-300">
                                                    {status.remaining}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-right font-semibold text-gray-700 dark:text-gray-300">
                                                    {usagePercent}%
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* Transport Details */}
                {(jobWork.transportName || jobWork.transportNumber) && (
                    <Card className="border-2 border-orange-500 dark:border-orange-400">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <Truck className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                                Transport Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {jobWork.transportName && (
                                    <div>
                                        <Label className="text-sm text-gray-600 dark:text-gray-300">Transport Name</Label>
                                        <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                            {jobWork.transportName}
                                        </div>
                                    </div>
                                )}
                                {jobWork.transportNumber && (
                                    <div>
                                        <Label className="text-sm text-gray-600 dark:text-gray-300">Transport Number</Label>
                                        <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                            {jobWork.transportNumber}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Modals for Material Actions */}
                {showUsedModal && selectedMaterial && (
                    <MaterialUsedModal
                        isOpen={showUsedModal}
                        onClose={() => {
                            setShowUsedModal(false)
                            setSelectedMaterial(null)
                        }}
                        material={jobWork.materialProvided?.find(m => m.itemId === selectedMaterial)}
                        currentUsed={materialUsed[selectedMaterial] || 0}
                        onSave={(quantity) => handleMaterialUsed(selectedMaterial, quantity)}
                    />
                )}

                {showReturnModal && selectedMaterial && (
                    <MaterialReturnModal
                        isOpen={showReturnModal}
                        onClose={() => {
                            setShowReturnModal(false)
                            setSelectedMaterial(null)
                        }}
                        material={jobWork.materialProvided?.find(m => m.itemId === selectedMaterial)}
                        currentReturned={materialReturned[selectedMaterial] || 0}
                        currentUsed={materialUsed[selectedMaterial] || 0}
                        currentWasted={materialWasted[selectedMaterial] || 0}
                        onSave={(quantity) => handleMaterialReturn(selectedMaterial, quantity)}
                    />
                )}

                {showWasteModal && selectedMaterial && (
                    <MaterialWasteModal
                        isOpen={showWasteModal}
                        onClose={() => {
                            setShowWasteModal(false)
                            setSelectedMaterial(null)
                        }}
                        material={jobWork.materialProvided?.find(m => m.itemId === selectedMaterial)}
                        currentWasted={materialWasted[selectedMaterial] || 0}
                        currentUsed={materialUsed[selectedMaterial] || 0}
                        currentReturned={materialReturned[selectedMaterial] || 0}
                        onSave={(quantity) => handleMaterialWaste(selectedMaterial, quantity)}
                    />
                )}
            </div>
        </AppLayout>
    )
}

// Material Used Modal
function MaterialUsedModal({
    isOpen,
    onClose,
    material,
    currentUsed,
    onSave
}: {
    isOpen: boolean
    onClose: () => void
    material: any
    currentUsed: number
    onSave: (quantity: number) => void
}) {
    const [quantity, setQuantity] = useState('')

    if (!isOpen || !material) return null

    const maxAvailable = material.quantity - currentUsed

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const qty = parseFloat(quantity)
        if (qty > 0 && qty <= maxAvailable) {
            onSave(qty)
            setQuantity('')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Mark Material as Used</h3>
                <div className="mb-4">
                    <Label className="text-sm text-gray-600 dark:text-gray-300">Material</Label>
                    <div className="font-semibold text-gray-900 dark:text-white">{material.itemName}</div>
                </div>
                <div className="mb-4">
                    <Label className="text-sm text-gray-600 dark:text-gray-300">Available to Use</Label>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {maxAvailable} {material.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Provided: {material.quantity} | Already Used: {currentUsed}
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <Label htmlFor="usedQuantity" className="text-sm text-gray-700">
                            Quantity to Mark as Used
                        </Label>
                        <Input
                            id="usedQuantity"
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxAvailable}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className="mt-1"
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Mark as Used
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Material Return Modal
function MaterialReturnModal({
    isOpen,
    onClose,
    material,
    currentReturned,
    currentUsed,
    currentWasted,
    onSave
}: {
    isOpen: boolean
    onClose: () => void
    material: any
    currentReturned: number
    currentUsed: number
    currentWasted: number
    onSave: (quantity: number) => void
}) {
    const [quantity, setQuantity] = useState('')

    if (!isOpen || !material) return null

    const maxAvailable = material.quantity - currentUsed - currentReturned - currentWasted

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const qty = parseFloat(quantity)
        if (qty > 0 && qty <= maxAvailable) {
            onSave(qty)
            setQuantity('')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Return Material</h3>
                <div className="mb-4">
                    <Label className="text-sm text-gray-600 dark:text-gray-300">Material</Label>
                    <div className="font-semibold text-gray-900 dark:text-white">{material.itemName}</div>
                </div>
                <div className="mb-4">
                    <Label className="text-sm text-gray-600 dark:text-gray-300">Available to Return</Label>
                    <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        {maxAvailable} {material.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Provided: {material.quantity} | Used: {currentUsed} | Returned: {currentReturned} | Wasted: {currentWasted}
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <Label htmlFor="returnQuantity" className="text-sm text-gray-700">
                            Quantity to Return
                        </Label>
                        <Input
                            id="returnQuantity"
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxAvailable}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className="mt-1"
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Return Material
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}


// Material Waste Modal
function MaterialWasteModal({
    isOpen,
    onClose,
    material,
    currentWasted,
    currentUsed,
    currentReturned,
    onSave
}: {
    isOpen: boolean
    onClose: () => void
    material: any
    currentWasted: number
    currentUsed: number
    currentReturned: number
    onSave: (quantity: number) => void
}) {
    const [quantity, setQuantity] = useState('')

    if (!isOpen || !material) return null

    const maxAvailable = material.quantity - currentUsed - currentReturned - currentWasted

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const qty = parseFloat(quantity)
        if (qty > 0 && qty <= maxAvailable) {
            onSave(qty)
            setQuantity('')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Mark Material as Wasted</h3>
                <div className="mb-4">
                    <Label className="text-sm text-gray-600 dark:text-gray-300">Material</Label>
                    <div className="font-semibold text-gray-900 dark:text-white">{material.itemName}</div>
                </div>
                <div className="mb-4">
                    <Label className="text-sm text-gray-600 dark:text-gray-300">Available to Mark as Waste</Label>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {maxAvailable} {material.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Provided: {material.quantity} | Used: {currentUsed} | Returned: {currentReturned} | Already Wasted: {currentWasted}
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <Label htmlFor="wasteQuantity" className="text-sm text-gray-700 dark:text-gray-300">
                            Quantity to Mark as Waste
                        </Label>
                        <Input
                            id="wasteQuantity"
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxAvailable}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className="mt-1"
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark as Waste
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
