'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Shield, Key, ArrowLeft, RefreshCw } from 'lucide-react'
import { setCredentials } from '@/lib/features/auth/authSlice'
import { useLoginTwoFactorVerifyMutation, useTwoFactorResetRequestMutation } from '@/lib/api/twoFactorApi'
import toast from 'react-hot-toast'

interface LoginTwoFactorVerificationProps {
  tempToken: string
  onCancel: () => void
  className?: string
}

export function LoginTwoFactorVerification({ 
  tempToken, 
  onCancel, 
  className 
}: LoginTwoFactorVerificationProps) {
  const [token, setToken] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const router = useRouter()
  const dispatch = useDispatch()

  // RTK Query hooks
  const [loginTwoFactorVerify, { isLoading }] = useLoginTwoFactorVerifyMutation()
  const [twoFactorResetRequest, { isLoading: isResetting }] = useTwoFactorResetRequestMutation()

  const handleVerify = async () => {
    if (!token && !backupCode) {
      toast.error('Please enter a verification code')
      return
    }

    if (!tempToken) {
      toast.error('Invalid session. Please login again.')
      onCancel()
      return
    }

    // Basic JWT validation (should have 3 parts separated by dots)
    if (!tempToken.includes('.') || tempToken.split('.').length !== 3) {
      toast.error('Invalid session token. Please login again.')
      console.error('Invalid tempToken format:', tempToken)
      onCancel()
      return
    }

    console.log('2FA Verification attempt:', {
      useBackupCode,
      hasToken: !!token,
      hasBackupCode: !!backupCode,
      tempToken: tempToken ? 'present' : 'missing'
    })

    try {
      const result = await loginTwoFactorVerify({
        token: useBackupCode ? undefined : token,
        backupCode: useBackupCode ? backupCode : undefined,
        tempToken: tempToken
      }).unwrap()

      console.log('2FA Verification response:', result)

      if (result.success) {
        // Handle successful 2FA verification - extract from data object
        const userData = result.data?.user || result.user
        const token = result.data?.tokens?.accessToken || result.token
        const companies = result.data?.companies || result.companies || []
        const permissions = result.data?.permissions || result.permissions

        console.log('2FA Success - storing auth data:', {
          hasUser: !!userData,
          hasToken: !!token,
          hasCompanies: !!companies,
          tokenLength: token?.length || 0
        })

        const refreshToken = result.data?.tokens?.refreshToken || result.refreshToken || ''

        dispatch(setCredentials({
          user: userData,
          token: token || '',
          refreshToken: refreshToken,
          companies: companies,
          permissions: Array.isArray(permissions) ? undefined : permissions
        }))

        // Store tokens in localStorage for persistence
        if (token) {
          localStorage.setItem('accessToken', token)
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken)
        }

        toast.success('Two-factor authentication successful!')
        router.push('/dashboard')
      } else {
        console.error('2FA Verification failed:', result)
        toast.error(result.message || 'Verification failed')
      }
    } catch (error: any) {
      console.error('2FA verification error:', error)
      toast.error(error?.data?.message || 'Verification failed. Please try again.')
    }
  }

  const handleReset2FA = async () => {
    try {
      const result = await twoFactorResetRequest({
        tempToken: tempToken
      }).unwrap()

      if (result.success) {
        toast.success('2FA reset request sent. Please check your email for instructions.')
        onCancel() // Go back to login form
      } else {
        toast.error(result.message || 'Failed to send reset request')
      }
    } catch (error: any) {
      console.error('2FA reset error:', error)
      toast.error(error?.data?.message || 'Failed to send reset request. Please try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

        {/* Input Field */}
        <div className="space-y-4">
          {useBackupCode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter backup code"
                  className="pl-10 text-gray-900 font-medium"
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={handleKeyDown}
                  placeholder="123456"
                  className="pl-10 text-center text-lg tracking-widest text-gray-900 font-bold"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleVerify}
            disabled={(!token && !backupCode) || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify & Login'
            )}
          </Button>

          <div className="flex space-x-2">
            <Button
              onClick={() => setUseBackupCode(!useBackupCode)}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={isLoading}
            >
              {useBackupCode ? 'Use Authenticator' : 'Use Backup Code'}
            </Button>

            <Button
              onClick={handleReset2FA}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset 2FA
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Lost access to your authenticator? Use a backup code or reset your 2FA settings.
          </p>
        </div>
      </div>
    </ResponsiveCard>
  )
}
