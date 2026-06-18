'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText } from 'lucide-react'
import { PurchaseOrderFormData } from './PurchaseOrderForm'

interface NotesSectionProps {
  formData: PurchaseOrderFormData
  updateFormData: (updates: Partial<PurchaseOrderFormData>) => void
}

export function NotesSection({ formData, updateFormData }: NotesSectionProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <FileText className="h-5 w-5" />
          Remarks / Notes
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Used for QC comments, adjustments, special conditions, additional internal notes, and any custom message
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Remarks / Notes *</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => updateFormData({ notes: e.target.value })}
              placeholder="Enter Remarks / Notes (QC comments, adjustments, special conditions, additional internal notes, any custom message)..."
              rows={6}
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This large text area is for all remarks, notes, QC comments, adjustments, special conditions, and custom messages
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Payment Notes (Optional)</Label>
            <Textarea
              value={formData.paymentNotes || ''}
              onChange={(e) => updateFormData({ paymentNotes: e.target.value })}
              placeholder="Enter payment-related notes, instructions, or comments..."
              rows={4}
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Optional field for payment-related notes, instructions, or comments
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



