import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Edit,
  Trash2,
  Clock,
  User,
  Phone,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  CustomerVisit,
  useDeleteCustomerVisitMutation,
  useApproveVisitMutation,
  useRejectVisitMutation,
  useMarkAsReimbursedMutation
} from '@/lib/features/hospitality/hospitalityApi'
import CustomerVisitFormModal from './modals/CustomerVisitFormModal'
import CustomerVisitDetailsModal from './modals/CustomerVisitDetailsModal'
import ExpenseDetailsModal from './modals/ExpenseDetailsModal'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'

export interface CustomerVisitListProps {
  visits: CustomerVisit[]
  isLoading: boolean
  totalPages: number
  totalVisits: number
  page: number
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export default function CustomerVisitList({
  visits,
  isLoading,
  totalPages,
  totalVisits,
  page,
  onPageChange,
  onRefresh
}: CustomerVisitListProps) {
  const router = useRouter()
  
  // Debug logging
  console.log('CustomerVisitList received:', {
    visits,
    visitsLength: visits?.length,
    isLoading,
    totalPages,
    totalVisits
  })
  const [editingVisit, setEditingVisit] = useState<CustomerVisit | null>(null)
  const [viewingVisit, setViewingVisit] = useState<CustomerVisit | null>(null)
  const [viewingExpenses, setViewingExpenses] = useState<CustomerVisit | null>(null)

  const [deleteVisit, { isLoading: isDeleting }] = useDeleteCustomerVisitMutation()
  const [approveVisit, { isLoading: isApproving }] = useApproveVisitMutation()
  const [rejectVisit, { isLoading: isRejecting }] = useRejectVisitMutation()
  const [markAsReimbursed, { isLoading: isReimbursing }] = useMarkAsReimbursedMutation()

  const handleEdit = (visit: CustomerVisit) => {
    setEditingVisit(visit)
  }

  const handleView = (visit: CustomerVisit) => {
    console.log('Navigating to visit details:', visit._id)
    router.push(`/operations/hospitality/${visit._id}`)
  }

  const handleViewExpenses = (visit: CustomerVisit) => {
    setViewingExpenses(visit)
  }

  const handleDelete = async (visitId: string) => {
    if (!confirm('Are you sure you want to delete this customer visit?')) return

    try {
      await deleteVisit(visitId).unwrap()
      toast.success('Customer visit deleted successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete customer visit')
    }
  }

  const handleApprove = async (visitId: string) => {
    try {
      await approveVisit({ id: visitId }).unwrap()
      toast.success('Customer visit approved successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to approve customer visit')
    }
  }

  const handleReject = async (visitId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):')
    try {
      await rejectVisit({ id: visitId, reason: reason || undefined }).unwrap()
      toast.success('Customer visit rejected successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject customer visit')
    }
  }

  const handleReimburse = async (visitId: string) => {
    try {
      await markAsReimbursed(visitId).unwrap()
      toast.success('Customer visit marked as reimbursed')
      onRefresh()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to mark as reimbursed')
    }
  }

  const handleEditSuccess = () => {
    setEditingVisit(null)
    onRefresh()
    toast.success('Customer visit updated successfully')
  }

