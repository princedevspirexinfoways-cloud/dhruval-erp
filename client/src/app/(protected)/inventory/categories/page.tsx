'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { CategoryList } from '@/features/category/components/CategoryList'

export default function CategoriesPage() {
    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
                    <p className="text-gray-600 mt-2">
                        Manage inventory categories for better organization
                    </p>
                </div>

                <CategoryList />
            </div>
        </AppLayout>
    )
}
