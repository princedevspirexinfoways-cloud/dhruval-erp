'use client'

import React, { Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Shield,
  AlertCircle,
  Edit,
  Key,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import { useGetUserByIdQuery } from '@/lib/features/users/usersApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useModals } from '@/hooks/useModals'
import clsx from 'clsx'

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const userId = params?.id as string

  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useGetUserByIdQuery(userId, {
    skip: !userId
  })

  const {
    openUserForm,
    openDeleteUser,
    openPasswordModal,
    openToggle2FA
  } = useModals()

  // Access control
  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You need Super Admin privileges to access this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 text-sky-600 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading User Details</h3>
                <p className="text-gray-600">Please wait while we fetch the user information.</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h3>
                <p className="text-gray-600 mb-4">The user you're looking for doesn't exist or has been deleted.</p>
                <Button 
                  onClick={() => router.push('/users')} 
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserDisplayName = () => {
    return user.personalInfo?.displayName ||
      (user.personalInfo?.firstName && user.personalInfo?.lastName
        ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
        : user.name || user.username || 'User')
  }

  const handleEdit = () => {
    openUserForm({
      user,
      onSuccess: () => {
        refetch()
        toast.success('User updated successfully!')
      }
    })
  }

  const handleDelete = () => {
    openDeleteUser({
      user,
      onSuccess: () => {
        router.push('/users')
        toast.success('User deleted successfully!')
      }
    })
  }

  const handleChangePassword = () => {
    openPasswordModal({
      user,
      onSuccess: () => {
        refetch()
        toast.success('Password updated successfully!')
      }
    })
  }

  const handleToggle2FA = () => {
    openToggle2FA({
      user,
      onSuccess: () => {
        refetch()
        toast.success(`2FA ${(user.is2FAEnabled || user.twoFactorEnabled) ? 'disabled' : 'enabled'} successfully!`)
      }
    })
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => router.push('/users')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Users
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black">{getUserDisplayName()}</h1>
                  <p className="text-gray-600 mt-1">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={clsx(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}>
                      {user.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                    {user.isSuperAdmin && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Super Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleEdit}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
                <Button
                  onClick={handleChangePassword}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button
                  onClick={handleToggle2FA}
                  className={clsx(
                    'text-white',
                    (user.is2FAEnabled || user.twoFactorEnabled)
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-purple-500 hover:bg-purple-600'
                  )}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {(user.is2FAEnabled || user.twoFactorEnabled) ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          </div>

          {/* User Details Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-sky-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-sky-600" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg">
                  <Mail className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="font-semibold text-black">{user.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="font-semibold text-black">{user.personalInfo?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Access Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-sky-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                Company Access
              </h3>

              {user.isSuperAdmin ? (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Super Administrator</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    This user has full access to all companies and system settings.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Primary Company */}
                  {user.primaryCompany && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-900">Primary Company</span>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Primary
                        </span>
                      </div>
                      <p className="font-semibold text-black mb-1">
                        {user.primaryCompany.companyName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Code: {user.primaryCompany.companyCode}
                      </p>
                    </div>
                  )}

                  {/* Company Access List */}
                  {user.companyAccess && user.companyAccess.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Company Access Details</h4>
                      {user.companyAccess.map((access, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                {access.companyId.companyName || `Company ${access.companyId._id}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={clsx(
                                'px-2 py-1 text-xs font-medium rounded-full',
                                access.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              )}>
                                {access.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {access.role}
                              </span>
                            </div>
                          </div>
                          {access.joinedAt && (
                            <p className="text-xs text-gray-500">
                              Joined: {new Date(access.joinedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-900">No Company Access</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        This user has not been assigned to any company yet.
                      </p>
                    </div>
                  )}

                  {/* Legacy Role Information */}
                  {user.role && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-600">Legacy Role:</span>
                        <span className="font-medium text-gray-900">
                          {typeof user.role === 'string' ? user.role : user?.role || 'User'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-sky-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                Account Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="font-semibold text-black">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="font-semibold text-black">{formatDate(user.updatedAt || user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-sky-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Two-Factor Auth</p>
                    <p className={clsx(
                      'font-semibold',
                      (user.is2FAEnabled || user.twoFactorEnabled) ? 'text-green-600' : 'text-gray-600'
                    )}>
                      {(user.is2FAEnabled || user.twoFactorEnabled) ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email Verified</p>
                    <p className={clsx(
                      'font-semibold',
                      user.isEmailVerified ? 'text-green-600' : 'text-red-600'
                    )}>
                      {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Alerts */}
          {(!user.isEmailVerified || (user.security?.failedLoginAttempts && user.security.failedLoginAttempts > 0)) && (
            <div className="mt-8 bg-yellow-50 rounded-2xl shadow-lg border border-yellow-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Security Alerts
              </h3>
              <div className="space-y-3">
                {!user.isEmailVerified && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Email Not Verified</p>
                      <p className="text-sm text-yellow-700">User's email address needs verification</p>
                    </div>
                  </div>
                )}
                
                {user.security?.failedLoginAttempts && user.security.failedLoginAttempts > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Failed Login Attempts</p>
                      <p className="text-sm text-red-700">{user.security.failedLoginAttempts} failed attempts detected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
