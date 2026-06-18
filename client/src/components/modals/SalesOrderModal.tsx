'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'

import { useGetCustomersQuery } from '@/lib/api/customersApi'
import { useGetInventoryItemsQuery } from '@/lib/api/inventoryApi'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { useCreateSalesOrderMutation, useUpdateSalesOrderMutation } from '@/lib/api/salesApi'
import toast from 'react-hot-toast'
import { X, Plus, Trash2, Search, ChevronDown, Check, Phone, Mail } from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'

interface SalesOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order?: any
  mode: 'create' | 'edit'
  onSuccess?: (orderData: any) => void
}

// Simple Searchable Dropdown Component
function SearchableDropdown({
  options,
  value,
  onSelect,
  placeholder,
  searchPlaceholder = "Search...",
  displayKey = "name",
  valueKey = "id",
  showDetails = false
}: {
  options: any[]
  value: string
  onSelect: (value: string) => void
  placeholder: string
  searchPlaceholder?: string
  displayKey?: string
  valueKey?: string
  showDetails?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const filteredOptions = options.filter(option => {
    const displayValue = option[displayKey] || ''
    const codeValue = option.customerCode || option.itemCode || ''
    const phoneValue = option.contactInfo?.primaryPhone || ''
    const emailValue = option.contactInfo?.primaryEmail || ''

    const searchLower = searchTerm.toLowerCase()
    return (
      displayValue.toLowerCase().includes(searchLower) ||
      codeValue.toLowerCase().includes(searchLower) ||
      phoneValue.toLowerCase().includes(searchLower) ||
      emailValue.toLowerCase().includes(searchLower)
    )
  })

  const handleSelect = (option: any) => {
    console.log('Option selected:', option)
    console.log('Value being passed:', option[valueKey])
    setSelectedItem(option)
    onSelect(option[valueKey])
    setIsOpen(false)
    setSearchTerm('')
  }

  useEffect(() => {
    if (value && options.length > 0) {
      const found = options.find(option => option[valueKey] === value)
      if (found) setSelectedItem(found)
    }
  }, [value, options, valueKey])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.searchable-dropdown')) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative searchable-dropdown">
      <div
        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
        onClick={() => {
          console.log('Dropdown clicked, current state:', isOpen)
          setIsOpen(!isOpen)
        }}
      >
        <span className={selectedItem ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
          {selectedItem ? selectedItem[displayKey] : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option[valueKey]}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-200"
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{option[displayKey]}</div>
                      {showDetails && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                          {option.customerCode && (
                            <div>Code: {option.customerCode}</div>
                          )}
                          {option.itemCode && (
                            <div>Code: {option.itemCode}</div>
                          )}
                          {option.contactInfo?.primaryPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                              <span>{option.contactInfo.primaryPhone}</span>
                            </div>
                          )}
                          {option.contactInfo?.primaryEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                              <span>{option.contactInfo.primaryEmail}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedItem?.[valueKey] === option[valueKey] && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-2" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SalesOrderModal({ isOpen, onClose, order, mode, onSuccess }: SalesOrderModalProps) {
  const currentUser = useSelector(selectCurrentUser)
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [isAddressAutoPopulated, setIsAddressAutoPopulated] = useState(false)

  // Function to handle delivery address field changes
  const handleDeliveryAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        deliveryAddress: {
          ...prev.delivery.deliveryAddress,
          [field]: value
        }
      }
    }))

    // If user manually edits, mark as not auto-populated
    if (isAddressAutoPopulated) {
      setIsAddressAutoPopulated(false)
    }
  }
  const [formData, setFormData] = useState({
    customerId: '',
    orderItems: [{
      itemId: '',
      itemName: '',
      quantity: 1,
      rate: 0, // Changed from unitPrice to rate to match backend
      category: '',
      stockInfo: null as any,
      productType: 'saree', // Added required productType
      materialSource: 'own_stock', // Added material source
      workAmount: 0 // Added work/processing amount
    }],
    orderSummary: {
      subtotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      finalAmount: 0
    },
    payment: {
      paymentTerms: '',
      paymentMethod: 'bank_transfer', // Changed default to match backend
      creditDays: 0,
      advancePercentage: 0,
      advanceAmount: 0
    },
    delivery: {
      deliveryType: 'delivery',
      expectedDeliveryDate: '',
      deliveryInstructions: '',
      deliveryAddress: { // Added delivery address structure
        contactPerson: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        landmark: ''
      }
    },
    priority: 'medium',
    status: 'draft',
    specialInstructions: '',
    orderType: 'local',
    orderSource: 'direct'
  })

  // Debug logging for dropdown values
  console.log('Form Data:', {
    paymentMethod: formData.payment.paymentMethod,
    deliveryType: formData.delivery.deliveryType,
    priority: formData.priority,
    status: formData.status
  })

  const [createSalesOrder] = useCreateSalesOrderMutation()
  const [updateSalesOrder] = useUpdateSalesOrderMutation()

  // Get companies for superadmin
  const { data: companiesData } = useGetAllCompaniesQuery()

  const companies = companiesData?.data || []

  // Check if user is superadmin (has access to multiple companies)
  const isSuperAdmin = companies.length > 1

  // Set company ID for non-superadmin users
  useEffect(() => {
    if (!isSuperAdmin && currentUser?.companyId) {
      setSelectedCompanyId(currentUser.companyId)
    }
  }, [isSuperAdmin, currentUser?.companyId])

  // Get customers based on selected company (or all if not superadmin)
  const { data: customersData } = useGetCustomersQuery(
    isSuperAdmin ? { companyId: selectedCompanyId } : {},
    { skip: isSuperAdmin && !selectedCompanyId }
  )

  // Get inventory items based on selected company (or all if not superadmin)
  const { data: inventoryData } = useGetInventoryItemsQuery(
    isSuperAdmin ? { companyId: selectedCompanyId } : {},
    { skip: isSuperAdmin && !selectedCompanyId }
  )

  const customers = customersData?.data || []
  const inventoryItems = inventoryData?.data?.data || []

  // Debug logging for data
  console.log('Companies:', companies)
  console.log('Customers:', customers)
  console.log('Inventory Items:', inventoryItems)
  console.log('Selected Company ID:', selectedCompanyId)

  useEffect(() => {
    if (order && mode === 'edit') {
      setFormData({
        customerId: order.customerId || '',
        orderItems: order.orderItems?.map((item: any) => ({
          itemId: item.productId || item.itemId || '',
          itemName: item.itemName || '',
          quantity: item.quantity || 1,
          rate: item.rate || item.unitPrice || 0,
          category: item.category || '',
          stockInfo: null as any,
          productType: item.productType || 'saree',
          materialSource: item.materialSource || 'own_stock',
          workAmount: item.workAmount || 0
        })) || [{
          itemId: '',
          itemName: '',
          quantity: 1,
          rate: 0,
          category: '',
          stockInfo: null as any,
          productType: 'saree',
          materialSource: 'own_stock',
          workAmount: 0
        }],
        orderSummary: order.orderSummary || {
          subtotal: 0,
          totalTax: 0,
          totalDiscount: 0,
          finalAmount: 0
        },
        payment: order.payment || {
          paymentTerms: '',
          paymentMethod: 'bank_transfer',
          creditDays: 0,
          advancePercentage: 0,
          advanceAmount: 0
        },
        delivery: order.delivery || {
          deliveryType: 'delivery',
          expectedDeliveryDate: '',
          deliveryInstructions: '',
          deliveryAddress: {
            contactPerson: '',
            phone: '',
            email: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
            landmark: ''
          }
        },
        priority: order.priority || 'medium',
        status: order.status || 'draft',
        specialInstructions: order.specialInstructions || '',
        orderType: order.orderType || 'local',
        orderSource: order.orderSource || 'direct'
      })

      // Set company ID for edit mode
      if (order.companyId) {
        setSelectedCompanyId(order.companyId)
      }
    }
  }, [order, mode])

  const calculateTotals = () => {
    const subtotal = formData.orderItems.reduce((sum, item) => sum + (item.quantity * item.rate) + (item.workAmount || 0), 0)
    const tax = subtotal * 0.18 // 18% GST
    const discount = 0 // Can be made configurable
    const finalAmount = subtotal + tax - discount

    setFormData(prev => ({
      ...prev,
      orderSummary: {
        subtotal,
        totalTax: tax,
        totalDiscount: discount,
        finalAmount
      }
    }))
  }

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, {
        itemId: '',
        itemName: '',
        quantity: 1,
        rate: 0, // Changed from unitPrice to rate
        category: '',
        stockInfo: null as any,
        productType: 'saree',
        materialSource: 'own_stock',
        workAmount: 0
      }]
    }))
  }

  const removeOrderItem = (index: number) => {
    if (formData.orderItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        orderItems: prev.orderItems.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOrderItem = (index: number, field: string, value: any) => {
    console.log('updateOrderItem called:', { index, field, value })

    setFormData(prev => ({
      ...prev,
      orderItems: prev.orderItems.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }

          // If itemId is selected, auto-fill item details
          if (field === 'itemId' && value) {
            console.log('Item ID selected:', value)
            const selectedItem = inventoryItems.find(invItem => invItem._id === value)
            console.log('Selected item:', selectedItem)
            if (selectedItem) {
              updatedItem.itemName = selectedItem.itemName
              updatedItem.rate = selectedItem.pricing.sellingPrice || 0 // Changed from unitPrice to rate
              updatedItem.category = selectedItem.category.primary || ''

              // Add stock information
              const availableStock = selectedItem.stock?.availableStock || 0
              const currentStock = selectedItem.stock?.currentStock || 0
              const reservedStock = selectedItem.stock?.reservedStock || 0

              updatedItem.stockInfo = {
                available: availableStock,
                current: currentStock,
                reserved: reservedStock,
                unit: selectedItem.stock?.unit || 'pcs'
              }

              console.log('Updated item with details:', updatedItem)
            }
          }

          return updatedItem
        }
        return item
      })
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSuperAdmin && !selectedCompanyId) {
      toast.error('Please select a company')
      return
    }

    if (!formData.customerId) {
      toast.error('Please select a customer')
      return
    }

    // Check stock availability (only for own stock items)
    const insufficientStockItems = formData.orderItems.filter(item =>
      item.materialSource === 'own_stock' &&
      item.stockInfo &&
      item.stockInfo.available < item.quantity
    )

    // Show warning for insufficient stock but allow order creation
    if (insufficientStockItems.length > 0) {
      const errorMessage = insufficientStockItems.map(item =>
        `${item.itemName}: Requested ${item.quantity}, Available ${item.stockInfo?.available}`
      ).join('; ')

      const shouldContinue = window.confirm(
        `Warning: Insufficient stock for some items:\n${errorMessage}\n\nDo you want to create the order anyway? You can arrange stock later or change material source to client-provided.`
      )

      if (!shouldContinue) {
        return
      }

      toast.error('Order created with insufficient stock items. Please arrange stock or update material source.')
    }

    try {
      // Create data that matches the backend API requirements
      const backendOrderData = {
        companyId: selectedCompanyId || currentUser?.companyId,
        customerId: formData.customerId,
        orderSource: formData.orderSource,
        orderType: formData.orderType,
        orderNumber: `SO-${Date.now()}`,

        orderItems: formData.orderItems.map(item => ({
          productId: item.itemId, // Send the selected item's _id as productId
          itemName: item.itemName,
          quantity: item.quantity,
          rate: item.rate, // Backend expects 'rate'
          unit: 'pieces',
          productType: item.productType || 'saree', // Required field
          category: item.category,
          materialSource: item.materialSource || 'own_stock', // Include material source
          workAmount: item.workAmount || 0 // Include work amount
        })),
        orderSummary: formData.orderSummary,
        payment: formData.payment,
        delivery: {
          ...formData.delivery,
          expectedDeliveryDate: formData.delivery.expectedDeliveryDate ? new Date(formData.delivery.expectedDeliveryDate) : new Date()
        },
        priority: formData.priority,
        status: formData.status,
        specialInstructions: formData.specialInstructions
      }

      // Use the backend data structure for API calls
      const orderData = backendOrderData as any

      // Debug: Log the order data being sent
      console.log('Sending order data:', {
        orderItems: orderData.orderItems.map((item: any) => ({
          productId: item.productId,
          itemName: item.itemName,
          quantity: item.quantity
        }))
      })

      if (onSuccess) {
        await onSuccess(orderData)
      } else {
        // Fallback to internal API calls if no onSuccess callback provided
        if (mode === 'create') {
          await createSalesOrder(orderData).unwrap()
          toast.success('Sales order created successfully!')
        } else {
          await updateSalesOrder({ id: order._id, data: orderData }).unwrap()
          toast.success('Sales order updated successfully!')
        }
      }

      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save sales order')
    }
  }

  useEffect(() => {
    calculateTotals()
  }, [formData.orderItems])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 bg-gradient-to-br from-white via-blue-50/30 to-indigo-100/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white via-blue-50/50 to-indigo-100/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 mb-6 transition-all duration-300">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-lg animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-gradient-to-tr from-purple-400/10 to-pink-500/10 rounded-full blur-lg animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-xl blur-md opacity-75 group-hover/icon:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover/icon:scale-110 transition-transform duration-300">
                  <svg className="h-6 w-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent transition-all duration-300">
                  {mode === 'create' ? 'Create New Sales Order' : 'Edit Sales Order'}
                </h2>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
                  {mode === 'create' ? 'Fill in the details to create a new sales order' : 'Update the sales order information'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="relative group/btn overflow-hidden border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 p-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-gray-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <X className="h-5 w-5 relative z-10" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Material Source Information */}
          {/* <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6 transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Enhanced Material Source Management</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  For each order item, you can now specify the material source:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li><strong>Own Stock:</strong> Deducts from your inventory (default)</li>
                  <li><strong>Client Provided:</strong> No stock deduction - client supplies material</li>
                  <li><strong>Job Work:</strong> Material provided by job work partner</li>
                  <li><strong>Purchase Required:</strong> Material needs to be purchased</li>
                </ul>
              </div>
            </div>
          </div> */}

          {/* Company Selection (for superadmin) */}
          {isSuperAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Selection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Choose the company for this order</p>
                </div>
              </div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Company *
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
              >
                <option value="">Select a company...</option>
                {companies.map((company: any) => (
                  <option key={company._id} value={company._id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Order Type and Source */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Configuration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Set the order type and source</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Order Type *
                </label>
                <select
                  value={formData.orderType || 'local'}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                >
                  <option value="local">Local</option>
                  <option value="export">Export</option>
                  <option value="custom">Custom</option>
                  <option value="sample">Sample</option>
                  <option value="bulk">Bulk</option>
                  <option value="repeat">Repeat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Order Source *
                </label>
                <select
                  value={formData.orderSource || 'direct'}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderSource: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                >
                  <option value="direct">Direct</option>
                  <option value="meesho">Meesho</option>
                  <option value="indiamart">IndiaMART</option>
                  <option value="website">Website</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="exhibition">Exhibition</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Selection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Choose the customer for this order</p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Customer *
            </label>
            <SearchableDropdown
              options={customers.map(customer => ({
                ...customer,
                displayName: (customer as any).customerName || (customer as any).name || (customer as any).companyName || customer.customerCode
              }))}
              value={formData.customerId}
              onSelect={(value) => {
                console.log('Customer selected:', value)
                // Find the selected customer
                const selectedCustomer = customers?.find(customer => customer._id === value) || null

                if (selectedCustomer) {
                  // Auto-populate delivery address with customer's primary address
                  const primaryAddress = selectedCustomer.addresses?.find(addr => addr.isPrimary) || selectedCustomer.addresses?.[0]
                  const primaryContact = selectedCustomer.contactPersons?.find(cp => cp.isPrimary) || selectedCustomer.contactPersons?.[0]

                  // Ensure we have safe access to customer properties
                  const customerName = selectedCustomer.customerName || ''
                  const contactInfo = selectedCustomer.contactInfo || {}

                  setFormData(prev => ({
                    ...prev,
                    customerId: value,
                    delivery: {
                      ...prev.delivery,
                      deliveryAddress: {
                        contactPerson: primaryContact?.name || customerName || '',
                        phone: primaryContact?.phone || contactInfo.primaryPhone || '',
                        email: primaryContact?.email || contactInfo.primaryEmail || '',
                        addressLine1: primaryAddress?.addressLine1 || '',
                        addressLine2: primaryAddress?.addressLine2 || '',
                        city: primaryAddress?.city || '',
                        state: primaryAddress?.state || '',
                        pincode: primaryAddress?.pincode || '',
                        country: primaryAddress?.country || 'India',
                        landmark: primaryAddress?.landmark || ''
                      }
                    }
                  }))

                  // Set flag to indicate address was auto-populated
                  setIsAddressAutoPopulated(true)

                  console.log('Auto-populated delivery address:', {
                    customer: selectedCustomer.customerName,
                    address: primaryAddress,
                    contact: primaryContact
                  })
                } else {
                  setFormData(prev => ({ ...prev, customerId: value }))
                  setIsAddressAutoPopulated(false)
                }
              }}
              placeholder="Select a customer..."
              searchPlaceholder="Search customers by name or code..."
              displayKey="displayName"
              valueKey="_id"
              showDetails={true}
            />
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Items</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Add products to this order</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOrderItem}
                className="relative group/btn overflow-hidden border-2 border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </div>
              </Button>
            </div>

            <div className="space-y-6">
              {formData.orderItems.map((item, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-700/50 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Item {index + 1}</h4>
                    </div>
                    {formData.orderItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOrderItem(index)}
                        className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Item Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Item *
                      </label>
                      <SearchableDropdown
                        options={inventoryItems.map(item => ({
                          ...item,
                          displayName: `${item.itemName} (${item.itemCode})`
                        }))}
                        value={item.itemId}
                        onSelect={(value) => updateOrderItem(index, 'itemId', value)}
                        placeholder="Select an item..."
                        searchPlaceholder="Search items by name or code..."
                        displayKey="displayName"
                        valueKey="_id"
                        showDetails={true}
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Rate */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Rate (₹)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateOrderItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Work Amount */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Work Amount (₹)
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Optional)</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.workAmount || 0}
                        onChange={(e) => updateOrderItem(index, 'workAmount', parseFloat(e.target.value) || 0)}
                        placeholder="Processing/work charges"
                        className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Item Name
                      </label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateOrderItem(index, 'itemName', e.target.value)}
                        placeholder="Item name"
                        className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Category
                      </label>
                      <Input
                        value={item.category}
                        onChange={(e) => updateOrderItem(index, 'category', e.target.value)}
                        placeholder="Category"
                        className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Product Type
                      </label>
                      <select
                        value={item.productType}
                        onChange={(e) => updateOrderItem(index, 'productType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                      >
                        <option value="saree">Saree</option>
                        <option value="african_cotton">African Cotton</option>
                        <option value="garment_fabric">Garment Fabric</option>
                        <option value="digital_print">Digital Print</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {/* Material Source */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Material Source *
                      </label>
                      <select
                        value={item.materialSource || 'own_stock'}
                        onChange={(e) => updateOrderItem(index, 'materialSource', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                      >
                        <option value="own_stock">Own Stock</option>
                        <option value="client_provided">Client Provided</option>
                        <option value="job_work">Job Work</option>
                        <option value="purchase_required">Purchase Required</option>
                      </select>
                    </div>
                  </div>

                  {/* Material Source Information */}
                  {item.materialSource === 'client_provided' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-green-200 dark:border-green-700 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h5 className="text-sm font-semibold text-green-900 dark:text-green-100">Client Provided Material</h5>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        This item will use material provided by the client. No stock will be deducted from inventory.
                      </p>
                    </div>
                  )}

                  {item.materialSource === 'purchase_required' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <svg className="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <h5 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Purchase Required</h5>
                      </div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Material needs to be purchased for this item. Create a purchase order before production.
                      </p>
                    </div>
                  )}

                  {/* Stock Information - Only show for own stock items */}
                  {item.stockInfo && item.materialSource === 'own_stock' && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Information</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Available</div>
                          <div className={`text-lg font-bold ${item.stockInfo.available >= item.quantity ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {item.stockInfo.available} {item.stockInfo.unit}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {item.stockInfo.current} {item.stockInfo.unit}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reserved</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {item.stockInfo.reserved} {item.stockInfo.unit}
                          </div>
                        </div>
                      </div>
                      {item.stockInfo.available < item.quantity && (
                        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                              Insufficient stock! Requested: {item.quantity}, Available: {item.stockInfo.available}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Review the order totals</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Subtotal</div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{formData.orderSummary.subtotal.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tax (18%)</div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{formData.orderSummary.totalTax.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Discount</div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{formData.orderSummary.totalDiscount.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 shadow-lg">
                <div className="text-xs font-medium text-blue-100 uppercase tracking-wide mb-2">Total</div>
                <p className="text-2xl font-bold text-white">₹{formData.orderSummary.finalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Configure payment method and terms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Method</label>
                <select
                  value={formData.payment.paymentMethod}
                  onChange={(e) => {
                    console.log('Payment method changed to:', e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      payment: { ...prev.payment, paymentMethod: e.target.value }
                    }))
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                  onClick={() => console.log('Payment method dropdown clicked')}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Terms</label>
                <Input
                  value={formData.payment.paymentTerms}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    payment: { ...prev.payment, paymentTerms: e.target.value }
                  }))}
                  placeholder="e.g., Net 30 days"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Set delivery type and expected date</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Delivery Type</label>
                <select
                  value={formData.delivery.deliveryType}
                  onChange={(e) => {
                    console.log('Delivery type changed to:', e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      delivery: { ...prev.delivery, deliveryType: e.target.value }
                    }))
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                  onClick={() => console.log('Delivery type dropdown clicked')}
                >
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="courier">Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Expected Delivery Date</label>
                <Input
                  type="date"
                  value={formData.delivery.expectedDeliveryDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    delivery: { ...prev.delivery, expectedDeliveryDate: e.target.value }
                  }))}
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <svg className="h-5 w-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Address</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Enter the delivery address details</p>
                </div>
              </div>
              {formData.customerId && (
                <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border ${isAddressAutoPopulated
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                  : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                  }`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    {isAddressAutoPopulated
                      ? 'Auto-populated from customer • Editable'
                      : 'Manually entered • Editable'
                    }
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Contact Person</label>
                <Input
                  value={formData.delivery.deliveryAddress.contactPerson}
                  onChange={(e) => handleDeliveryAddressChange('contactPerson', e.target.value)}
                  placeholder="Contact person name"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Phone</label>
                <Input
                  value={formData.delivery.deliveryAddress.phone}
                  onChange={(e) => handleDeliveryAddressChange('phone', e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Email</label>
                <Input
                  type="email"
                  value={formData.delivery.deliveryAddress.email}
                  onChange={(e) => handleDeliveryAddressChange('email', e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Country</label>
                <Input
                  value={formData.delivery.deliveryAddress.country}
                  onChange={(e) => handleDeliveryAddressChange('country', e.target.value)}
                  placeholder="Country"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Address Line 1</label>
                <Input
                  value={formData.delivery.deliveryAddress.addressLine1}
                  onChange={(e) => handleDeliveryAddressChange('addressLine1', e.target.value)}
                  placeholder="Street address"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Address Line 2</label>
                <Input
                  value={formData.delivery.deliveryAddress.addressLine2}
                  onChange={(e) => handleDeliveryAddressChange('addressLine2', e.target.value)}
                  placeholder="Apartment, suite, etc."
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">City</label>
                <Input
                  value={formData.delivery.deliveryAddress.city}
                  onChange={(e) => handleDeliveryAddressChange('city', e.target.value)}
                  placeholder="City"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">State</label>
                <Input
                  value={formData.delivery.deliveryAddress.state}
                  onChange={(e) => handleDeliveryAddressChange('state', e.target.value)}
                  placeholder="State"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Pincode</label>
                <Input
                  value={formData.delivery.deliveryAddress.pincode}
                  onChange={(e) => handleDeliveryAddressChange('pincode', e.target.value)}
                  placeholder="Pincode"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Landmark</label>
                <Input
                  value={formData.delivery.deliveryAddress.landmark}
                  onChange={(e) => handleDeliveryAddressChange('landmark', e.target.value)}
                  placeholder="Nearby landmark"
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <svg className="h-5 w-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Instructions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Add any special delivery instructions</p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Instructions</label>
            <Textarea
              value={formData.delivery.deliveryInstructions}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                delivery: { ...prev.delivery, deliveryInstructions: e.target.value }
              }))}
              placeholder="Any special delivery instructions..."
              rows={3}
              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          {/* Priority and Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Priority & Status</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Set priority level and current status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => {
                    console.log('Priority changed to:', e.target.value)
                    setFormData(prev => ({ ...prev, priority: e.target.value }))
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                  onClick={() => console.log('Priority dropdown clicked')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="rush">Rush</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    console.log('Status changed to:', e.target.value)
                    setFormData(prev => ({ ...prev, status: e.target.value }))
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all duration-200"
                  onClick={() => console.log('Status dropdown clicked')}
                >
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_production">In Production</option>
                  <option value="ready_to_dispatch">Ready to Dispatch</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <svg className="h-5 w-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Special Instructions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Add any special notes or instructions</p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Instructions</label>
            <Textarea
              value={formData.specialInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
              placeholder="Any special instructions or notes..."
              rows={3}
              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="relative group/btn overflow-hidden border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-gray-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Cancel</span>
              </Button>
              <Button
                type="submit"
                className="relative group/btn overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 px-8 py-3 text-lg font-bold rounded-xl transform hover:scale-105 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">
                  {mode === 'create' ? 'Create Order' : 'Update Order'}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
