import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Eye,
  EyeOff,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal'
import {
  User as UserType,
  useChangeUserPasswordMutation
} from '@/lib/features/users/usersApi'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: UserType
}

interface FormData {
  newPassword: string
  confirmPassword: string
}

export default function PasswordModal({ isOpen, onClose, onSuccess, user }: PasswordModalProps) {
  const [formData, setFormData] = useState<FormData>({
    newPassword: '',
    confirmPassword: ''
  })

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const [changePassword, { isLoading }] = useChangeUserPasswordMutation()

  // Helper function to get user ID
  const getUserId = (user: UserType) => user.id || user._id

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await changePassword({
        userId: getUserId(user),
        newPassword: formData.newPassword
      }).unwrap()

      toast.success('Password changed successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Change password error:', error)

      let errorMessage = 'Failed to change password'
      if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.data?.error) {
        errorMessage = error.data.error
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to change this user\'s password'
      } else if (error?.status === 404) {
        errorMessage = 'User not found'
      } else if (error?.status === 400) {
        errorMessage = 'Invalid password format'
      } else if (error?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      toast.error(errorMessage)
    }
  }

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key as keyof FormData]
    })
    setErrors(newErrors)
  }

  const handleClose = () => {
    // Reset form data
    setFormData({ newPassword: '', confirmPassword: '' })
    setErrors({})
    onClose()
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ]
    
    strength = checks.filter(Boolean).length
    
    if (strength <= 2) return { level: 'weak', color: 'bg-red-500', text: 'Weak' }
    if (strength <= 3) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' }
    if (strength <= 4) return { level: 'strong', color: 'bg-green-500', text: 'Strong' }
    return { level: 'very-strong', color: 'bg-green-600', text: 'Very Strong' }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)
  const userName = user.personalInfo?.displayName ||
    (user.personalInfo?.firstName && user.personalInfo?.lastName
      ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
      : user.name || user.username || 'User')

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      subtitle={`Update password for ${userName}`}
      size="md"
      headerClassName="bg-gradient-to-r from-green-500 to-emerald-600"
    >
      <ModalContent>
        <form id="password-form" onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-black">{user.name || 'Unnamed User'}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={(e) => updateFormData({ newPassword: e.target.value })}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                      errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.level === 'weak' ? 20 : passwordStrength.level === 'medium' ? 50 : passwordStrength.level === 'strong' ? 80 : 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.level === 'weak' ? 'text-red-600' :
                        passwordStrength.level === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        {formData.newPassword.length >= 8 ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        <span>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/(?=.*[a-z])(?=.*[A-Z])/.test(formData.newPassword) ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        <span>Uppercase and lowercase letters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/\d/.test(formData.newPassword) ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        <span>At least one number</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 mb-1">Security Notice</p>
                  <p className="text-xs text-yellow-700">
                    The user will be required to log in again with their new password. 
                    Make sure to communicate the password change to them securely.
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
          onClick={handleClose}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          form="password-form"
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Update Password
        </Button>
      </ModalFooter>
    </Modal>
  )
}
