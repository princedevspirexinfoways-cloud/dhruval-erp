'use client'

import { useState } from 'react'
import { useVerifyTwoFactorMutation } from '@/lib/api/twoFactorApi'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Shield, Key } from 'lucide-react'
import toast from 'react-hot-toast'

interface TwoFactorVerificationProps {
  onSuccess: () => void
  onCancel: () => void
  className?: string
}

export function TwoFactorVerification({ 
  onSuccess, 
  onCancel, 
  className 
}: TwoFactorVerificationProps) {
  const [token, setToken] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  
  const [verifyTwoFactor, { isLoading }] = useVerifyTwoFactorMutation()

  const handleVerify = async () => {
    if (!token && !backupCode) {
      toast.error('Please enter a verification code')
      return
    }

    try {
      const result = await verifyTwoFactor({
        token: useBackupCode ? '' : token,
        backupCode: useBackupCode ? backupCode : undefined
      }).unwrap()

      if (result.success) {
        toast.success('Verification successful!')
        onSuccess()
      } else {
        toast.error(result.message || 'Verification failed')
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Verification failed')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  return (
    <ResponsiveCard className={className} padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-sky-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            {useBackupCode 
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          {!useBackupCode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authenticator Code
              </label>
              <Input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code
              </label>
              <Input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8))}
                onKeyPress={handleKeyPress}
                placeholder="Enter backup code"
                className="text-center text-lg tracking-wider font-mono"
                maxLength={8}
                autoFocus
              />
            </div>
          )}

          {/* Toggle between authenticator and backup code */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode)
                setToken('')
                setBackupCode('')
              }}
              className="text-sm text-sky-600 hover:text-sky-800 underline"
            >
              {useBackupCode 
                ? 'Use authenticator app instead'
                : 'Use backup code instead'
              }
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleVerify}
            disabled={
              isLoading || 
              (!useBackupCode && token.length !== 6) || 
              (useBackupCode && backupCode.length < 6)
            }
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Verify
              </>
            )}
          </Button>
          
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>
            Having trouble? Make sure your device's time is synchronized.
          </p>
          {!useBackupCode && (
            <p>
              If you don't have access to your authenticator app, use a backup code.
            </p>
          )}
        </div>
      </div>
    </ResponsiveCard>
  )
}
