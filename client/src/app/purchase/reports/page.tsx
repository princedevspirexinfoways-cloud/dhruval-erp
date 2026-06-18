'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    FileText,
    Download,
    Filter,
    Calendar,
    Search,
    RefreshCw,
    TrendingUp,
    Package,
    Building2,
    ShoppingCart,
    BarChart3,
    X,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
    useGetVendorWiseSummaryQuery,
    useGetItemWiseReportQuery,
    useGetCategoryWiseReportQuery,
    useGetDateRangeReportQuery,
    useExportReportMutation,
    type ReportFilters,
    type VendorWisePurchaseSummary,
    type ItemWisePurchaseReport,
    type CategoryWisePurchaseReport,
    type DateRangeReport
} from '@/lib/api/purchaseReportsApi'
import { useGetSuppliersQuery } from '@/lib/api/suppliersApi'
import { useGetAgentsQuery } from '@/lib/api/agentsApi'
import toast from 'react-hot-toast'

type ReportType = 'vendor-wise' | 'item-wise' | 'category-wise' | 'date-range'

export default function PurchaseReportsPage() {
    const user = useSelector(selectCurrentUser)
    const isSuperAdmin = useSelector(selectIsSuperAdmin)

    // State management
    const [activeTab, setActiveTab] = useState<ReportType>('vendor-wise')
    const [showFilters, setShowFilters] = useState(false)

    // Get companyId from user - handle both string and object formats
    const getCompanyId = (): string | undefined => {
        if (!user) return undefined
        const companyId: any = user?.companyAccess?.[0]?.companyId || user?.companyId
        if (!companyId) return undefined
        // Convert to string if it's an object
        if (typeof companyId === 'string') return companyId
        if (companyId?._id) return String(companyId._id)
        if (companyId?.id) return String(companyId.id)
        if (typeof companyId?.toString === 'function') return companyId.toString()
        return undefined
    }

    const [filters, setFilters] = useState<ReportFilters>({
        companyId: getCompanyId(),
        vendorId: undefined,
        itemId: undefined,
        category: undefined,
        dateFrom: undefined,
        dateTo: undefined
    })

    // Update filters when user data is loaded
    useEffect(() => {
        const companyIdStr = getCompanyId()
        if (companyIdStr && companyIdStr !== filters.companyId) {
            console.log('PurchaseReports: Updating companyId in filters', companyIdStr)
            setFilters(prev => ({
                ...prev,
                companyId: companyIdStr
            }))
        } else if (!filters.companyId && companyIdStr) {
            // Set initial companyId if not set
            console.log('PurchaseReports: Setting initial companyId', companyIdStr)
            setFilters(prev => ({
                ...prev,
                companyId: companyIdStr
            }))
        }
    }, [user, filters.companyId])

    // Get vendors (suppliers + agents)
    const { data: suppliersData } = useGetSuppliersQuery({
        page: 1,
        limit: 1000,
        status: 'active'
    })

    const { data: agentsData } = useGetAgentsQuery({
        page: 1,
        limit: 1000,
        status: 'all'
    })

    const suppliers = suppliersData?.data?.data || []
    const agents = agentsData?.data?.data || []

    // Combine suppliers and agents as vendors
    const vendors = useMemo(() => {
        const supplierVendors = suppliers.map((s: any) => ({
            id: s._id || s.id,
            name: s.supplierName || s.firmName || 'Unknown Supplier',
            type: 'supplier' as const,
            contactPerson: s.contactPerson || s.contactPersonName,
            contactNumber: s.contactNumber || s.phone,
            email: s.email,
            gstin: s.gstin || s.gstNumber
        }))

        const agentVendors = agents.map((a: any) => ({
            id: a._id || a.id,
            name: a.agentName || 'Unknown Agent',
            type: 'agent' as const,
            contactPerson: a.contactPerson || a.agentName,
            contactNumber: a.contactNumber || a.phone,
            email: a.email,
            gstin: undefined
        }))

        return [...supplierVendors, ...agentVendors]
    }, [suppliers, agents])

    // Update filters when user data is loaded
    useEffect(() => {
        const companyIdStr = getCompanyId()
        if (companyIdStr && companyIdStr !== filters.companyId) {
            console.log('PurchaseReports: Updating companyId in filters', companyIdStr)
            setFilters(prev => ({
                ...prev,
                companyId: companyIdStr
            }))
        } else if (!filters.companyId && companyIdStr) {
            // Set initial companyId if not set
            console.log('PurchaseReports: Setting initial companyId', companyIdStr)
            setFilters(prev => ({
                ...prev,
                companyId: companyIdStr
            }))
        }
    }, [user])

    // API queries
    const {
        data: vendorWiseData,
        isLoading: vendorWiseLoading,
        error: vendorWiseError,
        refetch: refetchVendorWise
    } = useGetVendorWiseSummaryQuery(filters, {
        skip: activeTab !== 'vendor-wise' || !filters.companyId
    })

    const {
        data: itemWiseData,
        isLoading: itemWiseLoading,
        error: itemWiseError,
        refetch: refetchItemWise
    } = useGetItemWiseReportQuery(filters, {
        skip: activeTab !== 'item-wise' || !filters.companyId
    })

    const {
        data: categoryWiseData,
        isLoading: categoryWiseLoading,
        error: categoryWiseError,
        refetch: refetchCategoryWise
    } = useGetCategoryWiseReportQuery(filters, {
        skip: activeTab !== 'category-wise' || !filters.companyId
    })

    const {
        data: dateRangeData,
        isLoading: dateRangeLoading,
        error: dateRangeError,
        refetch: refetchDateRange
    } = useGetDateRangeReportQuery(filters, {
        skip: activeTab !== 'date-range' || !filters.companyId || !filters.dateFrom || !filters.dateTo
    })

    const [exportReport, { isLoading: exportLoading }] = useExportReportMutation()

    // Debug: Log filter state and API call status
    useEffect(() => {
        console.log('PurchaseReports: Current filters', filters)
        console.log('PurchaseReports: Active tab', activeTab)
        console.log('PurchaseReports: User', user)
        console.log('PurchaseReports: CompanyId from user', getCompanyId())
        console.log('PurchaseReports: Should skip vendor-wise?', activeTab !== 'vendor-wise' || !filters.companyId)
        console.log('PurchaseReports: Vendor-wise loading?', vendorWiseLoading)
        console.log('PurchaseReports: Vendor-wise error?', vendorWiseError)
        console.log('PurchaseReports: Vendor-wise data?', vendorWiseData)
    }, [filters, activeTab, user, vendorWiseLoading, vendorWiseError, vendorWiseData])

    // Loading and error states
    const isLoading =
        (activeTab === 'vendor-wise' && vendorWiseLoading) ||
        (activeTab === 'item-wise' && itemWiseLoading) ||
        (activeTab === 'category-wise' && categoryWiseLoading) ||
        (activeTab === 'date-range' && dateRangeLoading)

    const error =
        (activeTab === 'vendor-wise' && vendorWiseError) ||
        (activeTab === 'item-wise' && itemWiseError) ||
        (activeTab === 'category-wise' && categoryWiseError) ||
        (activeTab === 'date-range' && dateRangeError)

    // Handle filter changes
    const handleFilterChange = (key: keyof ReportFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }))
    }

    const handleClearFilters = () => {
        setFilters({
            companyId: user?.companyAccess?.[0]?.companyId || user?.companyId,
            vendorId: undefined,
            itemId: undefined,
            category: undefined,
            dateFrom: undefined,
            dateTo: undefined
        })
    }

    // Handle export
    const handleExport = async (format: 'xlsx' | 'pdf' | 'csv') => {
        try {
            const blob = await exportReport({
                reportType: activeTab,
                format: format as 'xlsx' | 'pdf' | 'csv',
                filters
            }).unwrap()

            // Create download link from blob
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            // Generate filename
            const date = new Date().toISOString().split('T')[0]
            const extension = format === 'xlsx' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf'
            const fileName = `${activeTab}-purchase-report-${date}.${extension}`

            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(`Report exported successfully as ${format.toUpperCase()}`)
        } catch (err: any) {
            console.error('Export error:', err)
            toast.error(err?.data?.message || `Failed to export report as ${format.toUpperCase()}`)
        }
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Format date
    const formatDate = (dateString: string | Date) => {
        if (!dateString) return 'N/A'
        try {
            const date = typeof dateString === 'string' ? new Date(dateString) : dateString
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        } catch {
            return 'N/A'
        }
    }

    // Get report data
    const vendorWiseReport: VendorWisePurchaseSummary[] = vendorWiseData?.data || []
    const itemWiseReport: ItemWisePurchaseReport[] = itemWiseData?.data || []
    const categoryWiseReport: CategoryWisePurchaseReport[] = categoryWiseData?.data || []
    const dateRangeReport: DateRangeReport | null = dateRangeData?.data || null

    return (
        <AppLayout>
            <ResponsiveContainer className="space-y-6">
                {/* Header */}
                <DashboardHeader
                    title="Purchase Reports"
                    description="Generate and export comprehensive purchase reports with vendor, item, category, and date range analysis"
                    icon={<FileText className="h-6 w-6 text-white" />}
                    actions={
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowFilters(!showFilters)}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 dark:border-gray-600"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {showFilters ? 'Hide' : 'Show'} Filters
                            </Button>
                            <Button
                                onClick={() => {
                                    if (activeTab === 'vendor-wise') refetchVendorWise()
                                    else if (activeTab === 'item-wise') refetchItemWise()
                                    else if (activeTab === 'category-wise') refetchCategoryWise()
                                    else if (activeTab === 'date-range') refetchDateRange()
                                }}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 dark:border-gray-600"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button
                                onClick={() => handleExport('xlsx')}
                                disabled={isLoading || exportLoading}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </Button>
                            <Button
                                onClick={() => handleExport('csv')}
                                disabled={isLoading || exportLoading}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button
                                onClick={() => handleExport('pdf')}
                                disabled={isLoading || exportLoading}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>
                    }
                />

                {/* Filters */}
                {showFilters && (
                    <Card className="border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                                <Button
                                    onClick={handleClearFilters}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Vendor Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Vendor (Supplier/Agent)
                                    </label>
                                    <Select
                                        value={filters.vendorId || 'all'}
                                        onValueChange={(value) => handleFilterChange('vendorId', value === 'all' ? undefined : value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Vendor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Vendors</SelectItem>
                                            {vendors.map((vendor) => (
                                                <SelectItem key={vendor.id} value={vendor.id}>
                                                    {vendor.name} ({vendor.type === 'supplier' ? 'Supplier' : 'Agent'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Category
                                    </label>
                                    <Select
                                        value={filters.category || 'all'}
                                        onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="raw_material">Raw Material</SelectItem>
                                            <SelectItem value="finished_goods">Finished Goods</SelectItem>
                                            <SelectItem value="consumables">Consumables</SelectItem>
                                            <SelectItem value="services">Services</SelectItem>
                                            <SelectItem value="capital_goods">Capital Goods</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date From */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        From Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.dateFrom || ''}
                                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                        placeholder="Select From Date"
                                        className="w-full"
                                    />
                                </div>

                                {/* Date To */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        To Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.dateTo || ''}
                                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                        placeholder="Select To Date"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error Display */}
                {error && (
                    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                <p>Error loading report: {(error as any)?.data?.message || 'Unknown error'}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Reports Tabs */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="vendor-wise">
                            <Building2 className="h-4 w-4 mr-2" />
                            Vendor-wise
                        </TabsTrigger>
                        <TabsTrigger value="item-wise">
                            <Package className="h-4 w-4 mr-2" />
                            Item-wise
                        </TabsTrigger>
                        <TabsTrigger value="category-wise">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Category-wise
                        </TabsTrigger>
                        <TabsTrigger value="date-range">
                            <Calendar className="h-4 w-4 mr-2" />
                            Date Range
                        </TabsTrigger>
                    </TabsList>

                    {/* Vendor-wise Report */}
                    <TabsContent value="vendor-wise" className="space-y-4">
                        {isLoading ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <LoadingSpinner />
                                </CardContent>
                            </Card>
                        ) : vendorWiseReport.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8 text-gray-500">
                                        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>No vendor-wise purchase data found for the selected filters.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {vendorWiseReport.map((vendor) => (
                                    <Card key={vendor.vendorId} className="border-gray-200 dark:border-gray-700">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{vendor.vendorName}</CardTitle>
                                                    <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                        {vendor.contactPerson && (
                                                            <span>Contact: {vendor.contactPerson}</span>
                                                        )}
                                                        {vendor.contactNumber && (
                                                            <span>Phone: {vendor.contactNumber}</span>
                                                        )}
                                                        {vendor.email && (
                                                            <span>Email: {vendor.email}</span>
                                                        )}
                                                        {vendor.gstin && (
                                                            <span>GSTIN: {vendor.gstin}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                                                        {formatCurrency(vendor.totalPurchases)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {vendor.totalOrders} Orders
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</div>
                                                    <div className="text-xl font-semibold">{vendor.totalQuantity.toLocaleString()}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Order Value</div>
                                                    <div className="text-xl font-semibold">{formatCurrency(vendor.averageOrderValue)}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Items Purchased</div>
                                                    <div className="text-xl font-semibold">{vendor.items.length}</div>
                                                </div>
                                            </div>
                                            {vendor.items.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="font-semibold mb-2">Items</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">Item Name</th>
                                                                    <th className="px-4 py-2 text-left">Code</th>
                                                                    <th className="px-4 py-2 text-left">Category</th>
                                                                    <th className="px-4 py-2 text-right">Quantity</th>
                                                                    <th className="px-4 py-2 text-right">Total Amount</th>
                                                                    <th className="px-4 py-2 text-right">Avg Rate</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {vendor.items.map((item, idx) => (
                                                                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                                                        <td className="px-4 py-2">{item.itemName}</td>
                                                                        <td className="px-4 py-2">{item.itemCode}</td>
                                                                        <td className="px-4 py-2">{item.category || 'N/A'}</td>
                                                                        <td className="px-4 py-2 text-right">{item.totalQuantity.toLocaleString()}</td>
                                                                        <td className="px-4 py-2 text-right">{formatCurrency(item.totalAmount)}</td>
                                                                        <td className="px-4 py-2 text-right">{formatCurrency(item.averageRate)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Item-wise Report */}
                    <TabsContent value="item-wise" className="space-y-4">
                        {isLoading ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <LoadingSpinner />
                                </CardContent>
                            </Card>
                        ) : itemWiseReport.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8 text-gray-500">
                                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>No item-wise purchase data found for the selected filters.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {itemWiseReport.map((item) => (
                                    <Card key={item.itemId} className="border-gray-200 dark:border-gray-700">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{item.itemName}</CardTitle>
                                                    <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <span>Code: {item.itemCode}</span>
                                                        {item.category && <span>Category: {item.category}</span>}
                                                        {item.subcategory && <span>Subcategory: {item.subcategory}</span>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                                                        {formatCurrency(item.totalAmount)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.totalQuantity.toLocaleString()} Units
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Purchase Count</div>
                                                    <div className="text-xl font-semibold">{item.purchaseCount}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Rate</div>
                                                    <div className="text-xl font-semibold">{formatCurrency(item.averageRate)}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Min Rate</div>
                                                    <div className="text-xl font-semibold">{formatCurrency(item.minRate)}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Max Rate</div>
                                                    <div className="text-xl font-semibold">{formatCurrency(item.maxRate)}</div>
                                                </div>
                                            </div>
                                            {item.purchases.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="font-semibold mb-2">Purchase History</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">PO Number</th>
                                                                    <th className="px-4 py-2 text-left">Date</th>
                                                                    <th className="px-4 py-2 text-left">Vendor</th>
                                                                    <th className="px-4 py-2 text-right">Quantity</th>
                                                                    <th className="px-4 py-2 text-right">Rate</th>
                                                                    <th className="px-4 py-2 text-right">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {item.purchases.map((purchase, idx) => (
                                                                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                                                        <td className="px-4 py-2">{purchase.poNumber}</td>
                                                                        <td className="px-4 py-2">{formatDate(purchase.poDate)}</td>
                                                                        <td className="px-4 py-2">{purchase.vendorName}</td>
                                                                        <td className="px-4 py-2 text-right">{purchase.quantity.toLocaleString()} {purchase.unit}</td>
                                                                        <td className="px-4 py-2 text-right">{formatCurrency(purchase.rate)}</td>
                                                                        <td className="px-4 py-2 text-right">{formatCurrency(purchase.amount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Category-wise Report */}
                    <TabsContent value="category-wise" className="space-y-4">
                        {isLoading ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <LoadingSpinner />
                                </CardContent>
                            </Card>
                        ) : categoryWiseReport.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8 text-gray-500">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>No category-wise purchase data found for the selected filters.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {categoryWiseReport.map((category) => (
                                    <Card key={category.category} className="border-gray-200 dark:border-gray-700">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg capitalize">{category.category.replace('_', ' ')}</CardTitle>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                                                        {formatCurrency(category.totalPurchases)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {category.totalOrders} Orders
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</div>
                                                    <div className="text-xl font-semibold">{category.totalQuantity.toLocaleString()}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Order Value</div>
                                                    <div className="text-xl font-semibold">{formatCurrency(category.averageOrderValue)}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Items</div>
                                                    <div className="text-xl font-semibold">{category.items.length}</div>
                                                </div>
                                            </div>
                                            {category.items.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="font-semibold mb-2">Items in Category</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">Item Name</th>
                                                                    <th className="px-4 py-2 text-left">Code</th>
                                                                    <th className="px-4 py-2 text-right">Quantity</th>
                                                                    <th className="px-4 py-2 text-right">Total Amount</th>
                                                                    <th className="px-4 py-2 text-right">Avg Rate</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {category.items.map((item, idx) => (
                                                                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                                                        <td className="px-4 py-2">{item.itemName}</td>
                                                                        <td className="px-4 py-2">{item.itemCode}</td>
                                                                        <td className="px-4 py-2 text-right">{item.totalQuantity.toLocaleString()}</td>
                                                                        <td className="px-4 py-2 text-right">{formatCurrency(item.totalAmount)}</td>
                                                                        <td className="px-4 py-2 text-right">{formatCurrency(item.averageRate)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                            {category.vendors.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="font-semibold mb-2">Vendors</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">Vendor Name</th>
                                                                    <th className="px-4 py-2 text-right">Total Purchases</th>
                                                                    <th className="px-4 py-2 text-right">Orders</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {category.vendors.map((vendor, idx) => (
                                                                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                                                        <td className="px-4 py-2">{vendor.vendorName}</td>
                                                                        <td className="px-4 py-2 text-right">{formatCurrency(vendor.totalPurchases)}</td>
                                                                        <td className="px-4 py-2 text-right">{vendor.totalOrders}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Date Range Report */}
                    <TabsContent value="date-range" className="space-y-4">
                        {isLoading ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <LoadingSpinner />
                                </CardContent>
                            </Card>
                        ) : !dateRangeReport ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8 text-gray-500">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>Please select a date range to view the report.</p>
                                        {(!filters.dateFrom || !filters.dateTo) && (
                                            <p className="text-sm mt-2 text-gray-400">
                                                Select "From Date" and "To Date" in the filters above.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card className="border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Amount
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                                                {formatCurrency(dateRangeReport.totalAmount)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Quantity
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {dateRangeReport.totalQuantity.toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Orders
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                {dateRangeReport.totalOrders}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-gray-200 dark:border-gray-700">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Average Order Value
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                {formatCurrency(dateRangeReport.averageOrderValue)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Vendor Details */}
                                {dateRangeReport.vendorDetails.length > 0 && (
                                    <Card className="border-gray-200 dark:border-gray-700">
                                        <CardHeader>
                                            <CardTitle>Vendor Details</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">Vendor Name</th>
                                                            <th className="px-4 py-2 text-right">Total Purchases</th>
                                                            <th className="px-4 py-2 text-right">Orders</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dateRangeReport.vendorDetails.map((vendor, idx) => (
                                                            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                                                <td className="px-4 py-2">{vendor.vendorName}</td>
                                                                <td className="px-4 py-2 text-right">{formatCurrency(vendor.totalPurchases)}</td>
                                                                <td className="px-4 py-2 text-right">{vendor.totalOrders}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Item Details */}
                                {dateRangeReport.itemDetails.length > 0 && (
                                    <Card className="border-gray-200 dark:border-gray-700">
                                        <CardHeader>
                                            <CardTitle>Item Details</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">Item Name</th>
                                                            <th className="px-4 py-2 text-left">Code</th>
                                                            <th className="px-4 py-2 text-right">Quantity</th>
                                                            <th className="px-4 py-2 text-right">Total Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dateRangeReport.itemDetails.map((item, idx) => (
                                                            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                                                <td className="px-4 py-2">{item.itemName}</td>
                                                                <td className="px-4 py-2">{item.itemCode}</td>
                                                                <td className="px-4 py-2 text-right">{item.totalQuantity.toLocaleString()}</td>
                                                                <td className="px-4 py-2 text-right">{formatCurrency(item.totalAmount)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* PO Entries */}
                                {dateRangeReport.poEntries.length > 0 && (
                                    <Card className="border-gray-200 dark:border-gray-700">
                                        <CardHeader>
                                            <CardTitle>Purchase Order Entries</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">PO Number</th>
                                                            <th className="px-4 py-2 text-left">Date</th>
                                                            <th className="px-4 py-2 text-left">Vendor</th>
                                                            <th className="px-4 py-2 text-right">Total Amount</th>
                                                            <th className="px-4 py-2 text-right">Quantity</th>
                                                            <th className="px-4 py-2 text-right">Items</th>
                                                            <th className="px-4 py-2 text-left">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dateRangeReport.poEntries.map((po, idx) => (
                                                            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                                                <td className="px-4 py-2">{po.poNumber}</td>
                                                                <td className="px-4 py-2">{formatDate(po.poDate)}</td>
                                                                <td className="px-4 py-2">{po.vendorName}</td>
                                                                <td className="px-4 py-2 text-right">{formatCurrency(po.totalAmount)}</td>
                                                                <td className="px-4 py-2 text-right">{po.totalQuantity.toLocaleString()}</td>
                                                                <td className="px-4 py-2 text-right">{po.itemCount}</td>
                                                                <td className="px-4 py-2">
                                                                    <Badge
                                                                        variant={
                                                                            po.status === 'completed' ? 'default' :
                                                                                po.status === 'pending' ? 'secondary' :
                                                                                    po.status === 'cancelled' ? 'destructive' : 'outline'
                                                                        }
                                                                    >
                                                                        {po.status}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </ResponsiveContainer>
        </AppLayout>
    )
}
