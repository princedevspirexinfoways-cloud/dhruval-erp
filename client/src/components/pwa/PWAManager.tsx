'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://')
      setIsInstalled(isStandalone)
    }

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('🔄 PWA: Registering service worker...')

          // Register the service worker
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          })

          console.log('✅ PWA: Service worker registered successfully')
          console.log('📍 PWA: SW scope:', registration.scope)
          console.log('📍 PWA: SW state:', registration.active?.state)
          
          setSwRegistration(registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('🔄 PWA: Service worker update found')
            const newWorker = registration.installing
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🎉 PWA: New service worker installed')
                  toast('App updated! Refresh to get the latest version.', {
                    duration: 5000,
                    icon: '🔄'
                  })
                }
              })
            }
          })

          // Listen for controlling service worker change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 PWA: Service worker controller changed')
            window.location.reload()
          })

        } catch (error) {
          console.error('❌ PWA: Service worker registration failed:', error)
        }
      } else {
        console.log('⚠️ PWA: Service workers not supported')
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Store the prompt for later use
      localStorage.setItem('pwa-prompt-available', 'true')

      // Show install prompt after delay only if not permanently dismissed
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem('pwa-prompt-permanently-dismissed')) {
          showInstallPrompt()
        }
      }, 15000) // Show after 15 seconds
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('🎉 PWA: App was installed')
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success('App installed successfully! 🎉')
    }

    // Initialize
    checkInstalled()
    registerServiceWorker()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const showInstallPrompt = () => {
    if (!deferredPrompt) {
      // For iOS or browsers without install prompt
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      
   
      return
    }

 
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`PWA: User response: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted install')
        toast.success('Installing app...')
      } else {
        console.log('PWA: User dismissed install')
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('PWA: Install prompt error:', error)
    }
  }

  // Expose install function globally for manual triggers
  useEffect(() => {
    (window as any).installPWA = () => {
      if (deferredPrompt) {
        handleInstallClick()
      } else {
        showInstallPrompt()
      }
    }

    // Expose service worker registration for debugging
    (window as any).swRegistration = swRegistration

    return () => {
      delete (window as any).installPWA
      delete (window as any).swRegistration
    }
  }, [deferredPrompt, swRegistration])

  // Background sync registration
  useEffect(() => {
    if (swRegistration && 'serviceWorker' in navigator) {
      // Register background sync if supported
      try {
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          (swRegistration as any).sync?.register('background-sync').catch((error: any) => {
            console.log('Background sync registration failed:', error)
          })
        }
      } catch (error) {
        console.log('Background sync not supported:', error)
      }
    }
  }, [swRegistration])

  // Push notification setup
  useEffect(() => {
    if (swRegistration && 'PushManager' in window) {
      // Check if push notifications are supported and permission granted
      if (Notification.permission === 'granted') {
        // Setup push notifications here if needed
        console.log('Push notifications available')
      }
    }
  }, [swRegistration])

  return null // This component doesn't render anything
}
