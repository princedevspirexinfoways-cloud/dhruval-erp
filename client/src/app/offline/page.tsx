'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useHealthCheckQuery } from '@/lib/api/authApi'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [triggerHealthCheck, setTriggerHealthCheck] = useState(false)
  const router = useRouter()

  // Use RTK Query for health check instead of direct fetch
  const { data: healthData, error: healthError, isFetching } = useHealthCheckQuery(undefined, {
    skip: !triggerHealthCheck,
    refetchOnMountOrArgChange: true,
  })

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Automatically redirect when back online
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  // Handle health check response
  useEffect(() => {
    if (triggerHealthCheck && !isFetching) {
      if (healthData?.success && !healthError) {
        // Health check successful - we're back online
        setIsOnline(true)
        setIsRetrying(false)
        router.push('/dashboard')
      } else {
        // Health check failed - still offline
        console.log('Still offline:', healthError)
        setIsRetrying(false)
        setTriggerHealthCheck(false)
      }
    }
  }, [healthData, healthError, isFetching, triggerHealthCheck, router])

  const handleRetry = () => {
    setIsRetrying(true)
    setTriggerHealthCheck(true)
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Offline Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Status Icon */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${
            isOnline 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}>
            {isOnline ? (
              <div className="text-3xl">✓</div>
            ) : (
              <WifiOff className="h-10 w-10" />
            )}
          </div>

          {/* Status Message */}
          <h1 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
            isOnline ? 'text-green-600' : 'text-gray-900'
          }`}>
            {isOnline ? 'Back Online!' : 'You\'re Offline'}
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {isOnline 
              ? 'Great! Your connection has been restored. Redirecting you back to the app...'
              : 'It looks like you\'re not connected to the internet. Some features may not be available until you reconnect.'
            }
          </p>

          {/* Connection Status */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 ${
            isOnline 
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isOnline ? 'Connected' : 'Disconnected'}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isOnline && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking Connection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>

          {/* Offline Features */}
          {!isOnline && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Available Offline:
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• View cached dashboard data</div>
                <div>• Access recently viewed items</div>
                <div>• Review offline reports</div>
                <div>• Browse cached inventory</div>
              </div>
            </div>
          )}
        </div>

        {/* Network Tips */}
        {!isOnline && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Connection Tips:
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div>• Check your WiFi or mobile data connection</div>
              <div>• Try moving to a location with better signal</div>
              <div>• Restart your router if using WiFi</div>
              <div>• Contact your network administrator if the problem persists</div>
            </div>
          </div>
        )}

        {/* PWA Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ERP System PWA • Offline Ready
          </p>
        </div>
      </div>
    </div>
  )
}
