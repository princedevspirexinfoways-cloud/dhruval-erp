'use client'

import { useState } from 'react'
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
    useGetPurchaseOrderByIdQuery,
    useUpdatePurchaseOrderMutation,
    useDeletePurchaseOrderMutation
} from '@/lib/api/purchaseOrdersApi'
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
    ExternalLink,
    Building,
    ShoppingCart
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { OrderDetailsSkeleton } from '@/components/ui/OrderDetailsSkeleton'

export default function PurchaseOrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const user = useSelector(selectCurrentUser)
    const orderId = params.id as string

    const [showEditModal, setShowEditModal] = useState(false)

    // RTK Query hooks
    const {
        data: orderData,
        isLoading,
        error,
        refetch: refetchOrder
    } = useGetPurchaseOrderByIdQuery(orderId)

    // Mutations
    const [updatePurchaseOrder] = useUpdatePurchaseOrderMutation()
    const [deletePurchaseOrder] = useDeletePurchaseOrderMutation()

    const order = orderData?.data

    // Helper functions
    const getSupplierName = () => {
        if (!order) return 'N/A'

        // Prefer explicit supplier name if present
        if (order.supplier && typeof order.supplier === 'object') {
            const supplierName =
                (order.supplier as any).supplierName ||
                (order.supplier as any).name

            if (supplierName) return supplierName
        }

        // Fallback: if no supplier name but agent is present, show agent name
        if ((order as any).agent?.agentName) {
            return (order as any).agent.agentName
        }

        // Last fallback: just country from supplier address if present
        if (
            order.supplier &&
            typeof order.supplier === 'object' &&
            (order.supplier as any).address &&
            (order.supplier as any).address.country
        ) {
            return (order.supplier as any).address.country
        }

        return 'N/A'
    }

    const getSupplierCode = () => {
        if (!order) return 'N/A'

        if (order.supplier && typeof order.supplier === 'object') {
            return (order.supplier as any).supplierCode || order.supplier.supplierCode || 'N/A'
        }

        return 'N/A'
    }

    const getSupplierPhone = () => {
        if (!order) return null

        if (order.supplier && typeof order.supplier === 'object' && order.supplier.contactInfo) {
            return order.supplier.contactInfo.phone || null
        }

        return null
    }

    const getSupplierEmail = () => {
        if (!order) return null

        if (order.supplier && typeof order.supplier === 'object' && order.supplier.contactInfo) {
            return order.supplier.contactInfo.email || null
        }

        return null
    }

    const getSupplierAddress = () => {
        if (!order) return null

        // 1) Supplier address if available (even partial, e.g. only country)
        if (order.supplier && typeof order.supplier === 'object' && 'address' in order.supplier) {
            const addr = (order.supplier as any).address
            if (typeof addr === 'string') return addr

            if (typeof addr === 'object' && addr) {
                const addressParts = [
                    addr.addressLine1,
                    addr.addressLine2,
                    addr.city,
                    addr.state,
                    addr.pincode,
                    addr.country
                ].filter(Boolean)

                if (addressParts.length > 0) return addressParts.join(', ')
            }
        }

        // 2) Fallback to delivery address (from deliveryInfo) if supplier
        //    address is not properly filled
        if ((order as any).deliveryInfo?.deliveryAddress) {
            const addr = (order as any).deliveryInfo.deliveryAddress
            const addressParts = [
                addr.addressLine1,
                addr.addressLine2,
                addr.city,
                addr.state,
                addr.pincode,
                addr.country
            ].filter(Boolean)

            if (addressParts.length > 0) return addressParts.join(', ')
        }

        return null
    }

    const getDeliveryAddress = () => {
        if (!order) return null

        if (order.deliveryAddress) {
            const addr = order.deliveryAddress
            const addressParts = [
                addr.addressLine1,
                addr.addressLine2,
                addr.city,
                addr.state,
                addr.pincode,
                addr.country
            ].filter(Boolean)

            return addressParts.length > 0 ? addressParts.join(', ') : null
        }

        return null
    }

    // Handler functions
    const handleStatusUpdate = async (newStatus: string) => {
        try {
            await updatePurchaseOrder({ orderId, orderData: { status: newStatus } }).unwrap()
            toast.success(`Order status updated to ${newStatus}!`)
            refetchOrder()
        } catch (error) {
            toast.error('Failed to update order status!')
        }
    }

    const handleDeleteOrder = async () => {
        if (confirm('Are you sure you want to delete this purchase order?')) {
            try {
                await deletePurchaseOrder(orderId).unwrap()
                toast.success('Purchase order deleted successfully!')
                router.push('/purchase-orders')
            } catch (error) {
                toast.error('Failed to delete purchase order!')
            }
        }
    }

    const handleCopyOrderId = () => {
        navigator.clipboard.writeText(order?.poNumber || order?.orderNumber || orderId)
        toast.success('PO Number copied to clipboard!')
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
            case 'delivered':
            case 'received':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            case 'confirmed':
            case 'approved':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
            case 'shipped':
                return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            case 'cancelled':
                return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        }
    }

    const getPaymentStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            case 'overdue':
                return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            case 'partial':
                return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
            case 'received':
                return <CheckCircle className="h-4 w-4" />
            case 'pending':
                return <Clock className="h-4 w-4" />
            case 'cancelled':
                return <XCircle className="h-4 w-4" />
            case 'shipped':
                return <Truck className="h-4 w-4" />
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
                            { label: 'Purchase', href: '/purchase' },
                            { label: 'Orders', href: '/purchase-orders' },
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
                    <XCircle className="h-16 w-16 text-red-500 dark:text-red-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Order Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400">The purchase order you're looking for doesn't exist or has been deleted.</p>
                    <Button onClick={() => router.push('/purchase-orders')} variant="outline">
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
                        { label: 'Purchase', href: '/purchase' },
                        { label: 'Orders', href: '/purchase-orders' },
                        { label: `${order?.poNumber || order?.orderNumber || orderId}`, current: true }
                    ]}
                    className="mb-4"
                />

                <DashboardHeader
                    title={`${order.poNumber || order.orderNumber || orderId}`}
                    description={`Purchase order details for ${getSupplierName()}`}
                    icon={<ShoppingCart className="h-6 w-6 text-white" />}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button onClick={() => router.push('/purchase-orders')} variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button onClick={() => setShowEditModal(true)} variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button onClick={() => window.print()} variant="outline" size="sm">
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                            <Button onClick={handleCopyOrderId} variant="outline" size="sm">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy PO Number
                            </Button>
                        </div>
                    }
                />

                <div className="space-y-6">
                    {/* Order Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Order Status */}
                        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Order Status</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusIcon(order.status)}
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                        {order.receivingStatus && (
                                            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                                Receiving: {order.receivingStatus}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                                        <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items Count */}
                        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Items Count</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                                                {order.items?.length || 0}
                                            </span>
                                        </div>
                                        {order.totalReceived !== undefined && order.totalPending !== undefined && (
                                            <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                                                Received: {order.totalReceived} | Pending: {order.totalPending}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                                        <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Amount */}
                        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Amount</p>
                                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                            {formatCurrency((order as any).amounts?.grandTotal || order.totalAmount || 0)}
                                        </p>
                                        {(order as any).amounts?.subtotal && (
                                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                Subtotal: {formatCurrency((order as any).amounts.subtotal)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                                        <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* PO Date */}
                        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">PO Date</p>
                                        <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                                            {formatDate(order.poDate || order.orderDate || order.createdAt)}
                                        </p>
                                        {order.expectedDeliveryDate && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                                Expected: {formatDate(order.expectedDeliveryDate)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-full">
                                        <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Left Column - Order Details */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Supplier / Agent Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="h-5 w-5" />
                                        {(order as any).supplier?.supplierName
                                            ? 'Supplier Information'
                                            : (order as any).agent?.agentName
                                                ? 'Agent Information'
                                                : 'Supplier / Agent Information'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Supplier Details - Show if supplier has name */}
                                        {(order as any).supplier?.supplierName && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier Name</label>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {(order as any).supplier.supplierName}
                                                    </p>
                                                </div>
                                                {(order as any).supplier?.supplierCode && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier Code</label>
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                            {(order as any).supplier.supplierCode}
                                                        </p>
                                                    </div>
                                                )}
                                                {((order as any).supplier?.supplierId) && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier ID</label>
                                                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                                            {typeof (order as any).supplier.supplierId === 'object'
                                                                ? (order as any).supplier.supplierId._id || 'N/A'
                                                                : (order as any).supplier.supplierId || 'N/A'}
                                                        </p>
                                                    </div>
                                                )}
                                                {(order as any).supplier?.gstin && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">GSTIN</label>
                                                        <p className="text-sm text-gray-900 dark:text-gray-100">{(order as any).supplier.gstin}</p>
                                                    </div>
                                                )}
                                                {(order as any).supplier?.pan && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PAN</label>
                                                        <p className="text-sm text-gray-900 dark:text-gray-100">{(order as any).supplier.pan}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Agent Details - Show if agent exists (and supplier doesn't have name) */}
                                        {(order as any).agent?.agentName && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Agent Name</label>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {(order as any).agent.agentName}
                                                    </p>
                                                </div>
                                                {(order as any).agent?.agentId && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Agent ID</label>
                                                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                                            {(order as any).agent.agentId}
                                                        </p>
                                                    </div>
                                                )}
                                                {(order as any).agent?.agentCode && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Agent Code</label>
                                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                                            {(order as any).agent.agentCode}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* PO Details */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PO Number</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">#{order.poNumber || order.orderNumber || 'N/A'}</p>
                                        </div>
                                        {(order as any).financialYear && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Financial Year</label>
                                                <p className="text-sm text-gray-900 dark:text-gray-100">{(order as any).financialYear}</p>
                                            </div>
                                        )}
                                        {(order as any).poType && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PO Type</label>
                                                <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{(order as any).poType.replace('_', ' ')}</p>
                                            </div>
                                        )}
                                        {(order as any).priority && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</label>
                                                <Badge className={clsx(
                                                    (order as any).priority === 'urgent' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                                        (order as any).priority === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                                                            (order as any).priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                                                'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                                )}>
                                                    {(order as any).priority}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Information - Show supplier contact if supplier exists, otherwise show delivery contact */}
                                    {((order as any).supplier?.supplierName && (getSupplierPhone() || getSupplierEmail() || getSupplierAddress())) && (
                                        <div className="border-t dark:border-gray-700 pt-4">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Supplier Contact Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {getSupplierPhone() && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                            <p className="text-gray-900 dark:text-gray-100">{getSupplierPhone()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {getSupplierEmail() && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                            <p className="text-gray-900 dark:text-gray-100">{getSupplierEmail()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {getSupplierAddress() && (
                                                    <div className="md:col-span-2">
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                                                        <div className="flex items-start gap-2 mt-1">
                                                            <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-1" />
                                                            <p className="text-gray-900 dark:text-gray-100">{getSupplierAddress()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivery Address - Show if no supplier address but delivery address exists */}
                                    {!(order as any).supplier?.supplierName && (order as any).deliveryInfo?.deliveryAddress && (
                                        <div className="border-t dark:border-gray-700 pt-4">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Delivery Address</h4>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-1" />
                                                <p className="text-gray-900 dark:text-gray-100">
                                                    {[
                                                        (order as any).deliveryInfo.deliveryAddress.addressLine1,
                                                        (order as any).deliveryInfo.deliveryAddress.addressLine2,
                                                        (order as any).deliveryInfo.deliveryAddress.city,
                                                        (order as any).deliveryInfo.deliveryAddress.state,
                                                        (order as any).deliveryInfo.deliveryAddress.pincode,
                                                        (order as any).deliveryInfo.deliveryAddress.country
                                                    ].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
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
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Item
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Ordered Qty
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Received Qty
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Pending Qty
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Unit Price
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                {order.items && order.items.length > 0 ? (
                                                    order.items.map((item: any, index: number) => {
                                                        const orderedQty = item.quantity || 0
                                                        const receivedQty = item.receivedQuantity || 0
                                                        const pendingQty = item.pendingQuantity || (orderedQty - receivedQty)
                                                        const rejectedQty = item.rejectedQuantity || 0
                                                        const unitPrice = item.rate || item.unitPrice || 0
                                                        const totalPrice = item.lineTotal || (orderedQty * unitPrice)
                                                        const unit = item.unit || 'pcs'
                                                        const discountAmount = item.discountAmount || 0
                                                        const taxAmount = item.totalTaxAmount || 0

                                                        return (
                                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                            {item.itemName || item.name || `Item ${index + 1}`}
                                                                        </div>
                                                                        {item.itemCode && (
                                                                            <div className="text-sm text-gray-500 dark:text-gray-400">Code: {item.itemCode}</div>
                                                                        )}
                                                                        {item.description && (
                                                                            <div className="text-xs text-gray-400 dark:text-gray-500">{item.description}</div>
                                                                        )}
                                                                        {item.specifications && (
                                                                            <div className="text-xs text-gray-400 dark:text-gray-500">Spec: {item.specifications}</div>
                                                                        )}
                                                                        {item.hsnCode && (
                                                                            <div className="text-xs text-gray-400 dark:text-gray-500">HSN: {item.hsnCode}</div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    <div className="font-medium">{orderedQty} {unit}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <div className={receivedQty > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                                                        {receivedQty} {unit}
                                                                    </div>
                                                                    {rejectedQty > 0 && (
                                                                        <div className="text-xs text-red-500 dark:text-red-400">Rejected: {rejectedQty} {unit}</div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <div className={pendingQty > 0 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                                                        {pendingQty} {unit}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    <div>{formatCurrency(unitPrice)}</div>
                                                                    {discountAmount > 0 && (
                                                                        <div className="text-xs text-red-500 dark:text-red-400">-{formatCurrency(discountAmount)}</div>
                                                                    )}
                                                                    {taxAmount > 0 && (
                                                                        <div className="text-xs text-blue-500 dark:text-blue-400">Tax: {formatCurrency(taxAmount)}</div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                                                                    {formatCurrency(totalPrice)}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                            No items found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Summary & Actions */}
                        <div className="space-y-6">
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
                                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {formatCurrency((order as any).amounts?.subtotal || order.subtotal || 0)}
                                        </span>
                                    </div>
                                    {(order as any).amounts?.totalDiscount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                                            <span className="font-medium text-red-600 dark:text-red-400">
                                                -{formatCurrency((order as any).amounts.totalDiscount || order.discountAmount || 0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Taxable Amount:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {formatCurrency((order as any).amounts?.taxableAmount || ((order as any).amounts?.subtotal || order.subtotal || 0) - ((order as any).amounts?.totalDiscount || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {formatCurrency((order as any).taxDetails?.totalTaxAmount || (order as any).amounts?.totalTaxAmount || order.taxAmount || 0)}
                                        </span>
                                    </div>
                                    {(order as any).taxDetails?.taxBreakup && (order as any).taxDetails.taxBreakup.length > 0 && (
                                        <div className="border-t dark:border-gray-700 pt-2 mt-2">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tax Breakdown:</p>
                                            {(order as any).taxDetails.taxBreakup.map((tax: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                    <span>{tax.taxType} ({tax.rate}%):</span>
                                                    <span>{formatCurrency(tax.taxAmount || 0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {(order as any).amounts?.freightCharges > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Freight:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency((order as any).amounts.freightCharges)}
                                            </span>
                                        </div>
                                    )}
                                    {(order as any).amounts?.packingCharges > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Packing:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency((order as any).amounts.packingCharges)}
                                            </span>
                                        </div>
                                    )}
                                    {(order as any).amounts?.otherCharges > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Other Charges:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency((order as any).amounts.otherCharges)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-t dark:border-gray-700 pt-3">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Grand Total:</span>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency((order as any).amounts?.grandTotal || order.totalAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Delivery Information */}
                            {(order.expectedDeliveryDate || (order as any).deliveryInfo || getDeliveryAddress()) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Truck className="h-5 w-5" />
                                            Delivery Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {order.expectedDeliveryDate && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Delivery</label>
                                                <p className="text-gray-900 dark:text-gray-100">{formatDate(order.expectedDeliveryDate)}</p>
                                            </div>
                                        )}
                                        {order.actualDeliveryDate && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Actual Delivery</label>
                                                <p className="text-gray-900 dark:text-gray-100">{formatDate(order.actualDeliveryDate)}</p>
                                            </div>
                                        )}
                                        {(order as any).lastReceivedDate && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Received</label>
                                                <p className="text-gray-900 dark:text-gray-100">{formatDate((order as any).lastReceivedDate)}</p>
                                            </div>
                                        )}
                                        {((order as any).deliveryInfo?.deliveryAddress || getDeliveryAddress()) && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Address</label>
                                                <p className="text-gray-900 dark:text-gray-100">
                                                    {((order as any).deliveryInfo?.deliveryAddress) ?
                                                        [
                                                            (order as any).deliveryInfo.deliveryAddress.addressLine1,
                                                            (order as any).deliveryInfo.deliveryAddress.addressLine2,
                                                            (order as any).deliveryInfo.deliveryAddress.city,
                                                            (order as any).deliveryInfo.deliveryAddress.state,
                                                            (order as any).deliveryInfo.deliveryAddress.pincode,
                                                            (order as any).deliveryInfo.deliveryAddress.country
                                                        ].filter(Boolean).join(', ') :
                                                        getDeliveryAddress()
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {(order as any).deliveryInfo?.warehouseName && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Warehouse</label>
                                                <p className="text-gray-900 dark:text-gray-100">{(order as any).deliveryInfo.warehouseName}</p>
                                            </div>
                                        )}
                                        {(order as any).deliveryInfo?.contactPerson && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Person</label>
                                                <p className="text-gray-900 dark:text-gray-100">{(order as any).deliveryInfo.contactPerson}</p>
                                                {(order as any).deliveryInfo?.contactPhone && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{(order as any).deliveryInfo.contactPhone}</p>
                                                )}
                                            </div>
                                        )}
                                        {((order as any).paymentTerms) && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Terms</label>
                                                <p className="text-gray-900 dark:text-gray-100">
                                                    {((order as any).paymentTerms?.description) ||
                                                        `${((order as any).paymentTerms?.termType || 'net').replace('_', ' ').toUpperCase()}${(order as any).paymentTerms?.days ? ` - ${(order as any).paymentTerms.days} days` : ''}`}
                                                    {(order as any).paymentTerms?.advancePercentage > 0 && (
                                                        <span className="text-sm text-gray-600 dark:text-gray-400"> (Advance: {(order as any).paymentTerms.advancePercentage}%)</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Payment Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Status</label>
                                        <div className="mt-1">
                                            <Badge className={getPaymentStatusColor((order as any).paymentStatus || 'pending')}>
                                                {(order as any).paymentStatus || 'pending'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {(order as any).lastPaymentAmount > 0 && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Payment</label>
                                            <p className="text-gray-900 dark:text-gray-100">{formatCurrency((order as any).lastPaymentAmount)}</p>
                                        </div>
                                    )}
                                    {(order as any).paymentTerms && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Terms</label>
                                            <p className="text-gray-900 dark:text-gray-100 text-sm">
                                                {((order as any).paymentTerms?.description) ||
                                                    `${((order as any).paymentTerms?.termType || 'net').replace('_', ' ').toUpperCase()}${(order as any).paymentTerms?.days ? ` - ${(order as any).paymentTerms.days} days` : ''}`}
                                                {(order as any).paymentTerms?.advancePercentage > 0 && (
                                                    <span className="block text-xs text-gray-600 dark:text-gray-400 mt-1">Advance: {(order as any).paymentTerms.advancePercentage}%</span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        onClick={() => handleStatusUpdate('ordered')}
                                        className="w-full"
                                        variant="outline"
                                        disabled={order.status === 'ordered' || order.status === 'received'}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Mark as Ordered
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusUpdate('received')}
                                        className="w-full"
                                        variant="outline"
                                        disabled={order.status === 'received'}
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        Mark as Received
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusUpdate('approved')}
                                        className="w-full"
                                        variant="outline"
                                        disabled={order.status === 'approved' || order.status === 'received'}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve Order
                                    </Button>
                                    <Button
                                        onClick={handleDeleteOrder}
                                        className="w-full"
                                        variant="destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Order
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Additional Information */}
                            {((order as any).notes || (order as any).terms || (order as any).specialInstructions) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Additional Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {(order as any).notes && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</label>
                                                <p className="text-gray-900 dark:text-gray-100 text-sm">{(order as any).notes}</p>
                                            </div>
                                        )}
                                        {(order as any).terms && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Terms & Conditions</label>
                                                <p className="text-gray-900 dark:text-gray-100 text-sm">{(order as any).terms}</p>
                                            </div>
                                        )}
                                        {(order as any).specialInstructions && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Special Instructions</label>
                                                <p className="text-gray-900 dark:text-gray-100 text-sm">{(order as any).specialInstructions}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </ResponsiveGrid>
        </AppLayout>
    )
}