  const getStatusBadge = (status: CustomerVisit['approvalStatus']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      reimbursed: { color: 'bg-blue-100 text-blue-800', icon: DollarSign, label: 'Reimbursed' }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getPurposeBadge = (purpose: CustomerVisit['purpose']) => {
    const purposeConfig = {
      sales: { color: 'bg-blue-100 text-blue-800', label: 'Sales' },
      support: { color: 'bg-green-100 text-green-800', label: 'Support' },
      meeting: { color: 'bg-purple-100 text-purple-800', label: 'Meeting' },
      demo: { color: 'bg-orange-100 text-orange-800', label: 'Demo' },
      'follow-up': { color: 'bg-indigo-100 text-indigo-800', label: 'Follow-up' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Other' },
      // Legacy support
      business_meeting: { color: 'bg-blue-100 text-blue-800', label: 'Business Meeting' },
      product_demo: { color: 'bg-purple-100 text-purple-800', label: 'Product Demo' },
      negotiation: { color: 'bg-orange-100 text-orange-800', label: 'Negotiation' },
      follow_up: { color: 'bg-green-100 text-green-800', label: 'Follow Up' },
      site_visit: { color: 'bg-indigo-100 text-indigo-800', label: 'Site Visit' }
    }

    const config = purposeConfig[purpose as keyof typeof purposeConfig] || purposeConfig.other
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getTravelTypeBadge = (travelType: CustomerVisit['travelType']) => {
    const travelConfig = {
      local: { color: 'bg-green-100 text-green-800', label: 'Local' },
      outstation: { color: 'bg-blue-100 text-blue-800', label: 'Outstation' },
      international: { color: 'bg-purple-100 text-purple-800', label: 'International' }
    }

    const config = travelConfig[travelType]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <MapPin className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getReimbursementBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: '⏳' },
      processed: { color: 'bg-blue-100 text-blue-800', label: 'Processed', icon: '⚡' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: '✅' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (visits.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No customer visits found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No customer visits match your current search and filter criteria.
          </p>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customer Visits ({totalVisits})
            </h2>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Visit List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {visits.map((visit) => (
            <div key={visit._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {visit.partyName}
                      </h3>
                      {getStatusBadge(visit.approvalStatus)}
                      {getPurposeBadge(visit.purpose)}
                      {getTravelTypeBadge(visit.travelType)}
                      {visit.reimbursementStatus && getReimbursementBadge(visit.reimbursementStatus)}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {visit.contactPerson}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {visit.contactNumber || visit.contactPhone}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(visit.visitDate), 'MMM dd, yyyy')}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-medium">
                          ₹{(visit.travelExpenses?.total || visit.totalExpenses?.total || 0).toLocaleString()}
                        </span>
                      </div>
                      {visit.purposeDescription && (
                        <div className="text-gray-600 dark:text-gray-400 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded max-w-xs truncate">
                          {visit.purposeDescription}
                        </div>
                      )}
                    </div>

                    {/* Travel Expenses Breakdown */}
                    {visit.travelExpenses && visit.travelExpenses.total > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div className="flex flex-wrap gap-2">
                          {visit.travelExpenses.transport > 0 && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Transport: ₹{visit.travelExpenses.transport.toLocaleString()}
                            </span>
                          )}
                          {visit.travelExpenses.accommodation > 0 && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              Stay: ₹{visit.travelExpenses.accommodation.toLocaleString()}
                            </span>
                          )}
                          {visit.travelExpenses.food > 0 && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                              Food: ₹{visit.travelExpenses.food.toLocaleString()}
                            </span>
                          )}
                          {visit.travelExpenses.other > 0 && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              Other: ₹{visit.travelExpenses.other.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Visit Outcome and Next Follow-up */}
                    {(visit.visitOutcome || visit.nextFollowUp) && (
                      <div className="mt-2 space-y-1">
                        {visit.visitOutcome && typeof visit.visitOutcome === 'string' && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            <strong>Outcome:</strong> {visit.visitOutcome}
                          </div>
                        )}
                        {visit.nextFollowUp && (
                          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            <strong>Next Follow-up:</strong> {new Date(visit.nextFollowUp).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleView(visit)}
                    variant="outline"
                    size="sm"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => handleViewExpenses(visit)}
                    variant="outline"
                    size="sm"
                    title="View Expenses"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <DollarSign className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => handleEdit(visit)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  {visit.approvalStatus === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleApprove(visit._id)}
                        disabled={isApproving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={() => handleReject(visit._id)}
                        disabled={isRejecting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  {visit.approvalStatus === 'approved' && (
                    <Button
                      onClick={() => handleReimburse(visit._id)}
                      disabled={isReimbursing}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    onClick={() => handleDelete(visit._id)}
                    disabled={isDeleting}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing page {page} of {totalPages}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <Button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingVisit && (
        <CustomerVisitFormModal
          isOpen={true}
          onClose={() => setEditingVisit(null)}
          onSuccess={handleEditSuccess}
          visit={editingVisit}
        />
      )}

      {/* Details Modal */}
      {viewingVisit && (
        <CustomerVisitDetailsModal
          isOpen={true}
          onClose={() => setViewingVisit(null)}
          visit={viewingVisit}
        />
      )}

      {/* Expense Details Modal */}
      {viewingExpenses && (
        <ExpenseDetailsModal
          isOpen={true}
          onClose={() => setViewingExpenses(null)}
          visit={viewingExpenses}
          onEdit={() => {
            setViewingExpenses(null)
            setEditingVisit(viewingExpenses)
          }}
        />
      )}
    </>
  )
}
