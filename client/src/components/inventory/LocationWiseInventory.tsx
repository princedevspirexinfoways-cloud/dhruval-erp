'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export function LocationWiseInventory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location-wise Inventory
        </CardTitle>
        <CardDescription>Warehouse and rack-wise stock distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <MapPin className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <p className="text-muted-foreground">Location tracking coming soon</p>
        </div>
      </CardContent>
    </Card>
  )
}
