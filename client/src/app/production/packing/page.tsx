'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import {
    useGetPackingsQuery,
    useGetDispatchReadyPackingsQuery,
    useCreatePackingMutation,
    useUpdatePackingDetailsMutation,
    Packing
} from '@/lib/api/productionModulesApi'
import { Plus, Package, Truck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { useGetLotDetailsQuery, useGetAvailableInputMeterQuery } from '@/lib/api/productionModulesApi'

export default function PackingPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showPackingModal, setShowPackingModal] = useState(false)
    const [selectedPacking, setSelectedPacking] = useState<Packing | null>(null)
    const [formData, setFormData] = useState({
        lotNumber: '',
        partyName: '',
        customerId: '',
        quality: '',
        inputMeter: 0,
        foldingCheckingId: '',
        packingType: 'bale' as 'roll' | 'bale' | 'carton',
        bardan: '',
        shippingMark: '',
        date: new Date().toISOString().split('T')[0]
    })
    const [packingData, setPackingData] = useState({
        totalPackedBale: 0,
        totalPackedMeter: 0,
        finishedGoodsInventoryId: ''
    })

    const { data, isLoading, refetch } = useGetPackingsQuery({})
    const { data: dispatchReadyData } = useGetDispatchReadyPackingsQuery()
    const [createPacking] = useCreatePackingMutation()
    const [updatePacking] = useUpdatePackingDetailsMutation()

    // Auto-fill from lot number
    const { data: lotDetailsData, refetch: refetchLotDetails } = useGetLotDetailsQuery(
        formData.lotNumber,
        { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
    )
    const { data: availableMeterData } = useGetAvailableInputMeterQuery(
        { lotNumber: formData.lotNumber, targetModule: 'packing' },
        { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
    )

    const packings = data?.data || []
    const dispatchReady = dispatchReadyData?.data || []

    // Auto-fill party name, quality, and customerId when lot number changes
    useEffect(() => {
        if (lotDetailsData?.data?.lotDetails && formData.lotNumber) {
            const lotDetails = lotDetailsData.data.lotDetails
            setFormData(prev => ({
                ...prev,
                partyName: lotDetails.partyName || prev.partyName,
                customerId: lotDetails.customerId || prev.customerId,
                quality: lotDetails.quality || prev.quality
            }))
        }
    }, [lotDetailsData, formData.lotNumber])

    // Auto-fill input meter from Folding Checking module
    useEffect(() => {
        if (availableMeterData?.data?.availableMeter && availableMeterData.data.availableMeter > 0) {
            setFormData(prev => ({
                ...prev,
                inputMeter: availableMeterData.data.availableMeter
            }))
        }
    }, [availableMeterData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createPacking(formData).unwrap()
            toast.success('Packing entry created successfully')
            setShowCreateModal(false)
            resetForm()
            refetch()
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to create packing entry')
        }
    }

    const handleUpdatePacking = async () => {
        if (!selectedPacking) return
        if (packingData.totalPackedMeter > selectedPacking.inputMeter) {
            toast.error('Packed meter cannot exceed input meter')
            return
        }
        try {
            await updatePacking({
                id: selectedPacking._id!,
                data: packingData
            }).unwrap()
            toast.success('Packing updated successfully')
            setShowPackingModal(false)
            setSelectedPacking(null)
            setPackingData({ totalPackedBale: 0, totalPackedMeter: 0, finishedGoodsInventoryId: '' })
            refetch()
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to update packing')
        }
    }

    const resetForm = () => {
        setFormData({
            lotNumber: '',
            partyName: '',
            customerId: '',
            quality: '',
            inputMeter: 0,
            foldingCheckingId: '',
            packingType: 'bale',
            bardan: '',
            shippingMark: '',
            date: new Date().toISOString().split('T')[0]
        })
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            pending: 'outline',
            in_progress: 'default',
            completed: 'secondary',
            dispatch_ready: 'default'
        }
        return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Packing Module</h1>
                        <p className="text-muted-foreground">Manage packing and finished goods</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Packing Entry
                    </Button>
                </div>

                {/* Dispatch Ready */}
                {dispatchReady.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Dispatch Ready ({dispatchReady.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dispatchReady.map((packing) => (
                                    <div key={packing._id} className="border rounded-lg p-4 bg-green-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold">{packing.partyName} - Lot: {packing.lotNumber}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Quality: {packing.quality} | Type: {packing.packingType}
                                                </div>
                                                <div className="text-sm mt-2">
                                                    Packed Bale: {packing.totalPackedBale} | Packed Meter: {packing.totalPackedMeter}m
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {getStatusBadge(packing.status)}
                                                <Badge variant="secondary">Dispatch Ready</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Packings */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Packing Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div>Loading...</div>
                        ) : packings.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No packing entries found</div>
                        ) : (
                            <div className="space-y-4">
                                {packings.map((packing) => (
                                    <div key={packing._id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-semibold">{packing.partyName} - Lot: {packing.lotNumber}</div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Quality: {packing.quality} | Type: {packing.packingType}
                                                </div>
                                                {packing.bardan && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Bardan: {packing.bardan} | Shipping Mark: {packing.shippingMark || 'N/A'}
                                                    </div>
                                                )}
                                                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Input:</span> {packing.inputMeter}m
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Packed Bale:</span> {packing.totalPackedBale}
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Packed Meter:</span> {packing.totalPackedMeter}m
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {getStatusBadge(packing.status)}
                                                {!packing.isDispatchReady && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedPacking(packing)
                                                            setPackingData({
                                                                totalPackedBale: packing.totalPackedBale,
                                                                totalPackedMeter: packing.totalPackedMeter,
                                                                finishedGoodsInventoryId: packing.finishedGoodsInventoryId || ''
                                                            })
                                                            setShowPackingModal(true)
                                                        }}
                                                    >
                                                        Update Packing
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Packing Entry</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Lot Number *</Label>
                                    <Input
                                        value={formData.lotNumber}
                                        onChange={(e) => {
                                            setFormData({ ...formData, lotNumber: e.target.value })
                                            if (e.target.value.length >= 3) {
                                                refetchLotDetails()
                                            }
                                        }}
                                        placeholder="Enter lot number to auto-fill details"
                                        required
                                    />
                                    {lotDetailsData?.data?.lotDetails && (
                                        <p className="text-xs text-green-600 mt-1">
                                            ✓ Auto-filled from {lotDetailsData.data.lotDetails.sourceModule}
                                        </p>
                                    )}
                                </div>
                                <CustomerSearchInput
                                    value={formData.partyName}
                                    customerId={formData.customerId}
                                    onChange={(partyName, customerId) => {
                                        setFormData({ ...formData, partyName, customerId })
                                    }}
                                    label="Party Name"
                                    required
                                />
                                <div>
                                    <Label>Quality *</Label>
                                    <Input
                                        value={formData.quality}
                                        onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Input Meter *</Label>
                                    <Input
                                        type="number"
                                        value={formData.inputMeter}
                                        onChange={(e) => setFormData({ ...formData, inputMeter: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Packing Type *</Label>
                                    <Select
                                        value={formData.packingType}
                                        onValueChange={(value: 'roll' | 'bale' | 'carton') =>
                                            setFormData({ ...formData, packingType: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="roll">Roll</SelectItem>
                                            <SelectItem value="bale">Bale</SelectItem>
                                            <SelectItem value="carton">Carton</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Bardan</Label>
                                    <Input
                                        value={formData.bardan}
                                        onChange={(e) => setFormData({ ...formData, bardan: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Shipping Mark</Label>
                                    <Input
                                        value={formData.shippingMark}
                                        onChange={(e) => setFormData({ ...formData, shippingMark: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Update Packing Modal */}
                <Dialog open={showPackingModal} onOpenChange={setShowPackingModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Packing Details</DialogTitle>
                        </DialogHeader>
                        {selectedPacking && (
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Total Input: {selectedPacking.inputMeter}m
                                </div>
                                <div>
                                    <Label>Total Packed Bale *</Label>
                                    <Input
                                        type="number"
                                        value={packingData.totalPackedBale}
                                        onChange={(e) => setPackingData({ ...packingData, totalPackedBale: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Total Packed Meter *</Label>
                                    <Input
                                        type="number"
                                        value={packingData.totalPackedMeter}
                                        onChange={(e) => setPackingData({ ...packingData, totalPackedMeter: Number(e.target.value) })}
                                        max={selectedPacking.inputMeter}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowPackingModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdatePacking}>Update</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
}


