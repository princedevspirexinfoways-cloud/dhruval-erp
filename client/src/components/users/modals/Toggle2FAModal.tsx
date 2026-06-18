import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal'
import {
  User as UserType,
  useToggle2FAMutation
} from '@/lib/features/users/usersApi'

interface Toggle2FAModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: UserType
}

export default function Toggle2FAModal({ isOpen, onClose, onSuccess, user }: Toggle2FAModalProps) {
  const [error, setError] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const [toggle2FA, { isLoading }] = useToggle2FAMutation()

  const isEnabling = !(user.is2FAEnabled || user.twoFactorEnabled)

  // Helper function to get user ID
  const getUserId = (user: UserType) => user.id || user._id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConfirmed) {
      setError('Please confirm the action by checking the checkbox')
      return
    }

    try {
      await toggle2FA({
        userId: getUserId(user),
        enable: isEnabling
      }).unwrap()

      toast.success(`2FA ${isEnabling ? 'enabled' : 'disabled'} successfully!`)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Toggle 2FA error:', error)

      let errorMessage = `Failed to ${isEnabling ? 'enable' : 'disable'} 2FA`
      if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.data?.error) {
        errorMessage = error.data.error
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to modify 2FA settings'
      } else if (error?.status === 404) {
        errorMessage = 'User not found'
      } else if (error?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      setError(errorMessage)
      toast.error(errorMessage)
    }
  }



  const userName = user.personalInfo?.displayName ||
    (user.personalInfo?.firstName && user.personalInfo?.lastName
      ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
      : user.name || user.username || 'User')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEnabling ? 'Enable' : 'Disable'} Two-Factor Authentication`}
      subtitle={`${isEnabling ? 'Secure' : 'Remove security from'} ${userName}'s account`}
      size="md"
      headerClassName={`bg-gradient-to-r ${
        isEnabling
          ? 'from-purple-500 to-indigo-600'
          : 'from-orange-500 to-red-600'
      }`}
    >
      <ModalContent>
          {/* User Info */}
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-black">{user.name || 'Unnamed User'}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    (user.is2FAEnabled || user.twoFactorEnabled)
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    <Shield className="w-3 h-3 mr-1" />
                    2FA {(user.is2FAEnabled || user.twoFactorEnabled) ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className={`rounded-xl p-4 border mb-6 ${
            isEnabling 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-start gap-3">
              {isEnabling ? (
                <Smartphone className="w-5 h-5 text-purple-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold mb-2 ${
                  isEnabling ? 'text-purple-800' : 'text-orange-800'
                }`}>
                  {isEnabling ? 'About Two-Factor Authentication' : 'Disabling Two-Factor Authentication'}
                </p>
                
                {isEnabling ? (
                  <div className="text-xs text-purple-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-purple-600" />
                      <span>Adds an extra layer of security to the account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-purple-600" />
                      <span>Requires a mobile app like Google Authenticator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-purple-600" />
                      <span>User will need to set up their authenticator app</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-orange-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                      <span>This will reduce account security</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                      <span>User will only need password to log in</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                      <span>Consider the security implications carefully</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <form id="toggle-2fa-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I understand the implications and want to {isEnabling ? 'enable' : 'disable'} Two-Factor Authentication for{' '}
                  <strong>{user.personalInfo?.displayName || user.username}</strong>
                </span>
              </label>
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
              )}
            </div>
        </form>
      </ModalContent>
      <ModalFooter>
        <Button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          form="toggle-2fa-form"
          disabled={isLoading}
          className={`px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-white ${
            isEnabling
              ? 'bg-purple-500 hover:bg-purple-600'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEnabling ? 'Enable 2FA' : 'Disable 2FA'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
