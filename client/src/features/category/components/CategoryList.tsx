'use client'

import React, { useState } from 'react'
import { useGetCategoriesQuery, useDeleteCategoryMutation } from '../api/categoryApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CategoryForm } from './CategoryForm'
import { Category } from '../types/category.types'

export function CategoryList() {
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const { toast } = useToast()

    const { data, isLoading, error } = useGetCategoriesQuery({})
    const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
            return
        }

        try {
            await deleteCategory(id).unwrap()
            toast({
                title: 'Success',
                description: 'Category deleted successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.data?.message || 'Failed to delete category',
                variant: 'destructive',
            })
        }
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setIsFormOpen(true)
    }

    const handleAdd = () => {
        setEditingCategory(null)
        setIsFormOpen(true)
    }

    const handleClose = () => {
        setEditingCategory(null)
        setIsFormOpen(false)
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center text-red-600">
                        Error loading categories. Please try again.
                    </div>
                </CardContent>
            </Card>
        )
    }

    const categories = data?.data || []

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <div>
                            <CardTitle>Categories</CardTitle>
                            <CardDescription>Manage your inventory categories</CardDescription>
                        </div>          </div>
                    <Button onClick={handleAdd} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                    </Button>
                </CardHeader>
                <CardContent>
                    {categories.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No categories found. Add your first category to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {category.icon && <span className="text-lg">{category.icon}</span>}
                                                {category.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {category.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded border"
                                                    style={{ backgroundColor: category.color || '#6b7280' }}
                                                />
                                                <span className="text-sm text-gray-600">
                                                    {category.color || '#6b7280'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={category.isActive ? 'default' : 'secondary'}>
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(category._id, category.name)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {isFormOpen && (
                <CategoryForm
                    category={editingCategory}
                    onClose={handleClose}
                    onSuccess={handleClose}
                />
            )}
        </>
    )
}
