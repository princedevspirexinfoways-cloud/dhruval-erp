'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface Field {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'datetime-local' | 'tel'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

interface CreateEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  title: string
  fields: Field[]
  initialData?: any
  isLoading?: boolean
  submitText?: string
  cancelText?: string
}

export function CreateEditModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
  isLoading = false,
  submitText = 'Save',
  cancelText = 'Cancel'
}: CreateEditModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Initialize form data
      const initData: any = {}
      fields.forEach(field => {
        initData[field.name] = initialData?.[field.name] || ''
      })
      setFormData(initData)
      setErrors({})
    }
  }, [isOpen, fields, initialData])

  const validateField = (field: Field, value: any) => {
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`
    }

    if (field.validation) {
      const { min, max, pattern, message } = field.validation

      if (field.type === 'number' && value) {
        const numValue = parseFloat(value)
        if (min !== undefined && numValue < min) {
          return message || `${field.label} must be at least ${min}`
        }
        if (max !== undefined && numValue > max) {
          return message || `${field.label} must be at most ${max}`
        }
      }

      if (pattern && value) {
        const regex = new RegExp(pattern)
        if (!regex.test(value)) {
          return message || `${field.label} format is invalid`
        }
      }
    }

    return null
  }

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }))

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev: any) => ({
        ...prev,
        [fieldName]: null
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors: any = {}
    fields.forEach(field => {
      const error = validateField(field, formData[field.name])
      if (error) {
        newErrors[field.name] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: Field) => {
    const value = formData[field.name] || ''
    const error = errors[field.name]
    const hasError = !!error

    const baseInputClasses = clsx(
      "w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors",
      hasError 
        ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500",
      "bg-white text-gray-900 placeholder-gray-500"
    )

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={baseInputClasses}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={clsx(baseInputClasses, "min-h-[100px] resize-vertical")}
              required={field.required}
              rows={4}
            />
            {hasError && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={baseInputClasses}
              required={field.required}
              min={field.validation?.min}
              max={field.validation?.max}
              pattern={field.validation?.pattern}
            />
            {hasError && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {fields.map(renderField)}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                disabled={isSubmitting}
              >
                {cancelText}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {submitText}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
