import React, { useState } from 'react'
import { 
  X, 
  DollarSign, 
  Receipt, 
  FileText, 
  Calendar, 
  MapPin, 
  Users,
  Car,
  Hotel,
  Utensils,
  Gift,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Edit,
  Plus,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CustomerVisit, hospitalityApi } from '@/lib/features/hospitality/hospitalityApi'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface ExpenseDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  visit: CustomerVisit
  onEdit?: () => void
}

export default function ExpenseDetailsModal({ 
  isOpen, 
  onClose, 
  visit, 
  onEdit 
}: ExpenseDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('summary')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFormType, setAddFormType] = useState<'food' | 'transport' | 'gifts' | 'other' | 'accommodation'>('food')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API hooks
  const [addFoodExpense] = hospitalityApi.useAddFoodExpenseMutation()
  const [addGift] = hospitalityApi.useAddGiftMutation()
  const [addTransportationExpense] = hospitalityApi.useAddTransportationExpenseMutation()
  const [addOtherExpense] = hospitalityApi.useAddOtherExpenseMutation()
  const [updateCustomerVisit] = hospitalityApi.useUpdateCustomerVisitMutation()

  if (!isOpen) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: CustomerVisit['approvalStatus']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: AlertTriangle },
      reimbursed: { color: 'bg-blue-100 text-blue-800', label: 'Reimbursed', icon: DollarSign }
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

  const tabs = [
    { id: 'summary', label: 'Summary', icon: DollarSign },
    { id: 'accommodation', label: 'Accommodation', icon: Hotel },
    { id: 'food', label: 'Food & Dining', icon: Utensils },
    { id: 'transport', label: 'Transportation', icon: Car },
    { id: 'gifts', label: 'Gifts & Samples', icon: Gift },
    { id: 'other', label: 'Other Expenses', icon: AlertTriangle },
    { id: 'receipts', label: 'Receipts', icon: Receipt }
  ]

  const totalExpenses = visit.totalExpenses?.total || visit.travelExpenses?.total || 0

  const handleAddExpense = (type: 'food' | 'transport' | 'gifts' | 'other' | 'accommodation') => {
    setAddFormType(type)
    setShowAddForm(true)
  }

  const handleCloseAddForm = () => {
    setShowAddForm(false)
    setAddFormType('food')
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Expense Details</h2>
              <p className="text-sm text-gray-500">
                {visit.partyName} • {format(new Date(visit.visitDate), 'PPP')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                    <p className="text-gray-900 font-medium">{visit.partyName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <p className="text-gray-900">{visit.contactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                    <p className="text-gray-900">{format(new Date(visit.visitDate), 'PPP')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div>{getStatusBadge(visit.approvalStatus)}</div>
                  </div>
                </div>
              </div>

              {/* Expense Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">Accommodation</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(visit.totalExpenses?.accommodation || visit.travelExpenses?.accommodation || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">Food</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(visit.totalExpenses?.food || visit.travelExpenses?.food || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">Transportation</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(visit.totalExpenses?.transportation || visit.travelExpenses?.transport || 0)}
                    </p>
                  </div>
                                     <div className="bg-white rounded-lg p-3 text-center">
                     <p className="text-sm text-gray-600">Gifts</p>
                     <p className="text-lg font-semibold text-gray-900">
                       {formatCurrency(visit.totalExpenses?.gifts || 0)}
                     </p>
                   </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">Other</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(visit.totalExpenses?.other || visit.travelExpenses?.other || 0)}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-600 font-medium">Total</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Information */}
              {visit.approvalStatus !== 'pending' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div>{getStatusBadge(visit.approvalStatus)}</div>
                    </div>
                    {visit.approvedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Processed At</label>
                        <p className="text-gray-900">{format(new Date(visit.approvedAt), 'PPp')}</p>
                      </div>
                    )}
                    {visit.reimbursementAmount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reimbursement Amount</label>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(visit.reimbursementAmount)}
                        </p>
                      </div>
                    )}
                    {visit.reimbursedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reimbursed At</label>
                        <p className="text-gray-900">{format(new Date(visit.reimbursedAt), 'PPp')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accommodation Tab */}
          {activeTab === 'accommodation' && (
            <div className="space-y-4">
              {visit.accommodation ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Accommodation Details</h3>
                  <div className="bg-white rounded-lg p-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                        <p className="text-lg font-semibold text-gray-900">{formatCurrency(visit.accommodation.totalCost)}</p>
                      </div>
                      {visit.accommodation.bookingReference && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference</label>
                          <p className="text-gray-900">{visit.accommodation.bookingReference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Hotel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No accommodation details</h3>
                  <p className="text-gray-500 mb-4">No accommodation information has been recorded for this visit.</p>
                  <Button
                    onClick={() => handleAddExpense('accommodation')}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Accommodation
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Food Tab */}
          {activeTab === 'food' && (
            <div className="space-y-4">
              {visit.foodExpenses && visit.foodExpenses.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Food Expenses ({visit.foodExpenses.length})</h3>
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-green-600">
                        Total: {formatCurrency(visit.foodExpenses.reduce((sum, exp) => sum + exp.totalCost, 0))}
                      </div>
                      <Button
                        onClick={() => handleAddExpense('food')}
                        size="sm"
                        className="flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Food Expense
                      </Button>
                    </div>
                  </div>
                  
                  {visit.foodExpenses.map((expense, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{expense.restaurant}</h4>
                        <span className="text-lg font-semibold text-gray-900">{formatCurrency(expense.totalCost)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <p className="text-gray-900">{format(new Date(expense.date), 'PPP')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                          <p className="text-gray-900 capitalize">{expense.mealType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <p className="text-gray-900">{expense.location}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                          <p className="text-gray-900">{expense.numberOfPeople}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Person</label>
                          <p className="text-gray-900">{formatCurrency(expense.costPerPerson)}</p>
                        </div>
                        {expense.billNumber && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                            <p className="text-gray-900">{expense.billNumber}</p>
                          </div>
                        )}
                      </div>
                      {expense.description && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-900 text-sm">{expense.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No food expenses</h3>
                  <p className="text-gray-500 mb-4">No food expenses have been recorded for this visit.</p>
                  <Button
                    onClick={() => handleAddExpense('food')}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Food Expense
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Transport Tab */}
          {activeTab === 'transport' && (
            <div className="space-y-4">
              {visit.transportationExpenses && visit.transportationExpenses.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Transportation Expenses ({visit.transportationExpenses.length})</h3>
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-purple-600">
                        Total: {formatCurrency(visit.transportationExpenses.reduce((sum, exp) => sum + exp.cost, 0))}
                      </div>
                      <Button
                        onClick={() => handleAddExpense('transport')}
                        size="sm"
                        className="flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Transport
                      </Button>
                    </div>
                  </div>
                  
                  {visit.transportationExpenses.map((expense, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                                           <div className="flex items-center justify-between mb-3">
                       <h4 className="font-semibold text-gray-900">{expense.type}</h4>
                       <span className="text-lg font-semibold text-gray-900">{formatCurrency(expense.cost)}</span>
                     </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <p className="text-gray-900">{format(new Date(expense.date), 'PPP')}</p>
                        </div>
                                                 <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                           <p className="text-gray-900">{expense.from}</p>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                           <p className="text-gray-900">{expense.to}</p>
                         </div>
                         {expense.billNumber && (
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                             <p className="text-gray-900">{expense.billNumber}</p>
                           </div>
                         )}
                      </div>
                      {expense.description && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-900 text-sm">{expense.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transportation expenses</h3>
                  <p className="text-gray-500 mb-4">No transportation expenses have been recorded for this visit.</p>
                  <Button
                    onClick={() => handleAddExpense('transport')}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transportation
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Gifts Tab */}
          {activeTab === 'gifts' && (
            <div className="space-y-4">
              {visit.giftsGiven && visit.giftsGiven.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Gifts & Samples ({visit.giftsGiven.length})</h3>
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-pink-600">
                        Total: {formatCurrency(visit.giftsGiven.reduce((sum, gift) => sum + gift.totalCost, 0))}
                      </div>
                      <Button
                        onClick={() => handleAddExpense('gifts')}
                        size="sm"
                        className="flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Gift
                      </Button>
                    </div>
                  </div>
                  
                  {visit.giftsGiven.map((gift, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{gift.itemName}</h4>
                        <span className="text-lg font-semibold text-gray-900">{formatCurrency(gift.totalCost)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                          <p className="text-gray-900 capitalize">{gift.itemType.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <p className="text-gray-900">{gift.quantity}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                          <p className="text-gray-900">{formatCurrency(gift.unitCost)}</p>
                        </div>
                        {gift.recipientName && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                            <p className="text-gray-900">{gift.recipientName}</p>
                          </div>
                        )}
                      </div>
                      {gift.description && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-900 text-sm">{gift.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No gifts recorded</h3>
                  <p className="text-gray-500 mb-4">No gifts or samples have been recorded for this visit.</p>
                  <Button
                    onClick={() => handleAddExpense('gifts')}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Gift
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Other Expenses Tab */}
          {activeTab === 'other' && (
            <div className="space-y-4">
              {visit.otherExpenses && visit.otherExpenses.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Other Expenses ({visit.otherExpenses.length})</h3>
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-gray-600">
                        Total: {formatCurrency(visit.otherExpenses.reduce((sum, exp) => sum + exp.cost, 0))}
                      </div>
                      <Button
                        onClick={() => handleAddExpense('other')}
                        size="sm"
                        className="flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Other
                      </Button>
                    </div>
                  </div>
                  
                  {visit.otherExpenses.map((expense, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                                           <div className="flex items-center justify-between mb-3">
                       <h4 className="font-semibold text-gray-900">{expense.category}</h4>
                       <span className="text-lg font-semibold text-gray-900">{formatCurrency(expense.cost)}</span>
                     </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <p className="text-gray-900">{format(new Date(expense.date), 'PPP')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <p className="text-gray-900 capitalize">{expense.category}</p>
                        </div>
                                                 {expense.billNumber && (
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                             <p className="text-gray-900">{expense.billNumber}</p>
                           </div>
                         )}
                      </div>
                      {expense.description && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-900 text-sm">{expense.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No other expenses</h3>
                  <p className="text-gray-500 mb-4">No other expenses have been recorded for this visit.</p>
                  <Button
                    onClick={() => handleAddExpense('other')}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Other Expense
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Receipts Tab */}
          {activeTab === 'receipts' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Receipt Management</h3>
                <p className="text-gray-500 mb-4">Upload and manage receipts for this visit.</p>
                <Button className="flex items-center mx-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      {/* Add Expense Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center p-4 z-60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Add {addFormType === 'food' ? 'Food Expense' : 
                      addFormType === 'transport' ? 'Transportation' :
                      addFormType === 'gifts' ? 'Gift' :
                      addFormType === 'other' ? 'Other Expense' :
                      'Accommodation'}
              </h3>
              <Button
                onClick={handleCloseAddForm}
                variant="outline"
                size="sm"
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              {addFormType === 'food' && <FoodExpenseForm visitId={visit._id} onSuccess={handleCloseAddForm} onCancel={handleCloseAddForm} />}
              {addFormType === 'transport' && <TransportExpenseForm visitId={visit._id} onSuccess={handleCloseAddForm} onCancel={handleCloseAddForm} />}
              {addFormType === 'gifts' && <GiftForm visitId={visit._id} onSuccess={handleCloseAddForm} onCancel={handleCloseAddForm} />}
              {addFormType === 'other' && <OtherExpenseForm visitId={visit._id} onSuccess={handleCloseAddForm} onCancel={handleCloseAddForm} />}
              {addFormType === 'accommodation' && <AccommodationForm visitId={visit._id} onSuccess={handleCloseAddForm} onCancel={handleCloseAddForm} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Food Expense Form Component
function FoodExpenseForm({ visitId, onSuccess, onCancel }: { visitId: string; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages',
    restaurant: '',
    location: '',
    numberOfPeople: 1,
    costPerPerson: 0,
    description: '',
    billNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addFoodExpense] = hospitalityApi.useAddFoodExpenseMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addFoodExpense({
        id: visitId,
        expense: formData
      }).unwrap()
      
      toast.success('Food expense added successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add food expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
          <select
            value={formData.mealType}
            onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
            <option value="beverages">Beverages</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
          <input
            type="text"
            value={formData.restaurant}
            onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
          <input
            type="number"
            min="1"
            value={formData.numberOfPeople}
            onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Person (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.costPerPerson}
            onChange={(e) => setFormData({ ...formData, costPerPerson: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number (Optional)</label>
          <input
            type="text"
            value={formData.billNumber}
            onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Cost:</span>
          <span className="text-lg font-semibold text-green-600">
            ₹{(formData.numberOfPeople * formData.costPerPerson).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}

// Transport Expense Form Component
function TransportExpenseForm({ visitId, onSuccess, onCancel }: { visitId: string; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'taxi' as 'taxi' | 'uber' | 'auto' | 'bus' | 'train' | 'flight' | 'fuel' | 'parking',
    from: '',
    to: '',
    cost: 0,
    description: '',
    billNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addTransportationExpense] = hospitalityApi.useAddTransportationExpenseMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addTransportationExpense({
        id: visitId,
        expense: formData
      }).unwrap()
      
      toast.success('Transportation expense added successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add transportation expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transport Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="taxi">Taxi</option>
            <option value="uber">Uber</option>
            <option value="auto">Auto</option>
            <option value="bus">Bus</option>
            <option value="train">Train</option>
            <option value="flight">Flight</option>
            <option value="fuel">Fuel</option>
            <option value="parking">Parking</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="text"
            value={formData.from}
            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="text"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number (Optional)</label>
          <input
            type="text"
            value={formData.billNumber}
            onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}

// Gift Form Component
function GiftForm({ visitId, onSuccess, onCancel }: { visitId: string; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    itemName: '',
    itemType: 'gift' as 'gift' | 'sample' | 'brochure' | 'promotional_material',
    quantity: 1,
    unitCost: 0,
    description: '',
    recipientName: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addGift] = hospitalityApi.useAddGiftMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addGift({
        id: visitId,
        gift: formData
      }).unwrap()
      
      toast.success('Gift added successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add gift')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
          <input
            type="text"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
          <select
            value={formData.itemType}
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="gift">Gift</option>
            <option value="sample">Sample</option>
            <option value="brochure">Brochure</option>
            <option value="promotional_material">Promotional Material</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name (Optional)</label>
          <input
            type="text"
            value={formData.recipientName}
            onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Cost:</span>
          <span className="text-lg font-semibold text-pink-600">
            ₹{(formData.quantity * formData.unitCost).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Adding...' : 'Add Gift'}
        </Button>
      </div>
    </form>
  )
}

// Other Expense Form Component
function OtherExpenseForm({ visitId, onSuccess, onCancel }: { visitId: string; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'communication' as 'communication' | 'printing' | 'stationery' | 'miscellaneous',
    description: '',
    cost: 0,
    billNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addOtherExpense] = hospitalityApi.useAddOtherExpenseMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addOtherExpense({
        id: visitId,
        expense: formData
      }).unwrap()
      
      toast.success('Other expense added successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add other expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="communication">Communication</option>
            <option value="printing">Printing</option>
            <option value="stationery">Stationery</option>
            <option value="miscellaneous">Miscellaneous</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number (Optional)</label>
          <input
            type="text"
            value={formData.billNumber}
            onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}

// Accommodation Form Component
function AccommodationForm({ visitId, onSuccess, onCancel }: { visitId: string; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    hotelName: '',
    hotelAddress: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date().toISOString().split('T')[0],
    roomType: 'single' as 'single' | 'double' | 'suite' | 'deluxe',
    numberOfRooms: 1,
    costPerNight: 0,
    bookingReference: '',
    amenities: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updateCustomerVisit] = hospitalityApi.useUpdateCustomerVisitMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const checkIn = new Date(formData.checkInDate)
      const checkOut = new Date(formData.checkOutDate)
      const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const totalCost = totalNights * formData.numberOfRooms * formData.costPerNight

      await updateCustomerVisit({
        id: visitId,
        data: {
          accommodation: {
            ...formData,
            totalNights,
            totalCost
          }
        }
      }).unwrap()
      
      toast.success('Accommodation details added successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add accommodation details')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
          <input
            type="text"
            value={formData.hotelName}
            onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
          <select
            value={formData.roomType}
            onChange={(e) => setFormData({ ...formData, roomType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="suite">Suite</option>
            <option value="deluxe">Deluxe</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
          <input
            type="date"
            value={formData.checkInDate}
            onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
          <input
            type="date"
            value={formData.checkOutDate}
            onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
          <input
            type="number"
            min="1"
            value={formData.numberOfRooms}
            onChange={(e) => setFormData({ ...formData, numberOfRooms: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Night (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.costPerNight}
            onChange={(e) => setFormData({ ...formData, costPerNight: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference (Optional)</label>
          <input
            type="text"
            value={formData.bookingReference}
            onChange={(e) => setFormData({ ...formData, bookingReference: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Address</label>
          <textarea
            value={formData.hotelAddress}
            onChange={(e) => setFormData({ ...formData, hotelAddress: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Cost:</span>
          <span className="text-lg font-semibold text-purple-600">
            ₹{(() => {
              const checkIn = new Date(formData.checkInDate)
              const checkOut = new Date(formData.checkOutDate)
              const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
              return (totalNights * formData.numberOfRooms * formData.costPerNight).toLocaleString()
            })()}
          </span>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Adding...' : 'Add Accommodation'}
        </Button>
      </div>
    </form>
  )
}
