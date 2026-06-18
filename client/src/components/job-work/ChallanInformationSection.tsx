'use client'

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/Button'
import { ChallanFormData, JobWorkFormErrors } from './types'
import { UNITS } from './constants'
import { QuickCreateCategory } from '@/components/inventory/QuickCreateCategory'
import { QuickCreateSubcategory } from '@/components/inventory/QuickCreateSubcategory'
import { QuickCreateUnit } from '@/components/inventory/QuickCreateUnit'
import { Plus } from 'lucide-react'

interface ChallanInformationSectionProps {
    challanData: ChallanFormData
    quantity: number
    unit: string
    categories: any[]
    subcategories: any[]
    units: any[]
    errors: JobWorkFormErrors
    onChallanChange: (field: keyof ChallanFormData, value: any) => void
    onQuantityChange: (value: number) => void
    onUnitChange: (value: string) => void
    onCategoryChange: (value: string) => void
    onSubcategoryChange: (value: string) => void
    onCategoryCreated?: (categoryId: string) => void
    onSubcategoryCreated?: (subcategoryId: string) => void
    onUnitCreated?: (unitId: string) => void
}

export function ChallanInformationSection({
    challanData,
    quantity,
    unit,
    categories,
    subcategories,
    units,
    errors,
    onChallanChange,
    onQuantityChange,
    onUnitChange,
    onCategoryChange,
    onSubcategoryChange,
    onCategoryCreated,
    onSubcategoryCreated,
    onUnitCreated
}: ChallanInformationSectionProps) {
    const theme = useSelector((state: RootState) => state.ui.theme)
    const [showCategoryDialog, setShowCategoryDialog] = useState(false)
    const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false)
    const [showUnitDialog, setShowUnitDialog] = useState(false)

    const handleCategoryCreated = (categoryId: string) => {
        onCategoryChange(categoryId)
        if (onCategoryCreated) {
            onCategoryCreated(categoryId)
        }
    }

    const handleSubcategoryCreated = (subcategoryId: string) => {
        onSubcategoryChange(subcategoryId)
        if (onSubcategoryCreated) {
            onSubcategoryCreated(subcategoryId)
        }
    }

    const handleUnitCreated = async (unitId: string) => {
        if (onUnitCreated) {
            await onUnitCreated(unitId)
        }
    }

    return (
        <div className="space-y-4">
            <h3 className={`text-lg font-semibold border-b pb-2 ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>Challan Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="challanNumber" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Challan Number
                    </Label>
                    <Input
                        id="challanNumber"
                        value={challanData.challanNumber}
                        onChange={(e) => onChallanChange('challanNumber', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Challan Number"
                    />
                    {errors.challanNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.challanNumber}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="challanDate" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Date
                    </Label>
                    <Input
                        id="challanDate"
                        type="date"
                        value={challanData.challanDate}
                        onChange={(e) => onChallanChange('challanDate', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                    />
                    {errors.challanDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.challanDate}</p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="category" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Category
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCategoryDialog(true)}
                            className={`h-7 px-2 text-xs ${theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}`}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    </div>
                    <Select
                        value={challanData.category}
                        onValueChange={(value) => {
                            onCategoryChange(value)
                            onChallanChange('subcategory', '')
                        }}
                    >
                        <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                            <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                        <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                            {categories.map((category: any) => (
                                <SelectItem key={category._id} value={category._id} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.category && (
                        <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="subcategory" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Subcategory
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSubcategoryDialog(true)}
                            className={`h-7 px-2 text-xs ${theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}`}
                            disabled={!challanData.category}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    </div>
                    <Select
                        value={challanData.subcategory}
                        onValueChange={(value) => onSubcategoryChange(value)}
                        disabled={!challanData.category}
                    >
                        <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                            <SelectValue placeholder="Select subcategory (optional)" />
                        </SelectTrigger>
                        <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                            {subcategories.map((subcategory: any) => (
                                <SelectItem key={subcategory._id} value={subcategory._id} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                    {subcategory.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.subcategory && (
                        <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="itemName" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Item Name
                    </Label>
                    <Input
                        id="itemName"
                        value={challanData.itemName}
                        onChange={(e) => onChallanChange('itemName', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Item Name"
                    />
                    {errors.itemName && (
                        <p className="text-red-500 text-sm mt-1">{errors.itemName}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="attributeName" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Attribute Name
                    </Label>
                    <Input
                        id="attributeName"
                        value={challanData.attributeName}
                        onChange={(e) => onChallanChange('attributeName', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Attribute Name"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="unit" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Unit
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUnitDialog(true)}
                            className={`h-7 px-2 text-xs ${theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}`}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    </div>
                    <Select
                        value={unit}
                        onValueChange={onUnitChange}
                    >
                        <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                            <SelectValue placeholder="Select unit (optional)" />
                        </SelectTrigger>
                        <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                            {units.length > 0 ? (
                                units.map((unitItem: any) => (
                                    <SelectItem key={unitItem._id} value={unitItem.name || unitItem.unit} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                        {unitItem.name || unitItem.unit}
                                    </SelectItem>
                                ))
                            ) : (
                                UNITS.map((unitItem) => (
                                    <SelectItem key={unitItem} value={unitItem} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                        {unitItem}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors.unit && (
                        <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="quantity" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Quantity
                    </Label>
                    <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        min="0"
                        value={quantity}
                        onChange={(e) => onQuantityChange(parseFloat(e.target.value) || 0)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="0"
                    />
                    {errors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="price" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Price
                    </Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={challanData.price}
                        onChange={(e) => onChallanChange('price', parseFloat(e.target.value) || 0)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <Label htmlFor="lotNumber" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Lot Number
                    </Label>
                    <Input
                        id="lotNumber"
                        value={challanData.lotNumber}
                        onChange={(e) => onChallanChange('lotNumber', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Lot Number"
                    />
                </div>
            </div>

            {/* Quick Create Dialogs */}
            <QuickCreateCategory
                open={showCategoryDialog}
                onOpenChange={setShowCategoryDialog}
                onCategoryCreated={handleCategoryCreated}
            />
            <QuickCreateSubcategory
                open={showSubcategoryDialog}
                onOpenChange={setShowSubcategoryDialog}
                onSubcategoryCreated={handleSubcategoryCreated}
                categoryId={challanData.category}
            />
            <QuickCreateUnit
                open={showUnitDialog}
                onOpenChange={setShowUnitDialog}
                onUnitCreated={handleUnitCreated}
            />
        </div>
    )
}

