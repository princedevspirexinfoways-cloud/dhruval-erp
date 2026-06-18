'use client'

import { FileText } from 'lucide-react'
import { StockMovement } from '../types'

interface MovementNotesProps {
  theme: 'light' | 'dark'
  movement: StockMovement
}

export function MovementNotes({ theme, movement }: MovementNotesProps) {
  const notes = (movement as any).notes

  if (!notes) {
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
        <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
        <span>Additional Notes</span>
      </h3>
      <p className={`rounded-lg p-4 whitespace-pre-wrap ${
        theme === 'dark'
          ? 'text-gray-300 bg-gray-700/50'
          : 'text-gray-700 bg-gray-50'
      }`}>
        {notes}
      </p>
    </div>
  )
}
















