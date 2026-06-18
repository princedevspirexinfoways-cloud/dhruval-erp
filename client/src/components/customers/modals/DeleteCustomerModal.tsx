import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  X,
  Trash2,
  AlertTriangle,
  User,
  Building2,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { 
  Customer, 
  useDeleteCustomerMutation 
} from '@/lib/features/customers/customersApi'

interface DeleteCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customer: Customer
}

export default function DeleteCustomerModal({ isOpen, onClose, onSuccess, customer }: DeleteCustomerModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const [deleteCustomer, { isLoading }] = useDeleteCustomerMutation()

  const customerName = customer.customerName || customer.name || customer.displayName || 'Customer'
  const expectedConfirmText = `DELETE ${customerName.toUpperCase()}`
  const isConfirmValid = confirmText === expectedConfirmText

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConfirmValid) {
      setError('Please type the exact confirmation text')
      return
    }

    try {
      await deleteCustomer(customer._id).unwrap()
      onSuccess()
    } catch (error: any) {
      setError(error?.data?.message || 'Failed to delete customer')
    }
  }

  const handleConfirmTextChange = (value: string) => {
    setConfirmText(value)
    if (error) setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-red-200 dark:border-gray-700 transition-all duration-300">
        {/* Header */}
        <div className="bg-red-500 p-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Delete Customer
                </h2>
                <p className="text-red-100">
                  This action cannot be undone
                </p>
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
        <div className="p-6">
          {/* Customer Info */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700 mb-6 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-bold text-black dark:text-white text-lg transition-colors duration-300">{customerName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">{customer.contactInfo?.primaryEmail || customer.email || 'No email'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700 transition-all duration-300">
                    {(customer.businessInfo?.businessType || customer.customerType) === 'business' ? (
                      <>
                        <Building2 className="w-3 h-3 mr-1" />
                        Business
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        Individual
                      </>
                    )}
                  </span>
                  {(customer.company || customer.companyId) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 transition-all duration-300">
                      {customer.company || customer.companyId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700 mb-6 transition-all duration-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 transition-colors duration-300" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 transition-colors duration-300">
                  Warning: This action is irreversible
                </p>
                <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 transition-colors duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full transition-colors duration-300"></div>
                    <span>The customer account will be permanently deleted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full transition-colors duration-300"></div>
                    <span>All customer data and order history will be removed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full transition-colors duration-300"></div>
                    <span>Related invoices and transactions may be affected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full transition-colors duration-300"></div>
                    <span>This action cannot be undone</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2 transition-colors duration-300">
                Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-red-600 dark:text-red-400 transition-all duration-300">{expectedConfirmText}</span> to confirm deletion
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => handleConfirmTextChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                  error ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' :
                  confirmText && !isConfirmValid ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
                  isConfirmValid ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' :
                  'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder={expectedConfirmText}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium transition-colors duration-300">{error}</p>
              )}
              {confirmText && !isConfirmValid && !error && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400 font-medium transition-colors duration-300">
                  Text doesn't match. Please type exactly: {expectedConfirmText}
                </p>
              )}
              {isConfirmValid && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 font-medium transition-colors duration-300">
                  Confirmation text matches. You can now delete the customer.
                </p>
              )}
            </div>

            {/* Final Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700 transition-all duration-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 transition-colors duration-300" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300 transition-colors duration-300">
                    Are you absolutely sure?
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1 transition-colors duration-300">
                    This will permanently delete {customerName}'s account and all associated data.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-600 transition-colors duration-300">
              <Button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all duration-300"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading || !isConfirmValid}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Customer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
