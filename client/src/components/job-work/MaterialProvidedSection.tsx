'use client'

import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MaterialItem } from './types'
import { UNITS } from './constants'
import { Plus, Trash2 } from 'lucide-react'

interface MaterialProvidedSectionProps {
    materials: MaterialItem[]
    inventoryItems: any[]
    onAddMaterial: () => void
    onRemoveMaterial: (index: number) => void
    onMaterialChange: (index: number, field: keyof MaterialItem, value: any) => void
}

export function MaterialProvidedSection({
    materials,
    inventoryItems,
    onAddMaterial,
    onRemoveMaterial,
    onMaterialChange
}: MaterialProvidedSectionProps) {
    const theme = useSelector((state: RootState) => state.ui.theme)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold border-b pb-2 ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>Material Provided</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddMaterial}
                    className={`flex items-center gap-2 ${theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}`}
                >
                    <Plus className="h-4 w-4" />
                    Add Material
                </Button>
            </div>

            {materials.length === 0 ? (
                <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>No materials added. Click "Add Material" to add items.</p>
            ) : (
                <div className="space-y-3">
                    {materials.map((material, index) => {
                        const selectedItem = inventoryItems.find((item: any) => item._id === material.itemId)
                        return (
                            <div key={index} className={`grid grid-cols-12 gap-2 items-end p-3 border-2 rounded-lg ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-sky-100 bg-white'}`}>
                                <div className="col-span-4">
                                    <Label className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Item <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={material.itemId}
                                        onValueChange={(value) => {
                                            onMaterialChange(index, 'itemId', value)
                                            const item = inventoryItems.find((i: any) => i._id === value)
                                            if (item) {
                                                onMaterialChange(index, 'itemName', item.itemName || item.itemCode)
                                                onMaterialChange(index, 'unit', item.stock?.unit || 'meters')
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                                            <SelectValue placeholder="Select Item" />
                                        </SelectTrigger>
                                        <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                                            {inventoryItems.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-gray-500">No items available</div>
                                            ) : (
                                                inventoryItems.map((item: any) => (
                                                    <SelectItem key={item._id} value={item._id} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{item.itemName || item.itemCode}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {item.itemCode} • Stock: {item.stock?.currentStock || 0} {item.stock?.unit || 'pcs'}
                                                                {item.pricing?.costPrice && ` • ₹${item.pricing.costPrice}`}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {selectedItem && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            Available: {selectedItem.stock?.availableStock || 0} {selectedItem.stock?.unit || 'pcs'}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <Label className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Quantity <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={material.quantity}
                                        onChange={(e) => onMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Unit</Label>
                                    <Select
                                        value={material.unit}
                                        onValueChange={(value) => onMaterialChange(index, 'unit', value)}
                                    >
                                        <SelectTrigger className={`w-full border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                                            {UNITS.map((unit) => (
                                                <SelectItem key={unit} value={unit} className={theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>
                                                    {unit}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <Label className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Rate (₹)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={material.rate || ''}
                                        onChange={(e) => onMaterialChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRemoveMaterial(index)}
                                        className={`w-full ${theme === 'dark' ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20 border-gray-600' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
