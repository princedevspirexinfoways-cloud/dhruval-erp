'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { initializeAuth, selectIsAuthenticated, selectCurrentUser, selectAuthLoading, selectAuthInitialized } from '@/lib/features/auth/authSlice'
import { defineAbilityFor } from '@/lib/casl/ability'
import { AbilityContext } from '@/lib/casl/Can'
import { selectPermissions } from '@/lib/features/auth/authSlice'
import { AppLoader } from '@/components/ui/LoadingSpinner'
import { RootState } from '@/lib/store'

interface AuthProviderProps {
  children: React.ReactNode
}

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const permissions = useSelector(selectPermissions)
  const isLoading = useSelector(selectAuthLoading)
  const isInitialized = useSelector(selectAuthInitialized)
  const authToken = useSelector((state: RootState) => state.auth.token)
  const authInitialized = useSelector((state: RootState) => state.auth.isInitialized)
  
  // Add client-side state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false)
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null)
  const [localStorageUser, setLocalStorageUser] = useState<string | null>(null)

  // Set client-side state after hydration
  useEffect(() => {
    setIsClient(true)
    setLocalStorageToken(localStorage.getItem('token'))
    setLocalStorageUser(localStorage.getItem('user'))
  }, [])

  // Initialize auth from localStorage on app start
  useEffect(() => {
    if (!isClient) return // Don't run on server
    
    console.log('AuthProvider: Initializing auth...');
    console.log('AuthProvider: Current localStorage state:', {
      token: !!localStorage.getItem('token'),
      user: !!localStorage.getItem('user'),
      companies: !!localStorage.getItem('companies'),
      permissions: !!localStorage.getItem('permissions')
    });
    dispatch(initializeAuth());
  }, [dispatch, isClient])

  // Handle authentication redirects with a small delay to allow initialization
  useEffect(() => {
    if (!isClient) return // Don't run on server
    
    const timer = setTimeout(() => {
      const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false
      
      // Check both Redux state and localStorage for authentication
      const currentLocalStorageToken = localStorage.getItem('token')
      const currentLocalStorageUser = localStorage.getItem('user')
      
      console.log('AuthProvider state check:', {
        isAuthenticated,
        pathname,
        isPublicRoute,
        user: user?._id,
        reduxToken: !!authToken,
        localStorageToken: !!currentLocalStorageToken,
        localStorageUser: !!currentLocalStorageUser,
        isInitialized: authInitialized,
        tokenLength: currentLocalStorageToken?.length || 0
      })

      // If we have data in localStorage but Redux state is not authenticated, 
      // we need to wait for initialization
      if (currentLocalStorageToken && currentLocalStorageUser && !isAuthenticated && !authInitialized) {
        console.log('AuthProvider: Waiting for auth initialization...')
        return
      }

      // If we have localStorage data but Redux state is not authenticated, 
      // try to reinitialize auth
      if (currentLocalStorageToken && currentLocalStorageUser && !isAuthenticated && authInitialized) {
        console.log('AuthProvider: Reinitializing auth from localStorage...')
        dispatch(initializeAuth())
        return
      }

      if (!isAuthenticated && !isPublicRoute) {
        console.log('AuthProvider: Redirecting to login - not authenticated')
        // Store the intended route before redirecting to login
        if (pathname && pathname !== '/') {
          localStorage.setItem('intendedRoute', pathname)
        }
        router.push('/login')
      } else if (isAuthenticated) {
        console.log('AuthProvider: User is authenticated, checking redirects')
        // Check if there's an intended route to redirect to
        const intendedRoute = localStorage.getItem('intendedRoute')
        if (intendedRoute && intendedRoute !== '/login' && intendedRoute !== pathname) {
          console.log('AuthProvider: Redirecting to intended route:', intendedRoute)
          localStorage.removeItem('intendedRoute')
          router.push(intendedRoute)
          return
        }

        // Only redirect from root page to dashboard if no intended route
        if (pathname === '/') {
          console.log('AuthProvider: Redirecting to dashboard')
          router.push('/dashboard')
        }
      }
    }, 100) // Small delay to allow initialization

    return () => clearTimeout(timer)
  }, [isAuthenticated, pathname, user?._id, authToken, authInitialized, router, dispatch, isClient])

  // Create CASL ability based on user permissions
  const ability = defineAbilityFor(user, permissions)

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}

// Hook to check if user is authenticated
export function useAuth() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const permissions = useSelector(selectPermissions)
  const isLoading = useSelector(selectAuthLoading)
  const isInitialized = useSelector(selectAuthInitialized)

  return {
    isAuthenticated,
    user,
    permissions,
    isLoading,
    isInitialized,
  }
}

// Hook to check permissions
export function usePermissions() {
  const permissions = useSelector(selectPermissions)
  
  const hasPermission = (module: string, action: string) => {
    const modulePermissions = permissions[module]
    return modulePermissions ? modulePermissions.includes(action) : false
  }
  
  const canAccess = (module: string) => {
    return !!permissions[module]
  }
  
  return {
    permissions,
    hasPermission,
    canAccess,
  }
}

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  fallback = <div>Access Denied</div> 
}: ProtectedRouteProps) {
  const { hasPermission } = usePermissions()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  
  if (!isAuthenticated) {
    return null // AuthProvider will handle redirect
  }
  
  if (requiredPermission) {
    const [module, action] = requiredPermission.split(':')
    if (!hasPermission(module, action)) {
      return <>{fallback}</>
    }
  }
  
  return <>{children}</>
}
