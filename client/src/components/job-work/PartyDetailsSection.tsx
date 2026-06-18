'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetCustomersQuery } from '@/lib/api/customersApi'
import { selectCurrentUser, selectIsSuperAdmin, selectCurrentCompanyId } from '@/lib/features/auth/authSlice'
import { Search, Plus } from 'lucide-react'
import { useModals } from '@/hooks/useModals'
import { PartyFormData } from './types'

interface PartyDetailsSectionProps {
    partyData: PartyFormData
    onPartyChange: (field: keyof PartyFormData, value: string) => void
}

export function PartyDetailsSection({
    partyData,
    onPartyChange
}: PartyDetailsSectionProps) {
    const theme = useSelector((state: RootState) => state.ui.theme)
    const user = useSelector(selectCurrentUser)
    const isSuperAdmin = useSelector(selectIsSuperAdmin)
    const currentCompanyId = useSelector(selectCurrentCompanyId)
    const { openCustomerForm } = useModals()
    const [customerSearch, setCustomerSearch] = useState('')
    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const previousCustomerIdRef = useRef<string>('')

    // Get company ID - super admin can see all, others see their company
    const companyId = isSuperAdmin
        ? undefined // Super admin sees all customers
        : (currentCompanyId || undefined)

    // Fetch customers
    const { data: customersData, isLoading: customersLoading, refetch: refetchCustomers } = useGetCustomersQuery({
        companyId: companyId,
        status: 'active',
        limit: 1000
    }, {
        skip: false
    })

    const customers = customersData?.data || []

    // Filter customers based on search
    const filteredCustomers = customers.filter((customer: any) => {
        if (!customerSearch) return true
        const searchLower = customerSearch.toLowerCase()
        return (
            customer.customerName?.toLowerCase().includes(searchLower) ||
            customer.customerCode?.toLowerCase().includes(searchLower) ||
            customer.contactInfo?.primaryPhone?.toLowerCase().includes(searchLower) ||
            customer.contactInfo?.primaryEmail?.toLowerCase().includes(searchLower) ||
            (customer.businessInfo as any)?.gstNumber?.toLowerCase().includes(searchLower) ||
            (customer as any).gstNumber?.toLowerCase().includes(searchLower)
        )
    })

    // Auto-fill party details when customer is selected (only when customer ID changes)
    useEffect(() => {
        if (selectedCustomerId && selectedCustomerId !== previousCustomerIdRef.current && selectedCustomerId !== 'none' && selectedCustomerId !== 'create') {
            const customer = customers.find((c: any) => c._id === selectedCustomerId)
            if (customer) {
                onPartyChange('partyName', customer.customerName || customer.displayName || '')
                // Get GST number from businessInfo or direct property
                const gstNumber = (customer.businessInfo as any)?.gstNumber || (customer as any).gstNumber || ''
                onPartyChange('partyGstNumber', gstNumber)

                // Get address from customer
                const primaryAddress = customer.addresses?.find((addr: any) => addr.isPrimary) || customer.addresses?.[0]
                if (primaryAddress) {
                    const addressParts = [
                        primaryAddress.street,
                        primaryAddress.city,
                        primaryAddress.state,
                        primaryAddress.pincode,
                        primaryAddress.country
                    ].filter(Boolean)
                    onPartyChange('partyAddress', addressParts.join(', '))
                } else if ((customer as any).address) {
                    onPartyChange('partyAddress', (customer as any).address)
                }
                previousCustomerIdRef.current = selectedCustomerId
            }
        } else if (!selectedCustomerId || selectedCustomerId === 'none') {
            previousCustomerIdRef.current = ''
        }
    }, [selectedCustomerId, customers])

    const handleCustomerSelect = (customerId: string) => {
        if (customerId === 'create') {
            // Open customer create modal
            openCustomerForm({
                onSuccess: async () => {
                    // Refetch customers list after creation
                    const result = await refetchCustomers()
                    const newCustomers = result.data?.data || []
                    // Select the most recently created customer (last in list)
                    if (newCustomers.length > 0) {
                        const newCustomer = newCustomers[newCustomers.length - 1]
                        setSelectedCustomerId(newCustomer._id)
                    }
                }
            })
            return
        }

        setSelectedCustomerId(customerId)
        if (customerId === 'none' || !customerId) {
            // Clear fields if no customer selected
            setSelectedCustomerId('')
            onPartyChange('partyName', '')
            onPartyChange('partyGstNumber', '')
            onPartyChange('partyAddress', '')
            previousCustomerIdRef.current = ''
        }
    }

    return (
        <div className="space-y-4">
            <h3 className={`text-lg font-semibold border-b pb-2 ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>Party Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Selector */}
                <div className="md:col-span-2">
                    <Label className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Select Customer (Optional)
                    </Label>
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                placeholder="Search customers by name, code, phone, email, GST..."
                                className={`pl-10 border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                            />
                        </div>
                        <Select
                            value={selectedCustomerId}
                            onValueChange={handleCustomerSelect}
                        >
                            <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                                <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select Customer to Auto-fill Details"} />
                            </SelectTrigger>
                            <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                                <SelectItem value="create" className={`${theme === 'dark' ? 'text-blue-400 hover:bg-gray-700 hover:text-blue-300' : 'text-blue-600 hover:bg-blue-50'} font-medium`}>
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        <span>Add/Create New Customer</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="none" className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                    <span className="text-gray-500">None (Enter manually)</span>
                                </SelectItem>
                                {filteredCustomers.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-gray-500">
                                        {customersLoading ? 'Loading...' : 'No customers found'}
                                    </div>
                                ) : (
                                    filteredCustomers.map((customer: any) => (
                                        <SelectItem key={customer._id} value={customer._id} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{customer.customerName || customer.displayName || customer.customerCode}</span>
                                                <span className="text-xs text-gray-500">
                                                    {customer.customerCode}
                                                    {customer.contactInfo?.primaryPhone && ` • ${customer.contactInfo.primaryPhone}`}
                                                    {((customer.businessInfo as any)?.gstNumber || (customer as any).gstNumber) && ` • GST: ${(customer.businessInfo as any)?.gstNumber || (customer as any).gstNumber}`}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {selectedCustomerId && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                                ✓ Customer selected - Details auto-filled below
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Label htmlFor="partyName" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Party Name
                    </Label>
                    <Input
                        id="partyName"
                        value={partyData.partyName}
                        onChange={(e) => onPartyChange('partyName', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Party Name"
                    />
                </div>

                <div>
                    <Label htmlFor="partyGstNumber" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Party GST Number
                    </Label>
                    <Input
                        id="partyGstNumber"
                        value={partyData.partyGstNumber}
                        onChange={(e) => onPartyChange('partyGstNumber', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter GST Number"
                    />
                </div>

                <div className="md:col-span-2">
                    <Label htmlFor="partyAddress" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Address
                    </Label>
                    <Textarea
                        id="partyAddress"
                        value={partyData.partyAddress}
                        onChange={(e) => onPartyChange('partyAddress', e.target.value)}
                        className={`border-2 border-sky-200 min-h-[80px] ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Party Address"
                    />
                </div>
            </div>
        </div>
    )
}
