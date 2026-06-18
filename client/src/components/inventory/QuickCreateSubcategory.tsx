'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSubcategoryMutation, useGetSubcategoriesByCategoryQuery } from '@/features/subcategory/api/subcategoryApi'
import { useGetCategoriesQuery } from '@/features/category/api/categoryApi'
import { useToast } from '@/components/ui/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface QuickCreateSubcategoryProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubcategoryCreated?: (subcategoryId: string) => void
    categoryId?: string // Pre-select category if provided
}

export function QuickCreateSubcategory({ 
    open, 
    onOpenChange, 
    onSubcategoryCreated,
    categoryId: initialCategoryId 
}: QuickCreateSubcategoryProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId || '')
    const [createSubcategory, { isLoading }] = useCreateSubcategoryMutation()
    const { toast } = useToast()
    const theme = useSelector((state: RootState) => state.ui.theme)
    const companyId = useSelector((state: RootState) =>
        state.auth.currentCompanyId ||
        state.auth.user?.companyAccess?.[0]?.companyId ||
        state.auth.user?.currentCompanyId
    )

    // Fetch categories
    const { data: categoriesData } = useGetCategoriesQuery(
        companyId ? { companyId: companyId.toString() } : {}
    )
    const categories = categoriesData?.data || []

    // Refetch subcategories after creation
    const { refetch: refetchSubcategories } = useGetSubcategoriesByCategoryQuery(
        selectedCategoryId || '',
        { skip: !selectedCategoryId }
    )

    // Update selected category when initialCategoryId changes
    React.useEffect(() => {
        if (initialCategoryId) {
            setSelectedCategoryId(initialCategoryId)
        }
    }, [initialCategoryId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedCategoryId) {
            toast({
                title: 'Error',
                description: 'Please select a category first',
                variant: 'destructive'
            })
            return
        }

        try {
            const result = await createSubcategory({
                categoryId: selectedCategoryId,
                name,
                description,
                ...(companyId && { companyId }) // Only include companyId if available
            }).unwrap()

            // Refetch subcategories to update the dropdown
            if (selectedCategoryId) {
                await refetchSubcategories()
            }

            toast({
                title: 'Success',
                description: 'Subcategory created successfully'
            })

            // Call callback with new subcategory ID
            if (onSubcategoryCreated && result.data?._id) {
                onSubcategoryCreated(result.data._id)
            }

            // Reset and close
            setName('')
            setDescription('')
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.data?.message || 'Failed to create subcategory',
                variant: 'destructive'
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[425px] ${theme === 'dark' ? '!bg-gray-800 !text-white !border-gray-700' : '!bg-white !text-gray-900 !border-gray-200'}`}>
                <DialogHeader>
                    <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        Quick Create Subcategory
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="category" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Category *
                        </Label>
                        <Select
                            value={selectedCategoryId}
                            onValueChange={setSelectedCategoryId}
                            disabled={!!initialCategoryId}
                        >
                            <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className={`!z-[10060] ${theme === 'dark' ? '!bg-gray-800 !border-gray-700 !text-white' : '!bg-white !border-gray-200 !text-gray-900'}`}>
                                {categories.map((cat: any) => (
                                    <SelectItem
                                        key={cat._id}
                                        value={cat._id}
                                        className={theme === 'dark' ? '!text-white hover:!bg-gray-700 focus:!bg-gray-700' : '!text-gray-900 hover:!bg-gray-50 focus:!bg-gray-50'}
                                    >
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="name" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Subcategory Name *
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Cotton Fabric"
                            required
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        />
                    </div>

                    <div>
                        <Label htmlFor="description" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this subcategory"
                            rows={3}
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !selectedCategoryId}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Subcategory'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
















