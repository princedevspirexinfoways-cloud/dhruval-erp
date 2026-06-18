import React from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Calendar,
  Edit,
  CheckCircle,
  XCircle,
  DollarSign,
  ShoppingCart,
  FileText,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Customer } from '@/lib/features/customers/customersApi'
import { useModals } from '@/hooks/useModals'
import clsx from 'clsx'

interface CustomerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  onEdit?: () => void
}

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  customer,
  onEdit
}: CustomerDetailsModalProps) {
  const { openCustomerForm } = useModals()

  if (!isOpen) return null

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      onClose()
      openCustomerForm({ customer })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
        {/* Header */}
        <div className="bg-blue-500 p-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
                  <span className="text-white font-bold text-2xl">
                    {(customer.customerName || customer.name || customer.displayName || 'C').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {customer.customerName || customer.name || customer.displayName || 'Unnamed Customer'}
                </h2>
                <div className="flex items-center gap-3">
                  {customer.customerCode && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white border border-white/30">
                      {customer.customerCode}
                    </span>
                  )}
                  
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white border border-white/30">
                    <Building2 className="w-4 h-4 mr-1" />
                    {(customer.businessInfo?.businessType || customer.customerType || 'Unknown').charAt(0).toUpperCase() + (customer.businessInfo?.businessType || customer.customerType || 'Unknown').slice(1)}
                  </span>
                  
                  <span className={clsx(
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border border-white/30',
                    customer.isActive
                                      ? 'bg-green-500/80 text-white'
                : 'bg-red-500/80 text-white'
                  )}>
                    {customer.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors bg-transparent border-0"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 transition-all duration-300">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center transition-colors duration-300">
                <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 transition-all duration-300">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Email</p>
                    <p className="text-black dark:text-white font-semibold transition-colors duration-300">{customer.contactInfo?.primaryEmail || customer.email || 'No email'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 transition-all duration-300">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Phone</p>
                    <p className="text-black dark:text-white font-semibold transition-colors duration-300">{customer.contactInfo?.primaryPhone || customer.phone || 'No phone'}</p>
                  </div>
                </div>
                
                {(customer.company || customer.companyId) && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 transition-all duration-300">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Company</p>
                      <p className="text-black dark:text-white font-semibold transition-colors duration-300">{customer.company || customer.companyId}</p>
                    </div>
                  </div>
                )}
                
                {customer.contactPerson && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 transition-all duration-300">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Contact Person</p>
                      <p className="text-black dark:text-white font-semibold transition-colors duration-300">{customer.contactPerson}</p>
                    </div>
                  </div>
                )}
                
                {(customer.contactInfo?.website || customer.website) && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 transition-all duration-300">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Website</p>
                      <a 
                        href={customer.contactInfo?.website || customer.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline break-all transition-colors duration-300"
                      >
                        {customer.contactInfo?.website || customer.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            {(customer.address || customer.addresses?.length) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700 transition-all duration-300">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center transition-colors duration-300">
                  <MapPin className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400 transition-colors duration-300" />
                  Address Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-yellow-100 dark:border-gray-600 transition-all duration-300">
                    <h4 className="font-semibold text-black dark:text-white mb-2 transition-colors duration-300">Primary Address</h4>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 transition-colors duration-300">
                      {(customer.address?.street || customer.addresses?.[0]?.street) && <p>{customer.address?.street || customer.addresses?.[0]?.street}</p>}
                      <p>
                        {[customer.address?.city || customer.addresses?.[0]?.city, customer.address?.state || customer.addresses?.[0]?.state].filter(Boolean).join(', ')}
                        {(customer.address?.zipCode || customer.addresses?.[0]?.zipCode) && ` - ${customer.address?.zipCode || customer.addresses?.[0]?.zipCode}`}
                      </p>
                      {(customer.address?.country || customer.addresses?.[0]?.country) && <p>{customer.address?.country || customer.addresses?.[0]?.country}</p>}
                    </div>
                  </div>
                  
                  {(customer.billingAddress || customer.addresses?.find(addr => addr.addressType === 'billing')) && (
                    <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-yellow-100 dark:border-gray-600 transition-all duration-300">
                      <h4 className="font-semibold text-black dark:text-white mb-2 transition-colors duration-300">Billing Address</h4>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 transition-colors duration-300">
                        {(customer.billingAddress?.street || customer.addresses?.find(addr => addr.addressType === 'billing')?.street) && <p>{customer.billingAddress?.street || customer.addresses?.find(addr => addr.addressType === 'billing')?.street}</p>}
                        <p>
                          {[customer.billingAddress?.city || customer.addresses?.find(addr => addr.addressType === 'billing')?.city, customer.billingAddress?.state || customer.addresses?.find(addr => addr.addressType === 'billing')?.state].filter(Boolean).join(', ')}
                          {(customer.billingAddress?.zipCode || customer.addresses?.find(addr => addr.addressType === 'billing')?.zipCode) && ` - ${customer.billingAddress?.zipCode || customer.addresses?.find(addr => addr.addressType === 'billing')?.zipCode}`}
                        </p>
                        {(customer.billingAddress?.country || customer.addresses?.find(addr => addr.addressType === 'billing')?.country) && <p>{customer.billingAddress?.country || customer.addresses?.find(addr => addr.addressType === 'billing')?.country}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Statistics */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 transition-all duration-300">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center transition-colors duration-300">
                <ShoppingCart className="w-5 h-5 mr-2 text-green-600 dark:text-green-400 transition-colors duration-300" />
                Business Statistics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg border border-green-100 dark:border-gray-600 transition-all duration-300">
                  <ShoppingCart className="w-8 h-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-white transition-colors duration-300">{customer.purchaseHistory?.totalOrders || customer.totalOrders || 0}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Total Orders</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg border border-green-100 dark:border-gray-600 transition-all duration-300">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-white transition-colors duration-300">{formatCurrency(customer.purchaseHistory?.totalOrderValue || customer.totalSpent || 0)}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Total Spent</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg border border-green-100 dark:border-gray-600 transition-all duration-300">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-white transition-colors duration-300">{formatCurrency(customer.purchaseHistory?.averageOrderValue || customer.averageOrderValue || 0)}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Avg Order Value</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 transition-all duration-300">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center transition-colors duration-300">
                <Calendar className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400 transition-colors duration-300" />
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 transition-all duration-300">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Created</p>
                    <p className="text-black dark:text-white font-semibold transition-colors duration-300">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
                
                {(customer.lastOrderDate || customer.purchaseHistory?.lastOrderDate) && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 transition-all duration-300">
                    <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Last Order</p>
                      <p className="text-black dark:text-white font-semibold transition-colors duration-300">{formatDate(customer.lastOrderDate || customer.purchaseHistory?.lastOrderDate || customer.createdAt)}</p>
                    </div>
                  </div>
                )}
                
                {(customer.creditLimit || customer.financialInfo?.creditLimit) && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 transition-all duration-300">
                    <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Credit Limit</p>
                      <p className="text-black dark:text-white font-semibold transition-colors duration-300">{formatCurrency(customer.financialInfo?.creditLimit || customer.creditLimit || 0)}</p>
                    </div>
                  </div>
                )}
                
                {(customer.paymentTerms || customer.financialInfo?.paymentTerms) && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 transition-all duration-300">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Payment Terms</p>
                      <p className="text-black dark:text-white font-semibold transition-colors duration-300">{customer.financialInfo?.paymentTerms || customer.paymentTerms}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            {(customer.notes || customer.tags?.length) && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700 transition-all duration-300">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center transition-colors duration-300">
                  <FileText className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                  Additional Information
                </h3>
                
                <div className="space-y-4">
                  {customer.notes && (
                    <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-purple-100 dark:border-gray-600 transition-all duration-300">
                      <h4 className="font-semibold text-black dark:text-white mb-2 transition-colors duration-300">Notes</h4>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap transition-colors duration-300">{customer.notes}</p>
                    </div>
                  )}
                  
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-purple-100 dark:border-gray-600 transition-all duration-300">
                      <h4 className="font-semibold text-black dark:text-white mb-2 flex items-center transition-colors duration-300">
                        <Tag className="w-4 h-4 mr-1" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {customer.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700 transition-all duration-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600 transition-colors duration-300">
            <Button
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Customer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
