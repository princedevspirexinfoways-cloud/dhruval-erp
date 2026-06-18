'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { useGetCustomersQuery } from '@/lib/api/customersApi'
import { selectIsSuperAdmin, selectCurrentCompanyId } from '@/lib/features/auth/authSlice'
import { Search, X } from 'lucide-react'

interface CustomerSearchInputProps {
    value: string
    customerId?: string // Optional: customerId to sync with component
    onChange: (partyName: string, customerId: string) => void
    label?: string
    required?: boolean
    placeholder?: string
    className?: string
}

export function CustomerSearchInput({
    value,
    customerId: propCustomerId,
    onChange,
    label = 'Party Name',
    required = false,
    placeholder = 'Search customer...',
    className = ''
}: CustomerSearchInputProps) {
    const isSuperAdmin = useSelector(selectIsSuperAdmin)
    const currentCompanyId = useSelector(selectCurrentCompanyId)
    const [customerSearch, setCustomerSearch] = useState('')
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Sync customerSearch and selectedCustomerId with props when they change externally (e.g., from lot auto-fill)
    useEffect(() => {
        if (value && value !== customerSearch) {
            setCustomerSearch(value)
        }
        if (propCustomerId && propCustomerId !== selectedCustomerId) {
            setSelectedCustomerId(propCustomerId)
        }
    }, [value, propCustomerId])

    // Get company ID for customer search
    const companyId = isSuperAdmin ? undefined : (currentCompanyId || undefined)

    // Fetch customers for search
    const { data: customersData } = useGetCustomersQuery({
        companyId: companyId,
        status: 'active',
        limit: 1000
    }, {
        skip: false
    })

    const customers = customersData?.data || []

    // Filter customers based on search
    const filteredCustomers = customers.filter((customer: any) => {
        if (!customerSearch) return false
        const searchLower = customerSearch.toLowerCase()
        return (
            customer.customerName?.toLowerCase().includes(searchLower) ||
            customer.customerCode?.toLowerCase().includes(searchLower) ||
            customer.contactInfo?.primaryPhone?.toLowerCase().includes(searchLower) ||
            customer.contactInfo?.primaryEmail?.toLowerCase().includes(searchLower)
        )
    })

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false)
            }
        }

        if (showCustomerDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showCustomerDropdown])

    const handleCustomerSelect = (customer: any) => {
        const customerName = customer.customerName || customer.displayName || ''
        setSelectedCustomerId(customer._id || '')
        setCustomerSearch(customerName)
        setShowCustomerDropdown(false)
        onChange(customerName, customer._id || '')
    }

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && <Label>{label} {required && '*'}</Label>}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    value={customerSearch || value}
                    onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        onChange(e.target.value, '') // Clear customerId when manually typing
                        setSelectedCustomerId('')
                        setShowCustomerDropdown(e.target.value.length > 0)
                    }}
                    onFocus={() => {
                        if (customerSearch || value) {
                            setShowCustomerDropdown(true)
                        }
                    }}
                    placeholder={placeholder}
                    className="pl-10"
                    required={required}
                />
                {customerSearch && (
                    <button
                        type="button"
                        onClick={() => {
                            setCustomerSearch('')
                            onChange('', '')
                            setSelectedCustomerId('')
                            setShowCustomerDropdown(false)
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.map((customer: any) => (
                        <div
                            key={customer._id}
                            onClick={() => handleCustomerSelect(customer)}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                        >
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                {customer.customerName || customer.displayName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {customer.customerCode && `Code: ${customer.customerCode}`}
                                {customer.contactInfo?.primaryPhone && ` | Phone: ${customer.contactInfo.primaryPhone}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

