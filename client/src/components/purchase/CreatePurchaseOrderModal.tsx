'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useCreatePurchaseOrderMutation } from '@/lib/api/purchaseApi'
import { useGetAllCompaniesQuery } from '@/lib/api/authApi'
import { useGetSuppliersQuery } from '@/lib/api/suppliersApi'
import { useGetWarehousesQuery } from '@/lib/api/warehousesApi'
import { useGetInventoryItemsQuery, useCreateInventoryItemMutation, useCreateStockMovementMutation } from '@/lib/api/inventoryApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { Plus, X, Package, DollarSign, Calendar, Truck, User, CreditCard, Save, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreatePurchaseOrderModalProps {
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface PurchaseItem {
  itemId?: string // Optional for new items, required for existing items
  itemCode: string
  itemName: string
  description: string
  specifications: string
  hsnCode: string
  quantity: number
  unit: string
  rate: number
  itemType?: 'new' | 'existing'
  selectedInventoryItemId?: string
  currentStock?: number
  availableStock?: number
  category?: 'raw_material' | 'finished_goods' | 'consumables' | 'services' | 'capital_goods' | 'maintenance' | 'spare_parts'
  discount: {
    type: 'percentage' | 'amount'
    value: number
  }
  discountAmount: number
  taxableAmount: number
  taxBreakup: Array<{
    taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS'
    rate: number
    amount: number
  }>
  totalTaxAmount: number
  lineTotal: number
  deliveryDate: string
  notes: string
}

interface CreatePurchaseOrderRequest {
  companyId?: string
  poNumber: string
  poDate: string
  expectedDeliveryDate: string
  financialYear: string
  poType: 'standard' | 'blanket' | 'contract' | 'planned' | 'emergency' | 'service' | 'capital'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'raw_material' | 'finished_goods' | 'consumables' | 'services' | 'capital_goods' | 'maintenance'
  supplier: {
    supplierId: string
    supplierCode: string
    supplierName: string
    gstin: string
    pan: string
    contactPerson: string
    phone: string
    email: string
    address: {
      addressLine1: string
      addressLine2: string
      city: string
      state: string
      pincode: string
      country: string
    }
  }
  deliveryInfo: {
    deliveryAddress: {
      addressLine1: string
      addressLine2: string
      city: string
      state: string
      pincode: string
      country: string
    }
    warehouseId: string
    warehouseName: string
    contactPerson: string
    contactPhone: string
    deliveryInstructions: string
    workingHours: string
    deliveryType: 'standard' | 'express' | 'scheduled'
  }
  items: Array<{
    itemId: string
    itemCode: string
    itemName: string
    description: string
    specifications: string
    hsnCode: string
    quantity: number
    unit: string
    rate: number
    discount: {
      type: 'percentage' | 'amount'
      value: number
    }
    discountAmount: number
    taxableAmount: number
    taxBreakup: Array<{
      taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS'
      rate: number
      amount: number
    }>
    totalTaxAmount: number
    lineTotal: number
    deliveryDate: string
    notes: string
  }>
  amounts: {
    subtotal: number
    totalDiscount: number
    taxableAmount: number
    totalTaxAmount: number
    freightCharges: number
    packingCharges: number
    otherCharges: number
    roundingAdjustment: number
    grandTotal: number
  }
  taxDetails: {
    placeOfSupply: string
    isReverseCharge: boolean
    taxBreakup: Array<{
      taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS'
      rate: number
      taxableAmount: number
      taxAmount: number
    }>
    totalTaxAmount: number
  }
  paymentTerms: {
    termType: 'advance' | 'net' | 'cod' | 'credit' | 'milestone'
    days: number
    advancePercentage: number
  }
  terms: string
  notes: string
  specialInstructions: string
}

