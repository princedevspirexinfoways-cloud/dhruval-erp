'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { convertToContaboUrl } from '@/utils/fileUtils'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "w-full h-full object-cover", 
  fallbackClassName = "w-full h-full bg-gray-100 flex items-center justify-center"
}: ImageWithFallbackProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className={`${fallbackClassName} text-gray-400`}>
        <ImageIcon className="w-6 h-6" />
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${fallbackClassName} absolute inset-0 bg-gray-100 animate-pulse`}>
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={convertToContaboUrl(src)}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  )
}
