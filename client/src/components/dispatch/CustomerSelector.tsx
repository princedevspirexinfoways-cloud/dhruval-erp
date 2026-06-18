'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Search } from 'lucide-react'
import { Customer } from '@/lib/api/customersApi'

interface CustomerSelectorProps {
  customers: Customer[]
  selectedCustomerId: string
  onCustomerSelect: (customer: Customer) => void
  disabled?: boolean
  companyId?: string
}

export const CustomerSelector = ({
  customers,
  selectedCustomerId,
  onCustomerSelect,
  disabled = false,
  companyId
}: CustomerSelectorProps) => {
  const [customerSearch, setCustomerSearch] = useState('')

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase()
    return customerSearch === '' || 
      customer.customerName?.toLowerCase().includes(searchLower) ||
      customer.displayName?.toLowerCase().includes(searchLower) ||
      customer.customerCode?.toLowerCase().includes(searchLower) ||
      customer.contactInfo?.primaryPhone?.toLowerCase().includes(searchLower) ||
      customer.contactInfo?.primaryEmail?.toLowerCase().includes(searchLower) ||
      customer.contactInfo?.alternatePhone?.toLowerCase().includes(searchLower) ||
      customer.contactInfo?.alternateEmail?.toLowerCase().includes(searchLower)
  })

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId)

  return (
    <div className="space-y-3">
      {/* Customer Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers by name, code, phone, email..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
        {customerSearch && (
          <button
            onClick={() => setCustomerSearch('')}
            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Customer Selection */}
      <select
        value={selectedCustomerId}
        onChange={(e) => {
          const selectedCustomer = filteredCustomers.find(c => c._id === e.target.value)
          if (selectedCustomer) {
            onCustomerSelect(selectedCustomer)
            setCustomerSearch('')
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled}
      >
        <option value="">
          {disabled ? 'Select company first' : `Select customer (${filteredCustomers.length} found)`}
        </option>
        {filteredCustomers.map((customer) => (
          <option key={`customer-${customer._id}`} value={customer._id}>
            👤 {customer.customerName || customer.displayName} - {customer.customerCode} 
            {customer.contactInfo?.primaryPhone && ` 📞 ${customer.contactInfo.primaryPhone}`}
            {customer.contactInfo?.primaryEmail && ` 📧 ${customer.contactInfo.primaryEmail}`}
          </option>
        ))}
      </select>
      
      {/* Selected Customer Details */}
      {selectedCustomer && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Customer Details:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-1 font-medium">{selectedCustomer.customerName || selectedCustomer.displayName}</span>
            </div>
            <div>
              <span className="text-gray-600">Code:</span>
              <span className="ml-1 font-medium">{selectedCustomer.customerCode}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="ml-1 font-medium">{selectedCustomer.contactInfo?.primaryPhone || 'Not available'}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-1 font-medium">{selectedCustomer.contactInfo?.primaryEmail || 'Not available'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
