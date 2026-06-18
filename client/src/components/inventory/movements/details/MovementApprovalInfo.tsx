'use client'

import { CheckCircle } from 'lucide-react'
import { StockMovement } from '../types'
import { formatDate, getStatusBadge } from '../utils'
import { CheckCircle as CheckCircleIcon, Clock, XCircle, TrendingUp, AlertTriangle, User } from 'lucide-react'

interface MovementApprovalInfoProps {
  theme: 'light' | 'dark'
  movement: StockMovement
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-4 h-4 text-green-600" />
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-600" />
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-600" />
    case 'in_progress':
      return <TrendingUp className="w-4 h-4 text-blue-600" />
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-600" />
  }
}

export function MovementApprovalInfo({ theme, movement }: MovementApprovalInfoProps) {
  const approval = (movement as any).approval
  const requiresApproval = (movement as any).requiresApproval

  if (!requiresApproval && !approval) {
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
        <CheckCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
        <span>Approval & Status</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Approval Required</label>
          <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
            {requiresApproval ? 'Yes' : 'No'}
          </p>
        </div>
        {approval && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Approval Status</label>
              <div className={getStatusBadge(approval.status, theme)}>
                {getStatusIcon(approval.status)}
                <span className="capitalize">{(approval.status || 'Unknown').replace('_', ' ')}</span>
              </div>
            </div>
            {approval.approvedBy && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Approved By</label>
                <div className="flex items-center space-x-2">
                  <User className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{approval.approvedBy}</p>
                </div>
              </div>
            )}
            {approval.approvedAt && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Approved At</label>
                <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                  {formatDate(approval.approvedAt)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
















