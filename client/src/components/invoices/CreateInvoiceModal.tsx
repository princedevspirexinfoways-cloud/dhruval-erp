'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { X, Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import {
  useGetCustomersQuery,
  useFindOrCreateCustomerMutation,
  type Customer
} from '@/lib/api/customersApi'
import { useCreateInvoiceMutation } from '@/lib/api/invoicesApi'
import { selectCurrentCompanyId } from '@/lib/features/auth/authSlice'
import toast from 'react-hot-toast'
import { localLabels } from '@/constants/localLabels'

const UNITS = ['PCS', 'MTR', 'YARD', 'KG', 'TON', 'BALE', 'QUINTAL', 'LITRE']

interface LineItem {
  id: string
  description: string
  hsnCode: string
  quantity: number
  unit: string
  rate: number
  taxRate: number
}

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const companyId = useSelector(selectCurrentCompanyId)
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation()
  const [findOrCreateCustomer, { isLoading: findingCustomer }] = useFindOrCreateCustomerMutation()
  const { data: customersData } = useGetCustomersQuery({ limit: 200 }, { skip: !isOpen })
  const customers = customersData?.data || []

  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', hsnCode: '5407', quantity: 0, unit: 'PCS', rate: 0, taxRate: 18 }
  ])
  const [transportCharges, setTransportCharges] = useState(0)
  const [packingCharges, setPackingCharges] = useState(0)
  const [otherCharges, setOtherCharges] = useState(0)
  const [roundOff, setRoundOff] = useState(0)
  const [notes, setNotes] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCustomers = customers.filter(
    (c: Customer) =>
      customerSearch &&
      (c.customerName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.customerCode?.toLowerCase().includes(customerSearch.toLowerCase()))
  )
  const exactMatch = customers.find(
    (c: Customer) => c.customerName?.toLowerCase() === customerSearch.trim().toLowerCase()
  )

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    if (showDropdown) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showDropdown])

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c)
    setCustomerSearch(c.customerName || c.displayName || '')
    setShowDropdown(false)
  }

  const handleSaveNewCustomer = async () => {
    const name = customerSearch.trim()
    if (!name) return
    try {
      const res = await findOrCreateCustomer({
        customerName: name,
        mobile: '',
        email: '',
        gstin: '',
        address: '',
        state: '',
        paymentTerms: '',
        notes: ''
      }).unwrap()
      if (res?.data) {
        setSelectedCustomer(res.data)
        setCustomerSearch(res.data.customerName || res.data.displayName || name)
        setShowDropdown(false)
        toast.success(res.created ? 'Customer created' : 'Customer found')
      }
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || 'Failed to save customer')
    }
  }

  const addLine = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: '',
        hsnCode: '5407',
        quantity: 0,
        unit: 'PCS',
        rate: 0,
        taxRate: 18
      }
    ])
  }

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const removeLine = (id: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((row) => row.id !== id))
  }

  const getPrimaryAddress = (c: Customer) => {
    const addrs = c.addresses as any[]
    if (addrs?.length) {
      const primary = addrs.find((a: any) => a.isPrimary) || addrs[0]
      return {
        addressLine1: primary.addressLine1 || primary.street || '',
        addressLine2: primary.addressLine2 || '',
        city: primary.city || '',
        state: primary.state || '',
        pincode: primary.pincode || primary.zipCode || '',
        country: primary.country || 'India'
      }
    }
    return {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) {
      toast.error('Company not selected')
      return
    }
    if (!selectedCustomer) {
      toast.error('Please select or add a customer')
      return
    }
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0 && i.rate >= 0)
    if (validItems.length === 0) {
      toast.error('Add at least one line item with description, qty and rate')
      return
    }

    const billingAddress = getPrimaryAddress(selectedCustomer)
    const payload = {
      companyId,
      customer: {
        customerId: selectedCustomer._id,
        customerCode: selectedCustomer.customerCode || '',
        customerName: selectedCustomer.customerName || selectedCustomer.displayName || '',
        gstin: (selectedCustomer as any).registrationDetails?.gstin,
        pan: (selectedCustomer as any).registrationDetails?.pan,
        billingAddress,
        contactPerson: (selectedCustomer as any).contactPersons?.[0]?.name,
        phone: selectedCustomer.contactInfo?.primaryPhone,
        email: selectedCustomer.contactInfo?.primaryEmail
      },
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      invoiceType: 'sales',
      invoiceCategory: 'b2b',
      placeOfSupply: billingAddress.state || 'Gujarat',
      items: validItems.map((i) => ({
        description: i.description,
        itemName: i.description,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.rate,
        taxRate: i.taxRate
      })),
      amounts: {
        transportCharges,
        packingCharges,
        otherCharges,
        roundingAdjustment: roundOff
      },
      notes
    }

    try {
      await createInvoice(payload as any).unwrap()
      toast.success('Invoice created')
      onSuccess()
      onClose()
      resetForm()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to create invoice')
    }
  }

  const resetForm = () => {
    setSelectedCustomer(null)
    setCustomerSearch('')
    setDueDate(() => {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      return d.toISOString().slice(0, 10)
    })
    setItems([
      { id: '1', description: '', hsnCode: '5407', quantity: 0, unit: 'PCS', rate: 0, taxRate: 18 }
    ])
    setTransportCharges(0)
    setPackingCharges(0)
    setOtherCharges(0)
    setRoundOff(0)
    setNotes('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create Invoice</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Customer - type-ahead + find-or-create */}
          <div className="space-y-1" ref={dropdownRef}>
            <Label>{localLabels.customer.primary} *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Type name to search or add new customer"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setSelectedCustomer(null)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-8"
                />
                {showDropdown && (customerSearch || filteredCustomers.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-auto">
                    {filteredCustomers.map((c: Customer) => (
                      <div
                        key={c._id}
                        onClick={() => handleSelectCustomer(c)}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        {c.customerName || c.displayName} {c.customerCode && `(${c.customerCode})`}
                      </div>
                    ))}
                    {customerSearch.trim() && !exactMatch && (
                      <button
                        type="button"
                        onClick={handleSaveNewCustomer}
                        disabled={findingCustomer}
                        className="w-full px-3 py-2 text-left text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        {findingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Save &quot;{customerSearch.trim()}&quot; as new customer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Line items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Add line
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left p-2">Product / Design</th>
                    <th className="text-left p-2 w-20">HSN</th>
                    <th className="text-left p-2 w-20">{localLabels.qty.primary}</th>
                    <th className="text-left p-2 w-24">Unit</th>
                    <th className="text-left p-2 w-24">{localLabels.rate.primary}</th>
                    <th className="text-left p-2 w-16">Tax %</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-1">
                        <Input
                          placeholder="Description"
                          value={row.description}
                          onChange={(e) => updateLine(row.id, 'description', e.target.value)}
                          className="h-8"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={row.hsnCode}
                          onChange={(e) => updateLine(row.id, 'hsnCode', e.target.value)}
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          min={0}
                          value={row.quantity || ''}
                          onChange={(e) => updateLine(row.id, 'quantity', e.target.value ? Number(e.target.value) : 0)}
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={row.unit}
                          onChange={(e) => updateLine(row.id, 'unit', e.target.value)}
                          className="h-8 w-24 border rounded px-1"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={row.rate || ''}
                          onChange={(e) => updateLine(row.id, 'rate', e.target.value ? Number(e.target.value) : 0)}
                          className="h-8 w-24"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={row.taxRate}
                          onChange={(e) => updateLine(row.id, 'taxRate', Number(e.target.value) || 0)}
                          className="h-8 w-14"
                        />
                      </td>
                      <td className="p-1">
                        <button
                          type="button"
                          onClick={() => removeLine(row.id)}
                          disabled={items.length <= 1}
                          className="text-red-500 hover:bg-red-50 p-1 rounded disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label>Transport</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={transportCharges || ''}
                onChange={(e) => setTransportCharges(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Packing</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={packingCharges || ''}
                onChange={(e) => setPackingCharges(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Other</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={otherCharges || ''}
                onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Round off</Label>
              <Input
                type="number"
                step={0.01}
                value={roundOff || ''}
                onChange={(e) => setRoundOff(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label>{localLabels.remarks.primary}</Label>
            <textarea
              placeholder="Remarks / Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg p-2 min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
