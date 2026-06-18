'use client'

import { useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useGetInventoryItemsQuery } from '@/lib/api/inventoryApi'
import { useGetCategoriesQuery } from '@/features/category/api/categoryApi'
import { useGetSubcategoriesByCategoryQuery } from '@/features/subcategory/api/subcategoryApi'
import { useGetUnitsQuery } from '@/features/unit/api/unitApi'
import { QuickCreateCategory } from '@/components/inventory/QuickCreateCategory'
import { QuickCreateSubcategory } from '@/components/inventory/QuickCreateSubcategory'
import { QuickCreateUnit } from '@/components/inventory/QuickCreateUnit'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { Plus, X, Package } from 'lucide-react'
import { PurchaseOrderFormData } from './PurchaseOrderForm'

interface ItemsSectionProps {
  formData: PurchaseOrderFormData
  updateFormData: (updates: Partial<PurchaseOrderFormData>) => void
}

// Separate component for each item row to avoid hooks in loops
function ItemRow({
  item,
  index,
  formData,
  updateItem,
  updateFormData,
  removeItem,
  inventoryItems,
  inventoryLoading,
  inventoryError,
  categories,
  units,
  selectedCompanyId,
  refetchCategories,
  refetchUnits
}: {
  item: any
  index: number
  formData: PurchaseOrderFormData
  updateItem: (index: number, field: string, value: any) => void
  updateFormData: (updates: Partial<PurchaseOrderFormData>) => void
  removeItem: (index: number) => void
  inventoryItems: any[]
  inventoryLoading: boolean
  inventoryError: any
  categories: any[]
  units: any[]
  selectedCompanyId: string
  refetchCategories: () => void
  refetchUnits: () => void
}) {
  const [openDialogs, setOpenDialogs] = useState({
    category: false,
    subcategory: false,
    unit: false
  })

  // Get subcategories for this item's category
  const { data: subcategoriesData } = useGetSubcategoriesByCategoryQuery(
    item.categoryId || '',
    { skip: !item.categoryId }
  )
  const subcategories = subcategoriesData?.data || []

  const selectedCategory = categories.find((cat: any) => cat._id === item.categoryId)
  const selectedUnit = units.find((unit: any) => unit._id === item.unitId)
  const selectedSubcategory = subcategories.find((sub: any) => sub._id === item.subcategoryId)

  // Handle category creation
  const handleCategoryCreated = async (categoryId: string) => {
    await refetchCategories()
    updateItem(index, 'categoryId', categoryId)
    setOpenDialogs(prev => ({ ...prev, category: false }))
  }

  // Handle subcategory creation
  const handleSubcategoryCreated = async (subcategoryId: string) => {
    updateItem(index, 'subcategoryId', subcategoryId)
    setOpenDialogs(prev => ({ ...prev, subcategory: false }))
  }

  // Handle unit creation
  const handleUnitCreated = async (unitId: string) => {
    await refetchUnits()
    updateItem(index, 'unitId', unitId)
    setOpenDialogs(prev => ({ ...prev, unit: false }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white">Item No. {index + 1}</h4>
        <Button
          type="button"
          onClick={() => removeItem(index)}
          variant="outline"
          size="sm"
          className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Item Type Selection */}
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Item Type *</Label>
          <Select
            value={item.itemType || 'new'}
            onValueChange={(value) => {
              console.log('Item type changed to:', value, 'for item index:', index)
              if (value === 'new' || value === 'existing') {
                const updatedItems = [...formData.items]
                updatedItems[index] = {
                  ...updatedItems[index],
                  itemType: value as 'new' | 'existing'
                }
                if (value === 'existing') {
                  updatedItems[index] = {
                    ...updatedItems[index],
                    itemCode: '',
                    itemName: '',
                    rate: 0,
                    selectedInventoryItemId: undefined
                  }
                }
                updateFormData({ items: updatedItems })
              }
            }}
          >
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Select item type" />
            </SelectTrigger>
            <SelectContent
              className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg"
              position="popper"
              sideOffset={4}
            >
              <SelectItem
                value="new"
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
              >
                New Item
              </SelectItem>
              <SelectItem
                value="existing"
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
              >
                Existing Item
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Existing Item Selection */}
        {item.itemType === 'existing' && (
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-gray-700 dark:text-gray-300">Select Existing Item *</Label>
            <Select
              value={item.selectedInventoryItemId || 'none'}
              onValueChange={(value) => {
                console.log('Existing item changed to:', value, 'for item index:', index)
                if (value === 'none') {
                  const updatedItems = [...formData.items]
                  updatedItems[index] = {
                    ...updatedItems[index],
                    selectedInventoryItemId: undefined,
                    itemId: undefined,
                    itemCode: '',
                    itemName: '',
                    rate: 0,
                    unitId: ''
                  }
                  updateFormData({ items: updatedItems })
                } else {
                  const selectedItem = inventoryItems.find(inv => inv._id === value)
                  if (selectedItem) {
                    const updatedItems = [...formData.items]
                    const updatedItem = {
                      ...updatedItems[index],
                      selectedInventoryItemId: selectedItem._id,
                      itemId: selectedItem._id,
                      itemCode: selectedItem.itemCode || '',
                      itemName: selectedItem.itemName || '',
                      rate: selectedItem.pricing?.costPrice || 0,
                      unitId: selectedItem.stock?.unit || ''
                    }
                    const discountAmount = (updatedItem.discount?.type === 'percentage')
                      ? (updatedItem.quantity * updatedItem.rate * (updatedItem.discount?.value || 0) / 100)
                      : (updatedItem.discount?.value || 0)
                    const discountAmt = discountAmount || 0
                    const taxableAmt = (updatedItem.quantity * updatedItem.rate) - discountAmt
                    const taxRate = 18
                    const totalTaxAmt = taxableAmt * taxRate / 100
                    updatedItems[index] = {
                      ...updatedItem,
                      discountAmount: discountAmt,
                      taxableAmount: taxableAmt,
                      totalTaxAmount: totalTaxAmt,
                      lineTotal: taxableAmt + totalTaxAmt
                    }
                    // Batch update all fields at once
                    updateFormData({ items: updatedItems })
                  }
                }
              }}
            >
              <SelectTrigger
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                onClick={(e) => {
                  console.log('Existing item SelectTrigger clicked')
                  e.stopPropagation()
                }}
              >
                <SelectValue placeholder="Select existing item" />
              </SelectTrigger>
              <SelectContent
                className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg max-h-[300px]"
                position="popper"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {inventoryLoading ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                    Loading inventory items...
                  </div>
                ) : inventoryError ? (
                  <div className="px-2 py-1.5 text-sm text-red-500 dark:text-red-400">
                    Error loading inventory items
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                    No inventory items available for this company
                  </div>
                ) : (
                  <>
                    <SelectItem
                      value="none"
                      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                      onClick={(e) => {
                        console.log('None item clicked')
                        e.stopPropagation()
                      }}
                    >
                      None
                    </SelectItem>
                    {inventoryItems.map((invItem) => (
                      <SelectItem
                        key={invItem._id}
                        value={invItem._id || ''}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                        onClick={(e) => {
                          console.log('Inventory item clicked:', invItem._id, invItem.itemName)
                          e.stopPropagation()
                        }}
                      >
                        {invItem.itemName} ({invItem.itemCode}) - Stock: {invItem.stock?.currentStock || 0} {invItem.stock?.unit || 'pcs'} - ₹{invItem.pricing?.costPrice || 0}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* New Item Fields - Enhanced with Dynamic Category/Subcategory/Units */}
        {item.itemType === 'new' && (
          <>
            {/* Row 1: Category, Subcategory */}
            {/* Category with + New button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 dark:text-gray-300">Category *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenDialogs(prev => ({ ...prev, category: true }))}
                  className="h-7 px-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
              <Select
                value={item.categoryId || ''}
                onValueChange={(value) => {
                  console.log('Category changed to:', value, 'for item index:', index)
                  if (!value) return

                  // Batch update: update category and clear subcategory in a single operation
                  const updatedItems = [...formData.items]
                  updatedItems[index] = {
                    ...updatedItems[index],
                    categoryId: value,
                    subcategoryId: '' // Clear subcategory when category changes
                  }

                  // Recalculate totals for display
                  const itemToUpdate = updatedItems[index]
                  const discountAmount = (itemToUpdate.discount?.type === 'percentage')
                    ? (itemToUpdate.quantity * itemToUpdate.rate * (itemToUpdate.discount?.value || 0) / 100)
                    : (itemToUpdate.discount?.value || 0)

                  const discountAmt = discountAmount || 0
                  const taxableAmt = (itemToUpdate.quantity * itemToUpdate.rate) - discountAmt
                  const taxRate = 18
                  const totalTaxAmt = taxableAmt * taxRate / 100

                  updatedItems[index] = {
                    ...updatedItems[index],
                    discountAmount: discountAmt,
                    taxableAmount: taxableAmt,
                    totalTaxAmount: totalTaxAmt,
                    lineTotal: taxableAmt + totalTaxAmt
                  }

                  // Use updateFormData to batch the update
                  updateFormData({ items: updatedItems })
                }}
              >
                <SelectTrigger
                  className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ${selectedCategory ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}
                  onClick={(e) => {
                    console.log('Category SelectTrigger clicked')
                    e.stopPropagation()
                  }}
                >
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent
                  className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg"
                  position="popper"
                  sideOffset={4}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {categories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                      No categories available. Click "New" to create one.
                    </div>
                  ) : (
                    categories.map((cat: any) => (
                      <SelectItem
                        key={cat._id}
                        value={cat._id || ''}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                        onClick={(e) => {
                          console.log('Category item clicked:', cat._id, cat.name)
                          e.stopPropagation()
                        }}
                      >
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory with + New button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 dark:text-gray-300">Subcategory</Label>
                {item.categoryId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenDialogs(prev => ({ ...prev, subcategory: true }))}
                    className="h-7 px-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                )}
              </div>
              <Select
                value={item.subcategoryId || ''}
                onValueChange={(value) => {
                  console.log('Subcategory changed to:', value, 'for item index:', index)
                  if (!value) return
                  updateItem(index, 'subcategoryId', value)
                }}
                disabled={!item.categoryId}
              >
                <SelectTrigger
                  className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ${!item.categoryId ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    console.log('Subcategory SelectTrigger clicked')
                    e.stopPropagation()
                  }}
                >
                  <SelectValue placeholder={item.categoryId ? "Select Subcategory" : "Select Category First"} />
                </SelectTrigger>
                <SelectContent
                  className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg"
                  position="popper"
                  sideOffset={4}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {subcategories.length > 0 ? (
                    subcategories.map((sub: any) => (
                      <SelectItem
                        key={sub._id}
                        value={sub._id || ''}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                        onClick={(e) => {
                          console.log('Subcategory item clicked:', sub._id, sub.name)
                          e.stopPropagation()
                        }}
                      >
                        {sub.name}
                      </SelectItem>
                    ))
                  ) : item.categoryId ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                      No subcategories found. Click "New" to create one.
                    </div>
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                      Please select a category first
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Item Name, HSN Code, Attribute Name */}
            {/* Item Name */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Item Name *</Label>
              <Input
                value={item.itemName || ''}
                onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                placeholder="Enter item name"
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* HSN Code */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">HSN Code</Label>
              <Input
                value={item.hsnCode || ''}
                onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                placeholder="Enter HSN code"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Attribute Name */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Attribute Name</Label>
              <Input
                value={item.attributeName || ''}
                onChange={(e) => updateItem(index, 'attributeName', e.target.value)}
                placeholder="Enter attribute name"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Row 3: Item Code, Unit */}
            {/* Item Code */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Item Code</Label>
              <Input
                value={item.itemCode || ''}
                onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                placeholder="Auto-generated if empty"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Units with + New button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 dark:text-gray-300">Unit *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenDialogs(prev => ({ ...prev, unit: true }))}
                  className="h-7 px-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
              <Select
                value={item.unitId || ''}
                onValueChange={(value) => {
                  console.log('Unit changed to:', value, 'for item index:', index)
                  if (!value) return
                  updateItem(index, 'unitId', value)
                }}
              >
                <SelectTrigger
                  className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ${selectedUnit ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}
                  onClick={(e) => {
                    console.log('Unit SelectTrigger clicked')
                    e.stopPropagation()
                  }}
                >
                  <SelectValue placeholder="Select Unit" />
                </SelectTrigger>
                <SelectContent
                  className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg"
                  position="popper"
                  sideOffset={4}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {units.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                      No units available. Click "New" to create one.
                    </div>
                  ) : (
                    units.map((unit: any) => (
                      <SelectItem
                        key={unit._id}
                        value={unit._id || ''}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                        onClick={(e) => {
                          console.log('Unit item clicked:', unit._id, unit.name)
                          e.stopPropagation()
                        }}
                      >
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Product Name (as per docs), Quantity, Rate */}
            {/* Product Name (as per docs) */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Product Name *</Label>
              <Input
                value={item.itemName || ''}
                onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                placeholder="Enter Product Name"
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Quantity *</Label>
              <Input
                type="number"
                value={item.quantity || 0}
                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                placeholder="Enter Quantity"
                min="0"
                step="0.01"
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Rate */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Rate (₹) *</Label>
              <Input
                type="number"
                value={item.rate || 0}
                onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                placeholder="Enter Rate"
                min="0"
                step="0.01"
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </>
        )}

        {/* For Existing Items - Show basic fields */}
        {item.itemType === 'existing' && (
          <>
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Product Name *</Label>
              <Input
                value={item.itemName || ''}
                onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                placeholder="Enter Product Name"
                required
                disabled={!!item.selectedInventoryItemId}
                className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${item.selectedInventoryItemId ? 'bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-600 cursor-not-allowed' : ''}`}
              />
              {item.selectedInventoryItemId && (
                <p className="text-xs text-green-600 dark:text-green-400">✓ Auto-filled from inventory</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Quantity *</Label>
              <Input
                type="number"
                value={item.quantity || 0}
                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                placeholder="Enter Quantity"
                min="0"
                step="0.01"
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Rate (₹) *</Label>
              <Input
                type="number"
                value={item.rate || 0}
                onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                placeholder="Enter Rate"
                min="0"
                step="0.01"
                required
                disabled={!!item.selectedInventoryItemId}
                className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${item.selectedInventoryItemId ? 'bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-600 cursor-not-allowed' : ''}`}
              />
              {item.selectedInventoryItemId && (
                <p className="text-xs text-green-600 dark:text-green-400">✓ Auto-filled from inventory</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Line Total Display */}
      <div className="flex justify-end">
        <div className="text-right">
          <Label className="text-sm text-gray-600 dark:text-gray-400">Line Total:</Label>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {formatCurrency((item.quantity || 0) * (item.rate || 0))}
          </p>
        </div>
      </div>

      {/* Quick Create Dialogs for this item */}
      <QuickCreateCategory
        open={openDialogs.category}
        onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, category: open }))}
        onCategoryCreated={(categoryId) => handleCategoryCreated(categoryId)}
      />
      <QuickCreateSubcategory
        open={openDialogs.subcategory}
        onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, subcategory: open }))}
        onSubcategoryCreated={(subcategoryId) => handleSubcategoryCreated(subcategoryId)}
        categoryId={item.categoryId}
      />
      <QuickCreateUnit
        open={openDialogs.unit}
        onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, unit: open }))}
        onUnitCreated={(unitId) => handleUnitCreated(unitId)}
      />
    </div>
  )
}

