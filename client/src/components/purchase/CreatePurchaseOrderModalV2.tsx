'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { PurchaseOrderForm } from './PurchaseOrderForm'

interface CreatePurchaseOrderModalV2Props {
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreatePurchaseOrderModalV2({ onSuccess, open: controlledOpen, onOpenChange }: CreatePurchaseOrderModalV2Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" style={{ 
        position: 'fixed',
        top: '5vh',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxHeight: '90vh'
      }}>
        <DialogHeader>
          <DialogTitle>Create New Purchase Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
          <PurchaseOrderForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}



