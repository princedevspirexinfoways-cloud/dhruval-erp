'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateCategoryMutation, useGetCategoriesQuery } from '@/features/category/api/categoryApi'
import { useToast } from '@/components/ui/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Loader2 } from 'lucide-react'

interface QuickCreateCategoryProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCategoryCreated?: (categoryId: string) => void
}

export function QuickCreateCategory({ open, onOpenChange, onCategoryCreated }: QuickCreateCategoryProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [createCategory, { isLoading }] = useCreateCategoryMutation()
    const { toast } = useToast()
    const theme = useSelector((state: RootState) => state.ui.theme)
    const companyId = useSelector((state: RootState) =>
        state.auth.currentCompanyId ||
        state.auth.user?.companyAccess?.[0]?.companyId ||
        state.auth.user?.currentCompanyId
    )

    // Refetch categories after creation
    const { refetch: refetchCategories } = useGetCategoriesQuery(
        companyId ? { companyId: companyId.toString() } : {}
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const result = await createCategory({
                name,
                description,
                ...(companyId && { companyId }) // Only include companyId if available
            }).unwrap()

            // Refetch categories to update the dropdown
            await refetchCategories()

            toast({
                title: 'Success',
                description: 'Category created successfully'
            })

            // Call callback with new category ID
            if (onCategoryCreated && result.data?._id) {
                onCategoryCreated(result.data._id)
            }

            // Reset and close
            setName('')
            setDescription('')
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.data?.message || 'Failed to create category',
                variant: 'destructive'
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[425px] ${theme === 'dark' ? '!bg-gray-800 !text-white !border-gray-700' : '!bg-white !text-gray-900 !border-gray-200'}`}>
                <DialogHeader>
                    <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        Quick Create Category
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Category Name *
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Raw Materials"
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
                            placeholder="Brief description of this category"
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
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Category'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