export function ItemsSection({ formData, updateFormData }: ItemsSectionProps) {
  const user = useSelector(selectCurrentUser)
  const userCompanyId = user?.companyAccess?.[0]?.companyId
  const selectedCompanyId = formData.selectedCompanyId || userCompanyId

  // Get inventory items for the selected company
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError } = useGetInventoryItemsQuery(
    {
      companyId: selectedCompanyId,
      limit: 100
    },
    { skip: !selectedCompanyId }
  )
  const inventoryItems = inventoryData?.data?.data || []

  // Get categories
  const { data: categoriesData, refetch: refetchCategories } = useGetCategoriesQuery(
    selectedCompanyId ? { companyId: selectedCompanyId.toString() } : {},
    { skip: !selectedCompanyId }
  )
  const categories = categoriesData?.data || []

  // Get units
  const { data: unitsData, refetch: refetchUnits } = useGetUnitsQuery(
    selectedCompanyId ? { companyId: selectedCompanyId.toString() } : {},
    { skip: !selectedCompanyId }
  )
  const units = unitsData?.data || []

  // Add new item
  const addItem = useCallback(() => {
    const newItem = {
      itemCode: '',
      itemName: '',
      quantity: 0,
      rate: 0,
      deliveryDate: formData.poDate || '',
      itemType: 'new' as const,
      selectedInventoryItemId: undefined,
      // Inventory creation fields for new items
      categoryId: '',
      subcategoryId: '',
      unitId: '',
      challanNumber: '',
      hsnCode: '',
      attributeName: '',
      itemDescription: '',
      // Internal fields
      discount: { type: 'percentage' as const, value: 0 },
      discountAmount: 0,
      taxableAmount: 0,
      taxBreakup: [
        { taxType: 'CGST' as const, rate: 9, amount: 0 },
        { taxType: 'SGST' as const, rate: 9, amount: 0 }
      ],
      totalTaxAmount: 0,
      lineTotal: 0
    }
    updateFormData({ items: [...formData.items, newItem] })
  }, [formData.items, formData.poDate, updateFormData])

  // Remove item
  const removeItem = useCallback((index: number) => {
    updateFormData({ items: formData.items.filter((_, i) => i !== index) })
  }, [formData.items, updateFormData])

  // Update item - helper function for single field updates
  const updateItem = useCallback((index: number, field: string, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate totals for display
    const item = updatedItems[index]
    const discountAmount = (item.discount?.type === 'percentage')
      ? (item.quantity * item.rate * (item.discount?.value || 0) / 100)
      : (item.discount?.value || 0)

    const discountAmt = discountAmount || 0
    const taxableAmt = (item.quantity * item.rate) - discountAmt

    // Calculate tax (assuming 18% GST)
    const taxRate = 18
    const totalTaxAmt = taxableAmt * taxRate / 100

    updatedItems[index] = {
      ...updatedItems[index],
      discountAmount: discountAmt,
      taxableAmount: taxableAmt,
      totalTaxAmount: totalTaxAmt,
      lineTotal: taxableAmt + totalTaxAmt
    }

    updateFormData({ items: updatedItems })
  }, [formData.items, updateFormData])

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items
          </div>
          <Button
            type="button"
            onClick={addItem}
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formData.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
            <p>No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <ItemRow
                key={`item-${index}`}
                item={item}
                index={index}
                formData={formData}
                updateItem={updateItem}
                updateFormData={updateFormData}
                removeItem={removeItem}
                inventoryItems={inventoryItems}
                inventoryLoading={inventoryLoading}
                inventoryError={inventoryError}
                categories={categories}
                units={units}
                selectedCompanyId={selectedCompanyId || ''}
                refetchCategories={refetchCategories}
                refetchUnits={refetchUnits}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
