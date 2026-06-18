'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { AppLayout } from '@/components/layout/AppLayout'
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer'

import { TwoFactorToggle } from '@/components/settings/TwoFactorToggle'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Mail, Phone, Building2, Shield, Edit, Save, X, Download, Smartphone, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const user = useSelector(selectCurrentUser)
  const [isEditing, setIsEditing] = useState(false)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <AppLayout>
        <ResponsiveContainer className="space-y-8">
          <div className="bg-slate-900 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Loading Profile...</h1>
                <p className="text-slate-300 mt-1">Please wait while we load your profile</p>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </AppLayout>
    )
  }

  // Check PWA installation status
  useEffect(() => {
    const checkPWAStatus = () => {
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone ||
                            document.referrer.includes('android-app://')
        setIsPWAInstalled(isStandalone)
      }
    }
    checkPWAStatus()
  }, [])

  const handleSave = async () => {
    try {
      // TODO: Implement profile update API call
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
    setIsEditing(false)
  }

  const handleInstallPWA = () => {
    // Try to use the global install function from PWAManager
   
  }

  return (
    <AppLayout>
      <ResponsiveContainer className="space-y-8">
        {/* Header */}
        <div className="bg-slate-900 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <p className="text-slate-300 mt-1">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} className="bg-slate-600 hover:bg-slate-700 text-white">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  First Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    <p className="text-slate-900 font-medium">{user?.firstName || 'Not set'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Last Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    <p className="text-slate-900 font-medium">{user?.lastName || 'Not set'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email Address
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    <p className="text-slate-900 font-medium">{user?.email || 'Not set'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone className="h-4 w-4 text-green-600" />
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    <p className="text-slate-900 font-medium">{user?.phone || 'Not set'}</p>
                  </div>
                )}
              </div>

              {/* Company Information */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Company
                </label>
                <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                  <p className="text-slate-900 font-medium">{user?.companyId || 'Not assigned'}</p>
                </div>
              </div>

              {/* Role Information */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Shield className="h-4 w-4 text-orange-600" />
                  Role & Status
                </label>
                <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                      {user?.roles && user.roles.length > 0 
                        ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0]?.roleId || 'Helper')
                        : 'Helper'
                      }
                    </span>
                    {user?.isActive && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Account Status
                </label>
                <div className="bg-slate-50 rounded-lg px-4 py-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">Email Verified</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user?.isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {user?.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">Two-Factor Auth</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user?.isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-600 text-white'
                    }`}>
                      {user?.isActive ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Disabled
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">Last Login</span>
                    <span className="text-sm text-slate-900 font-medium">
                      {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Company Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Username
                  </label>
                  <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    <p className="text-slate-900 font-medium">{user?.username}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Company Role
                  </label>
                  <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    <p className="text-slate-900 font-medium">
                      {user?.companyAccess && user.companyAccess.length > 0 
                        ? user.companyAccess[0]?.role?.replace('_', ' ').toUpperCase() || 'Helper'
                        : 'Helper'
                      }
                    </p>
                  </div>
                </div>
                {user?.isSuperAdmin && (
                  <div className="md:col-span-2">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-600 text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        Super Administrator
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
            </div>
          </div>

          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 text-lg">Two-Factor Authentication</h3>
                  <p className="text-red-700 mt-2 leading-relaxed">
                    Add an extra layer of security to your account by enabling 2FA.
                    You'll need your phone or authenticator app to sign in.
                  </p>
                </div>
              </div>
            </div>
            <TwoFactorToggle />
          </div>
        </div>

        {/* PWA Installation */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Mobile App</h2>
              </div>
              {isPWAInstalled && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Installed
                </span>
              )}
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-900 font-medium leading-relaxed">
                Install the ERP app on your device for faster access, offline functionality, and a native app experience.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleInstallPWA}
                disabled={isPWAInstalled}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold"
              >
                <Download className="h-5 w-5" />
                {isPWAInstalled ? 'App Installed' : 'Download App'}
              </Button>

              {!isPWAInstalled && (
                <Button
                  onClick={() => {
                    // Reset PWA prompt dismissal
                    localStorage.removeItem('pwa-prompt-permanently-dismissed')
                    sessionStorage.removeItem('pwa-prompt-dismissed')
                    toast.success('PWA prompts re-enabled! You may see install prompts again.')
                  }}
                  className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 text-base font-semibold"
                >
                  <Shield className="h-5 w-5" />
                  Reset Prompts
                </Button>
              )}
            </div>

            {isPWAInstalled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 text-green-800">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-base font-semibold">App is installed and ready to use!</span>
                </div>
                <p className="text-green-700 mt-2">
                  You can access the app from your home screen or app drawer.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Account Activity</h2>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Last Login</span>
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-slate-900 font-medium mt-2">
                  {user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Account Created</span>
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-slate-900 font-medium mt-2">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Account Status</span>
                  {user?.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <p className={`font-semibold mt-2 ${
                  user?.isActive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </AppLayout>
  )
}
