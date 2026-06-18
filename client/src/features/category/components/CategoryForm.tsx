'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '../api/categoryApi'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Category } from '../types/category.types'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

interface CategoryFormProps {
    category?: Category | null
    onClose: () => void
    onSuccess: () => void
}

interface FormData {
    name: string
    description: string
}

export function CategoryForm({ category, onClose, onSuccess }: CategoryFormProps) {
    const { toast } = useToast()
    const companyId = useSelector((state: RootState) =>
        state.auth.currentCompanyId ||
        state.auth.user?.companyAccess?.[0]?.companyId ||
        state.auth.user?.currentCompanyId ||
        state.auth.user?.companyId
    )

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            name: category?.name || '',
            description: category?.description || '',
        },
    })

    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()

    const isLoading = isCreating || isUpdating

    const onSubmit = async (data: FormData) => {
        try {
            // Default values for icon and color
            const defaultIcon = '📦'
            const defaultColor = '#6b7280' // gray color

            if (category) {
                // Update existing category - preserve existing icon and color, only update name and description
                await updateCategory({
                    id: category._id,
                    data: {
                        name: data.name,
                        description: data.description,
                        // Keep existing icon and color if they exist, otherwise use defaults
                        icon: category.icon || defaultIcon,
                        color: category.color || defaultColor,
                    },
                }).unwrap()
                toast({
                    title: 'Success',
                    description: 'Category updated successfully',
                })
            } else {
                // Create new category with defaults
                await createCategory({
                    name: data.name,
                    description: data.description,
                    icon: defaultIcon,
                    color: defaultColor,
                    ...(companyId && { companyId }),
                }).unwrap()
                toast({
                    title: 'Success',
                    description: 'Category created successfully',
                })
            }
            onSuccess()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.data?.message || 'Failed to save category',
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
                    <DialogDescription>
                        {category
                            ? 'Update the category details below.'
                            : 'Add a new category for your inventory items.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            {...register('name', { required: 'Name is required' })}
                            placeholder="e.g., Raw Materials"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Enter category description (optional)"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {category ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
