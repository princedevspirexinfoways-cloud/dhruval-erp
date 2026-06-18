'use client'

import { useState } from 'react'
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  Key, 
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  useGetTwoFactorStatusQuery,
  useSetupTwoFactorMutation,
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
  useGenerateBackupCodesMutation
} from '@/lib/api/twoFactorApi'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

interface TwoFactorSettingsProps {
  className?: string
}

export function TwoFactorSettings({ className }: TwoFactorSettingsProps) {
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [setupData, setSetupData] = useState<{secret: string, qrCodeUrl: string} | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const { data: statusData, isLoading: statusLoading, refetch } = useGetTwoFactorStatusQuery()
  const [setupTwoFactor, { isLoading: setupLoading }] = useSetupTwoFactorMutation()
  const [enableTwoFactor, { isLoading: enableLoading }] = useEnableTwoFactorMutation()
  const [disableTwoFactor, { isLoading: disableLoading }] = useDisableTwoFactorMutation()
  const [generateBackupCodes, { isLoading: backupLoading }] = useGenerateBackupCodesMutation()

  const isEnabled = statusData?.data?.isEnabled || false
  const backupCodesCount = statusData?.data?.backupCodesCount || 0
  const isLoading = statusLoading || setupLoading || enableLoading || disableLoading || backupLoading

  // Reset all states when component mounts or status changes
  const resetAllStates = () => {
    setShowDisableConfirm(false)
    setShowSetup(false)
    setShowBackupCodes(false)
    setPassword('')
    setShowPassword(false)
    setVerificationCode('')
    setSetupData(null)
    setBackupCodes([])
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
      setBackupCodes(result.data.backupCodes)
      setShowSetup(false)
      setShowBackupCodes(true)
      setVerificationCode('')
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

    try {
      await disableTwoFactor({ password }).unwrap()
      setShowDisableConfirm(false)
      setPassword('')
      toast.success('2FA disabled successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to disable 2FA')
    }
  }

  const handleGenerateBackupCodes = async () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    try {
      const result = await generateBackupCodes({ password }).unwrap()
      setBackupCodes(result.data.backupCodes)
      setShowBackupCodes(true)
      setPassword('')
      toast.success('New backup codes generated')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate backup codes')
    }
  }

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetStates = () => {
    setShowDisableConfirm(false)
    setShowSetup(false)
    setShowBackupCodes(false)
    setPassword('')
    setVerificationCode('')
    setSetupData(null)
    setBackupCodes([])
  }

  if (statusLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {isEnabled ? (
            <ShieldCheck className="h-8 w-8 text-green-600" />
          ) : (
            <ShieldX className="h-8 w-8 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500">
              {isEnabled 
                ? 'Your account is protected with 2FA' 
                : 'Add an extra layer of security to your account'
              }
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isEnabled
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Status Information */}
      {isEnabled && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 font-medium">
                2FA is active and protecting your account
              </p>
              <p className="text-xs text-green-600 mt-1">
                Backup codes remaining: {backupCodesCount}
              </p>
              {statusData?.data?.lastUsed && (
                <p className="text-xs text-green-600">
                  Last used: {new Date(statusData.data.lastUsed).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="space-y-4">
        {!isEnabled ? (
          // Enable 2FA Section
          !showSetup ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Secure your account with 2FA
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Use an authenticator app like Google Authenticator or Authy
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSetupStart}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </div>
          ) : (
            // Setup Process
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Scan QR Code
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app
                </p>
                {setupData?.qrCodeUrl && (
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <QRCodeSVG value={setupData.qrCodeUrl} size={200} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter verification code from your app
                  </label>
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    className="max-w-xs text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleEnable}
                    disabled={!verificationCode || isLoading}
                  >
                    Verify & Enable 2FA
                  </Button>
                  <Button
                    onClick={resetStates}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )
        ) : (
          // Manage 2FA Section
          <div className="space-y-4">
            {!showDisableConfirm ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setShowDisableConfirm(true)}
                    variant="destructive"
                    size="sm"
                  >
                    <ShieldX className="h-4 w-4 mr-2" />
                    Disable 2FA
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Backup Codes Management
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter password to generate new backup codes
                      </label>
                      <div className="flex space-x-2 max-w-sm">
                        <div className="relative flex-1">
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
                        <Button
                          onClick={handleGenerateBackupCodes}
                          disabled={!password || isLoading}
                          size="sm"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Disable Confirmation
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Disable Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-red-600 mt-1">
                      This will make your account less secure. Enter your password to confirm.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative max-w-sm">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleDisable}
                      disabled={!password || isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {isLoading ? 'Disabling...' : 'Confirm Disable'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDisableConfirm(false)
                        setPassword('')
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backup Codes Modal */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Backup Codes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={downloadBackupCodes} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setShowBackupCodes(false)} size="sm">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
