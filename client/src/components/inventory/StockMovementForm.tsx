'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  X,
  Save,
  Loader2,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { selectCurrentUser, selectCurrentCompany } from '@/lib/features/auth/authSlice'
import { useGetInventoryItemsQuery } from '@/lib/api/inventoryApi'
import { useGetWarehousesQuery } from '@/lib/api/warehousesApi'
import { toast } from 'sonner'

interface StockMovementFormProps {
  movement?: any
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading?: boolean
  theme?: 'light' | 'dark'
}

export function StockMovementForm({ movement, onClose, onSubmit, isLoading = false, theme = 'light' }: StockMovementFormProps) {
  const user = useSelector(selectCurrentUser)
  const currentCompany = useSelector(selectCurrentCompany)

  // Form state
  const [formData, setFormData] = useState<any>({
    movementType: movement?.movementType || 'inward',
    itemId: movement?.itemId || '',
    quantity: movement?.quantity || '',
    unit: movement?.unit || '',
    fromLocation: movement?.fromLocation || '',
    toLocation: movement?.toLocation || '',
    referenceDocument: {
      type: movement?.referenceDocument?.type || 'purchase_order',
      number: movement?.referenceDocument?.number || '',
      date: movement?.referenceDocument?.date || ''
    },
    notes: movement?.notes || '',
    movementDate: movement?.movementDate || new Date().toISOString().split('T')[0],
    requiresApproval: movement?.requiresApproval || false,
    priority: movement?.priority || 'normal'
  })

  const [errors, setErrors] = useState<any>({})

  // Fetch data
  const { data: itemsData, isLoading: itemsLoading } = useGetInventoryItemsQuery({})
  const { data: warehousesData, isLoading: warehousesLoading } = useGetWarehousesQuery({})

  const items = itemsData?.data?.data || []
  const warehouses = warehousesData?.data || []

  // Handle form changes
  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [parent]: {
          ...(prev[parent] as any || {}),
          [child]: ''
        }
      }))
    } else {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [field]: ''
      }))
    }

    if (field.includes('.')) {
      const [parentField, childField] = field.split('.')
      setFormData((prev: any) => ({
        ...prev,
        [parentField]: {
          ...(prev[parentField] || {}),
          [childField]: value
        }
      }))
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value
      }))
    }
  }

  // Handle nested object changes
  const handleNestedChange = (parentField: string, childField: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof typeof prev] || {}),
        [childField]: value
      }
    }))

    // Clear error when user starts typing
    if (errors[parentField]) {
      setErrors((prev: any) => ({
        ...prev,
        [parentField]: {
          ...(prev[parentField as keyof typeof prev] || {}),
          [childField]: ''
        }
      }))
    }
  }

  // Validation
  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.itemId) {
      newErrors.itemId = 'Item is required'
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }

    if (!formData.fromLocation) {
      newErrors.fromLocation = 'From location is required'
    }

    if (!formData.toLocation) {
      newErrors.toLocation = 'To location is required'
    }

    if (formData.fromLocation === formData.toLocation) {
      newErrors.toLocation = 'From and To locations cannot be the same'
    }

    if (!formData.referenceDocument.number) {
      newErrors.referenceDocument = 'Reference number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    // Prepare data for submission - EXACT format that works with the API
    const submissionData = {
      movementType: formData.movementType,
      itemId: formData.itemId,
      quantity: Number(formData.quantity) || 0,
      unit: selectedItem?.stock?.unit || 'PCS',
      companyId: currentCompany?._id || user?.currentCompanyId,
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation,
      referenceDocument: {
        documentType: formData.referenceDocument.type,
        documentNumber: formData.referenceDocument.number,
        documentDate: formData.referenceDocument.date
      },
      notes: formData.notes,
      priority: formData.priority
    }

    console.log('Form data being submitted:', submissionData);
    console.log('Selected item:', selectedItem);
    console.log('Current company:', currentCompany);
    console.log('User:', user);

    onSubmit(submissionData)
  }

  // Get selected item details
  const selectedItem = items.find(item => item._id === formData.itemId)

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-theme ${theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-sm' : 'bg-gray-500/50 backdrop-blur-sm'
      }`}>
      <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-theme border ${theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
        }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-theme ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                {movement ? 'Edit Stock Movement' : 'Create New Stock Movement'}
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                {movement ? 'Update movement details' : 'Record a new stock movement'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 text-gray-500'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Movement Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Movement Type *
              </label>
              <select
                value={formData.movementType}
                onChange={(e) => handleInputChange('movementType', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-gray-100'
                    : 'border-gray-300 bg-white text-gray-900'
                  }`}
                disabled={!!movement} // Can't change type for existing movements
              >
                <option value="inward">Inward (Stock In)</option>
                <option value="outward">Outward (Stock Out)</option>
                <option value="transfer">Transfer (Internal)</option>
                <option value="adjustment_note">Adjustment</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-gray-100'
                    : 'border-gray-300 bg-white text-gray-900'
                  }`}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Item Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Item *
            </label>
            <select
              value={formData.itemId}
              onChange={(e) => handleInputChange('itemId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                } ${theme === 'dark'
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-white text-gray-900'
                }`}
              disabled={itemsLoading}
            >
              <option value="">Select an item</option>
              {items.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.companyItemCode || item.itemCode} - {item.itemName}
                </option>
              ))}
            </select>
            {errors.itemId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.itemId}
              </p>
            )}
            {itemsLoading && (
              <p className="mt-1 text-sm text-gray-500 flex items-center">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Loading items...
              </p>
            )}
          </div>

          {/* Item Details Display */}
          {selectedItem && (
            <div className={`rounded-lg p-4 border transition-theme ${theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600'
                : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Current Stock:</span>
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{selectedItem.stock?.currentStock || 0}</p>
                </div>
                <div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Unit:</span>
                  <p className={`font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{selectedItem.stock?.unit || 'PCS'}</p>
                </div>
                <div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category:</span>
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{selectedItem.category?.primary || 'N/A'}</p>
                </div>
                <div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Available Stock:</span>
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{selectedItem.stock?.availableStock || 0}</p>
                </div>
              </div>
              <div className={`mt-3 pt-3 border-t transition-theme ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                }`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-medium">Note:</span> Unit will be automatically set to "{selectedItem.stock?.unit || 'PCS'}" from the selected item.
                </p>
              </div>
            </div>
          )}

          {/* Quantity, Unit and Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Quantity *
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className={`${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                min="0.01"
                step="0.01"
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.quantity}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Unit
              </label>
              <Input
                type="text"
                value={selectedItem?.stock?.unit || 'PCS'}
                className={`cursor-not-allowed ${theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                disabled
                placeholder="Unit will be auto-filled"
              />
              <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Auto-filled from selected item
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Movement Date *
              </label>
              <Input
                type="date"
                value={formData.movementDate}
                onChange={(e) => handleInputChange('movementDate', e.target.value)}
                className={`w-full ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              />
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                From Location *
              </label>
              <select
                value={formData.fromLocation}
                onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  } ${theme === 'dark'
                    ? 'bg-gray-700 text-gray-100'
                    : 'bg-white text-gray-900'
                  }`}
                disabled={warehousesLoading}
              >
                <option value="">Select source location</option>
                {warehouses.map((warehouse: any) => (
                  <option key={warehouse._id} value={warehouse.warehouseName}>
                    {warehouse.warehouseName} - {warehouse.location?.city}
                  </option>
                ))}
                <option value="Supplier">Supplier</option>
                <option value="Production">Production</option>
                <option value="Customer">Customer</option>
                <option value="Scrap">Scrap/Disposal</option>
              </select>
              {errors.fromLocation && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.fromLocation}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                To Location *
              </label>
              <select
                value={formData.toLocation}
                onChange={(e) => handleInputChange('toLocation', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  } ${theme === 'dark'
                    ? 'bg-gray-700 text-gray-100'
                    : 'bg-white text-gray-900'
                  }`}
                disabled={warehousesLoading}
              >
                <option value="">Select destination location</option>
                {warehouses.map((warehouse: any) => (
                  <option key={warehouse._id} value={warehouse.warehouseName}>
                    {warehouse.warehouseName} - {warehouse.location?.city}
                  </option>
                ))}
                <option value="Supplier">Supplier</option>
                <option value="Production">Production</option>
                <option value="Customer">Customer</option>
                <option value="Scrap">Scrap/Disposal</option>
              </select>
              {errors.toLocation && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.toLocation}
                </p>
              )}
            </div>
          </div>

          {/* Reference Document */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Document Type
              </label>
              <select
                value={formData.referenceDocument.type}
                onChange={(e) => handleNestedChange('referenceDocument', 'type', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-gray-100'
                    : 'border-gray-300 bg-white text-gray-900'
                  }`}
              >
                <option value="manual">Manual Entry</option>
                <option value="purchase_order">Purchase Order</option>
                <option value="sales_order">Sales Order</option>
                <option value="production_order">Production Order</option>
                <option value="transfer_request">Transfer Request</option>
                <option value="adjustment_note">Stock Adjustment</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Reference Number *
              </label>
              <Input
                type="text"
                value={formData.referenceDocument.number}
                onChange={(e) => handleNestedChange('referenceDocument', 'number', e.target.value)}
                className={`${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                placeholder="Enter reference number"
              />
              {errors.referenceDocument && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.referenceDocument}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Document Date
              </label>
              <Input
                type="date"
                value={formData.referenceDocument.date}
                onChange={(e) => handleNestedChange('referenceDocument', 'date', e.target.value)}
                className={`w-full ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requiresApproval"
                checked={formData.requiresApproval}
                onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
              />
              <label htmlFor="requiresApproval" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Requires Manager Approval
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isUrgent"
                checked={formData.priority === 'urgent'}
                onChange={(e) => handleInputChange('priority', e.target.checked ? 'urgent' : 'normal')}
                className={`w-4 h-4 text-red-600 rounded focus:ring-red-500 ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300'
                  }`}
              />
              <label htmlFor="isUrgent" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Mark as Urgent
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              placeholder="Add any additional notes or instructions..."
            />
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center justify-end space-x-3 pt-6 border-t transition-theme ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {movement ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {movement ? 'Update Movement' : 'Create Movement'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
