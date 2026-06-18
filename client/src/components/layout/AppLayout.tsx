'use client'

import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { selectSidebarCollapsed, selectSidebarOpen, setSidebarOpen } from '@/lib/features/ui/uiSlice'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { NotificationSystem } from '../notifications/NotificationSystem'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ModalManager } from '@/components/modals/ModalManager'
import clsx from 'clsx'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const dispatch = useDispatch()
  const isCollapsed = useSelector(selectSidebarCollapsed)
  const isOpen = useSelector(selectSidebarOpen)

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // On desktop, ensure sidebar is open
        dispatch(setSidebarOpen(true))
      } else {
        // On mobile, close sidebar by default
        dispatch(setSidebarOpen(false))
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative transition-all duration-300">
        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 lg:hidden transition-opacity duration-300 backdrop-blur-sm"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}

        <Sidebar />

        <div className={clsx(
          'transition-all duration-300 ease-in-out min-h-screen',
          // Desktop margins
          'lg:ml-0',
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}>
          <Header />

          <main className="p-3 sm:p-4 lg:p-6 transition-all duration-300">
            {/* Content root for modals to portal into, so sidebar remains interactive */}
            <div id="app-content-root" className="relative max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Modal Manager */}
        <ModalManager />
      </div>
    </ProtectedRoute>
  )
}

// Layout wrapper for pages that need the full app layout
export function withAppLayout<P extends object>(
  Component: React.ComponentType<P>
) {
  return function LayoutWrappedComponent(props: P) {
    return (
      <AppLayout>
        <Component {...props} />
      </AppLayout>
    )
  }
}
