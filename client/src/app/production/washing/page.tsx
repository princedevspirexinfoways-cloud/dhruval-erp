'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetWashingsQuery,
  useGetWashingWIPQuery,
  useCreateWashingMutation,
  useUpdateWashingOutputMutation,
  Washing
} from '@/lib/api/productionModulesApi'
import { Plus, RotateCcw, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { useGetLotDetailsQuery, useGetAvailableInputMeterQuery } from '@/lib/api/productionModulesApi'

export default function WashingPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showOutputModal, setShowOutputModal] = useState(false)
  const [selectedWashing, setSelectedWashing] = useState<Washing | null>(null)
  const [formData, setFormData] = useState({
    lotNumber: '',
    partyName: '',
    customerId: '',
    inputMeter: 0,
    hazerSilicateCuringId: '',
    washingType: 'normal' as 'normal' | 'soft' | 'heavy',
    operatorName: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [outputData, setOutputData] = useState({
    washedMeter: 0,
    shrinkageMeter: 0
  })

  const { data, isLoading, refetch } = useGetWashingsQuery({})
  const { data: wipData } = useGetWashingWIPQuery()
  const [createWashing] = useCreateWashingMutation()
  const [updateOutput] = useUpdateWashingOutputMutation()

  // Auto-fill from lot number
  const { data: lotDetailsData, refetch: refetchLotDetails } = useGetLotDetailsQuery(
    formData.lotNumber,
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )
  const { data: availableMeterData } = useGetAvailableInputMeterQuery(
    { lotNumber: formData.lotNumber, targetModule: 'washing' },
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )

  const washings = data?.data || []
  const wip = wipData?.data || []

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

  // Auto-fill input meter from Hazer/Silicate module
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
      await createWashing(formData).unwrap()
      toast.success('Washing entry created successfully')
      setShowCreateModal(false)
      resetForm()
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create washing entry')
    }
  }

  const handleUpdateOutput = async () => {
    if (!selectedWashing) return
    if (outputData.washedMeter + outputData.shrinkageMeter > selectedWashing.inputMeter) {
      toast.error('Washed + Shrinkage meter cannot exceed input meter')
      return
    }
    try {
      await updateOutput({
        id: selectedWashing._id!,
        data: outputData
      }).unwrap()
      toast.success('Washing output updated successfully')
      setShowOutputModal(false)
      setSelectedWashing(null)
      setOutputData({ washedMeter: 0, shrinkageMeter: 0 })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update washing output')
    }
  }

  const resetForm = () => {
    setFormData({
      lotNumber: '',
      partyName: '',
      customerId: '',
      inputMeter: 0,
      hazerSilicateCuringId: '',
      washingType: 'normal',
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
            <h1 className="text-3xl font-bold">Washing Module</h1>
            <p className="text-muted-foreground">Manage washing processes</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Washing Entry
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
                {wip.map((washing) => (
                  <div key={washing._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{washing.partyName} - Lot: {washing.lotNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {washing.washingType}
                        </div>
                        <div className="text-sm mt-2">
                          Input: {washing.inputMeter}m | 
                          Washed: {washing.washedMeter}m | 
                          Shrinkage: {washing.shrinkageMeter}m | 
                          Pending: {washing.pendingMeter}m
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(washing.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWashing(washing)
                            setOutputData({
                              washedMeter: washing.washedMeter,
                              shrinkageMeter: washing.shrinkageMeter
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

        {/* All Washings */}
        <Card>
          <CardHeader>
            <CardTitle>All Washing Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : washings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No washing entries found</div>
            ) : (
              <div className="space-y-4">
                {washings.map((washing) => (
                  <div key={washing._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">{washing.partyName} - Lot: {washing.lotNumber}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Type: {washing.washingType} | Operator: {washing.operatorName || 'N/A'}
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Input:</span> {washing.inputMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Washed:</span> {washing.washedMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Shrinkage:</span> {washing.shrinkageMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pending:</span> {washing.pendingMeter}m
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(washing.status)}
                        {washing.pendingMeter > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWashing(washing)
                              setOutputData({
                                washedMeter: washing.washedMeter,
                                shrinkageMeter: washing.shrinkageMeter
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Washing Entry</DialogTitle>
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
                  <Label>Washing Type *</Label>
                  <Select
                    value={formData.washingType}
                    onValueChange={(value: 'normal' | 'soft' | 'heavy') => 
                      setFormData({ ...formData, washingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="soft">Soft</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
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
              <DialogTitle>Update Washing Output</DialogTitle>
            </DialogHeader>
            {selectedWashing && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total Input: {selectedWashing.inputMeter}m
                </div>
                <div>
                  <Label>Washed Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.washedMeter}
                    onChange={(e) => setOutputData({ ...outputData, washedMeter: Number(e.target.value) })}
                    max={selectedWashing.inputMeter}
                    required
                  />
                </div>
                <div>
                  <Label>Shrinkage Meter *</Label>
                  <Input
                    type="number"
                    value={outputData.shrinkageMeter}
                    onChange={(e) => setOutputData({ ...outputData, shrinkageMeter: Number(e.target.value) })}
                    max={selectedWashing.inputMeter - outputData.washedMeter}
                    required
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Pending: {selectedWashing.inputMeter - outputData.washedMeter - outputData.shrinkageMeter}m
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


