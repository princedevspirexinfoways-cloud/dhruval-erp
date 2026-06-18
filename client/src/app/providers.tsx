'use client'

import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from '@/lib/store'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ModalProvider } from '@/components/providers/ModalProvider'
import { ThemeSync } from '@/components/providers/ThemeSync'

import { initializeUI } from '@/lib/features/ui/uiSlice'

function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize UI state from localStorage
    store.dispatch(initializeUI())
  }, [])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer>
        <AuthProvider>
          <ModalProvider>
            <ThemeSync />
            {children}
          </ModalProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg, #ffffff)',
                color: 'var(--toast-color, #1f2937)',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid var(--toast-border, #e5e7eb)',
              },
              success: {
                style: {
                  background: '#22c55e',
                  color: '#ffffff',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#ffffff',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#ef4444',
                },
              },
              loading: {
                style: {
                  background: '#3b82f6',
                  color: '#ffffff',
                },
              },
            }}
          />
        </AuthProvider>
      </AppInitializer>
    </Provider>
  )
}
