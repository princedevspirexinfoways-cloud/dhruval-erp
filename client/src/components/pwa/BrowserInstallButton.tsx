'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function BrowserInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isAndroidApp = document.referrer.includes('android-app://')

      setIsInstalled(isStandaloneMode || isIOSStandalone || isAndroidApp)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show button if not installed
      if (!isInstalled) {
        setShowButton(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowButton(false)
      setDeferredPrompt(null)
      toast.success('App installed successfully!')
    }

    checkInstalled()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS or browsers without install prompt
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

      if (isIOS) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <div className="font-semibold">Install ERP App</div>
            <div className="text-sm">
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-blue-600 text-sm font-medium"
            >
              Got it
            </button>
          </div>
        ), {
          duration: 8000,
          icon: '📱'
        })
      } else {
        // toast('Install option not available in this browser', {
        //   icon: 'ℹ️'
        // })
      }
      return
    }

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        toast.success('Installing app...')
      } else {
        console.log('User dismissed the install prompt')
      }

      setDeferredPrompt(null)
      setShowButton(false)
    } catch (error) {
      console.error('Error during installation:', error)
      toast.error('Installation failed')
    }
  }

  // Don't show if already installed or no install prompt available
  if (isInstalled || (!showButton && !deferredPrompt)) {
    return null
  }

  return (
    <></>
  )
}
