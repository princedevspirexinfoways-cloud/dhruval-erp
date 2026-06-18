'use client'

import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useCreatePurchaseOrderMutation, useUpdatePurchaseOrderMutation } from '@/lib/api/purchaseApi'
import { useCreateInventoryItemMutation, useCreateStockMovementMutation } from '@/lib/api/inventoryApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { PurchaseOrderDetails } from './PurchaseOrderDetails'
import { SupplierSelection } from './SupplierSelection'
import { WarehouseSelection } from './WarehouseSelection'
import { ItemsSection } from './ItemsSection'
import { NotesSection } from './NotesSection'
import { OrderSummary } from './OrderSummary'
import { InventoryImpactSummary } from './InventoryImpactSummary'
import { useGetAllCompaniesQuery } from '@/lib/api/authApi'
import { useGetCategoriesQuery } from '@/features/category/api/categoryApi'
import { useGetUnitsQuery } from '@/features/unit/api/unitApi'
import { useGetSubcategoriesByCategoryQuery } from '@/features/subcategory/api/subcategoryApi'

interface PurchaseOrderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  isSubmitting?: boolean
  setIsSubmitting?: (submitting: boolean) => void
}

export interface PurchaseOrderFormData {
  // Basic Details
  poNumber: string
  poDate: string
  expectedDeliveryDate: string
  financialYear: string

  // Company
  selectedCompanyId: string

  // Supplier
  selectedSupplierId: string
  selectedSupplier: any

  // Agent (PO Level)
  selectedAgentId?: string
  selectedAgent?: any

  // Warehouse
  selectedWarehouseId: string
  selectedWarehouse: any

  // Items - Only fields from docs: Item No, Date, Product Name, Quantity, Rate, Agent Name, Agent Contact Number
  items: Array<{
    itemId?: string
    itemCode: string // For internal use
    itemName: string // Product Name
    quantity: number
    rate: number
    deliveryDate: string // Date
    // Internal fields for calculations
    itemType?: 'new' | 'existing'
    selectedInventoryItemId?: string
    unitId?: string // Unit ID from units table
    categoryId?: string // Category ID from categories table
    subcategoryId?: string // Subcategory ID from subcategories table
    challanNumber?: string
    hsnCode?: string
    attributeName?: string
    itemDescription?: string // For new items - inventory creation
    discount?: {
      type: 'percentage' | 'amount'
      value: number
    }
    discountAmount?: number
    taxableAmount?: number
    taxBreakup?: Array<{
      taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS'
      rate: number
      amount: number
    }>
    totalTaxAmount?: number
    lineTotal?: number
  }>

  // Charges
  freightCharges: number
  packingCharges: number
  otherCharges: number

  // Payment Terms
  paymentTermType: 'advance' | 'net' | 'cod' | 'credit' | 'milestone'
  paymentDays: number
  advancePercentage: number

  // Notes
  terms: string
  notes: string
  paymentNotes?: string
}

