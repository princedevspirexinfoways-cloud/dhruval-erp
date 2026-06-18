'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { 
  useGetLongationStocksQuery,
  useGetLongationStockTotalQuery
} from '@/lib/api/productionModulesApi'
import { TrendingUp, Package } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function LongationStockPage() {
  const [filter, setFilter] = useState<{ sourceModule?: string; status?: string }>({})
  
  const { data, isLoading, refetch } = useGetLongationStocksQuery(filter)
  const { data: totalData } = useGetLongationStockTotalQuery()

  const stocks = data?.data || []
  const total = totalData?.data?.totalLongation || 0

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      available: 'default',
      allocated: 'secondary',
      used: 'outline'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      after_bleaching: 'bg-blue-100 text-blue-800',
      hazer_silicate_curing: 'bg-purple-100 text-purple-800',
      washing: 'bg-green-100 text-green-800',
      felt: 'bg-yellow-100 text-yellow-800'
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
            <h1 className="text-3xl font-bold">Longation Stock</h1>
            <p className="text-muted-foreground">Shrinkage/Extra Meter Stock Management</p>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Total Longation Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{total.toLocaleString()}m</div>
            <p className="text-sm text-muted-foreground mt-2">Total available longation stock</p>
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
                    <SelectItem value="after_bleaching">After Bleaching</SelectItem>
                    <SelectItem value="hazer_silicate_curing">Hazer/Silicate/Curing</SelectItem>
                    <SelectItem value="washing">Washing</SelectItem>
                    <SelectItem value="felt">Felt</SelectItem>
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
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock List */}
        <Card>
          <CardHeader>
            <CardTitle>Longation Stock Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : stocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No longation stock entries found</div>
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}






