'use client'

import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { useRecordPaymentMutation } from '@/lib/api/invoicesApi'
import { localLabels } from '@/constants/localLabels'
import toast from 'react-hot-toast'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoiceId: string
  invoiceNumber: string
  outstandingAmount: number
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'credit', label: 'Credit' }
]

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  invoiceNumber,
  outstandingAmount
}: RecordPaymentModalProps) {
  const [recordPayment, { isLoading }] = useRecordPaymentMutation()
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      toast.error('Enter valid amount')
      return
    }
    if (amt > outstandingAmount) {
      toast.error('Amount cannot exceed outstanding amount')
      return
    }
    try {
      await recordPayment({
        invoiceId,
        amount: amt,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined
      }).unwrap()
      toast.success('Payment recorded')
      onSuccess()
      onClose()
      setAmount('')
      setReference('')
      setNotes('')
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to record payment')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 className="text-lg font-semibold">Record Payment</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Invoice: <strong>{invoiceNumber}</strong> · {localLabels.dueAmount.primary}: ₹{outstandingAmount.toLocaleString('en-IN')}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                min={0.01}
                max={outstandingAmount}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Payment Mode *</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Reference No.</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Cheque no. / UTR / Transaction ref"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded-lg p-2 min-h-[60px]"
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Record Payment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
