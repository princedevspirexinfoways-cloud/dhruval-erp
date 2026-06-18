'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CustomerSelector } from './CustomerSelector'
import { SalesOrderSelector } from './SalesOrderSelector'
import { ImageUploader } from './ImageUploader'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { useGetWarehousesQuery } from '@/lib/api/warehousesApi'
import { useGetCustomersQuery } from '@/lib/api/customersApi'
import { useGetSalesOrdersQuery } from '@/lib/api/salesApi'
import { useCreateDispatchMutation, useGetUploadUrlMutation, useUploadToS3Mutation } from '@/lib/api/enhancedDispatchApi'
import { useUpdateSalesOrderMutation } from '@/lib/api/salesApi'
import { CreateDispatchRequest, Dispatch } from '@/lib/api/enhancedDispatchApi'
import { Customer } from '@/lib/api/customersApi'
import { SalesOrder } from '@/lib/api/salesApi'
import toast from 'react-hot-toast'
import { compressImage, validateImageFile } from '@/utils/imageCompression'

interface DispatchCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (dispatch: Dispatch) => void
  userCompanyId?: string
  user?: any
  prefilledData?: any
}

export const DispatchCreateModal = ({
  isOpen,
  onClose,
  onSuccess,
  userCompanyId,
  user,
  prefilledData
}: DispatchCreateModalProps) => {
  // Auto-generate dispatch number
  const generateDispatchNumber = () => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)
    return `DISP-${year}${month}${day}-${timestamp}`
  }

  const [formData, setFormData] = useState<CreateDispatchRequest>({
    companyId: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    dispatchType: 'pickup',
    priority: 'medium',
                    sourceWarehouseId: '',
                customerOrderId: '',
                vehicleNumber: '',
    deliveryPersonName: '',
    deliveryPersonNumber: '',
    status: 'pending',
    notes: ''
  })

  // Image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [fileName: string]: 'uploading' | 'success' | 'error' }>({})

  // RTK Query hooks
  const { data: companies = [] } = useGetAllCompaniesQuery()
  const { data: warehousesData } = useGetWarehousesQuery({ 
    companyId: formData.companyId || userCompanyId,
    limit: 100 
  })
  const warehouses = warehousesData?.data || []
  
  const { data: customersData } = useGetCustomersQuery({ 
    companyId: formData.companyId || userCompanyId,
    limit: 100 
  })
  const customers = customersData?.data || []
  
  const { data: salesOrdersData } = useGetSalesOrdersQuery({ 
    status: 'pending',
    limit: 100 
  })
  const salesOrders = salesOrdersData?.data?.orders || []
  
  // Filter sales orders for selected company
  const filteredSalesOrders = salesOrders.filter(order => {
    // For now, we'll show all pending orders since companyId is not available in SalesOrder
    // In a real implementation, you'd need to add companyId to the SalesOrder interface
    return order.status === 'pending' || order.status === 'confirmed'
  })

  // Mutations
  const [createDispatch, { isLoading: creating }] = useCreateDispatchMutation()
  const [getUploadUrl] = useGetUploadUrlMutation()
  const [uploadToS3] = useUploadToS3Mutation()
  const [updateSalesOrder] = useUpdateSalesOrderMutation()

  // State for selected sales order
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState<string>('')
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<any>(null)
  const [salesOrderSearch, setSalesOrderSearch] = useState<string>('')
  const [searchedSalesOrder, setSearchedSalesOrder] = useState<any>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialFormData = {
        ...formData,
        dispatchDate: new Date().toISOString().split('T')[0],
        dispatchType: 'pickup', // Auto-select pickup
        priority: 'medium' as const, // Auto-select medium priority
        status: 'pending' as const // Auto-select pending status
      }

      // If we have prefilled data from sales order, use it
      if (prefilledData) {
        // Auto-select company from sales order
        initialFormData.companyId = prefilledData.companyId || userCompanyId || ''
        
        // Ensure customerOrderId is a string
        const customerOrderId = typeof prefilledData.customerOrderId === 'string' 
          ? prefilledData.customerOrderId 
          : prefilledData.customerOrderId?._id || prefilledData.customerOrderId?.id || ''
        
        initialFormData.customerOrderId = customerOrderId
        
        // Set selected customer order ID for auto-updating
        setSelectedSalesOrderId(customerOrderId)
        
        // Set selected sales order object for stats display
        if (prefilledData) {
          setSelectedSalesOrder({
            orderNumber: prefilledData.orderNumber,
            customerName: prefilledData.customerName,
            orderSummary: {
              finalAmount: prefilledData.orderAmount
            }
          })
        }
        
        console.log('Prefilled data:', {
          companyId: initialFormData.companyId,
          customerOrderId: customerOrderId,
          prefilledData: prefilledData
        })
      }

      setFormData(initialFormData)
      setSelectedImages([])
      setImagePreviews([])
      setUploadProgress({})
      setUploadStatus({})
    }
  }, [isOpen, prefilledData, userCompanyId])

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setSelectedImages(prev => [...prev, ...validFiles])

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index)
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index])
      return newPreviews
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return []

    const uploadedKeys: string[] = []

    for (const file of selectedImages) {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }))

        // Validate file
        if (!validateImageFile(file)) {
          throw new Error('Invalid file type or size too large')
        }

        // Compress image before upload
        const compressedFile = await compressImage(file, 1200, 0.8)
        
        // Get presigned URL
        const response = await getUploadUrl({
          fileName: compressedFile.name,
          contentType: compressedFile.type,
          fileType: 'dispatch-photos',
        }).unwrap()

        // Use the upload URL directly from the response
        const actualUploadUrl = response.uploadUrl
        const publicUrl = response.publicUrl
        const key = response.key

        if (!actualUploadUrl) {
          throw new Error('No upload URL received')
        }

        // Upload to S3
        await uploadToS3({
          uploadUrl: actualUploadUrl,
          file: compressedFile,
          onProgress: (progress: number) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
          },
        }).unwrap()

        uploadedKeys.push(publicUrl)
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }))
        toast.success(`${file.name} uploaded successfully`)
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }))
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return uploadedKeys
  }

  const handleSalesOrderSelect = (salesOrder: SalesOrder, customer: Customer) => {
                    setFormData({
                  ...formData,
                  customerOrderId: salesOrder._id
                })
                setSelectedSalesOrderId(salesOrder._id)
                setSelectedSalesOrder(salesOrder)
  }

  const handleSearchSalesOrder = async () => {
    if (!salesOrderSearch.trim()) return
    
    try {
      // Find the sales order by ID in the existing data
      const foundOrder = salesOrders.find(order => order._id === salesOrderSearch.trim())
      if (foundOrder) {
        setSearchedSalesOrder(foundOrder)
      } else {
        toast.error('Sales order not found')
        setSearchedSalesOrder(null)
      }
    } catch (error) {
      toast.error('Failed to search sales order')
      setSearchedSalesOrder(null)
    }
  }

  const handleSelectSearchedOrder = (salesOrder: SalesOrder) => {
    const orderCustomer = customers.find(c => c._id === salesOrder.customerId)
    if (orderCustomer) {
      handleSalesOrderSelect(salesOrder, orderCustomer)
      setSearchedSalesOrder(null)
      setSalesOrderSearch('')
      toast.success(`Selected sales order #${salesOrder.orderNumber}`)
    } else {
      toast.error('Customer not found for this sales order')
    }
  }

  const handleCreate = async () => {
    try {
      // Upload images first
      const uploadedKeys = await uploadImages()
      
      // Create dispatch with simplified data structure
                        const dispatchData = {
                    companyId: formData.companyId,
                    dispatchDate: formData.dispatchDate,
                    dispatchType: formData.dispatchType,
                    status: formData.status,
                    priority: formData.priority,
                    sourceWarehouseId: formData.sourceWarehouseId,
                    customerOrderId: formData.customerOrderId,
                    vehicleNumber: formData.vehicleNumber,
                    deliveryPersonName: formData.deliveryPersonName,
                    deliveryPersonNumber: formData.deliveryPersonNumber,
                    documents: {
                      photos: uploadedKeys
                    },
                    notes: formData.notes
                  }

      const result = await createDispatch(dispatchData).unwrap()
      
      // Update sales order status if a sales order was selected
      if (selectedSalesOrderId && typeof selectedSalesOrderId === 'string' && selectedSalesOrderId.trim() !== '') {
        try {
          console.log('Updating sales order with ID:', selectedSalesOrderId)
          await updateSalesOrder({
            id: selectedSalesOrderId,
            data: {
              status: 'dispatched'
            }
          }).unwrap()
          
          // Success message will be handled by the parent component
        } catch (salesError) {
          console.error('Failed to update sales order:', salesError)
          toast.error('Dispatch created but failed to update sales order')
        }
      } else {
        console.log('No valid sales order ID to update:', selectedSalesOrderId)
        // Success message will be handled by the parent component
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to create dispatch:', error)
      toast.error('Failed to create dispatch')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Dispatch"
      size="xl"
    >
      <div className="max-h-[90vh] overflow-y-auto space-y-6">
        {/* Stats Cards Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Number</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {prefilledData?.orderNumber || selectedSalesOrder?.orderNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {prefilledData?.customerName || selectedSalesOrder?.customerName || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Amount</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{prefilledData?.orderAmount || selectedSalesOrder?.orderSummary?.finalAmount || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dispatch Number</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {generateDispatchNumber()}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Basic Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dispatch Date *</label>
              <Input
                type="date"
                value={formData.dispatchDate}
                onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Dispatch['status'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="delivered">📦 Delivered</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dispatch Type *</label>
              <select
                value={formData.dispatchType}
                onChange={(e) => setFormData({ ...formData, dispatchType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pickup">📦 Pickup</option>
                <option value="delivery">🚚 Delivery</option>
                <option value="transfer">🔄 Transfer</option>
                <option value="return">↩️ Return</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Dispatch['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
              <select
                value={formData.companyId}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    companyId: e.target.value,
                    sourceWarehouseId: ''
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select company</option>
                {(Array.isArray(companies)
                  ? companies
                  : companies?.data || []
                ).map((company: any) => (
                  <option key={company._id} value={company._id}>
                    🏢 {company.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sales Order Selection - Only show if not using prefilled data */}
        {!prefilledData && (
          <div className="space-y-4">
            {/* Sales Order Search by ID */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🔍 Search Sales Order by ID
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Sales Order ID (e.g., 507f1f77bcf86cd799439011)"
                  value={salesOrderSearch}
                  onChange={(e) => setSalesOrderSearch(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearchSalesOrder}
                  disabled={!salesOrderSearch.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Search
                </Button>
              </div>
              {searchedSalesOrder && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Found Sales Order:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Order:</span>
                      <span className="ml-1 font-medium">#{searchedSalesOrder.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-1 font-medium">{searchedSalesOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-1 font-medium">₹{searchedSalesOrder.orderSummary?.finalAmount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-1 font-medium">{searchedSalesOrder.status}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleSelectSearchedOrder(searchedSalesOrder)}
                    className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    Use This Order
                  </Button>
                </div>
              )}
            </div>

            {/* Regular Sales Order Selector */}
            <SalesOrderSelector
              salesOrders={salesOrders}
              customers={customers}
              onSalesOrderSelect={handleSalesOrderSelect}
            />
          </div>
        )}

        {/* Source Warehouse Selection */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏭 Source Warehouse</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Source Warehouse *</label>
            <select
              value={formData.sourceWarehouseId}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  sourceWarehouseId: e.target.value
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={!formData.companyId}
            >
              <option value="">
                {!formData.companyId ? 'Select company first' : 'Select warehouse'}
              </option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  🏭 {warehouse.warehouseName} - {warehouse.warehouseCode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🚚 Delivery Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Number</label>
              <Input
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="Enter vehicle number"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Person Name</label>
              <Input
                value={formData.deliveryPersonName}
                onChange={(e) => setFormData({ ...formData, deliveryPersonName: e.target.value })}
                placeholder="Enter delivery person name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Person Number</label>
              <Input
                value={formData.deliveryPersonNumber}
                onChange={(e) => setFormData({ ...formData, deliveryPersonNumber: e.target.value })}
                placeholder="Enter delivery person number"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Customer Information from Sales Order */}
        {prefilledData && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 Customer Information (from Sales Order)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                <Input
                  value={prefilledData.customerName}
                  className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Code</label>
                <Input
                  value={prefilledData.customerCode}
                  className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales Order Number</label>
                <Input
                  value={`#${prefilledData.orderNumber}`}
                  className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Amount</label>
                <Input
                  value={`₹${prefilledData.orderAmount}`}
                  className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Upload */}
        <ImageUploader
          selectedImages={selectedImages}
          imagePreviews={imagePreviews}
          uploadProgress={uploadProgress}
          uploadStatus={uploadStatus}
          onImageSelect={handleImageSelect}
          onRemoveImage={removeSelectedImage}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={creating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
          >
            {creating ? 'Creating...' : 'Create Dispatch'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
