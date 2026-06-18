import React from 'react'
import {
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  User,
  DollarSign,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Customer } from '@/lib/features/customers/customersApi'
import clsx from 'clsx'

interface CustomerListProps {
  customers: Customer[]
  isLoading: boolean
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export default function CustomerList({
  customers,
  isLoading,
  onView,
  onEdit,
  onDelete
}: CustomerListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'private_limited':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
      case 'public_limited':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
      case 'proprietorship':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700'
      case 'partnership':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700'
      case 'individual':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
  }

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'private_limited':
      case 'public_limited':
      case 'proprietorship':
      case 'partnership':
        return Building2
      case 'individual':
        return User
      default:
        return Users
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-all duration-300">
        <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors duration-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">No Customers Found</h3>
        <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">No customers match your current filters. Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {customers.map((customer) => {
        const TypeIcon = getCustomerTypeIcon(customer.customerType)
        
        return (
          <div
            key={customer._id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 group overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center border-2 border-blue-200">
                      <span className="text-white font-semibold text-lg">
                        {customer.customerName?.charAt(0)?.toUpperCase() || customer.displayName?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-black dark:text-white truncate transition-colors duration-300">
                        {customer.customerName || customer.displayName || 'Unnamed Customer'}
                      </h3>
                      
                      {customer.customerCode && (
                        <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-700 flex-shrink-0 transition-all duration-300">
                          {customer.customerCode}
                        </span>
                      )}
                      
                      {/* Business Type Badge */}
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        getCustomerTypeColor(customer.businessInfo?.businessType || 'unknown')
                      )}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {customer.businessInfo?.businessType?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                      </span>
                      
                      {/* Industry Badge */}
                      {customer.businessInfo?.industry && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700 transition-all duration-300">
                          {customer.businessInfo.industry}
                        </span>
                      )}

                      {/* Status Badge */}
                      <div className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300',
                        customer.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
                      )}>
                        {customer.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300 mb-3 transition-colors duration-300">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate max-w-xs">{customer.contactInfo?.primaryEmail || 'No email'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{customer.contactInfo?.primaryPhone || 'No phone'}</span>
                      </div>
                      
                      {/* Customer Type */}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="capitalize">{customer.relationship?.customerType || 'Unknown'}</span>
                      </div>
                      
                      {/* Company Information - Show if customer has company */}
                      {customer.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 transition-all duration-300">
                            Company: {customer.company}
                          </span>
                        </div>
                      )}
                      
                      {/* Priority */}
                      {customer.relationship?.priority && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700 transition-all duration-300">
                            {customer.relationship.priority} Priority
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {formatDate(customer.createdAt)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <ShoppingCart className="w-4 h-4" />
                        <span className="font-semibold text-black dark:text-white">{customer.purchaseHistory?.totalOrders || 0}</span>
                        <span className="text-gray-600 dark:text-gray-300">orders</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-black dark:text-white">{formatCurrency(customer.purchaseHistory?.totalOrderValue || 0)}</span>
                        <span className="text-gray-600 dark:text-gray-300">spent</span>
                      </div>
                      
                      {customer.purchaseHistory?.averageOrderValue && customer.purchaseHistory.averageOrderValue > 0 && (
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <span className="text-gray-600 dark:text-gray-300">Avg:</span>
                          <span className="font-semibold text-black dark:text-white">{formatCurrency(customer.purchaseHistory.averageOrderValue)}</span>
                        </div>
                      )}
                      
                      {/* KYC Status */}
                      <div className="flex items-center gap-1">
                        <span className={clsx(
                          'text-xs font-semibold px-2 py-1 rounded-full border transition-all duration-300',
                          customer.compliance?.kycStatus === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
                            : customer.compliance?.kycStatus === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
                        )}>
                          KYC: {customer.compliance?.kycStatus ? customer.compliance.kycStatus.charAt(0).toUpperCase() + customer.compliance.kycStatus.slice(1) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Button
                    onClick={() => onView(customer)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={() => onEdit(customer)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors"
                    title="Edit Customer"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={() => onDelete(customer)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    title="Delete Customer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
