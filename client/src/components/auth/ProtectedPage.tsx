'use client'

import React from 'react'
import { useSelector } from 'react-redux'
import { AppLayout } from '@/components/layout/AppLayout'
import { Shield } from 'lucide-react'
import { selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { usePermission } from '@/lib/hooks/usePermission'

interface ProtectedPageProps {
    module: string
    action?: string
    children: React.ReactNode
}

export function ProtectedPage({ module, action = 'view', children }: ProtectedPageProps) {
    const isSuperAdmin = useSelector(selectIsSuperAdmin)
    const { has } = usePermission()
    const canView = isSuperAdmin || has(module, action)

    if (!canView) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Restricted</h3>
                        <p className="text-gray-600 dark:text-gray-400">You don’t have permission to view this page.</p>
                    </div>
                </div>
            </AppLayout>
        )
    }

    return <>{children}</>
}



