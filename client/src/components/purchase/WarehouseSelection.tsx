'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetWarehousesQuery } from '@/lib/api/warehousesApi'
import { Package } from 'lucide-react'
import { PurchaseOrderFormData } from './PurchaseOrderForm'

interface WarehouseSelectionProps {
  formData: PurchaseOrderFormData
  updateFormData: (updates: Partial<PurchaseOrderFormData>) => void
}

export function WarehouseSelection({ formData, updateFormData }: WarehouseSelectionProps) {
  const { data: warehousesData } = useGetWarehousesQuery({
    companyId: formData.selectedCompanyId,
    page: 1,
    limit: 100
  }, {
    skip: !formData.selectedCompanyId
  })

  const warehouses = warehousesData?.data || []

  // Handle warehouse selection
  useEffect(() => {
    if (formData.selectedWarehouseId) {
      const warehouse = warehouses.find(w => w._id === formData.selectedWarehouseId)
      if (warehouse && (!formData.selectedWarehouse || formData.selectedWarehouse._id !== warehouse._id)) {
        updateFormData({ selectedWarehouse: warehouse })
      }
    } else if (formData.selectedWarehouse) {
      updateFormData({ selectedWarehouse: null })
    }
  }, [formData.selectedWarehouseId, warehouses, formData.selectedWarehouse, updateFormData])

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Package className="h-5 w-5" />
          Warehouse Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-white">Select Warehouse *</Label>
            <Select value={formData.selectedWarehouseId || ''} onValueChange={(value) => {
              console.log('Warehouse selected:', value)
              updateFormData({ selectedWarehouseId: value })
            }}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select a warehouse" />
              </SelectTrigger>
              <SelectContent className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                {warehouses.map((warehouse) => (
                  <SelectItem
                    key={warehouse._id || ''}
                    value={warehouse._id || ''}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                  >
                    {warehouse.warehouseName} ({warehouse.warehouseCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.selectedWarehouse && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Warehouse Code</Label>
                <p className="text-sm text-gray-900 dark:text-white">{formData.selectedWarehouse.warehouseCode}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                <p className="text-sm text-gray-900 dark:text-white">{formData.selectedWarehouse.warehouseType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                <p className="text-sm text-gray-900 dark:text-white">{formData.selectedWarehouse.contactInfo?.primaryPhone || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                <p className="text-sm text-gray-900 dark:text-white">{formData.selectedWarehouse.contactInfo?.email || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</Label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formData.selectedWarehouse.address?.addressLine1}, {formData.selectedWarehouse.address?.city}, {formData.selectedWarehouse.address?.state} - {formData.selectedWarehouse.address?.pincode}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
