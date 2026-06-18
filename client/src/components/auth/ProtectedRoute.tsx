'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser, selectAuthInitialized, selectAuthLoading } from '@/lib/features/auth/authSlice'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Actions, Subjects } from '@/lib/casl/ability'
import { CompactLoader } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredPermission?: {
    action: Actions
    subject: Subjects
  }
  requiredRole?: string
  requiredRoles?: string[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermission,
  requiredRole,
  requiredRoles,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const router = useRouter()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const isAuthInitialized = useSelector(selectAuthInitialized)
  const isAuthLoading = useSelector(selectAuthLoading)
  const permissions = usePermissions()
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Don't redirect until auth is initialized
    if (!isAuthInitialized) return

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo)
      return
    }

    if (isAuthenticated && user) {
      // Check role requirements
      if (requiredRole && !permissions.hasRole(requiredRole)) {
        router.push('/unauthorized')
        return
      }

      if (requiredRoles && !permissions.hasAnyRole(requiredRoles)) {
        router.push('/unauthorized')
        return
      }

      // Check permission requirements
      if (requiredPermission && !permissions.can(requiredPermission.action, requiredPermission.subject)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [
    isAuthenticated,
    user,
    requireAuth,
    requiredPermission,
    requiredRole,
    requiredRoles,
    router,
    redirectTo,
    permissions,
    isAuthInitialized
  ])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <CompactLoader message="Loading..." size="lg" />
      </div>
    )
  }

  // Show loading while checking authentication
  if (!isAuthInitialized || isAuthLoading || (requireAuth && !isAuthenticated && isAuthInitialized)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <CompactLoader message="Checking access..." size="lg" />
      </div>
    )
  }

  // Check permissions after authentication
  if (isAuthenticated && user) {
    if (requiredRole && !permissions.hasRole(requiredRole)) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have the required role to access this page.</p>
          </div>
        </div>
      )
    }

    if (requiredRoles && !permissions.hasAnyRole(requiredRoles)) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have the required role to access this page.</p>
          </div>
        </div>
      )
    }

    if (requiredPermission && !permissions.can(requiredPermission.action, requiredPermission.subject)) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking if user can access a route
export function useRouteAccess(options: Omit<ProtectedRouteProps, 'children'>) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const isAuthInitialized = useSelector(selectAuthInitialized)
  const permissions = usePermissions()

  if (!isAuthInitialized) {
    return { canAccess: false, reason: 'loading' }
  }

  if (options.requireAuth !== false && !isAuthenticated) {
    return { canAccess: false, reason: 'not_authenticated' }
  }

  if (isAuthenticated && user) {
    if (options.requiredRole && !permissions.hasRole(options.requiredRole)) {
      return { canAccess: false, reason: 'insufficient_role' }
    }

    if (options.requiredRoles && !permissions.hasAnyRole(options.requiredRoles)) {
      return { canAccess: false, reason: 'insufficient_role' }
    }

    if (options.requiredPermission && !permissions.can(options.requiredPermission.action, options.requiredPermission.subject)) {
      return { canAccess: false, reason: 'insufficient_permission' }
    }
  }

  return { canAccess: true, reason: null }
}
