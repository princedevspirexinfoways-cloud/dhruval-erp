import React from 'react'
import { X, Users, User, Phone, Calendar, MapPin, FileText, DollarSign, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CustomerVisit } from '@/lib/features/hospitality/hospitalityApi'
import { format } from 'date-fns'

interface CustomerVisitDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  visit: CustomerVisit
}

export default function CustomerVisitDetailsModal({ isOpen, onClose, visit }: CustomerVisitDetailsModalProps) {
  if (!isOpen) return null

  const getStatusBadge = (status: CustomerVisit['approvalStatus']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      reimbursed: { color: 'bg-blue-100 text-blue-800', label: 'Reimbursed' }
    }

    const config = statusConfig[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Visit Details</h2>
              <p className="text-sm text-gray-500">Complete visit information and expenses</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Party Name
                </label>
                <p className="text-lg font-semibold text-gray-900">{visit.partyName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <p className="text-gray-900">{visit.contactPerson}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{visit.contactPhone}</p>
                </div>
              </div>
              
              {visit.contactEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{visit.contactEmail}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Date
                </label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{format(new Date(visit.visitDate), 'PPP')}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(visit.approvalStatus)}
                  {getPurposeBadge(visit.purpose)}
                  {getTravelTypeBadge(visit.travelType)}
                </div>
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Visit Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose Description
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{visit.purposeDescription}</p>
              </div>
              
              {visit.travelDetails && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Travel Route
                  </label>
                  <p className="text-gray-900">
                    {visit.travelDetails.origin} → {visit.travelDetails.destination}
                    {visit.travelDetails.travelMode && (
                      <span className="text-gray-500 ml-2">
                        (via {visit.travelDetails.travelMode})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Expense Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Expense Summary
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Accommodation</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(visit.totalExpenses.accommodation)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Food</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(visit.totalExpenses.food)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Transportation</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(visit.totalExpenses.transportation)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Gifts</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(visit.totalExpenses.gifts)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Other</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(visit.totalExpenses.other)}
                </p>
              </div>
              
              <div className="bg-blue-100 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(visit.totalExpenses.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Food Expenses */}
          {visit.foodExpenses && visit.foodExpenses.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Food Expenses ({visit.foodExpenses.length})
              </h3>
              
              <div className="space-y-3">
                {visit.foodExpenses.map((expense, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{expense.restaurant}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.mealType} • {expense.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        {expense.numberOfPeople} people × {formatCurrency(expense.costPerPerson)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(expense.totalCost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gifts Given */}
          {visit.giftsGiven && visit.giftsGiven.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gifts & Samples ({visit.giftsGiven.length})
              </h3>
              
              <div className="space-y-3">
                {visit.giftsGiven.map((gift, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{gift.itemName}</p>
                      <p className="text-sm text-gray-600">
                        {gift.itemType} • Qty: {gift.quantity}
                      </p>
                      {gift.recipientName && (
                        <p className="text-sm text-gray-500">Given to: {gift.recipientName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(gift.totalCost)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(gift.unitCost)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accommodation Details */}
          {visit.accommodation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Accommodation Details
              </h3>
              
              <div className="bg-white rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Name
                    </label>
                    <p className="text-gray-900">{visit.accommodation.hotelName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Type
                    </label>
                    <p className="text-gray-900 capitalize">{visit.accommodation.roomType}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in Date
                    </label>
                    <p className="text-gray-900">
                      {format(new Date(visit.accommodation.checkInDate), 'PPP')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out Date
                    </label>
                    <p className="text-gray-900">
                      {format(new Date(visit.accommodation.checkOutDate), 'PPP')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Nights
                    </label>
                    <p className="text-gray-900">{visit.accommodation.totalNights}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Cost
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(visit.accommodation.totalCost)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visit Outcome */}
          {visit.visitOutcome && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Visit Outcome
              </h3>
              
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <p className="text-gray-900 capitalize">
                    {typeof visit.visitOutcome === 'string'
                      ? visit.visitOutcome
                      : visit.visitOutcome.status.replace('_', ' ')
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {typeof visit.visitOutcome === 'string'
                      ? visit.visitOutcome
                      : visit.visitOutcome.notes
                    }
                  </p>
                </div>
                
                {typeof visit.visitOutcome !== 'string' && visit.visitOutcome.businessGenerated && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Generated
                    </label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(visit.visitOutcome.businessGenerated)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Information */}
          {visit.approvalStatus !== 'pending' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Approval Information
              </h3>
              
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div>{getStatusBadge(visit.approvalStatus)}</div>
                  </div>
                  
                  {visit.approvedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {visit.approvalStatus === 'approved' ? 'Approved At' : 'Processed At'}
                      </label>
                      <p className="text-gray-900">
                        {format(new Date(visit.approvedAt), 'PPp')}
                      </p>
                    </div>
                  )}
                  
                  {visit.reimbursementAmount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reimbursement Amount
                      </label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(visit.reimbursementAmount)}
                      </p>
                    </div>
                  )}
                  
                  {visit.reimbursedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reimbursed At
                      </label>
                      <p className="text-gray-900">
                        {format(new Date(visit.reimbursedAt), 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">{format(new Date(visit.createdAt), 'PPp')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">{format(new Date(visit.updatedAt), 'PPp')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
