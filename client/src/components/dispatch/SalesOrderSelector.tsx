'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Search } from 'lucide-react'
import { SalesOrder } from '@/lib/api/salesApi'
import { Customer } from '@/lib/api/customersApi'

interface SalesOrderSelectorProps {
  salesOrders: SalesOrder[]
  customers: Customer[]
  onSalesOrderSelect: (salesOrder: SalesOrder, customer: Customer) => void
}

export const SalesOrderSelector = ({
  salesOrders,
  customers,
  onSalesOrderSelect
}: SalesOrderSelectorProps) => {
  const [salesOrderSearch, setSalesOrderSearch] = useState('')

  // Filter sales orders based on search and only show pending orders
  const filteredSalesOrders = salesOrders.filter(order => {
    const searchLower = salesOrderSearch.toLowerCase()
    const orderCustomer = customers.find(c => c._id === order.customerId)
    const matchesSearch = salesOrderSearch === '' || 
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      orderCustomer?.customerName?.toLowerCase().includes(searchLower) ||
      orderCustomer?.displayName?.toLowerCase().includes(searchLower) ||
      orderCustomer?.customerCode?.toLowerCase().includes(searchLower) ||
      order.orderSummary?.finalAmount?.toString().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerCode?.toLowerCase().includes(searchLower)
    
    // Only show orders that are not already dispatched
    const isNotDispatched = order.status !== 'dispatched' && order.status !== 'delivered'
    
    return matchesSearch && isNotDispatched
  })

  if (salesOrders.length === 0) {
    return null
  }

  return (
    <div className="bg-yellow-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        📋 Sales Orders Pending Delivery ({filteredSalesOrders.length} of {salesOrders.length})
      </h3>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Select a sales order to auto-fill customer and delivery details:
        </p>
        
        {/* Search Sales Orders */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sales orders by order #, customer name, amount..."
            value={salesOrderSearch}
            onChange={(e) => setSalesOrderSearch(e.target.value)}
            className="pl-10"
          />
          {salesOrderSearch && (
            <button
              onClick={() => setSalesOrderSearch('')}
              className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        
        <select
          value=""
          onChange={(e) => {
            const selectedOrder = filteredSalesOrders.find(order => order._id === e.target.value)
            if (selectedOrder) {
              const orderCustomer = customers.find(c => c._id === selectedOrder.customerId)
              if (orderCustomer) {
                onSalesOrderSelect(selectedOrder, orderCustomer)
              }
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a sales order to auto-fill details...</option>
          {filteredSalesOrders.map((order) => {
            const orderCustomer = customers.find(c => c._id === order.customerId)
            return (
              <option key={order._id} value={order._id}>
                📦 {order.orderNumber} - {orderCustomer?.customerName || orderCustomer?.displayName || 'Unknown Customer'}
                {order.orderSummary?.finalAmount && ` (₹${order.orderSummary.finalAmount})`}
              </option>
            )
          })}
        </select>
      </div>
    </div>
  )
}
