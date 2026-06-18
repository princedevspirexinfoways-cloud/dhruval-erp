'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Ruler, Plus, Search, Edit, Trash2, RefreshCw, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useGetUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} from '@/features/unit/api/unitApi'
import { Unit, CreateUnitRequest, UpdateUnitRequest } from '@/features/unit/types/unit.types'
import { useToast } from '@/components/ui/use-toast'
import { RootState } from '@/lib/store'
import { Loader2 } from 'lucide-react'

export default function UnitsPage() {
  const { toast } = useToast()
  const theme = useSelector((state: RootState) => state.ui?.theme || 'light')
  const companyId = useSelector((state: RootState) =>
    state.auth.currentCompanyId ||
    state.auth.user?.companyAccess?.[0]?.companyId ||
    state.auth.user?.currentCompanyId
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateUnitRequest>({
    name: '',
    symbol: '',
    description: '',
    baseUnit: '',
    conversionFactor: 1,
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch units
  const {
    data: unitsData,
    isLoading,
    error,
    refetch,
  } = useGetUnitsQuery(
    companyId
      ? { companyId: companyId.toString(), includeInactive: showInactive }
      : { includeInactive: showInactive },
    { skip: !companyId }
  )

  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation()
  const [updateUnit, { isLoading: isUpdating }] = useUpdateUnitMutation()
  const [deleteUnit, { isLoading: isDeleting }] = useDeleteUnitMutation()

  const units = unitsData?.data || []
  const total = unitsData?.total || 0

  // Filter units based on search term
  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    return matchesSearch && (showInactive || unit.isActive)
  })

  const handleCreateClick = () => {
    setFormData({
      name: '',
      symbol: '',
      description: '',
      baseUnit: '',
      conversionFactor: 1,
    })
    setSelectedUnit(null)
    setShowCreateModal(true)
  }

  const handleEditClick = (unit: Unit) => {
    setSelectedUnit(unit)
    setFormData({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description || '',
      baseUnit: unit.baseUnit || '',
      conversionFactor: unit.conversionFactor,
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = async (unit: Unit) => {
    if (
      window.confirm(
        `Are you sure you want to delete the unit "${unit.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteUnit(unit._id).unwrap()
        toast({
          title: 'Success',
          description: 'Unit deleted successfully',
          variant: 'success',
        })
        refetch()
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error?.data?.message || 'Failed to delete unit',
          variant: 'destructive',
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedUnit) {
        // Update existing unit
        const updateData: UpdateUnitRequest = {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          baseUnit: formData.baseUnit,
          conversionFactor: formData.conversionFactor,
        }
        await updateUnit({ id: selectedUnit._id, data: updateData }).unwrap()
        toast({
          title: 'Success',
          description: 'Unit updated successfully',
          variant: 'success',
        })
      } else {
        // Create new unit
        const createData: CreateUnitRequest = {
          ...formData,
          ...(companyId && { companyId: companyId.toString() }),
        }
        await createUnit(createData).unwrap()
        toast({
          title: 'Success',
          description: 'Unit created successfully',
          variant: 'success',
        })
      }

      setShowCreateModal(false)
      setShowEditModal(false)
      setSelectedUnit(null)
      setFormData({
        name: '',
        symbol: '',
        description: '',
        baseUnit: '',
        conversionFactor: 1,
      })
      refetch()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to save unit',
        variant: 'destructive',
      })
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedUnit(null)
    setFormData({
      name: '',
      symbol: '',
      description: '',
      baseUnit: '',
      conversionFactor: 1,
    })
  }

  if (!isClient) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Unit Management"
          description={`Manage measurement units for inventory items (${total} units)`}
          icon={<Ruler className="h-6 w-6" />}
          variant="indigo"
        >
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className="bg-white text-indigo-600 hover:bg-gray-50"
              onClick={handleCreateClick}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </PageHeader>

        {/* Search and Filters */}
        <div
          className={`rounded-lg border p-4 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search units by name, symbol, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label
                htmlFor="showInactive"
                className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
              >
                Show inactive
              </Label>
            </div>
          </div>
        </div>

        {/* Units Table */}
        <div
          className={`rounded-lg border overflow-hidden ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>
                Failed to load units. Please try again.
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="p-12 text-center">
              <Ruler className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                {searchTerm
                  ? 'No units found matching your search.'
                  : 'No units found. Create your first unit to get started.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow
                  className={
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-700'
                      : 'bg-gray-50 hover:bg-gray-50'
                  }
                >
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Base Unit</TableHead>
                  <TableHead>Conversion Factor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <TableRow key={unit._id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <code
                        className={`px-2 py-1 rounded text-sm ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-gray-200'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {unit.symbol}
                      </code>
                    </TableCell>
                    <TableCell>
                      {unit.description || (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>{unit.baseUnit || '-'}</TableCell>
                    <TableCell>{unit.conversionFactor}</TableCell>
                    <TableCell>
                      <Badge
                        variant={unit.isActive ? 'success' : 'secondary'}
                      >
                        {unit.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(unit)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(unit)}
                          disabled={isDeleting}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create Unit Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent
            className={`sm:max-w-[500px] ${
              theme === 'dark'
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            <DialogHeader>
              <DialogTitle
                className={theme === 'dark' ? 'text-white' : 'text-gray-900'}
              >
                Create New Unit
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label
                    htmlFor="name"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Unit Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Meters, Kilograms"
                    required
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="symbol"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Symbol *
                  </Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value })
                    }
                    placeholder="e.g., m, kg"
                    required
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of this unit"
                    rows={3}
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="baseUnit"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Base Unit
                  </Label>
                  <Input
                    id="baseUnit"
                    value={formData.baseUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUnit: e.target.value })
                    }
                    placeholder="e.g., kg, meter"
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="conversionFactor"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Conversion Factor
                  </Label>
                  <Input
                    id="conversionFactor"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.conversionFactor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conversionFactor: parseFloat(e.target.value) || 1,
                      })
                    }
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                  <p
                    className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Factor to convert to base unit (e.g., 0.001 for gram to kg)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isCreating}
                  className={
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                      : ''
                  }
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Unit'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Unit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent
            className={`sm:max-w-[500px] ${
              theme === 'dark'
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            <DialogHeader>
              <DialogTitle
                className={theme === 'dark' ? 'text-white' : 'text-gray-900'}
              >
                Edit Unit
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label
                    htmlFor="edit-name"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Unit Name *
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Meters, Kilograms"
                    required
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-symbol"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Symbol *
                  </Label>
                  <Input
                    id="edit-symbol"
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value })
                    }
                    placeholder="e.g., m, kg"
                    required
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-description"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of this unit"
                    rows={3}
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-baseUnit"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Base Unit
                  </Label>
                  <Input
                    id="edit-baseUnit"
                    value={formData.baseUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUnit: e.target.value })
                    }
                    placeholder="e.g., kg, meter"
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-conversionFactor"
                    className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Conversion Factor
                  </Label>
                  <Input
                    id="edit-conversionFactor"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.conversionFactor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conversionFactor: parseFloat(e.target.value) || 1,
                      })
                    }
                    className={
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }
                  />
                  <p
                    className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Factor to convert to base unit (e.g., 0.001 for gram to kg)
                  </p>
                </div>

                {selectedUnit && (
                  <div>
                    <Label
                      htmlFor="edit-isActive"
                      className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                    >
                      Status
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="edit-isActive"
                        checked={selectedUnit.isActive}
                        onChange={async (e) => {
                          try {
                            await updateUnit({
                              id: selectedUnit._id,
                              data: { isActive: e.target.checked },
                            }).unwrap()
                            toast({
                              title: 'Success',
                              description: `Unit ${e.target.checked ? 'activated' : 'deactivated'} successfully`,
                              variant: 'success',
                            })
                            refetch()
                          } catch (error: any) {
                            toast({
                              title: 'Error',
                              description: error?.data?.message || 'Failed to update unit status',
                              variant: 'destructive',
                            })
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label
                        htmlFor="edit-isActive"
                        className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                      >
                        Active
                      </Label>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isUpdating}
                  className={
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                      : ''
                  }
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Unit'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
