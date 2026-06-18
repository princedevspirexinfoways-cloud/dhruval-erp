'use client'

import toast from 'react-hot-toast'

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const { title, description, variant = 'default', duration = 4000 } = options

    const message = title && description 
      ? `${title}: ${description}` 
      : title || description || ''

    if (variant === 'destructive') {
      toast.error(message, { duration })
    } else if (variant === 'success') {
      toast.success(message, { duration })
    } else {
      toast(message, { duration })
    }
  }

  return {
    toast: showToast,
  }
}
















