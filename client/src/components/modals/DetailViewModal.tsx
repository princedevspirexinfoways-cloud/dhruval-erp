'use client'

import { X, Edit, Trash2, Download } from 'lucide-react'
import clsx from 'clsx'

interface DetailField {
  label: string
  value: any
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'list' | 'image'
  render?: (value: any) => React.ReactNode
}

interface DetailSection {
  title: string
  fields: DetailField[]
  className?: string
}

interface DetailViewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  sections: DetailSection[]
  actions?: {
    onEdit?: () => void
    onDelete?: () => void
    onDownload?: () => void
    customActions?: Array<{
      label: string
      onClick: () => void
      icon?: React.ReactNode
      variant?: 'primary' | 'secondary' | 'danger'
    }>
  }
  loading?: boolean
  className?: string
}

export function DetailViewModal({
  isOpen,
  onClose,
  title,
  sections,
  actions,
  loading = false,
  className
}: DetailViewModalProps) {
  const formatValue = (field: DetailField) => {
    if (field.render) {
      return field.render(field.value)
    }

    switch (field.type) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(field.value || 0)
      
      case 'date':
        return field.value ? new Date(field.value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-'
      
      case 'number':
        return new Intl.NumberFormat('en-IN').format(field.value || 0)
      
      case 'badge':
        return (
          <span className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            getBadgeColor(field.value)
          )}>
            {String(field.value || '').replace('_', ' ').toUpperCase()}
          </span>
        )
      
      case 'list':
        return Array.isArray(field.value) ? (
          <div className="flex flex-wrap gap-1">
            {field.value.map((item, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {String(item)}
              </span>
            ))}
          </div>
        ) : '-'
      
      case 'image':
        return field.value ? (
          <img src={field.value} alt="Image" className="h-16 w-16 object-cover rounded-lg" />
        ) : '-'
      
      default:
        return String(field.value || '-')
    }
  }

  const getBadgeColor = (value: any) => {
    const val = String(value).toLowerCase()
    if (['active', 'operational', 'completed', 'delivered', 'confirmed'].includes(val)) {
      return 'bg-green-100 text-green-600'
    }
    if (['warning', 'pending', 'in_progress', 'processing'].includes(val)) {
      return 'bg-yellow-100 text-yellow-600'
    }
    if (['error', 'critical', 'failed', 'cancelled', 'rejected'].includes(val)) {
      return 'bg-red-100 text-red-600'
    }
    if (['maintenance', 'offline', 'inactive'].includes(val)) {
      return 'bg-gray-100 text-gray-600'
    }
    return 'bg-blue-100 text-blue-600'
  }

  const getActionButtonClass = (variant: string = 'secondary') => {
    const baseClass = 'flex items-center px-4 py-2 rounded-lg font-medium transition-colors'
    switch (variant) {
      case 'primary':
        return `${baseClass} bg-blue-500 text-white hover:bg-blue-600`
      case 'danger':
        return `${baseClass} bg-red-500 text-white hover:bg-red-600`
      default:
        return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`
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
        <div className={clsx(
          'relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden',
          className
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="animate-pulse space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className={clsx('space-y-4', section.className)}>
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {section.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="space-y-1">
                          <label className="text-sm font-medium text-gray-600">
                            {field.label}
                          </label>
                          <div className="text-sm text-gray-900">
                            {formatValue(field)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              {actions.onDownload && (
                <button
                  onClick={actions.onDownload}
                  className={getActionButtonClass('secondary')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              )}
              
              {actions.customActions?.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={getActionButtonClass(action.variant)}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
              
              {actions.onEdit && (
                <button
                  onClick={actions.onEdit}
                  className={getActionButtonClass('primary')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              
              {actions.onDelete && (
                <button
                  onClick={actions.onDelete}
                  className={getActionButtonClass('danger')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
