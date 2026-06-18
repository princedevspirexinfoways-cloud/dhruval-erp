'use client'

import React from 'react'
import { usePermission } from '@/lib/hooks/usePermission'

interface RequirePermissionProps {
    module: string
    action: string
    fallback?: React.ReactNode
    children: React.ReactNode
}

export function RequirePermission({ module, action, fallback = null, children }: RequirePermissionProps) {
    const { has, isSuperAdmin } = usePermission()
    if (isSuperAdmin || has(module, action)) return <>{children}</>
    return <>{fallback}</>
}



