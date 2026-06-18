import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './Button'
import clsx from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string | React.ReactNode
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  portalTargetId?: string // Render inside this container if present (keeps sidebar interactive)
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  headerClassName,
  contentClassName,
  portalTargetId = 'app-content-root'
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={clsx(
          'relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden border border-sky-200 dark:border-sky-700 transition-all duration-300',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={clsx(
            'bg-gradient-to-r from-sky-500 to-blue-600 p-6 relative overflow-hidden',
            headerClassName
          )}>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              {title && (
                <div>
                  <h2 className="text-2xl font-bold text-white">{title}</h2>
                  {subtitle && (
                    <p className="text-sky-100 mt-1">{subtitle}</p>
                  )}
                </div>
              )}
              
              {showCloseButton && (
                <Button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors bg-transparent border-0 ml-4"
                >
                  <X className="w-6 h-6" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={clsx(
          'overflow-y-auto max-h-[calc(90vh-120px)]',
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </div>
  )

  // Use portal to render modal at the end of body for better z-index handling
  const target = typeof window !== 'undefined' ? document.body : null
  return target ? createPortal(modalContent, target) : null
}

// Modal content sections for better organization
export function ModalContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end gap-3 transition-all duration-300', className)}>
      {children}
    </div>
  )
}

export default Modal
