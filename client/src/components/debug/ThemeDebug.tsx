'use client'

import { useEffect, useState } from 'react'

export function ThemeDebug() {
  // Completely disable during SSR
  if (typeof window === 'undefined') {
    return null
  }

  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [domClasses, setDomClasses] = useState('')
  const [bodyClasses, setBodyClasses] = useState('')
  const [hasDarkClass, setHasDarkClass] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateClasses = () => {
      try {
        if (typeof window !== 'undefined' && document) {
          setDomClasses(document.documentElement.className)
          setBodyClasses(document.body.className)
          setHasDarkClass(document.documentElement.classList.contains('dark'))
          
          // Get theme from localStorage instead of Redux to avoid SSR issues
          const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
          setTheme(savedTheme || 'light')
        }
      } catch (error) {
        console.warn('ThemeDebug: Error updating classes:', error)
      }
    }

    updateClasses()
    
    // Update classes every 100ms to catch changes
    const interval = setInterval(updateClasses, 100)
    
    return () => clearInterval(interval)
  }, [])

  // Don't render anything during SSR or in production
  if (process.env.NODE_ENV === 'production' || !mounted) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border-2 border-red-500 p-3 rounded-lg shadow-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">Theme Debug</h3>
      <div className="space-y-1">
        <div>Redux Theme: <span className="font-mono">{theme}</span></div>
        <div>HTML Classes: <span className="font-mono text-xs break-all">{domClasses}</span></div>
        <div>Body Classes: <span className="font-mono text-xs break-all">{bodyClasses}</span></div>
        <div>Has Dark Class: <span className="font-mono">{hasDarkClass ? 'YES' : 'NO'}</span></div>
      </div>
    </div>
  )
}
