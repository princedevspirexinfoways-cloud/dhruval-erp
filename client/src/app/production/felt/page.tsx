'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import {
    useGetFeltsQuery,
    useGetActiveFeltsQuery,
    useCreateFeltMutation,
    useCompleteFeltMutation,
    Felt
} from '@/lib/api/productionModulesApi'
import { Plus, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { useGetLotDetailsQuery, useGetAvailableInputMeterQuery } from '@/lib/api/productionModulesApi'

export default function FeltPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [selectedFelt, setSelectedFelt] = useState<Felt | null>(null)
    const [formData, setFormData] = useState({
        lotNumber: '',
        partyName: '',
        customerId: '',
        inputMeter: 0,
        finishingId: '',
        feltDuration: 0,
        durationUnit: 'hours' as 'hours' | 'days',
        dateIn: new Date().toISOString().split('T')[0]
    })
    const [completeData, setCompleteData] = useState({
        feltMeter: 0,
        lossMeter: 0,
        dateOut: new Date().toISOString().split('T')[0]
    })

    const { data, isLoading, refetch } = useGetFeltsQuery({})
    const { data: activeData } = useGetActiveFeltsQuery()
    const [createFelt] = useCreateFeltMutation()
    const [completeFelt] = useCompleteFeltMutation()

    // Auto-fill from lot number
    const { data: lotDetailsData, refetch: refetchLotDetails } = useGetLotDetailsQuery(
        formData.lotNumber,
        { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
    )
    const { data: availableMeterData } = useGetAvailableInputMeterQuery(
        { lotNumber: formData.lotNumber, targetModule: 'felt' },
        { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
    )

    const felts = data?.data || []
    const activeFelts = activeData?.data || []

    // Auto-fill party name and customerId when lot number changes
    useEffect(() => {
        if (lotDetailsData?.data?.lotDetails && formData.lotNumber) {
            const lotDetails = lotDetailsData.data.lotDetails
            setFormData(prev => ({
                ...prev,
                partyName: lotDetails.partyName || prev.partyName,
                customerId: lotDetails.customerId || prev.customerId
            }))
        }
    }, [lotDetailsData, formData.lotNumber])

    // Auto-fill input meter from Finishing module
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
            await createFelt(formData).unwrap()
            toast.success('Felt entry created successfully')
            setShowCreateModal(false)
            resetForm()
            refetch()
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to create felt entry')
        }
    }

    const handleComplete = async () => {
        if (!selectedFelt) return
        if (completeData.feltMeter + completeData.lossMeter > selectedFelt.inputMeter) {
            toast.error('Felt + Loss meter cannot exceed input meter')
            return
        }
        try {
            await completeFelt({
                id: selectedFelt._id!,
                data: completeData
            }).unwrap()
            toast.success('Felt process completed successfully')
            setShowCompleteModal(false)
            setSelectedFelt(null)
            setCompleteData({ feltMeter: 0, lossMeter: 0, dateOut: new Date().toISOString().split('T')[0] })
            refetch()
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to complete felt process')
        }
    }

    const resetForm = () => {
        setFormData({
            lotNumber: '',
            partyName: '',
            customerId: '',
            inputMeter: 0,
            finishingId: '',
            feltDuration: 0,
            durationUnit: 'hours',
            dateIn: new Date().toISOString().split('T')[0]
        })
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            in_felt: 'default',
            completed: 'secondary'
        }
        return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Felt Module</h1>
                        <p className="text-muted-foreground">Manage felt (resting/stabilizing) processes</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Felt Entry
                    </Button>
                </div>

                {/* Active Felts */}
                {activeFelts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Active Felts ({activeFelts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activeFelts.map((felt) => (
                                    <div key={felt._id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold">{felt.partyName} - Lot: {felt.lotNumber}</div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Input: {felt.inputMeter}m | Date In: {new Date(felt.dateIn).toLocaleDateString()}
                                                </div>
                                                {felt.feltDuration && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Duration: {felt.feltDuration} {felt.durationUnit}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {getStatusBadge(felt.status)}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedFelt(felt)
                                                        setCompleteData({
                                                            feltMeter: felt.feltMeter || felt.inputMeter,
                                                            lossMeter: felt.lossMeter || 0,
                                                            dateOut: new Date().toISOString().split('T')[0]
                                                        })
                                                        setShowCompleteModal(true)
                                                    }}
                                                >
                                                    Complete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Felts */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Felt Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div>Loading...</div>
                        ) : felts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No felt entries found</div>
                        ) : (
                            <div className="space-y-4">
                                {felts.map((felt) => (
                                    <div key={felt._id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-semibold">{felt.partyName} - Lot: {felt.lotNumber}</div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Date In: {new Date(felt.dateIn).toLocaleDateString()}
                                                    {felt.dateOut && ` | Date Out: ${new Date(felt.dateOut).toLocaleDateString()}`}
                                                </div>
                                                {felt.feltDuration && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Duration: {felt.feltDuration} {felt.durationUnit}
                                                    </div>
                                                )}
                                                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Input:</span> {felt.inputMeter}m
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Felt:</span> {felt.feltMeter}m
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Loss:</span> {felt.lossMeter}m
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {getStatusBadge(felt.status)}
                                                {felt.status === 'in_felt' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedFelt(felt)
                                                            setCompleteData({
                                                                feltMeter: felt.feltMeter || felt.inputMeter,
                                                                lossMeter: felt.lossMeter || 0,
                                                                dateOut: new Date().toISOString().split('T')[0]
                                                            })
                                                            setShowCompleteModal(true)
                                                        }}
                                                    >
                                                        Complete
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
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Felt Entry</DialogTitle>
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
                                    <Label>Input Meter *</Label>
                                    <Input
                                        type="number"
                                        value={formData.inputMeter}
                                        onChange={(e) => setFormData({ ...formData, inputMeter: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Felt Duration</Label>
                                    <Input
                                        type="number"
                                        value={formData.feltDuration}
                                        onChange={(e) => setFormData({ ...formData, feltDuration: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label>Duration Unit</Label>
                                    <Select
                                        value={formData.durationUnit}
                                        onValueChange={(value: 'hours' | 'days') =>
                                            setFormData({ ...formData, durationUnit: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hours">Hours</SelectItem>
                                            <SelectItem value="days">Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Date In *</Label>
                                    <Input
                                        type="date"
                                        value={formData.dateIn}
                                        onChange={(e) => setFormData({ ...formData, dateIn: e.target.value })}
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

                {/* Complete Modal */}
                <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Complete Felt Process</DialogTitle>
                        </DialogHeader>
                        {selectedFelt && (
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Total Input: {selectedFelt.inputMeter}m
                                </div>
                                <div>
                                    <Label>Felt Meter *</Label>
                                    <Input
                                        type="number"
                                        value={completeData.feltMeter}
                                        onChange={(e) => setCompleteData({ ...completeData, feltMeter: Number(e.target.value) })}
                                        max={selectedFelt.inputMeter}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Loss Meter *</Label>
                                    <Input
                                        type="number"
                                        value={completeData.lossMeter}
                                        onChange={(e) => setCompleteData({ ...completeData, lossMeter: Number(e.target.value) })}
                                        max={selectedFelt.inputMeter - completeData.feltMeter}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Date Out *</Label>
                                    <Input
                                        type="date"
                                        value={completeData.dateOut}
                                        onChange={(e) => setCompleteData({ ...completeData, dateOut: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowCompleteModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleComplete}>Complete</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
}


