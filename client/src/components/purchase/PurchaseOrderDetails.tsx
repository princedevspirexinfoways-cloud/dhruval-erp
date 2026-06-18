'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Package } from 'lucide-react'
import { PurchaseOrderFormData } from './PurchaseOrderForm'

interface PurchaseOrderDetailsProps {
  formData: PurchaseOrderFormData
  updateFormData: (updates: Partial<PurchaseOrderFormData>) => void
  isSuperAdmin: boolean
  companies: Array<{ _id: string; companyName: string; companyCode: string }>
}

export function PurchaseOrderDetails({ formData, updateFormData, isSuperAdmin, companies }: PurchaseOrderDetailsProps) {
  return (
    <>
      {/* Company Selection (Super Admin Only) */}
      {isSuperAdmin && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Package className="h-5 w-5" />
              Company Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Select Company *</Label>
              <Select value={formData.selectedCompanyId || ''} onValueChange={(value) => {
                console.log('Company selected:', value)
                updateFormData({ selectedCompanyId: value })
              }}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                  {companies.map((company) => (
                    <SelectItem key={company._id} value={company._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                      {company.companyName} ({company.companyCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Order Details */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <FileText className="h-5 w-5" />
            Purchase Order Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">PO Number (Auto-generated) *</Label>
              <Input
                value={formData.poNumber}
                onChange={(e) => updateFormData({ poNumber: e.target.value })}
                placeholder="PO-2024-001"
                required
                readOnly
                className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">PO number is auto-generated</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">PO Date *</Label>
              <Input
                type="date"
                value={formData.poDate}
                onChange={(e) => updateFormData({ poDate: e.target.value })}
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Expected Delivery Date *</Label>
              <Input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => updateFormData({ expectedDeliveryDate: e.target.value })}
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Financial Year *</Label>
              <Input
                value={formData.financialYear}
                onChange={(e) => updateFormData({ financialYear: e.target.value })}
                placeholder="2024-2025"
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
