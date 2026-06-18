'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, ShieldX, User, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  useToggleUserStatusMutation,
  useEnableUser2FAMutation,
  useDisableUser2FAMutation
} from '@/lib/api/adminApi'
import toast from 'react-hot-toast'

interface QuickUserToggleProps {
  userId: string
  userName: string
  isActive: boolean
  twoFactorEnabled: boolean
  onUpdate: () => void
  className?: string
}

export function QuickUserToggle({
  userId,
  userName,
  isActive,
  twoFactorEnabled,
  onUpdate,
  className
}: QuickUserToggleProps) {
  const [toggleUserStatus, { isLoading: isTogglingStatus }] = useToggleUserStatusMutation()
  const [enableUser2FA, { isLoading: isEnabling2FA }] = useEnableUser2FAMutation()
  const [disableUser2FA, { isLoading: isDisabling2FA }] = useDisableUser2FAMutation()

  const loading = isTogglingStatus || isEnabling2FA || isDisabling2FA

  const handleToggleStatus = async () => {
    try {
      const result = await toggleUserStatus(userId).unwrap()
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`)
      onUpdate()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update user status')
    }
  }

  const handleToggle2FA = async () => {
    try {
      if (twoFactorEnabled) {
        await disableUser2FA(userId).unwrap()
        toast.success(`2FA disabled for ${userName}`)
      } else {
        await enableUser2FA(userId).unwrap()
        toast.success(`2FA enabled for ${userName}`)
      }
      onUpdate()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update 2FA status')
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* User Status Toggle */}
      <Button
        onClick={handleToggleStatus}
        disabled={loading}
        variant="outline"
        size="sm"
        className={`${
          isActive 
            ? 'text-green-600 border-green-300 hover:bg-green-50' 
            : 'text-red-600 border-red-300 hover:bg-red-50'
        }`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
        ) : isActive ? (
          <UserCheck className="h-3 w-3" />
        ) : (
          <UserX className="h-3 w-3" />
        )}
      </Button>

      {/* 2FA Toggle */}
      <Button
        onClick={handleToggle2FA}
        disabled={loading}
        variant="outline"
        size="sm"
        className={`${
          twoFactorEnabled 
            ? 'text-green-600 border-green-300 hover:bg-green-50' 
            : 'text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
        ) : twoFactorEnabled ? (
          <ShieldCheck className="h-3 w-3" />
        ) : (
          <ShieldX className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}
