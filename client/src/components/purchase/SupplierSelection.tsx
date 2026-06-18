'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetSuppliersQuery } from '@/lib/api/suppliersApi'
import { useGetAgentsQuery } from '@/lib/api/agentsApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { Truck, User } from 'lucide-react'
import { PurchaseOrderFormData } from './PurchaseOrderForm'

interface SupplierSelectionProps {
  formData: PurchaseOrderFormData
  updateFormData: (updates: Partial<PurchaseOrderFormData>) => void
}

export function SupplierSelection({ formData, updateFormData }: SupplierSelectionProps) {
  const user = useSelector(selectCurrentUser)
  const userCompanyId = user?.companyAccess?.[0]?.companyId

  // Track the selected type locally
  const [selectedType, setSelectedType] = useState<'supplier' | 'agent'>(
    formData.selectedSupplierId ? 'supplier' : (formData.selectedAgentId ? 'agent' : 'supplier')
  )

  const { data: suppliersData } = useGetSuppliersQuery({
    page: 1,
    limit: 100
  })

  const suppliers = suppliersData?.data?.data || []

  // Get agents for the selected company
  const { data: agentsData } = useGetAgentsQuery(
    {
      page: 1,
      limit: 100,
      status: 'all'
    },
    { skip: !formData.selectedCompanyId && !userCompanyId }
  )
  const agents = (agentsData?.data?.data || agentsData?.data || []) as any[]

  // Handle supplier/agent type selection
  const handleTypeChange = (type: 'supplier' | 'agent') => {
    console.log('handleTypeChange called with:', type)

    if (type === 'supplier') {
      // Clear agent when selecting supplier
      setSelectedType('supplier')
      updateFormData({
        selectedAgentId: undefined,
        selectedAgent: null,
        // Keep existing supplier if any, otherwise leave empty
      })
    } else if (type === 'agent') {
      // Clear supplier when selecting agent
      setSelectedType('agent')
      updateFormData({
        selectedSupplierId: '',
        selectedSupplier: null,
        // Keep existing agent if any, otherwise leave empty
      })
    }
  }

  // Sync selectedType with formData when it changes externally
  useEffect(() => {
    if (formData.selectedSupplierId) {
      setSelectedType('supplier')
    } else if (formData.selectedAgentId) {
      setSelectedType('agent')
    }
  }, [formData.selectedSupplierId, formData.selectedAgentId])

  // Determine current type - use local state for immediate UI update
  const currentType = selectedType

  // Handle supplier selection
  useEffect(() => {
    if (formData.selectedSupplierId) {
      const supplier = suppliers.find(s => s._id === formData.selectedSupplierId)
      if (supplier && (!formData.selectedSupplier || formData.selectedSupplier._id !== supplier._id)) {
        updateFormData({ selectedSupplier: supplier })
      }
    } else if (formData.selectedSupplier) {
      updateFormData({ selectedSupplier: null })
    }
  }, [formData.selectedSupplierId, suppliers, formData.selectedSupplier, updateFormData])

  // Handle agent selection
  useEffect(() => {
    if (formData.selectedAgentId) {
      const agent = agents.find(a => a._id === formData.selectedAgentId)
      if (agent && (!formData.selectedAgent || formData.selectedAgent._id !== agent._id)) {
        updateFormData({ selectedAgent: agent })
      }
    } else if (formData.selectedAgent) {
      updateFormData({ selectedAgent: null })
    }
  }, [formData.selectedAgentId, agents, formData.selectedAgent, updateFormData])

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Truck className="h-5 w-5" />
          Supplier / Agent Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Type Selection - Either Supplier OR Agent */}
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-white">Select Type *</Label>
            <Select
              value={currentType}
              onValueChange={(value) => {
                console.log('Type changed to:', value)
                if (value === 'supplier' || value === 'agent') {
                  handleTypeChange(value)
                }
              }}
            >
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg" position="popper">
                <SelectItem
                  value="supplier"
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                >
                  Supplier
                </SelectItem>
                <SelectItem
                  value="agent"
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                >
                  Agent
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Supplier Selection */}
          {currentType === 'supplier' && (
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Select Supplier *</Label>
              <Select
                value={formData.selectedSupplierId || 'none'}
                onValueChange={(value) => {
                  console.log('Supplier selected:', value)
                  if (value === 'none') {
                    updateFormData({ selectedSupplierId: '', selectedSupplier: null })
                  } else {
                    const supplier = suppliers.find(s => s._id === value)
                    if (supplier) {
                      updateFormData({ selectedSupplierId: value, selectedSupplier: supplier })
                    }
                  }
                }}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                  <SelectItem value="none" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                    None
                  </SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier._id || ''} value={supplier._id || ''} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                      {supplier.supplierName} ({supplier.supplierCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.selectedSupplier && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mt-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier Code</Label>
                    <p className="text-sm text-gray-900 dark:text-white">{formData.selectedSupplier.supplierCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Person</Label>
                    <p className="text-sm text-gray-900 dark:text-white">{formData.selectedSupplier.contactPersons?.[0]?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                    <p className="text-sm text-gray-900 dark:text-white">{formData.selectedSupplier.contactInfo?.primaryPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                    <p className="text-sm text-gray-900 dark:text-white">{formData.selectedSupplier.contactInfo?.primaryEmail || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agent Selection */}
          {currentType === 'agent' && (
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Select Agent *</Label>
              <Select
                value={formData.selectedAgentId || 'none'}
                onValueChange={(value) => {
                  console.log('Agent selected:', value)
                  if (value === 'none') {
                    updateFormData({ selectedAgentId: undefined, selectedAgent: null })
                  } else {
                    const agent = agents.find(a => a._id === value)
                    if (agent) {
                      updateFormData({ selectedAgentId: value, selectedAgent: agent })
                    }
                  }
                }}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent className="!z-[10060] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                  <SelectItem value="none" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                    None
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem
                      key={agent._id}
                      value={agent._id}
                      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {agent.agentName} ({agent.contactInfo?.primaryPhone || 'No phone'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.selectedAgent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Agent Name</Label>
                    <p className="text-sm text-gray-900 dark:text-white">{formData.selectedAgent.agentName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Number</Label>
                    <p className="text-sm text-gray-900 dark:text-white">{formData.selectedAgent.contactInfo?.primaryPhone || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
