import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Trash2,
  AlertTriangle,
  User,
  Shield,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal'
import {
  User as UserType,
  useDeleteUserMutation
} from '@/lib/features/users/usersApi'

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: UserType
}

export default function DeleteUserModal({ isOpen, onClose, onSuccess, user }: DeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const [deleteUser, { isLoading }] = useDeleteUserMutation()

  // Helper function to get user ID
  const getUserId = (user: UserType) => user.id || user._id

  const userName =
    user.personalInfo?.displayName ||
    (user.personalInfo?.firstName && user.personalInfo?.lastName
      ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
      : user.name || user.username || 'User')

  const expectedConfirmText = `DELETE ${userName.toUpperCase()}`
  const isConfirmValid = confirmText === expectedConfirmText

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConfirmValid) {
      setError('Please type the exact confirmation text')
      return
    }

    try {
      await deleteUser(getUserId(user)).unwrap()
      toast.success('User deleted successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Delete user error:', error)

      let errorMessage = 'Failed to delete user'
      if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.data?.error) {
        errorMessage = error.data.error
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to delete this user'
      } else if (error?.status === 404) {
        errorMessage = 'User not found'
      } else if (error?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleConfirmTextChange = (value: string) => {
    setConfirmText(value)
    if (error) setError('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete User"
      subtitle="This action cannot be undone"
      size="md"
      headerClassName="bg-gradient-to-r from-red-500 to-red-600"
    >
      <ModalContent>
        <form id="delete-form" onSubmit={handleSubmit}>
          {/* User Info */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-bold text-black text-lg">{user.name || 'Unnamed User'}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                    <User className="w-3 h-3 mr-1" />
                    {user.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Helper'}
                  </span>
                  {(user.is2FAEnabled || user.twoFactorEnabled) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <Shield className="w-3 h-3 mr-1" />
                      2FA Enabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  Warning: This action is irreversible
                </p>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                    <span>The user account will be permanently deleted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                    <span>All user data and permissions will be removed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                    <span>The user will lose access to all systems immediately</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                    <span>This action cannot be undone</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Type{' '}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">
                  {expectedConfirmText}
                </span>{' '}
                to confirm deletion
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => handleConfirmTextChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono ${
                  error
                    ? 'border-red-300 bg-red-50'
                    : confirmText && !isConfirmValid
                    ? 'border-yellow-300 bg-yellow-50'
                    : isConfirmValid
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 bg-white'
                }`}
                placeholder={expectedConfirmText}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
              )}
              {confirmText && !isConfirmValid && !error && (
                <p className="mt-1 text-sm text-yellow-600 font-medium">
                  Text doesn't match. Please type exactly: {expectedConfirmText}
                </p>
              )}
              {isConfirmValid && (
                <p className="mt-1 text-sm text-green-600 font-medium">
                  Confirmation text matches. You can now delete the user.
                </p>
              )}
            </div>

            {/* Final Warning */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Are you absolutely sure?
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    This will permanently delete {user.name}'s account and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
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
          form="delete-form"
          disabled={isLoading || !isConfirmValid}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Trash2 className="w-4 h-4 mr-2" />
          Delete User
        </Button>
      </ModalFooter>
    </Modal>
  )
}
