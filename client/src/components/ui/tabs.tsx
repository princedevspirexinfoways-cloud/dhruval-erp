'use client'

import { ReactNode, HTMLAttributes, createContext, useContext, useState } from 'react'
import clsx from 'clsx'

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  value: string
  className?: string
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  value: string
  className?: string
}

export function Tabs({ children, defaultValue, value, onValueChange, className, ...props }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || '')
  const activeTab = value !== undefined ? value : internalActiveTab
  
  const setActiveTab = (tab: string) => {
    if (onValueChange) {
      onValueChange(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={clsx('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div 
      className={clsx(
        'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ children, value, className, ...props }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }
  
  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive 
          ? 'bg-white text-gray-950 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900',
        className
      )}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ children, value, className, ...props }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }
  
  const { activeTab } = context
  
  if (activeTab !== value) {
    return null
  }

  return (
    <div 
      className={clsx(
        'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