export function CreatePurchaseOrderModal({ onSuccess, open: controlledOpen, onOpenChange }: CreatePurchaseOrderModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)

  // User and company info
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const userCompanyId = user?.companyAccess?.[0]?.companyId

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState('')

  // API hooks
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation()
  const [createInventoryItem] = useCreateInventoryItemMutation()
  const [createStockMovement] = useCreateStockMovementMutation()
  const { data: companiesData } = useGetAllCompaniesQuery(undefined, {
    skip: !isSuperAdmin
  })
  const { data: suppliersData } = useGetSuppliersQuery({
    page: 1,
    limit: 100
  })
  const { data: warehousesData } = useGetWarehousesQuery({
    companyId: selectedCompanyId,
    page: 1,
    limit: 100
  }, {
    skip: !selectedCompanyId
  })
  const [poNumber, setPoNumber] = useState('')
  const [poDate, setPoDate] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [financialYear, setFinancialYear] = useState('')
  const [poType, setPoType] = useState<'standard' | 'blanket' | 'contract' | 'planned' | 'emergency' | 'service' | 'capital'>('standard')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [category, setCategory] = useState<'raw_material' | 'finished_goods' | 'consumables' | 'services' | 'capital_goods' | 'maintenance'>('raw_material')

  // Supplier selection
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)

  // Warehouse selection
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null)

  // Items
  const [items, setItems] = useState<PurchaseItem[]>([])

  // Charges
  const [freightCharges, setFreightCharges] = useState(0)
  const [packingCharges, setPackingCharges] = useState(0)
  const [otherCharges, setOtherCharges] = useState(0)

  // Payment Terms
  const [paymentTermType, setPaymentTermType] = useState<'advance' | 'net' | 'cod' | 'credit' | 'milestone'>('net')
  const [paymentDays, setPaymentDays] = useState(30)
  const [advancePercentage, setAdvancePercentage] = useState(0)

  // Notes
  const [terms, setTerms] = useState('')
  const [notes, setNotes] = useState('')

  // Data
  const companies = companiesData?.data || []
  const suppliers = suppliersData?.data?.data || []
  const warehouses = warehousesData?.data || []
  
  // Get inventory items for the selected company
  const { data: inventoryData } = useGetInventoryItemsQuery(
    { companyId: selectedCompanyId || userCompanyId },
    { skip: !selectedCompanyId && !userCompanyId }
  )
  const inventoryItems = inventoryData?.data?.data || []

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      // Set default values
      const currentDate = new Date().toISOString().split('T')[0]
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1
      
      setPoNumber(`PO-${currentYear}-${Date.now().toString().slice(-6)}`)
      setPoDate(currentDate)
      setExpectedDeliveryDate('')
      setFinancialYear(`${currentYear}-${nextYear}`)
      setSelectedCompanyId(isSuperAdmin ? '' : userCompanyId || '')
      setSelectedSupplierId('')
      setSelectedSupplier(null)
      setSelectedWarehouseId('')
      setSelectedWarehouse(null)
      setItems([])
      setFreightCharges(0)
      setPackingCharges(0)
      setOtherCharges(0)
      setPaymentDays(30)
      setAdvancePercentage(0)
      setTerms('')
      setNotes('')
    }
  }, [open, isSuperAdmin, userCompanyId])

  // Handle supplier selection
  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find(s => s._id === selectedSupplierId)
      setSelectedSupplier(supplier || null)
    } else {
      setSelectedSupplier(null)
    }
  }, [selectedSupplierId, suppliers])

  // Handle warehouse selection
  useEffect(() => {
    if (selectedWarehouseId) {
      const warehouse = warehouses.find(w => w._id === selectedWarehouseId)
      setSelectedWarehouse(warehouse || null)
    } else {
      setSelectedWarehouse(null)
    }
  }, [selectedWarehouseId, warehouses])

  // Add new item
  const addItem = () => {
    const newItem: PurchaseItem = {
      itemCode: '',
      itemName: '',
      description: '',
      specifications: '',
      hsnCode: '',
      quantity: 0,
      unit: 'pcs',
      rate: 0,
      itemType: 'new',
      category: 'raw_material',
      discount: { type: 'percentage', value: 0 },
      discountAmount: 0,
      taxableAmount: 0,
      taxBreakup: [
        { taxType: 'CGST', rate: 9, amount: 0 },
        { taxType: 'SGST', rate: 9, amount: 0 }
      ],
      totalTaxAmount: 0,
      lineTotal: 0,
      deliveryDate: '',
      notes: ''
    }
    setItems([...items, newItem])
  }

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Update item
  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // If changing to new item type, set default category
    if (field === 'itemType' && value === 'new' && !updatedItems[index].category) {
      updatedItems[index].category = 'raw_material'
    }
    
    // Recalculate item totals
    const item = updatedItems[index]
    const discountAmount = item.discount.type === 'percentage' 
      ? (item.quantity * item.rate * item.discount.value / 100)
      : item.discount.value
    
    item.discountAmount = discountAmount
    item.taxableAmount = (item.quantity * item.rate) - discountAmount
    
    // Calculate tax (assuming 18% GST for now)
    const taxRate = 18
    item.totalTaxAmount = item.taxableAmount * taxRate / 100
    
    // Update tax breakup
    item.taxBreakup = [
      { taxType: 'CGST', rate: 9, amount: item.totalTaxAmount / 2 },
      { taxType: 'SGST', rate: 9, amount: item.totalTaxAmount / 2 }
    ]
    
    item.lineTotal = item.taxableAmount + item.totalTaxAmount
    
    setItems(updatedItems)
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0)
  const taxableAmount = items.reduce((sum, item) => sum + item.taxableAmount, 0)
  const totalTaxAmount = items.reduce((sum, item) => sum + item.totalTaxAmount, 0)
  const grandTotal = taxableAmount + totalTaxAmount + freightCharges + packingCharges + otherCharges

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCompanyId) {
      toast.error('Please select a company')
      return
    }

    if (!selectedSupplierId || !selectedSupplier) {
      toast.error('Please select a supplier')
      return
    }

    if (!selectedWarehouseId || !selectedWarehouse) {
      toast.error('Please select a warehouse')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    // Validate each item has required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.itemCode || !item.itemName || item.quantity <= 0 || item.rate <= 0) {
        toast.error(`Item ${i + 1}: Please fill all required fields (Item Code, Item Name, Quantity, Rate)`)
        return
      }
    }

    if (!expectedDeliveryDate) {
      toast.error('Please select expected delivery date')
      return
    }

    setIsSubmitting(true)

    try {
      const purchaseOrderData: CreatePurchaseOrderRequest = {
        companyId: selectedCompanyId,
        poNumber,
        poDate,
        expectedDeliveryDate,
        financialYear,
        poType,
        priority,
        category,
        supplier: {
          supplierId: selectedSupplier._id || '',
          supplierCode: selectedSupplier.supplierCode,
          supplierName: selectedSupplier.supplierName,
          gstin: selectedSupplier.gstin || '',
          pan: selectedSupplier.pan || '',
          contactPerson: selectedSupplier.contactPerson || '',
          phone: selectedSupplier.phone || '',
          email: selectedSupplier.email || '',
          address: {
            addressLine1: selectedSupplier.addresses?.[0]?.addressLine1 || '',
            addressLine2: selectedSupplier.addresses?.[0]?.addressLine2 || '',
            city: selectedSupplier.addresses?.[0]?.city || '',
            state: selectedSupplier.addresses?.[0]?.state || '',
            pincode: selectedSupplier.addresses?.[0]?.pincode || '',
            country: selectedSupplier.addresses?.[0]?.country || 'India'
          }
        },
        deliveryInfo: {
          deliveryAddress: {
            addressLine1: selectedWarehouse?.address?.addressLine1 || '',
            addressLine2: selectedWarehouse?.address?.addressLine2 || '',
            city: selectedWarehouse?.address?.city || '',
            state: selectedWarehouse?.address?.state || '',
            pincode: selectedWarehouse?.address?.pincode || '',
            country: selectedWarehouse?.address?.country || 'India'
          },
          warehouseId: selectedWarehouseId,
          warehouseName: selectedWarehouse?.warehouseName || '',
          contactPerson: selectedWarehouse?.contactInfo?.primaryPhone || '',
          contactPhone: selectedWarehouse?.contactInfo?.primaryPhone || '',
          deliveryInstructions: '',
          workingHours: '',
          deliveryType: 'standard'
        },
        items: items.map(item => ({
          itemId: item.itemType === 'existing' ? item.selectedInventoryItemId! : `new-item-${Date.now()}-${Math.random()}`,
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.description,
          specifications: item.specifications,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount: item.discount,
          discountAmount: item.discountAmount,
          taxableAmount: item.taxableAmount,
          taxBreakup: item.taxBreakup,
          totalTaxAmount: item.totalTaxAmount,
          lineTotal: item.lineTotal,
          deliveryDate: item.deliveryDate,
          notes: item.notes
        })),
        amounts: {
          subtotal,
          totalDiscount,
          taxableAmount,
          totalTaxAmount,
          freightCharges,
          packingCharges,
          otherCharges,
          roundingAdjustment: 0,
          grandTotal
        },
        taxDetails: {
          placeOfSupply: selectedWarehouse?.address?.state || 'Maharashtra',
          isReverseCharge: false,
          taxBreakup: [
            { taxType: 'CGST', rate: 9, taxableAmount: taxableAmount / 2, taxAmount: totalTaxAmount / 2 },
            { taxType: 'SGST', rate: 9, taxableAmount: taxableAmount / 2, taxAmount: totalTaxAmount / 2 }
          ],
          totalTaxAmount
        },
        paymentTerms: {
          termType: paymentTermType,
          days: paymentDays,
          advancePercentage
        },
        terms,
        notes,
        specialInstructions: ''
      }

      const result = await createPurchaseOrder(purchaseOrderData).unwrap()
      
      // Handle inventory updates for new items
      for (const item of items) {
        if (item.itemType === 'new') {
          try {
            // Create new inventory item
            const inventoryData = {
              itemName: item.itemName,
              itemCode: item.itemCode,
              category: item.category || 'raw_material',
              itemDescription: item.description || '',
              warehouseId: selectedWarehouseId,
              reorderPoint: 0,
              reorderQuantity: item.quantity,
              stockingMethod: 'fifo' as const,
              initialStockLevel: item.quantity,
              unitOfMeasure: item.unit,
              specifications: {
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
            
            await createInventoryItem(inventoryData).unwrap()
            
            // Create stock movement record
            await createStockMovement({
              companyId: selectedCompanyId,
              itemId: item.itemId,
              warehouseId: selectedWarehouseId,
              movementType: 'inward',
              quantity: item.quantity,
              unit: item.unit,
              referenceDocument: {
                type: 'purchase_order',
                number: poNumber,
                date: poDate
              },
              notes: `Initial stock from PO ${poNumber}`,
              movementDate: poDate
            }).unwrap()
            
          } catch (error) {
            console.error('Failed to create inventory item:', error)
            toast.error(`Failed to create inventory item: ${item.itemName}`)
          }
        } else if (item.itemType === 'existing' && item.selectedInventoryItemId) {
          try {
            // Update existing item stock
            await createStockMovement({
              companyId: selectedCompanyId,
              itemId: item.selectedInventoryItemId,
              warehouseId: selectedWarehouseId,
              movementType: 'inward',
              quantity: item.quantity,
              unit: item.unit,
              referenceDocument: {
                type: 'purchase_order',
                number: poNumber,
                date: poDate
              },
              notes: `Stock addition from PO ${poNumber}`,
              movementDate: poDate
            }).unwrap()
          } catch (error) {
            console.error('Failed to update inventory stock:', error)
            toast.error(`Failed to update stock for: ${item.itemName}`)
          }
        }
      }
      
      toast.success('Purchase Order created successfully!')
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create purchase order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" style={{ 
        position: 'fixed',
        top: '5vh',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxHeight: '90vh'
      }}>
        <DialogHeader>
          <DialogTitle>Create New Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
          {/* Company Selection (Super Admin Only) */}
          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Company Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Select Company *</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      {companies.map((company) => (
                        <SelectItem key={company._id} value={company._id} className="bg-white hover:bg-gray-50">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Purchase Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>PO Number *</Label>
                  <Input
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="PO-2024-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>PO Date *</Label>
                  <Input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected Delivery Date *</Label>
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Financial Year *</Label>
                  <Input
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    placeholder="2024-2025"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>PO Type *</Label>
                  <Select value={poType} onValueChange={(value: any) => setPoType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="standard" className="bg-white hover:bg-gray-50">Standard</SelectItem>
                      <SelectItem value="blanket" className="bg-white hover:bg-gray-50">Blanket</SelectItem>
                      <SelectItem value="contract" className="bg-white hover:bg-gray-50">Contract</SelectItem>
                      <SelectItem value="planned" className="bg-white hover:bg-gray-50">Planned</SelectItem>
                      <SelectItem value="emergency" className="bg-white hover:bg-gray-50">Emergency</SelectItem>
                      <SelectItem value="service" className="bg-white hover:bg-gray-50">Service</SelectItem>
                      <SelectItem value="capital" className="bg-white hover:bg-gray-50">Capital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="low" className="bg-white hover:bg-gray-50">Low</SelectItem>
                      <SelectItem value="medium" className="bg-white hover:bg-gray-50">Medium</SelectItem>
                      <SelectItem value="high" className="bg-white hover:bg-gray-50">High</SelectItem>
                      <SelectItem value="urgent" className="bg-white hover:bg-gray-50">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                    <SelectTrigger className="bg-blue-50 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="raw_material" className="bg-white hover:bg-gray-50">Raw Material</SelectItem>
                      <SelectItem value="finished_goods" className="bg-white hover:bg-gray-50">Finished Goods</SelectItem>
                      <SelectItem value="consumables" className="bg-white hover:bg-gray-50">Consumables</SelectItem>
                      <SelectItem value="services" className="bg-white hover:bg-gray-50">Services</SelectItem>
                      <SelectItem value="capital_goods" className="bg-white hover:bg-gray-50">Capital Goods</SelectItem>
                      <SelectItem value="maintenance" className="bg-white hover:bg-gray-50">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Supplier Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Supplier *</Label>
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                    <SelectTrigger className="bg-green-50 border-green-200 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier._id || ''} value={supplier._id || ''} className="bg-white hover:bg-gray-50">
                          {supplier.supplierName} ({supplier.supplierCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSupplier && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Supplier Code</Label>
                      <p className="text-sm">{selectedSupplier.supplierCode}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contact Person</Label>
                      <p className="text-sm">{selectedSupplier.contactPerson || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-sm">{selectedSupplier.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{selectedSupplier.email || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Warehouse Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Warehouse *</Label>
                  <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a warehouse" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse._id || ''} value={warehouse._id || ''} className="bg-white hover:bg-gray-50">
                          {warehouse.warehouseName} ({warehouse.warehouseCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedWarehouse && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Warehouse Code</Label>
                      <p className="text-sm">{selectedWarehouse.warehouseCode}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Type</Label>
                      <p className="text-sm">{selectedWarehouse.warehouseType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-sm">{selectedWarehouse.contactInfo?.primaryPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{selectedWarehouse.contactInfo?.email || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm">
                        {selectedWarehouse.address?.addressLine1}, {selectedWarehouse.address?.city}, {selectedWarehouse.address?.state} - {selectedWarehouse.address?.pincode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items
                </div>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.itemId} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Item Selection Type */}
                        <div className="space-y-2">
                          <Label>Item Type</Label>
                          <Select 
                            value={item.itemType || 'new'} 
                            onValueChange={(value) => updateItem(index, 'itemType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                              <SelectItem value="new" className="bg-white hover:bg-gray-50">New Item</SelectItem>
                              <SelectItem value="existing" className="bg-white hover:bg-gray-50">Existing Item</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Existing Item Selection */}
                        {item.itemType === 'existing' && (
                          <div className="space-y-2">
                            <Label>Select Existing Item</Label>
                            <Select 
                              value={item.selectedInventoryItemId || ''} 
                              onValueChange={(value) => {
                                const selectedItem = inventoryItems.find(inv => inv._id === value);
                                if (selectedItem) {
                                  updateItem(index, 'selectedInventoryItemId', value);
                                  updateItem(index, 'itemId', value);
                                  updateItem(index, 'itemCode', selectedItem.itemCode);
                                  updateItem(index, 'itemName', selectedItem.itemName);
                                  updateItem(index, 'unit', selectedItem.stock?.unit || 'pcs');
                                  updateItem(index, 'currentStock', selectedItem.stock?.currentStock || 0);
                                  updateItem(index, 'availableStock', selectedItem.stock?.availableStock || 0);
                                  updateItem(index, 'rate', selectedItem.pricing?.costPrice || 0);
                                  updateItem(index, 'hsnCode', '');
                                  updateItem(index, 'specifications', `${selectedItem.specifications?.color || ''} ${selectedItem.specifications?.design || ''}`.trim());
                                }
                              }}
                            >
                              <SelectTrigger className="z-50">
                                <SelectValue placeholder="Select existing item" />
                              </SelectTrigger>
                              <SelectContent className="z-50">
                                {inventoryItems.map((invItem) => (
                                  <SelectItem key={invItem._id} value={invItem._id} className="bg-white hover:bg-gray-50">
                                    {invItem.itemName} ({invItem.itemCode}) - Stock: {invItem.stock?.currentStock || 0} {invItem.stock?.unit || 'pcs'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Item Code *</Label>
                          <Input
                            value={item.itemCode}
                            onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                            placeholder="Item code"
                            required
                            disabled={item.itemType === 'existing'}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Item Name *</Label>
                          <Input
                            value={item.itemName}
                            onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                            placeholder="Item name"
                            required
                            disabled={item.itemType === 'existing'}
                          />
                        </div>

                        {/* Category Selection - Only for new items */}
                        {item.itemType === 'new' && (
                          <div className="space-y-2 col-span-full">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              Category *
                            </Label>
                            <Select 
                              value={item.category || 'raw_material'} 
                              onValueChange={(value) => updateItem(index, 'category', value)}
                            >
                              <SelectTrigger className="bg-purple-50 border-purple-200 focus:border-purple-500 focus:ring-purple-500 w-full h-10">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                                <SelectItem value="raw_material" className="bg-white hover:bg-gray-50">Raw Material</SelectItem>
                                <SelectItem value="finished_goods" className="bg-white hover:bg-gray-50">Finished Goods</SelectItem>
                                <SelectItem value="consumables" className="bg-white hover:bg-gray-50">Consumables</SelectItem>
                                <SelectItem value="services" className="bg-white hover:bg-gray-50">Services</SelectItem>
                                <SelectItem value="capital_goods" className="bg-white hover:bg-gray-50">Capital Goods</SelectItem>
                                <SelectItem value="maintenance" className="bg-white hover:bg-gray-50">Maintenance</SelectItem>
                                <SelectItem value="spare_parts" className="bg-white hover:bg-gray-50">Spare Parts</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>HSN Code</Label>
                          <Input
                            value={item.hsnCode}
                            onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                            placeholder="HSN code"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Specifications</Label>
                          <Input
                            value={item.specifications}
                            onChange={(e) => updateItem(index, 'specifications', e.target.value)}
                            placeholder="Specifications"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Select value={item.unit} onValueChange={(value) => updateItem(index, 'unit', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                              <SelectItem value="pcs" className="bg-white hover:bg-gray-50">Pieces</SelectItem>
                              <SelectItem value="kg" className="bg-white hover:bg-gray-50">Kilograms</SelectItem>
                              <SelectItem value="meters" className="bg-white hover:bg-gray-50">Meters</SelectItem>
                              <SelectItem value="liters" className="bg-white hover:bg-gray-50">Liters</SelectItem>
                              <SelectItem value="boxes" className="bg-white hover:bg-gray-50">Boxes</SelectItem>
                              <SelectItem value="sets" className="bg-white hover:bg-gray-50">Sets</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Stock Information for Existing Items */}
                        {item.itemType === 'existing' && item.currentStock !== undefined && (
                          <div className="col-span-full p-3 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Stock Information</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Current Stock:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {item.currentStock} {item.unit}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Available Stock:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {item.availableStock} {item.unit}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Cost Price:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  ₹{item.rate}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Item Code:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {item.itemCode}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Rate (₹) *</Label>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Discount Type</Label>
                          <Select value={item.discount.type} onValueChange={(value: any) => updateItem(index, 'discount', { ...item.discount, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                              <SelectItem value="percentage" className="bg-white hover:bg-gray-50">Percentage (%)</SelectItem>
                              <SelectItem value="amount" className="bg-white hover:bg-gray-50">Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Discount Value</Label>
                          <Input
                            type="number"
                            value={item.discount.value}
                            onChange={(e) => updateItem(index, 'discount', { ...item.discount, value: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Delivery Date</Label>
                          <Input
                            type="date"
                            value={item.deliveryDate}
                            onChange={(e) => updateItem(index, 'deliveryDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item description..."
                          rows={2}
                        />
                      </div>

                      {/* Item Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Subtotal</Label>
                          <p className="font-medium">{formatCurrency(item.quantity * item.rate)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Discount</Label>
                          <p className="font-medium">{formatCurrency(item.discountAmount)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Tax</Label>
                          <p className="font-medium">{formatCurrency(item.totalTaxAmount)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Total</Label>
                          <p className="font-medium text-blue-600">{formatCurrency(item.lineTotal)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Additional Charges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Freight Charges (₹)</Label>
                  <Input
                    type="number"
                    value={freightCharges}
                    onChange={(e) => setFreightCharges(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Packing Charges (₹)</Label>
                  <Input
                    type="number"
                    value={packingCharges}
                    onChange={(e) => setPackingCharges(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Other Charges (₹)</Label>
                  <Input
                    type="number"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Payment Term</Label>
                  <Select value={paymentTermType} onValueChange={(value: any) => setPaymentTermType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="net" className="bg-white hover:bg-gray-50">Net</SelectItem>
                      <SelectItem value="advance" className="bg-white hover:bg-gray-50">Advance</SelectItem>
                      <SelectItem value="cod" className="bg-white hover:bg-gray-50">Cash on Delivery</SelectItem>
                      <SelectItem value="credit" className="bg-white hover:bg-gray-50">Credit</SelectItem>
                      <SelectItem value="milestone" className="bg-white hover:bg-gray-50">Milestone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Days</Label>
                  <Input
                    type="number"
                    value={paymentDays}
                    onChange={(e) => setPaymentDays(parseInt(e.target.value) || 0)}
                    placeholder="30"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Advance Percentage (%)</Label>
                  <Input
                    type="number"
                    value={advancePercentage}
                    onChange={(e) => setAdvancePercentage(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Payment terms, delivery terms, warranty terms..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or special instructions..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Impact Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">This purchase order will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {items.filter(item => item.itemType === 'new').length > 0 && (
                      <li>Create {items.filter(item => item.itemType === 'new').length} new inventory item(s)</li>
                    )}
                    {items.filter(item => item.itemType === 'existing').length > 0 && (
                      <li>Update stock for {items.filter(item => item.itemType === 'existing').length} existing item(s)</li>
                    )}
                    <li>Record stock movements for all items</li>
                    <li>Update warehouse inventory levels</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Discount:</span>
                  <span className="text-green-600">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>{formatCurrency(taxableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>{formatCurrency(totalTaxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Freight Charges:</span>
                  <span>{formatCurrency(freightCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packing Charges:</span>
                  <span>{formatCurrency(packingCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Charges:</span>
                  <span>{formatCurrency(otherCharges)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Grand Total:</span>
                  <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
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
      </DialogContent>
    </Dialog>
  )
}
