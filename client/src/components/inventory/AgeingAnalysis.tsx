'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export function AgeingAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Stock Ageing Analysis
        </CardTitle>
        <CardDescription>Track inventory age and identify slow-moving stock</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-orange-500 mb-4" />
          <p className="text-muted-foreground">Ageing analysis coming soon</p>
        </div>
      </CardContent>
    </Card>
  )
}
