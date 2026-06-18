'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CreditCard } from 'lucide-react'
import { PurchaseOrderFormData } from './PurchaseOrderForm'

interface PaymentTermsSectionProps {
  formData: PurchaseOrderFormData
  updateFormData: (updates: Partial<PurchaseOrderFormData>) => void
}

// Predefined payment terms templates
const PREDEFINED_PAYMENT_TERMS = [
  {
    id: 'net30',
    name: 'Net 30 Days',
    description: 'Payment due within 30 days of invoice date',
    termType: 'net',
    days: 30,
    advancePercentage: 0
  },
  {
    id: 'net45',
    name: 'Net 45 Days',
    description: 'Payment due within 45 days of invoice date',
    termType: 'net',
    days: 45,
    advancePercentage: 0
  },
  {
    id: 'net60',
    name: 'Net 60 Days',
    description: 'Payment due within 60 days of invoice date',
    termType: 'net',
    days: 60,
    advancePercentage: 0
  },
  {
    id: 'advance50',
    name: '50% Advance, 50% on Delivery',
    description: '50% payment in advance, remaining 50% on delivery',
    termType: 'advance',
    days: 0,
    advancePercentage: 50
  },
  {
    id: 'advance30',
    name: '30% Advance, 70% on Delivery',
    description: '30% payment in advance, remaining 70% on delivery',
    termType: 'advance',
    days: 0,
    advancePercentage: 30
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Payment to be made at the time of delivery',
    termType: 'cod',
    days: 0,
    advancePercentage: 0
  },
  {
    id: 'credit15',
    name: 'Credit 15 Days',
    description: 'Payment due within 15 days of delivery',
    termType: 'credit',
    days: 15,
    advancePercentage: 0
  },
  {
    id: 'milestone',
    name: 'Milestone Based',
    description: 'Payment based on project milestones',
    termType: 'milestone',
    days: 0,
    advancePercentage: 0
  }
]

export function PaymentTermsSection({ formData, updateFormData }: PaymentTermsSectionProps) {
  const [customTerms, setCustomTerms] = useState(formData.terms || '')

  const handlePredefinedSelect = (termId: string) => {
    const term = PREDEFINED_PAYMENT_TERMS.find(t => t.id === termId)
    if (term) {
      updateFormData({
        paymentTermType: term.termType as any,
        paymentDays: term.days,
        advancePercentage: term.advancePercentage,
        terms: term.description
      })
      setCustomTerms(term.description)
    }
  }

  const handleCustomTermsChange = (value: string) => {
    setCustomTerms(value)
    updateFormData({ terms: value })
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <CreditCard className="h-5 w-5" />
          Payment Terms
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Select a predefined payment term or enter custom terms
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Predefined Payment Terms */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Predefined Payment Terms</Label>
            <Select onValueChange={handlePredefinedSelect}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select a predefined payment term" />
              </SelectTrigger>
              <SelectContent className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg max-h-[300px]">
                {PREDEFINED_PAYMENT_TERMS.map((term) => (
                  <SelectItem
                    key={term.id}
                    value={term.id}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{term.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{term.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Term Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Payment Term Type</Label>
              <Select
                value={formData.paymentTermType}
                onValueChange={(value: any) => updateFormData({ paymentTermType: value })}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                  <SelectItem value="net" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Net</SelectItem>
                  <SelectItem value="advance" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Advance</SelectItem>
                  <SelectItem value="cod" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Cash on Delivery</SelectItem>
                  <SelectItem value="credit" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Credit</SelectItem>
                  <SelectItem value="milestone" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Payment Days</Label>
              <Input
                type="number"
                value={formData.paymentDays}
                onChange={(e) => updateFormData({ paymentDays: parseInt(e.target.value) || 0 })}
                placeholder="Enter payment days"
                min="0"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Advance Percentage (%)</Label>
              <Input
                type="number"
                value={formData.advancePercentage}
                onChange={(e) => updateFormData({ advancePercentage: parseFloat(e.target.value) || 0 })}
                placeholder="Enter advance percentage"
                min="0"
                max="100"
                step="0.01"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Custom Payment Terms Input */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Custom Payment Terms / Description</Label>
            <Textarea
              value={customTerms}
              onChange={(e) => handleCustomTermsChange(e.target.value)}
              placeholder="Enter custom payment terms or additional details..."
              rows={4}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter any additional payment terms, conditions, or special instructions
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
