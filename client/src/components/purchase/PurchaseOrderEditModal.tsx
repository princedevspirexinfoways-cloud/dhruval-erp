'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { X, Save, Package, Truck, Calendar, DollarSign, FileText, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useUpdatePurchaseOrderMutation } from '@/lib/api/purchaseOrdersApi'
import toast from 'react-hot-toast'

interface PurchaseOrderEditModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
  onSave?: (updatedOrder: any) => void
}

export function PurchaseOrderEditModal({ order, isOpen, onClose, onSave }: PurchaseOrderEditModalProps) {
  const theme = useSelector(selectTheme)
  const [updatePurchaseOrder] = useUpdatePurchaseOrderMutation()
  const [formData, setFormData] = useState<any>({
    orderNumber: '',
    status: 'pending',
    totalAmount: 0,
    expectedDeliveryDate: '',
    notes: '',
    supplier: {
      supplierName: '',
      supplierCode: '',
      contactPerson: '',
      phone: '',
      email: ''
    },
    items: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        orderNumber: order.orderNumber || '',
        status: order.status || 'pending',
        totalAmount: order.totalAmount || 0,
        expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
        notes: order.notes || '',
        supplier: {
          supplierName: order.supplier?.supplierName || '',
          supplierCode: order.supplier?.supplierCode || '',
          contactPerson: order.supplier?.contactPerson || '',
          phone: order.supplier?.phone || '',
          email: order.supplier?.email || ''
        },
        items: order.items || []
      })
    }
  }, [order])

  if (!isOpen || !order) return null

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSupplierChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        [field]: value
      }
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }
    
    // Recalculate item total if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const item = updatedItems[index]
      const total = (item.quantity || 0) * (item.rate || 0)
      updatedItems[index].total = total
    }
    
    setFormData((prev: any) => ({
      ...prev,
      items: updatedItems
    }))
  }

  const addNewItem = () => {
    const newItem = {
      itemName: '',
      description: '',
      quantity: 0,
      rate: 0,
      unit: 'pcs',
      total: 0
    }
    
    setFormData((prev: any) => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_: any, i: number) => i !== index)
    setFormData((prev: any) => ({
      ...prev,
      items: updatedItems
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Calculate total amount from items
      const calculatedTotal = formData.items.reduce((sum: number, item: any) => {
        return sum + ((item.quantity || 0) * (item.rate || 0))
      }, 0)

      // Prepare the update data
      const updateData = {
        status: formData.status,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        notes: formData.notes,
        totalAmount: calculatedTotal,
        items: formData.items.map((item: any) => ({
          itemId: item.itemId || item._id || '',
          itemName: item.itemName,
          itemCode: item.itemCode || '',
          quantity: item.quantity || 0,
          unitPrice: item.rate || 0,
          totalPrice: (item.quantity || 0) * (item.rate || 0),
          specifications: item.description || ''
        })),
        supplier: {
          supplierName: formData.supplier.supplierName,
          supplierCode: formData.supplier.supplierCode,
          contactInfo: {
            email: formData.supplier.email || '',
            phone: formData.supplier.phone || ''
          }
        }
      }

      // Make API call to update the purchase order
      const result = await updatePurchaseOrder({
        orderId: order._id,
        orderData: updateData
      }).unwrap()

      if (result.success) {
        toast.success('Purchase order updated successfully!')
        
        // Call the onSave callback if provided
        if (onSave) {
          onSave(result.data)
        }
        
        onClose()
      } else {
        throw new Error('Failed to update purchase order')
      }
    } catch (error: any) {
      console.error('Error updating purchase order:', error)
      const errorMessage = error?.data?.message || error?.message || 'Failed to update purchase order'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-sky-500 dark:text-sky-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Purchase Order</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.orderNumber}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Order Number</Label>
                  <Input
                    value={formData.orderNumber}
                    onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                    className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="pending" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Pending</SelectItem>
                      <SelectItem value="approved" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Approved</SelectItem>
                      <SelectItem value="ordered" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Ordered</SelectItem>
                      <SelectItem value="received" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Received</SelectItem>
                      <SelectItem value="partial" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Partial</SelectItem>
                      <SelectItem value="cancelled" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Expected Delivery Date</Label>
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                    className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Total Amount</Label>
                  <Input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                    className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Truck className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Supplier Name</Label>
                  <Input
                    value={formData.supplier?.supplierName || ''}
                    onChange={(e) => handleSupplierChange('supplierName', e.target.value)}
                    className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Supplier Code</Label>
                  <Input
                    value={formData.supplier?.supplierCode || ''}
                    onChange={(e) => handleSupplierChange('supplierCode', e.target.value)}
                    className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Contact Person</Label>
                  <Input
                    value={formData.supplier?.contactPerson || ''}
                    onChange={(e) => handleSupplierChange('contactPerson', e.target.value)}
                    className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Phone</Label>
                  <Input
                    value={formData.supplier?.phone || ''}
                    onChange={(e) => handleSupplierChange('phone', e.target.value)}
                    className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Package className="h-5 w-5" />
                  Items ({formData.items.length})
                </CardTitle>
                <Button
                  type="button"
                  onClick={addNewItem}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
                  <p>No items added yet</p>
                  <p className="text-sm">Click "Add Item" to start adding items to this order</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item: any, index: number) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Item #{index + 1}
                        </h4>
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-900 dark:text-white">Item Name *</Label>
                          <Input
                            value={item.itemName || ''}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                            placeholder="Enter item name"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-gray-900 dark:text-white">Quantity *</Label>
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-gray-900 dark:text-white">Rate *</Label>
                          <Input
                            type="number"
                            value={item.rate || ''}
                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-gray-900 dark:text-white">Unit</Label>
                          <Select value={item.unit || 'pcs'} onValueChange={(value) => handleItemChange(index, 'unit', value)}>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectItem value="pcs" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Pieces</SelectItem>
                              <SelectItem value="kg" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Kilograms</SelectItem>
                              <SelectItem value="m" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Meters</SelectItem>
                              <SelectItem value="box" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Boxes</SelectItem>
                              <SelectItem value="roll" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Rolls</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-gray-900 dark:text-white">Total</Label>
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white font-medium">
                            {formatCurrency((item.quantity || 0) * (item.rate || 0))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <Label className="text-gray-900 dark:text-white">Description</Label>
                        <Textarea
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Enter item description (optional)"
                          rows={2}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white">Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Items Count:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{formData.items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(formData.items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.rate || 0)), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Tax (18%):</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(formData.items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.rate || 0)), 0) * 0.18)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-3">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(formData.items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.rate || 0)), 0) * 1.18)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
