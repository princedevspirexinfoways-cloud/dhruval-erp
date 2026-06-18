'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetRejectionStocksQuery,
  useGetRejectionStockTotalQuery,
  useUpdateRejectionStockStatusMutation,
  RejectionStock
} from '@/lib/api/productionModulesApi'
import { AlertTriangle, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function RejectionStockPage() {
  const [filter, setFilter] = useState<{ sourceModule?: string; status?: string }>({})
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState<RejectionStock | null>(null)
  const [newStatus, setNewStatus] = useState<'disposed' | 'reworked'>('disposed')
  
  const { data, isLoading, refetch } = useGetRejectionStocksQuery(filter)
  const { data: totalData } = useGetRejectionStockTotalQuery()
  const [updateStatus] = useUpdateRejectionStockStatusMutation()

  const stocks = data?.data || []
  const total = totalData?.data?.totalRejection || 0

  const handleUpdateStatus = async () => {
    if (!selectedStock) return
    try {
      await updateStatus({
        id: selectedStock._id!,
        data: { status: newStatus }
      }).unwrap()
      toast.success('Rejection stock status updated successfully')
      setShowStatusModal(false)
      setSelectedStock(null)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update status')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'destructive',
      disposed: 'outline',
      reworked: 'secondary'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      printing: 'bg-red-100 text-red-800',
      finishing: 'bg-orange-100 text-orange-800',
      folding_checking: 'bg-pink-100 text-pink-800'
    }
    return (
      <Badge className={colors[source] || 'bg-gray-100 text-gray-800'}>
        {source.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rejection Stock</h1>
            <p className="text-muted-foreground">Waste/Rejected Stock Management</p>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Total Rejection Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{total.toLocaleString()}m</div>
            <p className="text-sm text-muted-foreground mt-2">Total pending rejection stock</p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Module</Label>
                <Select
                  value={filter.sourceModule || 'all'}
                  onValueChange={(value) => 
                    setFilter({ ...filter, sourceModule: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="printing">Printing</SelectItem>
                    <SelectItem value="finishing">Finishing</SelectItem>
                    <SelectItem value="folding_checking">Folding + Checking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={filter.status || 'all'}
                  onValueChange={(value) => 
                    setFilter({ ...filter, status: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                    <SelectItem value="reworked">Reworked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock List */}
        <Card>
          <CardHeader>
            <CardTitle>Rejection Stock Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : stocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No rejection stock entries found</div>
            ) : (
              <div className="space-y-4">
                {stocks.map((stock) => (
                  <div key={stock._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">{stock.partyName} - Lot: {stock.lotNumber}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {getSourceBadge(stock.sourceModule)}
                          {stock.reason && ` | Reason: ${stock.reason}`}
                        </div>
                        {stock.qualityIssue && (
                          <div className="text-sm text-muted-foreground">
                            Quality Issue: {stock.qualityIssue}
                          </div>
                        )}
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Meter:</span> <span className="font-semibold">{stock.meter}m</span>
                        </div>
                        {stock.createdAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(stock.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(stock.status)}
                        {stock.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStock(stock)
                              setNewStatus('disposed')
                              setShowStatusModal(true)
                            }}
                          >
                            Update Status
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

        {/* Update Status Modal */}
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Rejection Stock Status</DialogTitle>
            </DialogHeader>
            {selectedStock && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Lot: {selectedStock.lotNumber} | Meter: {selectedStock.meter}m
                </div>
                <div>
                  <Label>New Status *</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value: 'disposed' | 'reworked') => setNewStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disposed">Disposed</SelectItem>
                      <SelectItem value="reworked">Reworked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowStatusModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStatus}>Update</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}






