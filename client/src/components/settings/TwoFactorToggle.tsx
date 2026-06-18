'use client'

import { useState } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Download,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  useGetTwoFactorStatusQuery,
  useSetupTwoFactorMutation,
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation
} from '@/lib/api/twoFactorApi'
import toast from 'react-hot-toast'

interface TwoFactorToggleProps {
  className?: string
}

export function TwoFactorToggle({ className }: TwoFactorToggleProps) {
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [disableToken, setDisableToken] = useState('')
  const [setupData, setSetupData] = useState<{secret: string, qrCodeUrl: string} | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const { data: statusData, isLoading: statusLoading, refetch } = useGetTwoFactorStatusQuery()
  const [setupTwoFactor, { isLoading: setupLoading }] = useSetupTwoFactorMutation()
  const [enableTwoFactor, { isLoading: enableLoading }] = useEnableTwoFactorMutation()
  const [disableTwoFactor, { isLoading: disableLoading }] = useDisableTwoFactorMutation()

  const isEnabled = statusData?.data?.isEnabled || false
  const isLoading = statusLoading || setupLoading || enableLoading || disableLoading

  const handleToggle = async () => {
    if (isEnabled) {
      setShowDisable(true)
    } else {
      await handleSetupStart()
    }
  }

  const handleSetupStart = async () => {
    try {
      const result = await setupTwoFactor().unwrap()
      setSetupData({
        secret: result.data.secret,
        qrCodeUrl: result.data.qrCodeUrl
      })
      setShowSetup(true)
      toast.success('Scan the QR code with your authenticator app')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to setup 2FA')
    }
  }

  const handleEnable = async () => {
    if (!verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    try {
      const result = await enableTwoFactor({ token: verificationCode }).unwrap()
      setShowSetup(false)
      setVerificationCode('')
      setSetupData(null)

      // Show backup codes if returned
      if (result.data?.backupCodes && result.data.backupCodes.length > 0) {
        setBackupCodes(result.data.backupCodes)
        setShowBackupCodes(true)
      }

      toast.success('2FA enabled successfully!')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Invalid verification code')
    }
  }

  const handleDisable = async () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    if (!disableToken) {
      toast.error('Please enter your 2FA code to disable')
      return
    }

    try {
      await disableTwoFactor({ password, token: disableToken }).unwrap()
      setShowDisable(false)
      setPassword('')
      setDisableToken('')
      toast.success('2FA disabled successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to disable 2FA')
    }
  }

  const resetStates = () => {
    setShowSetup(false)
    setShowDisable(false)
    setShowBackupCodes(false)
    setPassword('')
    setShowPassword(false)
    setVerificationCode('')
    setDisableToken('')
    setSetupData(null)
    setBackupCodes([])
  }

  if (statusLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          {isEnabled ? (
            <ShieldCheck className="h-6 w-6 text-green-600" />
          ) : (
            <ShieldX className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500">
              {isEnabled 
                ? 'Your account is protected with 2FA' 
                : 'Add extra security to your account'
              }
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleToggle}
          disabled={isLoading}
          className={`${
            isEnabled 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              {isEnabled ? 'Disable' : 'Enable'}
            </>
          )}
        </Button>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enable Two-Factor Authentication
            </h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {setupData?.qrCodeUrl ? (
                  <div className="inline-block p-4 bg-gray-50 rounded-lg">
                    <img
                      src={setupData.qrCodeUrl}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                ) : setupData?.secret && (
                  <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-sm text-gray-600 mb-2">
                      Manual entry code:
                    </p>
                    <code className="text-xs bg-white p-2 rounded border block text-center break-all">
                      {setupData.secret}
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                      Enter this code manually in your authenticator app
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the 6-digit code from your app
                </label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleEnable}
                  disabled={verificationCode.length !== 6 || enableLoading}
                  className="flex-1"
                >
                  {enableLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Enable 2FA
                </Button>
                <Button
                  onClick={resetStates}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable Confirmation Modal */}
      {showDisable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Disable Two-Factor Authentication
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Disabling 2FA will make your account less secure.
                  Enter your password and current 2FA code to confirm.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 2FA code from your authenticator app
                  </label>
                  <Input
                    type="text"
                    value={disableToken}
                    onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDisable}
                  disabled={!password || !disableToken || disableToken.length !== 6 || disableLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  {disableLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Disable 2FA
                </Button>
                <Button
                  onClick={resetStates}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-sm w-full mx-2 my-4 p-4 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">
                2FA Enabled!
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-yellow-100 border border-yellow-400 rounded-md p-3">
                <p className="text-sm text-yellow-900 font-bold">
                  ⚠️ Save these backup codes
                </p>
                <p className="text-xs text-yellow-800 mt-1">
                  Use them if you lose your authenticator device.
                </p>
              </div>

              <div className="bg-gray-100 rounded-md p-3 border border-gray-300">
                <p className="text-xs text-gray-900 mb-2 font-bold">
                  Your Backup Codes:
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-blue-200 text-center font-bold text-black">
                      <span className="text-sm">{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-100 border border-blue-400 rounded-md p-3">
                <p className="text-sm text-blue-900 font-bold">
                  💡 Tips:
                </p>
                <ul className="text-xs text-blue-800 mt-1 space-y-1">
                  <li>• Save in secure location</li>
                  <li>• Each code used only once</li>
                  <li>• Generate new codes in settings</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const content = backupCodes.join('\n')
                      const blob = new Blob([content], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = '2fa-backup-codes.txt'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0 text-sm py-2"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'))
                      toast.success('Backup codes copied!')
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 text-sm py-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <Button
                  onClick={() => setShowBackupCodes(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white border-0 text-sm py-2"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      {isEnabled && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">
              2FA is active. You have {statusData?.data?.backupCodesCount || 0} backup codes remaining.
            </p>
          </div>
          {statusData?.data?.lastUsed && (
            <p className="text-xs text-green-600 mt-1 ml-6">
              Last used: {new Date(statusData.data.lastUsed).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