export function PurchaseOrderForm({ onSuccess, onCancel, isSubmitting, setIsSubmitting }: PurchaseOrderFormProps) {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const theme = useSelector(selectTheme)
  const userCompanyId = user?.companyAccess?.[0]?.companyId

  // API hooks
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation()
  const [updatePurchaseOrder] = useUpdatePurchaseOrderMutation()
  const [createInventoryItem] = useCreateInventoryItemMutation()
  const [createStockMovement] = useCreateStockMovementMutation()
  const { data: companiesData } = useGetAllCompaniesQuery(undefined, {
    skip: !isSuperAdmin
  })

  // Form state
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    poNumber: '',
    poDate: '',
    expectedDeliveryDate: '',
    financialYear: '',
    selectedCompanyId: '',
    selectedSupplierId: '',
    selectedSupplier: null,
    selectedAgentId: undefined,
    selectedAgent: null,
    selectedWarehouseId: '',
    selectedWarehouse: null,
    items: [],
    freightCharges: 0,
    packingCharges: 0,
    otherCharges: 0,
    paymentTermType: 'net',
    paymentDays: 30,
    advancePercentage: 0,
    terms: '',
    notes: '',
    paymentNotes: ''
  })

  // Get categories and units for resolving IDs to names (after formData is initialized)
  const selectedCompanyIdForData = formData.selectedCompanyId || userCompanyId
  const { data: categoriesData } = useGetCategoriesQuery(
    selectedCompanyIdForData ? { companyId: selectedCompanyIdForData.toString() } : {},
    { skip: !selectedCompanyIdForData }
  )
  const categories = categoriesData?.data || []

  const { data: unitsData } = useGetUnitsQuery(
    selectedCompanyIdForData ? { companyId: selectedCompanyIdForData.toString() } : {},
    { skip: !selectedCompanyIdForData }
  )
  const units = unitsData?.data || []

  // Initialize form with default values
  useEffect(() => {
    const currentDate = new Date().toISOString().split('T')[0]
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    setFormData(prev => ({
      ...prev,
      poNumber: `PO-${currentYear}-${Date.now().toString().slice(-6)}`,
      poDate: currentDate,
      financialYear: `${currentYear}-${nextYear}`,
      selectedCompanyId: isSuperAdmin ? '' : userCompanyId || ''
    }))
  }, [isSuperAdmin, userCompanyId])

  // Update form data
  const updateFormData = useCallback((updates: Partial<PurchaseOrderFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Calculate totals - memoized for performance
  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    const totalDiscount = formData.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
    const taxableAmount = formData.items.reduce((sum, item) => sum + (item.taxableAmount || item.quantity * item.rate), 0)
    const totalTaxAmount = formData.items.reduce((sum, item) => sum + (item.totalTaxAmount || 0), 0)
    const grandTotal = taxableAmount + totalTaxAmount + formData.freightCharges + formData.packingCharges + formData.otherCharges

    return { subtotal, totalDiscount, taxableAmount, totalTaxAmount, grandTotal }
  }, [formData.items, formData.freightCharges, formData.packingCharges, formData.otherCharges])

  const { subtotal, totalDiscount, taxableAmount, totalTaxAmount, grandTotal } = totals

  // Validation
  const validateForm = () => {
    if (!formData.selectedCompanyId) {
      toast.error('Please select a company')
      return false
    }

    // Either supplier OR agent must be selected
    if (!formData.selectedSupplierId && !formData.selectedAgentId) {
      toast.error('Please select either a supplier or an agent')
      return false
    }

    if (formData.selectedSupplierId && !formData.selectedSupplier) {
      toast.error('Please select a valid supplier')
      return false
    }

    if (formData.selectedAgentId && !formData.selectedAgent) {
      toast.error('Please select a valid agent')
      return false
    }

    if (!formData.selectedWarehouseId || !formData.selectedWarehouse) {
      toast.error('Please select a warehouse')
      return false
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return false
    }

    // Validate each item has required fields from docs: Date, Product Name, Quantity, Rate
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]

      if (!item.itemType) {
        toast.error(`Item ${i + 1}: Please select item type (New or Existing)`)
        return false
      }

      if (item.itemType === 'existing' && !item.selectedInventoryItemId) {
        toast.error(`Item ${i + 1}: Please select an existing item from inventory`)
        return false
      }

      if (item.itemType === 'new') {
        if (!item.categoryId) {
          toast.error(`Item ${i + 1}: Category is required for new items`)
          return false
        }
        if (!item.unitId) {
          toast.error(`Item ${i + 1}: Unit is required for new items`)
          return false
        }
      }

      if (!item.itemName || item.itemName.trim() === '') {
        toast.error(`Item ${i + 1}: Product Name is required`)
        return false
      }

      if (!item.quantity || item.quantity <= 0) {
        toast.error(`Item ${i + 1}: Quantity is required and must be greater than 0`)
        return false
      }

      if (!item.rate || item.rate <= 0) {
        toast.error(`Item ${i + 1}: Rate is required and must be greater than 0`)
        return false
      }

      if (!item.deliveryDate || item.deliveryDate.trim() === '') {
        toast.error(`Item ${i + 1}: Date is required`)
        return false
      }
    }

    if (!formData.expectedDeliveryDate) {
      toast.error('Please select expected delivery date')
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user is authenticated
    if (!user || !user._id) {
      toast.error('User not authenticated. Please log in again.');
      return;
    }

    if (!validateForm()) return

    const submitting = setIsSubmitting || (() => { })
    submitting(true)

    try {
      // Debug: Log user information
      console.log('Purchase Order Creation - User Debug:', {
        user: user,
        userId: user?._id,
        userEmail: user?.email,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
      });

      // Get user ID with fallbacks
      const getUserId = () => {
        if (user?._id) return user._id;

        // Try to get from localStorage as fallback
        if (typeof window !== 'undefined') {
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser._id) return parsedUser._id;
            }
          } catch (error) {
            console.error('Error parsing stored user:', error);
          }
        }

        // Last resort - throw error if no user ID found
        throw new Error('User ID not found. Please log in again.');
      };

      const userId = getUserId();

      const purchaseOrderData = {
        companyId: formData.selectedCompanyId,
        poNumber: formData.poNumber,
        poDate: formData.poDate,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        financialYear: formData.financialYear,
        poType: 'standard' as 'standard' | 'blanket' | 'contract' | 'planned' | 'emergency' | 'service' | 'capital',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        category: 'raw_material' as 'raw_material' | 'finished_goods' | 'consumables' | 'services' | 'capital_goods' | 'maintenance',
        // Supplier OR Agent (not both)
        supplier: formData.selectedSupplierId && formData.selectedSupplier ? {
          supplierId: formData.selectedSupplier._id || '',
          supplierCode: formData.selectedSupplier.supplierCode,
          supplierName: formData.selectedSupplier.supplierName,
          gstin: formData.selectedSupplier.registrationDetails?.gstin || '',
          pan: formData.selectedSupplier.registrationDetails?.pan || '',
          contactPerson: formData.selectedSupplier.contactPersons?.[0]?.name || '',
          phone: formData.selectedSupplier.contactInfo?.primaryPhone || '',
          email: formData.selectedSupplier.contactInfo?.primaryEmail || '',
          address: {
            addressLine1: formData.selectedSupplier.addresses?.[0]?.addressLine1 || '',
            addressLine2: formData.selectedSupplier.addresses?.[0]?.addressLine2 || '',
            city: formData.selectedSupplier.addresses?.[0]?.city || '',
            state: formData.selectedSupplier.addresses?.[0]?.state || '',
            pincode: formData.selectedSupplier.addresses?.[0]?.pincode || '',
            country: formData.selectedSupplier.addresses?.[0]?.country || 'India'
          }
        } : undefined,
        deliveryInfo: {
          deliveryAddress: {
            addressLine1: formData.selectedWarehouse?.address?.addressLine1 || '',
            addressLine2: formData.selectedWarehouse?.address?.addressLine2 || '',
            city: formData.selectedWarehouse?.address?.city || '',
            state: formData.selectedWarehouse?.address?.state || '',
            pincode: formData.selectedWarehouse?.address?.pincode || '',
            country: formData.selectedWarehouse?.address?.country || 'India'
          },
          warehouseId: formData.selectedWarehouseId,
          warehouseName: formData.selectedWarehouse?.warehouseName || '',
          contactPerson: formData.selectedWarehouse?.contactInfo?.primaryPhone || '',
          contactPhone: formData.selectedWarehouse?.contactInfo?.primaryPhone || '',
          deliveryInstructions: '',
          workingHours: '',
          deliveryType: 'standard' as const
        },
        items: formData.items.map((item, idx) => {
          // Resolve unit from unitId
          let unitValue = 'pcs'
          if (item.unitId) {
            const selectedUnit = units.find((unit: any) => unit._id === item.unitId)
            if (selectedUnit) {
              unitValue = selectedUnit.symbol || selectedUnit.name || 'pcs'
            }
          }

          return {
            // For existing items, use the inventory item ID. For new items, use temp ID (will be replaced when item is created)
            itemId: item.itemType === 'existing' && item.selectedInventoryItemId
              ? item.selectedInventoryItemId
              : `temp-${Date.now()}-${idx}`,
            itemCode: item.itemCode || (item.itemType === 'existing' ? `ITEM-${idx + 1}` : `ITEM-${Date.now()}-${idx}`),
            itemName: item.itemName, // Product Name
            quantity: item.quantity,
            unit: unitValue,
            rate: item.rate,
            deliveryDate: item.deliveryDate || formData.poDate,
            // Internal fields for backend compatibility
            description: '',
            specifications: '',
            hsnCode: '',
            discount: item.discount || { type: 'percentage' as const, value: 0 },
            discountAmount: item.discountAmount || 0,
            taxableAmount: item.taxableAmount || (item.quantity * item.rate),
            taxBreakup: item.taxBreakup || [
              { taxType: 'CGST' as const, rate: 9, amount: 0 },
              { taxType: 'SGST' as const, rate: 9, amount: 0 }
            ],
            totalTaxAmount: item.totalTaxAmount || 0,
            lineTotal: item.lineTotal || (item.quantity * item.rate),
            notes: ''
          }
        }),
        amounts: {
          subtotal,
          totalDiscount,
          taxableAmount,
          totalTaxAmount,
          freightCharges: formData.freightCharges,
          packingCharges: formData.packingCharges,
          otherCharges: formData.otherCharges,
          roundingAdjustment: 0,
          grandTotal
        },
        taxDetails: {
          placeOfSupply: formData.selectedWarehouse?.address?.state || 'Maharashtra',
          isReverseCharge: false,
          taxBreakup: [
            { taxType: 'CGST' as const, rate: 9, taxableAmount: taxableAmount / 2, taxAmount: totalTaxAmount / 2 },
            { taxType: 'SGST' as const, rate: 9, taxableAmount: taxableAmount / 2, taxAmount: totalTaxAmount / 2 }
          ],
          totalTaxAmount
        },
        paymentTerms: {
          termType: formData.paymentTermType,
          days: formData.paymentDays,
          advancePercentage: formData.advancePercentage,
          description: formData.terms || '' // Store custom terms in description
        },
        terms: formData.terms,
        // PO-level Agent details (if agent is selected instead of supplier)
        agent: formData.selectedAgentId && formData.selectedAgent ? {
          agentId: formData.selectedAgent._id,
          agentName: formData.selectedAgent.agentName,
          contactPerson: formData.selectedAgent.contactPersons?.[0]?.name || '',
          phone: formData.selectedAgent.contactInfo?.primaryPhone || '',
          email: formData.selectedAgent.contactInfo?.primaryEmail || '',
        } : undefined,
        notes: formData.notes,
        paymentNotes: formData.paymentNotes || '',
        specialInstructions: '',
        createdBy: userId,
        lastModifiedBy: userId,
        buyerId: userId,
        buyerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Unknown User',
        isActive: true
      }

      const result = await createPurchaseOrder(purchaseOrderData).unwrap()

      // Store mapping of temporary item IDs to actual inventory item IDs
      const itemIdMapping: { [key: string]: string } = {}

      // Handle inventory updates and linking
      for (const item of formData.items) {
        if (item.itemType === 'new') {
          try {
            // Resolve categoryId to category name
            let categoryPrimary: string = 'raw_material'
            let categorySecondary = ''
            if (item.categoryId) {
              const selectedCategory = categories.find((cat: any) => cat._id === item.categoryId)
              if (selectedCategory) {
                categoryPrimary = typeof selectedCategory.name === 'string' ? selectedCategory.name : 'raw_material'
              }
            }

            // Resolve subcategoryId to subcategory name (we'll fetch it if needed)
            // For now, we'll pass the subcategoryId and let backend resolve it
            // Or we can fetch subcategories here if needed
            if (item.subcategoryId && item.categoryId) {
              // Try to get subcategory name from a cached list or fetch
              // For now, we'll pass it as secondary category name
              categorySecondary = item.subcategoryId // Backend can resolve this
            }

            // Resolve unitId to unit symbol/name
            let unitValue = 'pcs'
            if (item.unitId) {
              const selectedUnit = units.find((unit: any) => unit._id === item.unitId)
              if (selectedUnit) {
                unitValue = selectedUnit.symbol || selectedUnit.name || 'pcs'
              }
            }

            // Create new inventory item with 0 stock (not received yet)
            const inventoryData = {
              itemName: item.itemName,
              itemCode: item.itemCode || `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              category: categoryPrimary, // Convert to string as required by API
              itemDescription: item.itemDescription || '', // Use description if provided
              companyId: formData.selectedCompanyId,
              warehouseId: formData.selectedWarehouseId,
              reorderPoint: 0,
              reorderQuantity: 0,
              stockingMethod: 'fifo' as const,
              initialStockLevel: 0, // Stock is 0 because item is not received yet
              unitOfMeasure: unitValue, // Unit symbol/name
              specifications: {
                hsnCode: item.hsnCode || '',
                attributeName: item.attributeName || '',
                challan: item.challanNumber || '',
                color: '',
                design: '',
                finish: ''
              },
              pricing: {
                costPrice: item.rate,
                sellingPrice: item.rate * 1.2, // 20% markup
                mrp: item.rate * 1.3
              }
            }

            const newInventoryItem = await createInventoryItem(inventoryData).unwrap()

            // Store the mapping from temporary ID to actual inventory item ID
            if (item.itemId) {
              itemIdMapping[item.itemId] = newInventoryItem.data._id
            }

            console.log(`Created new inventory item with 0 stock: ${newInventoryItem.data._id} for item: ${item.itemName}`)

          } catch (error) {
            console.error('Failed to create inventory item:', error)
            toast.error(`Failed to create inventory item: ${item.itemName}`)
          }
        } else if (item.itemType === 'existing' && item.selectedInventoryItemId) {
          // For existing items, just link to the inventory item
          // Stock will be updated when PO is received
          console.log(`Linked existing inventory item: ${item.selectedInventoryItemId} for item: ${item.itemName}`)
        }
      }

      // Log the linking summary
      console.log('Purchase Order Item Linking Summary:', {
        poNumber: formData.poNumber,
        poId: result.data._id,
        itemMappings: itemIdMapping,
        existingItems: formData.items.filter(item => item.itemType === 'existing').map(item => ({
          itemName: item.itemName,
          inventoryItemId: item.selectedInventoryItemId
        }))
      })

      toast.success('Purchase Order created successfully!')
      onSuccess?.()
    } catch (error: any) {
      console.error('Purchase Order Creation Error:', error);

      // Handle specific error cases
      if (error?.message === 'User ID not found. Please log in again.') {
        toast.error('Session expired. Please log in again.');
        // Optionally redirect to login page
        // window.location.href = '/login';
      } else {
        toast.error(error?.data?.message || error?.message || 'Failed to create purchase order');
      }
    } finally {
      submitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Purchase Order Details */}
      <PurchaseOrderDetails
        formData={formData}
        updateFormData={updateFormData}
        isSuperAdmin={isSuperAdmin}
        companies={companiesData?.data || []}
      />

      {/* Supplier Selection */}
      <SupplierSelection
        formData={formData}
        updateFormData={updateFormData}
      />

      {/* Warehouse Selection */}
      <WarehouseSelection
        formData={formData}
        updateFormData={updateFormData}
      />

      {/* Items */}
      <ItemsSection
        formData={formData}
        updateFormData={updateFormData}
      />

      {/* Notes */}
      <NotesSection
        formData={formData}
        updateFormData={updateFormData}
      />

      {/* Inventory Impact Summary */}
      <InventoryImpactSummary items={formData.items} />

      {/* Order Summary */}
      <OrderSummary
        items={formData.items.map(item => ({
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          discountAmount: item.discountAmount || 0,
          taxableAmount: item.taxableAmount || (item.quantity || 0) * (item.rate || 0),
          totalTaxAmount: item.totalTaxAmount || 0,
          lineTotal: item.lineTotal || (item.quantity || 0) * (item.rate || 0)
        }))}
        freightCharges={formData.freightCharges}
        packingCharges={formData.packingCharges}
        otherCharges={formData.otherCharges}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px] bg-sky-500 hover:bg-sky-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="h-4 w-4 mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create PO
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
