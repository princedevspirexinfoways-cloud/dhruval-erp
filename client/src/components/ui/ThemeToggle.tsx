'use client'

import { useSelector, useDispatch } from 'react-redux'
import { Moon, Sun } from 'lucide-react'
import { selectTheme, setTheme } from '@/lib/features/ui/uiSlice'
import toast from 'react-hot-toast'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const dispatch = useDispatch()
  const theme = useSelector(selectTheme)

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('ThemeToggle: Current theme:', theme)
    console.log('ThemeToggle: Switching to:', newTheme)
    console.log('ThemeToggle: Document classes before:', document.documentElement.className)
    
    dispatch(setTheme(newTheme))
    
    // Check if the class was added/removed
    setTimeout(() => {
      console.log('ThemeToggle: Document classes after dispatch:', document.documentElement.className)
      console.log('ThemeToggle: Has dark class:', document.documentElement.classList.contains('dark'))
    }, 100)
    
    toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme enabled`)
  }

  return (
    <button
      onClick={handleThemeToggle}
      className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      )}
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}
