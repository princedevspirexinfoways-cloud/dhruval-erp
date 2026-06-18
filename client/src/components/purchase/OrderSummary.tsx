'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

interface OrderSummaryProps {
  items: Array<{
    quantity: number
    rate: number
    discountAmount: number
    taxableAmount: number
    totalTaxAmount: number
    lineTotal: number
  }>
  freightCharges: number
  packingCharges: number
  otherCharges: number
}

export function OrderSummary({ items, freightCharges, packingCharges, otherCharges }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0)
  const taxableAmount = items.reduce((sum, item) => sum + item.taxableAmount, 0)
  const totalTaxAmount = items.reduce((sum, item) => sum + item.totalTaxAmount, 0)
  const grandTotal = taxableAmount + totalTaxAmount + freightCharges + packingCharges + otherCharges

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <DollarSign className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Total Discount:</span>
            <span className="font-medium text-green-600 dark:text-green-400">-{formatCurrency(totalDiscount)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Taxable Amount:</span>
            <span className="font-medium">{formatCurrency(taxableAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Total Tax:</span>
            <span className="font-medium">{formatCurrency(totalTaxAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Freight Charges:</span>
            <span className="font-medium">{formatCurrency(freightCharges)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Packing Charges:</span>
            <span className="font-medium">{formatCurrency(packingCharges)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Other Charges:</span>
            <span className="font-medium">{formatCurrency(otherCharges)}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-bold text-lg">
            <span className="text-gray-900 dark:text-white">Grand Total:</span>
            <span className="text-blue-600 dark:text-blue-400">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



