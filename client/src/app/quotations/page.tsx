'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Quote } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { SalesHeader } from '@/components/ui/PageHeader'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { QuotationsList } from '@/components/quotations/QuotationsList'
import { Quotation } from '@/lib/api/quotationsApi'

export default function QuotationsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Quotation handlers
  const handleCreateNew = () => {
    setShowCreateModal(true)
  }

  const handleViewQuotation = (quotation: Quotation) => {
    console.log('View quotation:', quotation)
    // TODO: Navigate to quotation detail page
  }

  const handleEditQuotation = (quotation: Quotation) => {
    console.log('Edit quotation:', quotation)
    // TODO: Navigate to quotation edit page
  }

  const handleDeleteQuotation = (quotation: Quotation) => {
    console.log('Delete quotation:', quotation)
    // TODO: Show delete confirmation modal
  }

  const handleSendQuotation = (quotation: Quotation) => {
    console.log('Send quotation:', quotation)
    // TODO: Show send quotation modal
  }

  const handleDuplicateQuotation = (quotation: Quotation) => {
    console.log('Duplicate quotation:', quotation)
    // TODO: Create duplicate quotation
  }

  const handleDownloadQuotation = (quotation: Quotation) => {
    console.log('Download quotation:', quotation)
    // TODO: Download quotation PDF
  }

  return (
    <AppLayout>
      <div className="p-6">
        <SalesHeader
          title="Quotations"
          description="Manage your quotations and track their status"
          icon={<Quote className="h-6 w-6 text-white" />}
        />
        
        <QuotationsList
          onCreateNew={handleCreateNew}
          onViewQuotation={handleViewQuotation}
          onEditQuotation={handleEditQuotation}
          onDeleteQuotation={handleDeleteQuotation}
          onSendQuotation={handleSendQuotation}
          onDuplicateQuotation={handleDuplicateQuotation}
          onDownloadQuotation={handleDownloadQuotation}
        />
      </div>
    </AppLayout>
  )
}
