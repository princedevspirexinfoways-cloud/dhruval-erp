'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Share, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Users,
  Hotel,
  Utensils,
  Car,
  Gift,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  FileText,
  Receipt,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AppLayout } from '@/components/layout/AppLayout'
import { useGetCustomerVisitByIdQuery, useRecalculateTotalsMutation } from '@/lib/features/hospitality/hospitalityApi'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import dynamic from 'next/dynamic'

const ExpenseDetailsModal = dynamic(() => import('@/components/hospitality/modals/ExpenseDetailsModal'), {
  ssr: false
})

export default function CustomerVisitDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const visitId = params.id as string
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Debug logging
  console.log('CustomerVisitDetailsPage rendered with visitId:', visitId)

  const {
    data: visit,
    isLoading,
    error,
    refetch
  } = useGetCustomerVisitByIdQuery(visitId)
  
  // Debug logging for API response
  console.log('API Response:', { visit, isLoading, error })
  
  const [recalculateTotals] = useRecalculateTotalsMutation()
  const [isRecalculating, setIsRecalculating] = useState(false)

  const handleRecalculateTotals = async () => {
    try {
      setIsRecalculating(true)
      await recalculateTotals({ id: visitId }).unwrap()
      await refetch()
      toast.success('Totals recalculated successfully!')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to recalculate totals')
    } finally {
      setIsRecalculating(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Loading visit details for ID: {visitId}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !visit) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Visit Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">The customer visit you're looking for doesn't exist or has been removed.</p>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Visit ID: {visitId}</p>
              {error && (
                <p className="mt-2 text-red-600 dark:text-red-400">
                  Error: {JSON.stringify(error)}
                </p>
              )}
            </div>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: AlertTriangle },
      reimbursed: { color: 'bg-blue-100 text-blue-800', label: 'Reimbursed', icon: DollarSign }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </span>
    )
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleExport = () => {
    toast.success('Export functionality coming soon!')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Customer Visit - ${visit.partyName}`,
        text: `Visit details for ${visit.partyName} on ${format(new Date(visit.visitDate), 'PPP')}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  size="sm"
                  className="p-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Users className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
                    {visit.partyName}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Visit on {format(new Date(visit.visitDate), 'PPP')} • {visit.contactPerson}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={handleRecalculateTotals}
                  disabled={isRecalculating}
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                  {isRecalculating ? 'Recalculating...' : 'Recalculate Totals'}
                </Button>
                <Button
                  onClick={handleEdit}
                  className="flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Visit Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Visit Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Party Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{visit.partyName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                    <p className="text-gray-900 dark:text-white">{visit.contactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                    <p className="text-gray-900 dark:text-white flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      {visit.contactPhone}
                    </p>
                  </div>
                  {visit.contactEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                      <p className="text-gray-900 dark:text-white flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        {visit.contactEmail}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visit Date</label>
                    <p className="text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      {format(new Date(visit.visitDate), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                    <p className="text-gray-900 dark:text-white capitalize">{visit.purpose.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Type</label>
                    <p className="text-gray-900 dark:text-white capitalize">{visit.travelType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <div>{getStatusBadge(visit.approvalStatus)}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose Description</label>
                  <p className="text-gray-900 dark:text-white">{visit.purposeDescription}</p>
                </div>
              </div>

              {/* Travel Details */}
              {visit.travelDetails && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    Travel Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origin</label>
                      <p className="text-gray-900 dark:text-white">{visit.travelDetails.origin}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
                      <p className="text-gray-900 dark:text-white">{visit.travelDetails.destination}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Mode</label>
                      <p className="text-gray-900 dark:text-white capitalize">{visit.travelDetails.travelMode}</p>
                    </div>
                    {visit.travelDetails.travelClass && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Class</label>
                        <p className="text-gray-900 dark:text-white capitalize">{visit.travelDetails.travelClass}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Accommodation Details */}
              {visit.accommodation && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Hotel className="w-5 h-5 mr-2 text-purple-600" />
                    Accommodation Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                      <p className="text-gray-900">{visit.accommodation.hotelName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                      <p className="text-gray-900 capitalize">{visit.accommodation.roomType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                      <p className="text-gray-900">{format(new Date(visit.accommodation.checkInDate), 'PPP')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                      <p className="text-gray-900">{format(new Date(visit.accommodation.checkOutDate), 'PPP')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Nights</label>
                      <p className="text-gray-900">{visit.accommodation.totalNights}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Night</label>
                      <p className="text-gray-900">{formatCurrency(visit.accommodation.costPerNight)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
                      <p className="text-gray-900">{visit.accommodation.numberOfRooms}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                      <p className="text-lg font-semibold text-purple-600">{formatCurrency(visit.accommodation.totalCost)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Address</label>
                    <p className="text-gray-900">{visit.accommodation.hotelAddress}</p>
                  </div>
                  {visit.accommodation.bookingReference && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference</label>
                      <p className="text-gray-900 font-mono">{visit.accommodation.bookingReference}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Visit Outcome */}
              {visit.visitOutcome && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Visit Outcome
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <p className="text-gray-900 capitalize">
                        {typeof visit.visitOutcome === 'string' 
                          ? visit.visitOutcome.replace('_', ' ')
                          : visit.visitOutcome?.status?.replace('_', ' ')
                        }
                      </p>
                    </div>
                    {typeof visit.visitOutcome === 'object' && visit.visitOutcome?.businessGenerated && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Generated</label>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(visit.visitOutcome.businessGenerated)}</p>
                      </div>
                    )}
                    {typeof visit.visitOutcome === 'object' && visit.visitOutcome?.potentialBusiness && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Potential Business</label>
                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(visit.visitOutcome.potentialBusiness)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-gray-900">
                      {typeof visit.visitOutcome === 'string' 
                        ? visit.visitOutcome
                        : visit.visitOutcome?.notes
                      }
                    </p>
                  </div>
                  {typeof visit.visitOutcome === 'object' && visit.visitOutcome?.nextActionRequired && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Required</label>
                      <p className="text-gray-900">{visit.visitOutcome.nextActionRequired}</p>
                    </div>
                  )}
                  {typeof visit.visitOutcome === 'object' && visit.visitOutcome?.nextFollowUpDate && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                      <p className="text-gray-900">{format(new Date(visit.visitOutcome.nextFollowUpDate), 'PPP')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Expense Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Expense Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Hotel className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      Accommodation
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(visit.totalExpenses?.accommodation || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Utensils className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      Food
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(visit.totalExpenses?.food || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Car className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Transportation
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(visit.totalExpenses?.transportation || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Gift className="w-4 h-4 mr-2 text-pink-600 dark:text-pink-400" />
                      Gifts
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(visit.totalExpenses?.gifts || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                      Other
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(visit.totalExpenses?.other || 0)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(visit.totalExpenses?.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Expenses
                  </Button>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share Visit
                  </Button>
                </div>
              </div>

              {/* Approval Information */}
              {visit.approvalStatus !== 'pending' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Approval Information</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <div>{getStatusBadge(visit.approvalStatus)}</div>
                    </div>
                    {visit.approvedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Processed At</label>
                        <p className="text-gray-900 dark:text-white">{format(new Date(visit.approvedAt), 'PPp')}</p>
                      </div>
                    )}
                    {visit.reimbursementAmount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reimbursement Amount</label>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(visit.reimbursementAmount)}
                        </p>
                      </div>
                    )}
                    {visit.reimbursedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reimbursed At</label>
                        <p className="text-gray-900 dark:text-white">{format(new Date(visit.reimbursedAt), 'PPp')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <ExpenseDetailsModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            visit={visit}
            onEdit={() => {
              setIsEditModalOpen(false)
              // Refresh the data
              window.location.reload()
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
