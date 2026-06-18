'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ProductionDashboard } from '@/components/production/ProductionDashboard'
import { Factory } from 'lucide-react'

export default function ProductionDashboardPage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <DashboardHeader
          title="Production Dashboard"
          description="Real-time production monitoring, machine status, and performance metrics"
          icon={<Factory className="h-6 w-6 text-white" />}
        />
        
        <ProductionDashboard />
      </div>
    </AppLayout>
  )
}
