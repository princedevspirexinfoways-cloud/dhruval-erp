'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Download,
  RefreshCw
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetQuotationsQuery,
  useGetQuotationStatsQuery,
  useDeleteQuotationMutation,
  useUpdateQuotationMutation,
  useSendQuotationMutation,
  useAcceptQuotationMutation,
  useRejectQuotationMutation
} from '@/lib/api/quotationsApi'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function PurchaseQuotationsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // RTK Query hooks
  const {
    data: quotationsData,
    isLoading,
    error,
    refetch
  } = useGetQuotationsQuery({
    page,
    limit: 10,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    customerId: supplierFilter !== 'all' ? supplierFilter : undefined
  }, {
    pollingInterval: 30000, // Poll every 30 seconds
    refetchOnFocus: true,
    refetchOnReconnect: true
  })

  const { data: quotationStats, isLoading: isLoadingStats } = useGetQuotationStatsQuery({})

  // Mutations
  const [deleteQuotation, { isLoading: isDeleting }] = useDeleteQuotationMutation()
  const [sendQuotation, { isLoading: isSending }] = useSendQuotationMutation()
  const [acceptQuotation, { isLoading: isAccepting }] = useAcceptQuotationMutation()
  const [rejectQuotation, { isLoading: isRejecting }] = useRejectQuotationMutation()

  const quotations = quotationsData?.data || []
  const pagination = quotationsData?.pagination

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error('Failed to load quotations')
    }
  }, [error])

  // Handler functions
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleDelete = async (quotationId: string) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(quotationId).unwrap()
        toast.success('Quotation deleted successfully')
        refetch()
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to delete quotation')
      }
    }
  }

  const handleSend = async (quotationId: string) => {
    try {
      await sendQuotation({ quotationId }).unwrap()
      toast.success('Quotation sent successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send quotation')
    }
  }

  const handleAccept = async (quotationId: string) => {
    try {
      await acceptQuotation({ quotationId }).unwrap()
      toast.success('Quotation accepted successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to accept quotation')
    }
  }

  const handleReject = async (quotationId: string) => {
    try {
      await rejectQuotation({ quotationId }).unwrap()
      toast.success('Quotation rejected successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject quotation')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-600`
      case 'received':
        return `${baseClasses} bg-purple-100 text-purple-600`
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'expired':
        return `${baseClasses} bg-gray-100 text-gray-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'sent':
        return <Send className="h-3 w-3" />
      case 'received':
        return <Download className="h-3 w-3" />
      case 'approved':
        return <CheckCircle className="h-3 w-3" />
      case 'rejected':
        return <XCircle className="h-3 w-3" />
      case 'expired':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getDaysUntilExpiry = (validUntil: string) => {
    const today = new Date()
    const expiry = new Date(validUntil)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDepartmentColor = (department: string) => {
    const colors: { [key: string]: string } = {
      'Production': 'bg-blue-100 text-blue-600',
      'Maintenance': 'bg-green-100 text-green-600',
      'Safety': 'bg-red-100 text-red-600',
      'IT': 'bg-sky-100 text-sky-600',
      'Quality': 'bg-yellow-100 text-yellow-600',
      'Admin': 'bg-gray-100 text-gray-600'
    }
    return colors[department] || 'bg-gray-100 text-gray-600'
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Theme Colors */}
        <PageHeader
          title="Purchase Quotations"
          description={`Request and manage supplier quotations (${quotations.length} quotations)`}
          icon={<FileText className="h-6 w-6" />}
          variant="sky"
        >
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-sky-600 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Quotation
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-sky-500 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Quotations</CardTitle>
              <div className="p-2 bg-sky-100 rounded-lg">
                <FileText className="h-4 w-4 text-sky-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{quotationStats?.data?.totalQuotations || 0}</div>
              <p className="text-xs text-green-600">
                +{quotationStats?.data?.newQuotationsThisWeek || 0} this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{quotationStats?.data?.pendingQuotations || 0}</div>
              <p className="text-xs text-gray-600">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Approved</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{quotationStats?.data?.approvedQuotations || 0}</div>
              <p className="text-xs text-gray-600">
                Ready to order
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Value</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(quotationStats?.data?.totalValue || 0)}
              </div>
              <p className="text-xs text-green-600">
                +{quotationStats?.data?.valueGrowth || 0}% growth
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search quotations..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                  <option value="converted">Converted</option>
                </select>
              </div>

              {/* Supplier Filter */}
              <div>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="all">All Suppliers</option>
                  <option value="Steel Industries Ltd">Steel Industries Ltd</option>
                  <option value="Lubricants Corp">Lubricants Corp</option>
                  <option value="Safety First Ltd">Safety First Ltd</option>
                  <option value="Tech Solutions Inc">Tech Solutions Inc</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Quotations</h3>
              <p className="text-red-600">Failed to load purchase quotations. Please try again.</p>
            </CardContent>
          </Card>
        ) : quotations.length === 0 ? (
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotations Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || supplierFilter !== 'all'
                  ? 'No quotations match your search criteria.'
                  : 'No purchase quotations have been requested yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotations.map((quotation) => {
              const daysUntilExpiry = getDaysUntilExpiry(quotation.validUntil)
              return (
                <Card key={quotation._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {quotation.quotationNumber}
                        </CardTitle>
                        <p className="text-sm text-sky-600 font-medium">
                          {quotation.customer?.customerName || quotation.supplierName || 'Unknown Supplier'}
                        </p>
                      </div>
                      <Badge
                        variant={
                          quotation.status === 'accepted' ? 'success' :
                          quotation.status === 'rejected' ? 'destructive' :
                          quotation.status === 'expired' ? 'secondary' :
                          'default'
                        }
                      >
                        {quotation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Request Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="h-4 w-4 text-sky-500" />
                        <span>{quotation.requestedBy || 'N/A'}</span>
                        {quotation.department && (
                          <Badge variant="outline" className="text-xs">
                            {quotation.department}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-sky-500" />
                        <span>Valid until: {formatDate(quotation.validUntil)}</span>
                        {daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
                          <Badge variant={daysUntilExpiry <= 3 ? "destructive" : "warning"} className="text-xs">
                            {daysUntilExpiry} days left
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quotation Stats */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-sky-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{quotation.items?.length || quotation.itemsCount || 0}</p>
                        <p className="text-xs text-gray-600">Items</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(quotation.totalAmount || 0)}</p>
                        <p className="text-xs text-gray-600">Total Value</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {quotation.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">{quotation.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(quotation._id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {quotation.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSend(quotation._id)}
                            disabled={isSending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        {quotation.status === 'sent' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAccept(quotation._id)}
                              disabled={isAccepting}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(quotation._id)}
                              disabled={isRejecting}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} quotations
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
