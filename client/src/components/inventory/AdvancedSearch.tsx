'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'

export function AdvancedSearch() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Advanced Search
        </CardTitle>
        <CardDescription>Search by design number, GSM, color, batch, etc.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-purple-500 mb-4" />
          <p className="text-muted-foreground">Advanced search coming soon</p>
        </div>
      </CardContent>
    </Card>
  )
}
