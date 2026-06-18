'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import {
  useGetFinishingsQuery,
  useGetFinishingWIPQuery,
  useCreateFinishingMutation,
  useUpdateFinishingOutputMutation,
  Finishing
} from '@/lib/api/productionModulesApi'
import { Plus, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { useGetLotDetailsQuery, useGetAvailableInputMeterQuery } from '@/lib/api/productionModulesApi'

export default function FinishingPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showOutputModal, setShowOutputModal] = useState(false)
  const [selectedFinishing, setSelectedFinishing] = useState<Finishing | null>(null)
  const [formData, setFormData] = useState({
    lotNumber: '',
    partyName: '',
    customerId: '',
    quality: '',
    inputMeter: 0,
    washingId: '',
    finishWidth: 0,
    gsm: 0,
    finishingType: 'soft' as 'soft' | 'stiff' | 'export_finish',
    operatorName: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [outputData, setOutputData] = useState({
    finishedMeter: 0,
    rejectedMeter: 0
  })

  const { data, isLoading, refetch } = useGetFinishingsQuery({})
  const { data: wipData } = useGetFinishingWIPQuery()
  const [createFinishing] = useCreateFinishingMutation()
  const [updateOutput] = useUpdateFinishingOutputMutation()

  // Auto-fill from lot number
  const { data: lotDetailsData, refetch: refetchLotDetails } = useGetLotDetailsQuery(
    formData.lotNumber,
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )
  const { data: availableMeterData } = useGetAvailableInputMeterQuery(
    { lotNumber: formData.lotNumber, targetModule: 'finishing' },
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )

  const finishings = data?.data || []
  const wip = wipData?.data || []

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

  // Auto-fill input meter from Washing module
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
      await createFinishing(formData).unwrap()
      toast.success('Finishing entry created successfully')
      setShowCreateModal(false)
      resetForm()
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create finishing entry')
    }
  }

  const handleUpdateOutput = async () => {
    if (!selectedFinishing) return
    if (outputData.finishedMeter + outputData.rejectedMeter > selectedFinishing.inputMeter) {
      toast.error('Finished + Rejected meter cannot exceed input meter')
      return
    }
    try {
      await updateOutput({
        id: selectedFinishing._id!,
        data: outputData
      }).unwrap()
      toast.success('Finishing output updated successfully')
      setShowOutputModal(false)
      setSelectedFinishing(null)
      setOutputData({ finishedMeter: 0, rejectedMeter: 0 })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update finishing output')
    }
  }

  const resetForm = () => {
    setFormData({
      lotNumber: '',
      partyName: '',
      customerId: '',
      quality: '',
      inputMeter: 0,
      washingId: '',
      finishWidth: 0,
      gsm: 0,
      finishingType: 'soft',
      operatorName: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      in_progress: 'default',
      completed: 'secondary'
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Finishing Module</h1>
            <p className="text-muted-foreground">Manage finishing processes</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Finishing Entry
          </Button>
        </div>

        {/* WIP Section */}
        {wip.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Work In Progress ({wip.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wip.map((finishing) => (
                  <div key={finishing._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{finishing.partyName} - Lot: {finishing.lotNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {finishing.finishingType} | Quality: {finishing.quality}
                        </div>
                        <div className="text-sm mt-2">
                          Input: {finishing.inputMeter}m |
                          Finished: {finishing.finishedMeter}m |
                          Rejected: {finishing.rejectedMeter}m |
                          Pending: {finishing.pendingMeter}m
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(finishing.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFinishing(finishing)
                            setOutputData({
                              finishedMeter: finishing.finishedMeter,
                              rejectedMeter: finishing.rejectedMeter
                            })
                            setShowOutputModal(true)
                          }}
                        >
                          Update Output
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Finishings */}
        <Card>
          <CardHeader>
            <CardTitle>All Finishing Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : finishings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No finishing entries found</div>
            ) : (
              <div className="space-y-4">
                {finishings.map((finishing) => (
                  <div key={finishing._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">{finishing.partyName} - Lot: {finishing.lotNumber}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Type: {finishing.finishingType} | Quality: {finishing.quality}
                        </div>
                        {finishing.finishWidth && (
                          <div className="text-sm text-muted-foreground">
                            Finish Width: {finishing.finishWidth} | GSM: {finishing.gsm || 'N/A'}
                          </div>
                        )}
                        <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Input:</span> {finishing.inputMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Finished:</span> {finishing.finishedMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rejected:</span> {finishing.rejectedMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pending:</span> {finishing.pendingMeter}m
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(finishing.status)}
                        {finishing.pendingMeter > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFinishing(finishing)
                              setOutputData({
                                finishedMeter: finishing.finishedMeter,
                                rejectedMeter: finishing.rejectedMeter
                              })
                              setShowOutputModal(true)
                            }}
                          >
                            Update Output
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
              <DialogTitle>Create New Finishing Entry</DialogTitle>
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
                  <Label>Finishing Type *</Label>
                  <Select
                    value={formData.finishingType}
                    onValueChange={(value: 'soft' | 'stiff' | 'export_finish') =>
                      setFormData({ ...formData, finishingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">Soft</SelectItem>
                      <SelectItem value="stiff">Stiff</SelectItem>
                      <SelectItem value="export_finish">Export Finish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Finish Width</Label>
                  <Input
                    type="number"
                    value={formData.finishWidth}
                    onChange={(e) => setFormData({ ...formData, finishWidth: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>GSM</Label>
                  <Input
                    type="number"
                    value={formData.gsm}
                    onChange={(e) => setFormData({ ...formData, gsm: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Operator Name</Label>
                  <Input
                    value={formData.operatorName}
                    onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
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

        {/* Update Output Modal */}
        <Dialog open={showOutputModal} onOpenChange={setShowOutputModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Finishing Output</DialogTitle>
            </DialogHeader>
            {selectedFinishing && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total Input: {selectedFinishing.inputMeter}m
                </div>
                <div>
                  <Label>Finished Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.finishedMeter}
                    onChange={(e) => setOutputData({ ...outputData, finishedMeter: Number(e.target.value) })}
                    max={selectedFinishing.inputMeter}
                    required
                  />
                </div>
                <div>
                  <Label>Rejected Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.rejectedMeter}
                    onChange={(e) => setOutputData({ ...outputData, rejectedMeter: Number(e.target.value) })}
                    max={selectedFinishing.inputMeter - outputData.finishedMeter}
                    required
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Pending: {selectedFinishing.inputMeter - outputData.finishedMeter - outputData.rejectedMeter}m
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowOutputModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateOutput}>Update</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
