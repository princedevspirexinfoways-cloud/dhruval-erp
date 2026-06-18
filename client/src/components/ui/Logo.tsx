'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Building2 } from 'lucide-react'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  showText?: boolean
  textSize?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'white' | 'dark'
}

export function Logo({ 
  width = 32, 
  height = 32, 
  className = '', 
  showText = false,
  textSize = 'md',
  variant = 'default'
}: LogoProps) {
  const [imageError, setImageError] = useState(false)

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }

  const textColorClasses = {
    default: 'text-gray-900',
    white: 'text-white',
    dark: 'text-gray-900'
  }

  // Fallback icon component
  const FallbackIcon = () => (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg ${className}`}
      style={{ width, height }}
    >
      <Building2
        className="text-white"
        size={Math.min(width, height) * 0.6}
      />
    </div>
  )

  // Use the local logo file
  const logoUrl = "/logo.png"

  return (
    <div className="flex items-center space-x-2">
      {/* Logo Image with Fallback */}
      {!imageError ? (
        <Image
          src={logoUrl}
          alt="Factory ERP Logo"
          width={width}
          height={height}
          className={`rounded-lg ${className}`}
          onError={() => setImageError(true)}
          priority
          unoptimized // For better production compatibility
        />
      ) : (
        <FallbackIcon />
      )}

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${textSizeClasses[textSize]} ${textColorClasses[variant]}`}>
            Factory ERP
          </span>
          {textSize !== 'sm' && (
            <span className={`text-xs ${variant === 'white' ? 'text-gray-200' : 'text-sky-600'} font-medium`}>
              Manufacturing Suite
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Specific logo variants for common use cases
export function SidebarLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Logo
      width={collapsed ? 24 : 32}
      height={collapsed ? 24 : 32}
      showText={!collapsed}
      textSize="lg"
      className="shadow-sm"
    />
  )
}

export function LoginLogo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: { width: 60, height: 60, textSize: 'md' as const },
    md: { width: 80, height: 80, textSize: 'lg' as const },
    lg: { width: 120, height: 120, textSize: 'xl' as const },
    xl: { width: 160, height: 160, textSize: 'xl' as const }
  }

  const { width, height, textSize } = sizes[size]

  return (
    <div className="text-center">
      <Logo
        width={width}
        height={height}
        showText={true}
        textSize={textSize}
        className="mx-auto mb-4 shadow-lg"
      />
    </div>
  )
}

export function HeaderLogo() {
  return (
    <Logo
      width={28}
      height={28}
      showText={false}
      className="shadow-sm"
    />
  )
}

export function LoadingLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { width: 48, height: 48 },
    md: { width: 72, height: 72 },
    lg: { width: 96, height: 96 }
  }

  const { width, height } = sizes[size]

  return (
    <div className="animate-pulse">
      <Logo
        width={width}
        height={height}
        showText={false}
        className="shadow-xl"
      />
    </div>
  )
}
