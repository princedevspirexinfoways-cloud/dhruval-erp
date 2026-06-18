'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveGrid } from '@/components/ui/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
    useGetSalesOrderQuery,
    useUpdateSalesOrderMutation,
    useUpdatePaymentStatusMutation,
    useDeleteSalesOrderMutation
} from '@/lib/api/salesApi'
import {
    ArrowLeft,
    Edit,
    Trash2,
    Download,
    Printer,
    Share2,
    Calendar,
    User,
    Package,
    CreditCard,
    Truck,
    FileText,
    Phone,
    Mail,
    MapPin,
    Clock,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Eye,
    Copy,
    ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import SalesOrderModal from '@/components/modals/SalesOrderModal'
import { DispatchCreateModal } from '@/components/dispatch/DispatchCreateModal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { OrderDetailsSkeleton } from '@/components/ui/OrderDetailsSkeleton'

export default function SalesOrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const user = useSelector(selectCurrentUser)
    const orderId = params.id as string

    const [showEditModal, setShowEditModal] = useState(false)
    const [showDispatchModal, setShowDispatchModal] = useState(false)

    // RTK Query hooks
    const {
        data: orderData,
        isLoading,
        error,
        refetch: refetchOrder
    } = useGetSalesOrderQuery(orderId)

    // Mutations
    const [updateSalesOrder] = useUpdateSalesOrderMutation()
    const [updatePaymentStatus] = useUpdatePaymentStatusMutation()
    const [deleteSalesOrder] = useDeleteSalesOrderMutation()

    const order = orderData?.data

    // Helper function to safely extract customer information
    const getCustomerName = () => {
        if (!order) return 'N/A'

        // Check if customerId is an object with customerName
        if (order.customerId && typeof order.customerId === 'object' && 'customerName' in order.customerId) {
            return (order.customerId as any).customerName || 'N/A'
        }

        // Fallback to direct customerName field
        if (typeof order.customerName === 'string') return order.customerName
        if (order.customerName && typeof order.customerName === 'object' && 'customerName' in order.customerName) {
            return (order.customerName as any).customerName || 'N/A'
        }

        return 'N/A'
    }

    const getCustomerCode = () => {
        if (!order) return 'N/A'

        // Check if customerId is an object with customerCode
        if (order.customerId && typeof order.customerId === 'object' && 'customerCode' in order.customerId) {
            return (order.customerId as any).customerCode || 'N/A'
        }

        // Fallback to direct customerCode field
        if (typeof order.customerCode === 'string') return order.customerCode
        if (order.customerCode && typeof order.customerCode === 'object' && 'customerCode' in order.customerCode) {
            return (order.customerCode as any).customerCode || 'N/A'
        }

        return 'N/A'
    }

    const getCustomerId = () => {
        if (!order) return 'N/A'

        // Check if customerId is an object with _id
        if (order.customerId && typeof order.customerId === 'object' && '_id' in order.customerId) {
            return (order.customerId as any)._id || 'N/A'
        }

        // Fallback to direct customerId field
        if (typeof order.customerId === 'string') return order.customerId

        return 'N/A'
    }

    const getCustomerPhone = () => {
        if (!order) return null

        // Check delivery address first
        if (order.delivery?.deliveryAddress?.phone) return order.delivery.deliveryAddress.phone

        // Check customer details
        if (order.customerDetails?.phone) return order.customerDetails.phone

        // Check direct fields
        if (typeof order.customerPhone === 'string') return order.customerPhone
        if (order.customerPhone && typeof order.customerPhone === 'object' && 'phone' in order.customerPhone) {
            return (order.customerPhone as any).phone || null
        }

        return null
    }

    const getCustomerEmail = () => {
        if (!order) return null

        // Check delivery address first
        if (order.delivery?.deliveryAddress?.email) return order.delivery.deliveryAddress.email

        // Check customer details
        if (order.customerDetails?.email) return order.customerDetails.email

        // Check direct fields
        if (typeof order.customerEmail === 'string') return order.customerEmail
        if (order.customerEmail && typeof order.customerEmail === 'object' && 'email' in order.customerEmail) {
            return (order.customerEmail as any).email || null
        }

        return null
    }

    const getCustomerAddress = () => {
        if (!order) return null

        // Check delivery address first
        if (order.delivery?.deliveryAddress) {
            const addr = order.delivery.deliveryAddress
            const addressParts = [
                addr.addressLine1,
                addr.addressLine2,
                addr.city,
                addr.state,
                addr.pincode,
                addr.country
            ].filter(Boolean)

            if (addressParts.length > 0) {
                return addressParts.join(', ')
            }
        }

        // Check customer details
        if (order.customerDetails?.address) return order.customerDetails.address

        // Check direct fields
        if (typeof order.customerAddress === 'string') return order.customerAddress
        if (order.customerAddress && typeof order.customerAddress === 'object' && 'address' in order.customerAddress) {
            return (order.customerAddress as any).address || null
        }

        return null
    }

    // Handler functions
    const handleStatusUpdate = async (newStatus: string) => {
        try {
            await updateSalesOrder({ id: orderId, data: { status: newStatus } }).unwrap()
            toast.success(`Order status updated to ${newStatus}!`)
            refetchOrder()
        } catch (error) {
            toast.error('Failed to update order status!')
        }
    }

    const handlePaymentStatusUpdate = async (paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial') => {
        try {
            await updatePaymentStatus({ id: orderId, paymentStatus }).unwrap()
            toast.success('Payment status updated!')
            refetchOrder()
        } catch (error) {
            toast.error('Failed to update payment status!')
        }
    }

    const handleUpdateOrder = async (orderData: any) => {
        try {
            const orderWithCompany = {
                ...orderData,
                companyId: user?.companyId || user?.companyAccess?.[0]?.companyId
            }
            await updateSalesOrder({ id: orderId, data: orderWithCompany }).unwrap()
            toast.success('Sales order updated successfully!')
            setShowEditModal(false)
            refetchOrder()
        } catch (error) {
            toast.error('Failed to update sales order!')
        }
    }

    const handleDeleteOrder = async () => {
        if (confirm('Are you sure you want to delete this order?')) {
            try {
                await deleteSalesOrder(orderId).unwrap()
                toast.success('Sales order deleted successfully!')
                router.push('/sales/orders')
            } catch (error) {
                toast.error('Failed to delete sales order!')
            }
        }
    }

    const handleCreateDispatch = () => {
        setShowDispatchModal(true)
    }

    const handleDispatchSuccess = (dispatch: any) => {
        setShowDispatchModal(false)
        refetchOrder()
        toast.success(`Dispatch ${dispatch.dispatchNumber} created successfully!`)
    }

    const handleCopyOrderId = () => {
        navigator.clipboard.writeText(order?.orderNumber || orderId)
        toast.success('Order ID copied to clipboard!')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'confirmed':
                return 'bg-blue-100 text-blue-800'
            case 'dispatched':
                return 'bg-indigo-100 text-indigo-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getPaymentStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'overdue':
                return 'bg-red-100 text-red-800'
            case 'partial':
                return 'bg-orange-100 text-orange-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return <CheckCircle className="h-4 w-4" />
            case 'pending':
                return <Clock className="h-4 w-4" />
            case 'cancelled':
                return <XCircle className="h-4 w-4" />
            default:
                return <AlertTriangle className="h-4 w-4" />
        }
    }

    if (isLoading) {
        return (
            <AppLayout>
                <ResponsiveGrid>
                    <Breadcrumb
                        items={[
                            { label: 'Sales', href: '/sales' },
                            { label: 'Orders', href: '/sales/orders' },
                            { label: 'Loading...', current: true }
                        ]}
                        className="mb-4"
                    />
                    <OrderDetailsSkeleton />
                </ResponsiveGrid>
            </AppLayout>
        )
    }

    if (error || !order) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <XCircle className="h-16 w-16 text-red-500" />
                    <h2 className="text-xl font-semibold text-gray-900">Order Not Found</h2>
                    <p className="text-gray-600">The sales order you're looking for doesn't exist or has been deleted.</p>
                    <Button onClick={() => router.push('/sales/orders')} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <ResponsiveGrid>
                <Breadcrumb
                    items={[
                        { label: 'Sales', href: '/sales' },
                        { label: 'Orders', href: '/sales/orders' },
                        { label: `Order #${order?.orderNumber || orderId}`, current: true }
                    ]}
                    className="mb-4"
                />

                <DashboardHeader
                    title={`Order #${order.orderNumber}`}
                    description={`Sales order details for ${getCustomerName()}`}
                    icon={<FileText className="h-6 w-6 text-white" />}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button onClick={() => router.push('/sales/orders')} variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button onClick={() => setShowEditModal(true)} variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                                <Button onClick={handleCreateDispatch} variant="default" size="sm">
                                    <Truck className="h-4 w-4 mr-2" />
                                    Create Dispatch
                                </Button>
                            )}
                            <Button onClick={() => window.print()} variant="outline" size="sm">
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    }
                />

                <div className="space-y-6">
                    {/* Order Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Order Status */}
                        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">Order Status</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusIcon(order.status)}
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-200 rounded-full">
                                        <Package className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Status */}
                        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600">Payment Status</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <CreditCard className="h-4 w-4" />
                                            <Badge className={getPaymentStatusColor(order.payment?.paymentStatus)}>
                                                {order.payment?.paymentStatus || 'pending'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-200 rounded-full">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Amount */}
                        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600">Total Amount</p>
                                        <p className="text-2xl font-bold text-purple-900">
                                            {formatCurrency(order.orderSummary?.finalAmount || 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-200 rounded-full">
                                        <DollarSign className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Date */}
                        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-orange-600">Order Date</p>
                                        <p className="text-sm font-bold text-orange-900">
                                            {formatDate(order.orderDate || order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-200 rounded-full">
                                        <Calendar className="h-6 w-6 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Left Column - Order Details */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Customer Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Customer Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Customer Name</label>
                                            <p className="text-lg font-semibold text-gray-900">{getCustomerName()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Customer Code</label>
                                            <p className="text-lg font-semibold text-gray-900">{getCustomerCode()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Customer ID</label>
                                            <p className="text-sm text-gray-900 font-mono">{getCustomerId()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Order Number</label>
                                            <p className="text-sm text-gray-900 font-mono">#{order.orderNumber}</p>
                                        </div>
                                    </div>

                                    {/* Customer Contact Information */}
                                    {(getCustomerPhone() || getCustomerEmail() || getCustomerAddress() || order.delivery?.deliveryAddress?.contactPerson) && (
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {order.delivery?.deliveryAddress?.contactPerson && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Contact Person</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <User className="h-4 w-4 text-gray-400" />
                                                            <p className="text-gray-900">{order.delivery.deliveryAddress.contactPerson}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {getCustomerPhone() && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Phone className="h-4 w-4 text-gray-400" />
                                                            <p className="text-gray-900">{getCustomerPhone()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {getCustomerEmail() && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Mail className="h-4 w-4 text-gray-400" />
                                                            <p className="text-gray-900">{getCustomerEmail()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {getCustomerAddress() && (
                                                    <div className="md:col-span-2">
                                                        <label className="text-sm font-medium text-gray-600">Address</label>
                                                        <div className="flex items-start gap-2 mt-1">
                                                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                                                            <p className="text-gray-900">{getCustomerAddress()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Debug Information - Show all available data */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div className="border-t pt-4">
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                                    Debug: Show all order data
                                                </summary>
                                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                                                    {JSON.stringify(order, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Order Items */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Item
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Quantity
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Unit Price
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {order.orderItems && order.orderItems.length > 0 ? (
                                                    order.orderItems.map((item: any, index: number) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {item.itemName || item.name || `Item ${index + 1}`}
                                                                    </div>
                                                                    {item.category && (
                                                                        <div className="text-sm text-gray-500">{item.category}</div>
                                                                    )}
                                                                    {item.description && (
                                                                        <div className="text-xs text-gray-400">{item.description}</div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {item.quantity || 0}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatCurrency(item.rate || item.unitPrice || item.price || 0)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {formatCurrency(item.totalAmount || ((item.quantity || 0) * (item.rate || item.unitPrice || item.price || 0)))}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Package className="h-8 w-8 text-gray-300" />
                                                                <p>No items found in this order</p>
                                                                <p className="text-xs">Items may not be loaded or this order has no items</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Delivery Information */}
                            {order.delivery && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Truck className="h-5 w-5" />
                                            Delivery Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Delivery Type</label>
                                                <p className="text-gray-900">{order.delivery.deliveryType}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Expected Delivery</label>
                                                <p className="text-gray-900">
                                                    {order.delivery.expectedDeliveryDate
                                                        ? formatDate(order.delivery.expectedDeliveryDate)
                                                        : 'Not specified'
                                                    }
                                                </p>
                                            </div>
                                            {order.delivery.deliveryInstructions && (
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-medium text-gray-600">Delivery Instructions</label>
                                                    <p className="text-gray-900">{order.delivery.deliveryInstructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column - Actions & Summary */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-600">Update Status</label>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            disabled={order.status === 'completed' || order.status === 'cancelled'}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="dispatched">Dispatched</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-600">Payment Status</label>
                                        <select
                                            value={order.payment?.paymentStatus || 'pending'}
                                            onChange={(e) => handlePaymentStatusUpdate(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="partial">Partial</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 space-y-2">
                                        <Button
                                            onClick={handleCopyOrderId}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy Order ID
                                        </Button>

                                        <Button
                                            onClick={() => refetchOrder()}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Refresh
                                        </Button>

                                        <Button
                                            onClick={handleDeleteOrder}
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-red-600 border-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Order
                                        </Button>
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
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">
                                            {formatCurrency(order.orderSummary?.subtotal || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-medium">
                                            {formatCurrency(order.orderSummary?.totalTax || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="font-medium text-green-600">
                                            -{formatCurrency(order.orderSummary?.totalDiscount || 0)}
                                        </span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-semibold">Total</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                {formatCurrency(order.orderSummary?.finalAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Details */}
                            {order.payment && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Payment Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Status</span>
                                            <Badge className={getPaymentStatusColor(order.payment.paymentStatus)}>
                                                {order.payment.paymentStatus || 'pending'}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Amount</span>
                                            <span className="font-medium">
                                                {formatCurrency(order.orderSummary?.finalAmount || order.payment.totalAmount || 0)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Advance Received</span>
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(order.payment.advanceReceived || order.payment.advanceAmount || 0)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Balance Amount</span>
                                            <span className="font-medium text-orange-600">
                                                {formatCurrency(order.payment.balanceAmount || 0)}
                                            </span>
                                        </div>

                                        {order.payment.paymentMethod && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Method</span>
                                                <span className="font-medium">{order.payment.paymentMethod}</span>
                                            </div>
                                        )}

                                        {order.payment.paymentTerms && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Terms</span>
                                                <span className="font-medium">{order.payment.paymentTerms}</span>
                                            </div>
                                        )}

                                        {order.payment.creditDays && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Credit Days</span>
                                                <span className="font-medium">{order.payment.creditDays} days</span>
                                            </div>
                                        )}

                                        {order.payment.dueDate && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Due Date</span>
                                                <span className="font-medium">
                                                    {formatDate(order.payment.dueDate)}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Order Timeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Order Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium">Order Created</p>
                                            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                        </div>
                                    </div>
                                    {order.updatedAt !== order.createdAt && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <div>
                                                <p className="text-sm font-medium">Last Updated</p>
                                                <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                {showEditModal && (
                    <SalesOrderModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        order={order}
                        mode="edit"
                        onSuccess={handleUpdateOrder}
                    />
                )}

                {showDispatchModal && (
                    <DispatchCreateModal
                        isOpen={showDispatchModal}
                        onClose={() => setShowDispatchModal(false)}
                        onSuccess={handleDispatchSuccess}
                        userCompanyId={user?.companyAccess?.[0]?.companyId}
                        user={user}
                        prefilledData={order ? {
                            customerOrderId: order._id,
                            companyId: order.companyId || user?.companyAccess?.[0]?.companyId,
                            customerId: order.customerId,
                            customerName: getCustomerName(),
                            customerCode: getCustomerCode(),
                            orderNumber: order.orderNumber,
                            orderAmount: order.orderSummary?.finalAmount || 0,
                            dispatchDate: new Date().toISOString().split('T')[0],
                            status: 'pending',
                            priority: 'normal',
                            dispatchType: 'delivery'
                        } : undefined}
                    />
                )}
            </ResponsiveGrid>
        </AppLayout>
    )
}