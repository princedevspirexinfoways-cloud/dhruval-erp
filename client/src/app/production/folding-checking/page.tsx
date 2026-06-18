'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetFoldingCheckingsQuery,
  useCreateFoldingCheckingMutation,
  useUpdateQCMutation,
  FoldingChecking
} from '@/lib/api/productionModulesApi'
import { Plus, Scissors, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerSearchInput } from '@/components/production/CustomerSearchInput'
import { useGetLotDetailsQuery, useGetAvailableInputMeterQuery } from '@/lib/api/productionModulesApi'

export default function FoldingCheckingPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQCModal, setShowQCModal] = useState(false)
  const [selectedFolding, setSelectedFolding] = useState<FoldingChecking | null>(null)
  const [formData, setFormData] = useState({
    lotNumber: '',
    partyName: '',
    customerId: '',
    inputMeter: 0,
    feltId: '',
    foldType: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [qcData, setQcData] = useState({
    checkedMeter: 0,
    rejectedMeter: 0,
    qcStatus: 'partial' as 'pass' | 'fail' | 'partial',
    checkerName: ''
  })

  const { data, isLoading, refetch } = useGetFoldingCheckingsQuery({})
  const [createFolding] = useCreateFoldingCheckingMutation()
  const [updateQC] = useUpdateQCMutation()

  // Auto-fill from lot number
  const { data: lotDetailsData, refetch: refetchLotDetails } = useGetLotDetailsQuery(
    formData.lotNumber,
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )
  const { data: availableMeterData } = useGetAvailableInputMeterQuery(
    { lotNumber: formData.lotNumber, targetModule: 'folding' },
    { skip: !formData.lotNumber || formData.lotNumber.length < 3 }
  )

  const foldings = data?.data || []

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

  // Auto-fill input meter from Felt module
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
      await createFolding(formData).unwrap()
      toast.success('Folding + Checking entry created successfully')
      setShowCreateModal(false)
      resetForm()
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create folding + checking entry')
    }
  }

  const handleUpdateQC = async () => {
    if (!selectedFolding) return
    if (qcData.checkedMeter + qcData.rejectedMeter > selectedFolding.inputMeter) {
      toast.error('Checked + Rejected meter cannot exceed input meter')
      return
    }
    try {
      await updateQC({
        id: selectedFolding._id!,
        data: qcData
      }).unwrap()
      toast.success('QC results updated successfully')
      setShowQCModal(false)
      setSelectedFolding(null)
      setQcData({ checkedMeter: 0, rejectedMeter: 0, qcStatus: 'partial', checkerName: '' })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update QC results')
    }
  }

  const resetForm = () => {
    setFormData({
      lotNumber: '',
      partyName: '',
      customerId: '',
      inputMeter: 0,
      feltId: '',
      foldType: '',
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

  const getQCBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pass: 'secondary',
      fail: 'destructive',
      partial: 'outline'
    }
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Folding + Checking Module</h1>
            <p className="text-muted-foreground">Manage folding and quality control</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>

        {/* All Foldings */}
        <Card>
          <CardHeader>
            <CardTitle>All Folding + Checking Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : foldings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No entries found</div>
            ) : (
              <div className="space-y-4">
                {foldings.map((folding) => (
                  <div key={folding._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">{folding.partyName} - Lot: {folding.lotNumber}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Fold Type: {folding.foldType || 'N/A'} | Checker: {folding.checkerName || 'N/A'}
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Input:</span> {folding.inputMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Checked:</span> {folding.checkedMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rejected:</span> {folding.rejectedMeter}m
                          </div>
                          <div>
                            <span className="text-muted-foreground">QC Status:</span> {getQCBadge(folding.qcStatus)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(folding.status)}
                        {folding.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFolding(folding)
                              setQcData({
                                checkedMeter: folding.checkedMeter,
                                rejectedMeter: folding.rejectedMeter,
                                qcStatus: folding.qcStatus,
                                checkerName: folding.checkerName || ''
                              })
                              setShowQCModal(true)
                            }}
                          >
                            Update QC
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
              <DialogTitle>Create New Folding + Checking Entry</DialogTitle>
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
                  <Label>Fold Type</Label>
                  <Input
                    value={formData.foldType}
                    onChange={(e) => setFormData({ ...formData, foldType: e.target.value })}
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

        {/* Update QC Modal */}
        <Dialog open={showQCModal} onOpenChange={setShowQCModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update QC Results</DialogTitle>
            </DialogHeader>
            {selectedFolding && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total Input: {selectedFolding.inputMeter}m
                </div>
                <div>
                  <Label>Checked Meter *</Label>
                  <Input
                    type="number"
                    value={qcData.checkedMeter}
                    onChange={(e) => setQcData({ ...qcData, checkedMeter: Number(e.target.value) })}
                    max={selectedFolding.inputMeter}
                    required
                  />
                </div>
                <div>
                  <Label>Rejected Meter *</Label>
                  <Input
                    type="number"
                    value={qcData.rejectedMeter}
                    onChange={(e) => setQcData({ ...qcData, rejectedMeter: Number(e.target.value) })}
                    max={selectedFolding.inputMeter - qcData.checkedMeter}
                    required
                  />
                </div>
                <div>
                  <Label>QC Status *</Label>
                  <Select
                    value={qcData.qcStatus}
                    onValueChange={(value: 'pass' | 'fail' | 'partial') => 
                      setQcData({ ...qcData, qcStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Checker Name *</Label>
                  <Input
                    value={qcData.checkerName}
                    onChange={(e) => setQcData({ ...qcData, checkerName: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowQCModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateQC}>Update QC</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}


