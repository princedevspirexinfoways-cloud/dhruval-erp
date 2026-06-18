'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  useGetTwoFactorStatusQuery,
  useSetupTwoFactorMutation,
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
  useGenerateBackupCodesMutation,
  useTestTwoFactorMutation
} from '@/lib/api/twoFactorApi'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Shield, ShieldCheck, ShieldX, Copy, Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface TwoFactorSetupProps {
  className?: string
}

export function TwoFactorSetup({ className }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup' | 'disable'>('status')
  const [verificationToken, setVerificationToken] = useState('')
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showConfirmDisable, setShowConfirmDisable] = useState(false)

  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useGetTwoFactorStatusQuery()
  const [setupTwoFactor, { isLoading: isSettingUp }] = useSetupTwoFactorMutation()
  const [enableTwoFactor, { isLoading: isEnabling }] = useEnableTwoFactorMutation()
  const [disableTwoFactor, { isLoading: isDisabling }] = useDisableTwoFactorMutation()
  const [generateBackupCodes, { isLoading: isGeneratingCodes }] = useGenerateBackupCodesMutation()
  const [testTwoFactor, { isLoading: isTesting }] = useTestTwoFactorMutation()

  const isLoading = statusLoading || isSettingUp || isEnabling || isDisabling || isGeneratingCodes || isTesting

  const isEnabled = statusData?.data?.isEnabled || false

  const handleSetup = async () => {
    try {
      const result = await setupTwoFactor().unwrap()
      setSecret(result.data.secret)
      setQrCodeUrl(result.data.qrCodeUrl)
      setStep('setup')
      toast.success('2FA setup initiated. Scan the QR code with your authenticator app.')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to setup 2FA')
    }
  }

  const handleTestToken = async () => {
    if (!verificationToken || !secret) return

    try {
      await testTwoFactor({ secret, token: verificationToken }).unwrap()
      toast.success('Token verified! Proceeding to enable 2FA.')
      setStep('verify')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Invalid token. Please try again.')
    }
  }

  const handleEnable = async () => {
    if (!verificationToken) return

    try {
      const result = await enableTwoFactor({ token: verificationToken }).unwrap()
      setBackupCodes(result.data.backupCodes)
      setStep('backup')
      toast.success('2FA enabled successfully!')
      refetchStatus()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to enable 2FA')
    }
  }

  const handleDisable = async () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    try {
      await disableTwoFactor({ password }).unwrap()
      toast.success('2FA disabled successfully')
      setStep('status')
      setPassword('')
      setShowConfirmDisable(false)
      refetchStatus()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to disable 2FA')
    }
  }

  const handleCancelDisable = () => {
    setShowConfirmDisable(false)
    setPassword('')
    setStep('status')
  }

  const handleGenerateNewBackupCodes = async () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    try {
      const result = await generateBackupCodes({ password }).unwrap()
      setBackupCodes(result.data.backupCodes)
      toast.success('New backup codes generated')
      setPassword('')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate backup codes')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const downloadBackupCodes = async () => {
    try {
      // Import download utility dynamically
      const { downloadText } = await import('@/utils/downloadUtils')

      const content = backupCodes.join('\n')
      const success = await downloadText(content, 'backup-codes.txt')

      if (!success) {
        // Fallback to original method
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'backup-codes.txt'
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Backup codes download failed:', error)
      // Fallback to original method
      const content = backupCodes.join('\n')
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'backup-codes.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const renderStatus = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        {isEnabled ? (
          <ShieldCheck className="h-8 w-8 text-green-600" />
        ) : (
          <ShieldX className="h-8 w-8 text-red-600" />
        )}
        <div>
          <h3 className="text-lg font-semibold">
            Two-Factor Authentication {isEnabled ? 'Enabled' : 'Disabled'}
          </h3>
          <p className="text-sm text-gray-600">
            {isEnabled 
              ? 'Your account is protected with 2FA' 
              : 'Add an extra layer of security to your account'
            }
          </p>
        </div>
      </div>

      {isEnabled ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              2FA is active. You have {statusData?.data?.backupCodesCount || 0} backup codes remaining.
            </p>
            {statusData?.data?.lastUsed && (
              <p className="text-xs text-green-600 mt-1">
                Last used: {new Date(statusData.data.lastUsed).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter password to manage 2FA
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="max-w-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleGenerateNewBackupCodes}
                disabled={!password || isGeneratingCodes}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New Backup Codes
              </Button>

              <Button
                onClick={handleDisable}
                disabled={!password || isDisabling}
                variant="destructive"
                size="sm"
              >
                <ShieldX className="h-4 w-4 mr-2" />
                Disable 2FA
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={handleSetup} disabled={isSettingUp}>
          <Shield className="h-4 w-4 mr-2" />
          Enable Two-Factor Authentication
        </Button>
      )}
    </div>
  )

  const renderSetup = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Setup Two-Factor Authentication</h3>
        <p className="text-sm text-gray-600">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
      </div>

      {qrCodeUrl ? (
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            {qrCodeUrl.startsWith('data:image') ? (
              // If it's a data URL from server, display as image
              <img
                src={qrCodeUrl}
                alt="2FA QR Code"
                className="w-48 h-48 object-contain"
              />
            ) : (
              // If it's a raw otpauth URL, use QRCodeSVG
              <QRCodeSVG
                value={qrCodeUrl}
                size={192}
                level="M"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-yellow-600" />
            <h4 className="text-sm font-medium text-yellow-800">QR Code Unavailable</h4>
          </div>
          <p className="text-sm text-yellow-700">
            Please use the manual entry method below to add your account to your authenticator app.
          </p>
        </div>
      )}

      {/* Manual Entry Section */}
      <div className={`p-4 rounded-lg border-2 ${!qrCodeUrl ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Copy className="h-5 w-5 text-blue-600" />
          <h4 className="text-sm font-medium text-gray-900">Manual Setup</h4>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          {!qrCodeUrl
            ? 'Add this account to your authenticator app manually:'
            : 'Or manually enter this key if you prefer:'
          }
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Secret Key</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono break-all select-all">
                {secret}
              </code>
              <Button
                onClick={() => copyToClipboard(secret)}
                variant="outline"
                size="sm"
                title="Copy secret key"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium text-gray-700">Account name:</span>
              <div className="text-gray-600 font-mono">Enterprise ERP</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Issuer:</span>
              <div className="text-gray-600 font-mono">Enterprise ERP</div>
            </div>
          </div>
        </div>

        {!qrCodeUrl && (
          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Steps:</strong> Open your authenticator app → Add account → Enter account manually →
              Paste the secret key above → Save
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter the 6-digit code from your authenticator app
          </label>
          <Input
            type="text"
            value={verificationToken}
            onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="max-w-sm text-center text-lg tracking-widest"
            maxLength={6}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleTestToken}
            disabled={verificationToken.length !== 6 || isTesting}
          >
            Verify Code
          </Button>
          <Button
            onClick={() => setStep('status')}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )

  const renderVerify = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Confirm Setup</h3>
        <p className="text-sm text-gray-600">
          Enter the code from your authenticator app one more time to confirm the setup.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmation Code
          </label>
          <Input
            type="text"
            value={verificationToken}
            onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="max-w-sm text-center text-lg tracking-widest"
            maxLength={6}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleEnable}
            disabled={verificationToken.length !== 6 || isEnabling}
          >
            Enable 2FA
          </Button>
          <Button
            onClick={() => setStep('setup')}
            variant="outline"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )

  const renderBackupCodes = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Backup Codes</h3>
        <p className="text-sm text-gray-600">
          Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {backupCodes.map((code, index) => (
            <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
              <span>{code}</span>
              <button
                onClick={() => copyToClipboard(code)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={downloadBackupCodes} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Codes
        </Button>
        <Button onClick={() => setStep('status')}>
          Done
        </Button>
      </div>
    </div>
  )

  return (
    <ResponsiveCard className={className} padding="lg">
      {step === 'status' && renderStatus()}
      {step === 'setup' && renderSetup()}
      {step === 'verify' && renderVerify()}
      {step === 'backup' && renderBackupCodes()}
    </ResponsiveCard>
  )
}
