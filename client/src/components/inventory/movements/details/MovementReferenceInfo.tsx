'use client'

import { FileText } from 'lucide-react'
import { StockMovement } from '../types'
import { formatDate } from '../utils'

interface MovementReferenceInfoProps {
  theme: 'light' | 'dark'
  movement: StockMovement
}

export function MovementReferenceInfo({ theme, movement }: MovementReferenceInfoProps) {
  const referenceDoc = (movement as any).referenceDocument

  if (!referenceDoc) {
    return null
  }

  return (
    <div className={`rounded-xl border p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}>
        <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
        <span>Reference Document</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Document Type</label>
          <p className={`capitalize ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {referenceDoc.documentType?.replace('_', ' ') || referenceDoc.type?.replace('_', ' ') || 'Manual Entry'}
          </p>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Reference Number</label>
          <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {referenceDoc.documentNumber || referenceDoc.number || 'N/A'}
          </p>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Document Date</label>
          <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
            {referenceDoc.date ? formatDate(referenceDoc.date) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
















