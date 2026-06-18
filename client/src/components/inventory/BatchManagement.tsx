'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'

export function BatchManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Batch Management
        </CardTitle>
        <CardDescription>Track batches through production stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <p className="text-muted-foreground">Batch management coming soon</p>
        </div>
      </CardContent>
    </Card>
  )
}
