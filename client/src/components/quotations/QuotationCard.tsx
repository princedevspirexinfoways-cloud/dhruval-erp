'use client'

import { useState } from 'react'
import {
  Eye,
  Edit,
  Trash2,
  Send,
  Copy,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  FileText,
  Download
} from 'lucide-react'
import { Quotation } from '@/lib/api/quotationsApi'
import clsx from 'clsx'

interface QuotationCardProps {
  quotation: Quotation
  onView?: (quotation: Quotation) => void
  onEdit?: (quotation: Quotation) => void
  onDelete?: (quotation: Quotation) => void
  onSend?: (quotation: Quotation) => void
  onDuplicate?: (quotation: Quotation) => void
  onDownload?: (quotation: Quotation) => void
}

export function QuotationCard({
  quotation,
  onView,
  onEdit,
  onDelete,
  onSend,
  onDuplicate,
  onDownload
}: QuotationCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'draft':
        return clsx(baseClasses, "bg-gray-100 text-gray-800")
      case 'sent':
        return clsx(baseClasses, "bg-blue-100 text-blue-800")
      case 'accepted':
        return clsx(baseClasses, "bg-green-100 text-green-800")
      case 'rejected':
        return clsx(baseClasses, "bg-red-100 text-red-800")
      case 'expired':
        return clsx(baseClasses, "bg-orange-100 text-orange-800")
      default:
        return clsx(baseClasses, "bg-gray-100 text-gray-800")
    }
  }

  const getDaysUntilExpiry = (validUntil: string) => {
    const today = new Date()
    const expiryDate = new Date(validUntil)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilExpiry = getDaysUntilExpiry(quotation.validUntil)

  return (
    <div className="bg-white rounded-xl border-2 border-sky-500 p-6 hover:border-black transition-colors">
      {/* Quotation Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-black truncate">
            {quotation.quotationNumber}
          </h3>
          <p className="text-sm text-sky-600 font-medium">
            {quotation.customer?.customerName || quotation.party?.partyName || 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(quotation.status)}
          <span className={getStatusBadge(quotation.status)}>
            {quotation.status}
          </span>
        </div>
      </div>

      {/* Quotation Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-black opacity-75">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Date: {formatDate(quotation.quotationDate)}</span>
          </div>
          <div className="flex items-center text-black opacity-75">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {daysUntilExpiry > 0 
                ? `${daysUntilExpiry} days left`
                : daysUntilExpiry === 0 
                ? 'Expires today'
                : 'Expired'
              }
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-black opacity-75">
            <User className="h-4 w-4 mr-2" />
            <span>Items: {quotation.items?.length || 0}</span>
          </div>
          <div className="flex items-center text-black font-semibold">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>{formatCurrency(quotation.amounts?.grandTotal || 0)}</span>
          </div>
        </div>

        {quotation.party?.contactInfo?.email && (
          <div className="flex items-center text-sm text-black opacity-75">
            <Building className="h-4 w-4 mr-2" />
            <span className="truncate">{quotation.party.contactInfo.email}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-sky-200">
        <div className="flex items-center space-x-2">
          {onView && (
            <button
              onClick={() => onView(quotation)}
              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
              title="View Quotation"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(quotation)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Quotation"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={() => onDownload(quotation)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onSend && quotation.status === 'draft' && (
            <button
              onClick={() => onSend(quotation)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Send Quotation"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(quotation)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Duplicate Quotation"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(quotation)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Quotation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
