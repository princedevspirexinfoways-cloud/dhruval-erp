'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  Download,
  Send,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  CreditCard,
  ExternalLink
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { FinancialHeader } from '@/components/ui/PageHeader'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetInvoicesQuery, useGetInvoiceStatsQuery } from '@/lib/api/invoicesApi'
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal'
import { RecordPaymentModal } from '@/components/invoices/RecordPaymentModal'
import clsx from 'clsx'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export default function InvoicesPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<{
    _id: string
    invoiceNumber: string
    outstandingAmount?: number
    balanceAmount?: number
    paidAmount?: number
    totalAmount?: number
  } | null>(null)

  // Fetch invoices data
  const { data: invoicesData, isLoading, error } = useGetInvoicesQuery({
    page,
    limit: 10,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    customerId: customerFilter !== 'all' ? customerFilter : undefined
  })

  // Fetch invoice statistics
  const { data: invoiceStats } = useGetInvoiceStatsQuery({})

  const invoices = invoicesData?.data || []
  const pagination = invoicesData?.pagination

  const refreshInvoices = () => {
    window.location.reload()
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
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-600`
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-600`
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'partial':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4" />
      case 'sent':
        return <Send className="h-4 w-4" />
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'partial':
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* New Header */}
        <FinancialHeader
          title="Invoices"
          description={`Manage customer invoices and payments (${invoices.length} invoices)`}
          icon={<FileText className="h-6 w-6 text-white" />}
          showRefresh={true}
          onRefresh={() => window.location.reload()}
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 border border-white transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </FinancialHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Invoices</p>
                <p className="text-2xl font-bold text-black">{invoiceStats?.data?.totalInvoices || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-sky-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Outstanding</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(invoiceStats?.data?.outstandingAmount || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Paid This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(invoiceStats?.data?.paidThisMonth || 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{invoiceStats?.data?.overdueInvoices || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-sky-500 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-500" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Customer Filter */}
            <div>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white text-black"
              >
                <option value="all">All Customers</option>
                {/* Customer options will be populated from API */}
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl border-2 border-sky-500 p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/4"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                  <div className="h-4 bg-sky-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border-2 border-red-500 p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Error Loading Invoices</h3>
            <p className="text-red-600">Failed to load invoices. Please try again.</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-sky-500 p-6 text-center">
            <FileText className="h-12 w-12 text-sky-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No Invoices Found</h3>
            <p className="text-black opacity-75">
              {searchTerm || statusFilter !== 'all' || customerFilter !== 'all'
                ? 'No invoices match your search criteria.'
                : 'No invoices have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-sky-500 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sky-200">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-sky-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-sky-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-black">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-sm text-sky-600">
                            {formatDate(invoice.invoiceDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-sky-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-black">
                              {invoice.customer?.customerName || 'N/A'}
                            </div>
                            <div className="text-sm text-sky-600">
                              {invoice.customer?.customerCode || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(invoice.status)}
                          <span className={getStatusBadge(invoice.status)}>
                            {invoice.status}
                          </span>
                          {invoice.status === 'overdue' && (
                            <span className="text-xs text-red-600">
                              ({getDaysOverdue(invoice.dueDate)} days)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                        {invoice.paidAmount > 0 && (
                          <div className="text-xs text-green-600">
                            Paid: {formatCurrency(invoice.paidAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1">
                          <a
                            href={`${API_BASE}/invoices/${invoice._id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-500 hover:text-black p-1.5 rounded hover:bg-sky-50 inline-flex"
                            title="View / Print PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setPaymentInvoice({
                              _id: invoice._id,
                              invoiceNumber: invoice.invoiceNumber,
                              outstandingAmount: (invoice as any).outstandingAmount ?? invoice.balanceAmount ?? ((invoice.totalAmount || 0) - (invoice.paidAmount || 0))
                            })}
                            className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50 inline-flex"
                            title="Record payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button className="text-sky-500 hover:text-black p-1.5 rounded hover:bg-sky-50">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-500 hover:text-green-700 p-1.5 rounded hover:bg-green-50">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-sky-500 hover:text-sky-700 p-1.5 rounded hover:bg-sky-50">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white rounded-xl border-2 border-sky-500 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-black">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm bg-white border border-sky-300 rounded hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-black">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1 text-sm bg-white border border-sky-300 rounded hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        <CreateInvoiceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={refreshInvoices}
        />

        {/* Record Payment Modal */}
        {paymentInvoice && (
          <RecordPaymentModal
            isOpen={!!paymentInvoice}
            onClose={() => setPaymentInvoice(null)}
            onSuccess={refreshInvoices}
            invoiceId={paymentInvoice._id}
            invoiceNumber={paymentInvoice.invoiceNumber}
            outstandingAmount={paymentInvoice.outstandingAmount ?? 0}
          />
        )}
      </div>
    </AppLayout>
  )
}
