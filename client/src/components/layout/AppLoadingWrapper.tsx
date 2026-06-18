'use client'

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { usePathname } from 'next/navigation'
import { selectAuthInitialized, selectAuthLoading } from '@/lib/features/auth/authSlice'
import { AppLoader, CompactLoader } from '@/components/ui/LoadingSpinner'

interface AppLoadingWrapperProps {
  children: React.ReactNode
  showFullLoader?: boolean
}

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export function AppLoadingWrapper({ children, showFullLoader = false }: AppLoadingWrapperProps) {
  const pathname = usePathname()
  const isAuthInitialized = useSelector(selectAuthInitialized)
  const isAuthLoading = useSelector(selectAuthLoading)
  const [showInitialLoader, setShowInitialLoader] = useState(true)

  // Show initial loader for a brief moment to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoader(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false
  const shouldShowLoader = showInitialLoader || !isAuthInitialized || isAuthLoading

  // For public routes, show minimal loading
  if (isPublicRoute && shouldShowLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100">
        <CompactLoader message="Loading..." size="lg" />
      </div>
    )
  }

  // For protected routes, show full app loader
  if (!isPublicRoute && shouldShowLoader) {
    return (
      <AppLoader 
        message={showInitialLoader ? "Starting Enterprise ERP..." : "Verifying authentication..."} 
        showLogo={true}
        showFeatures={!showInitialLoader}
      />
    )
  }

  // Show full loader if explicitly requested
  if (showFullLoader) {
    return (
      <AppLoader 
        message="Loading your workspace..." 
        showLogo={true}
        showFeatures={true}
      />
    )
  }

  return <>{children}</>
}

// Higher-order component version
export function withAppLoadingWrapper<P extends object>(
  Component: React.ComponentType<P>,
  options?: { showFullLoader?: boolean }
) {
  return function LoadingWrappedComponent(props: P) {
    return (
      <AppLoadingWrapper showFullLoader={options?.showFullLoader}>
        <Component {...props} />
      </AppLoadingWrapper>
    )
  }
}

// Hook for checking loading state
export function useAppLoading() {
  const isAuthInitialized = useSelector(selectAuthInitialized)
  const isAuthLoading = useSelector(selectAuthLoading)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return {
    isLoading: isInitialLoading || !isAuthInitialized || isAuthLoading,
    isAuthLoading,
    isAuthInitialized,
    isInitialLoading,
  }
}
