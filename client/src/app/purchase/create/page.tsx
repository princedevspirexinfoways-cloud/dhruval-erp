'use client'

import { useState, useCallback, memo } from 'react'
import { useSelector } from 'react-redux'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PurchaseOrderForm } from '@/components/purchase/PurchaseOrderForm'
import { selectTheme } from '@/lib/features/ui/uiSlice'

function CreatePurchaseOrderPage() {
  const router = useRouter()
  const theme = useSelector(selectTheme)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuccess = useCallback(() => {
    router.push('/purchase')
  }, [router])

  const handleCancel = useCallback(() => {
    router.push('/purchase')
  }, [router])

  const handleBack = useCallback(() => {
    router.push('/purchase')
  }, [router])

  return (
    <AppLayout>
      <ResponsiveContainer className="space-y-6 pb-8">
        {/* Header */}
        <DashboardHeader
          title="Create Purchase Order"
          description="Create a new purchase order with supplier details, items, and payment terms"
          icon={<ArrowLeft className="h-6 w-6 text-white" />}
          actions={
            <div className="flex gap-2">
              <Button 
                onClick={handleBack} 
                variant="outline" 
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Purchase
              </Button>
            </div>
          }
        />

        {/* Form */}
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          <PurchaseOrderForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        </div>
      </ResponsiveContainer>
    </AppLayout>
  )
}

export default memo(CreatePurchaseOrderPage)
