'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, ShieldX, AlertTriangle, User, Settings, Edit } from 'lucide-react'
import { QuickUserToggle } from './QuickUserToggle'
import { Button } from '@/components/ui/Button'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import { useForceDisableUser2FAMutation } from '@/lib/api/adminApi'
import toast from 'react-hot-toast'

interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  isSuperAdmin: boolean
  twoFactorEnabled?: boolean
  lastLoginAt?: string
}

interface UserTwoFactorManagementProps {
  users: User[]
  onRefresh: () => void
  onEditUser?: (user: User) => void
  className?: string
}

export function UserTwoFactorManagement({
  users,
  onRefresh,
  onEditUser,
  className
}: UserTwoFactorManagementProps) {
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set())
  const [forceDisableUser2FA] = useForceDisableUser2FAMutation()

  const handleToggleTwoFactor = async (userId: string, currentStatus: boolean, userName: string) => {
    setLoadingUsers(prev => new Set(prev).add(userId))

    try {
      const endpoint = currentStatus 
        ? `/api/admin/users/${userId}/disable-2fa`
        : `/api/admin/users/${userId}/enable-2fa`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success(
          currentStatus 
            ? `2FA disabled for ${userName}`
            : `2FA enabled for ${userName}`
        )
        onRefresh()
      } else {
        toast.error(result.message || 'Failed to update 2FA status')
      }
    } catch (error) {
      console.error('2FA toggle error:', error)
      toast.error('Failed to update 2FA status')
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleForceDisable2FA = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to force disable 2FA for ${userName}? This will remove all their 2FA settings and backup codes.`)) {
      return
    }

    setLoadingUsers(prev => new Set(prev).add(userId))

    try {
      await forceDisableUser2FA(userId).unwrap()
      toast.success(`2FA force disabled for ${userName}`)
      onRefresh()
    } catch (error: any) {
      console.error('Force disable 2FA error:', error)
      toast.error(error?.data?.message || 'Failed to force disable 2FA')
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const getTwoFactorStats = () => {
    const usersArray = Array.isArray(users) ? users : []
    const total = usersArray.length
    const enabled = usersArray.filter(user => user.twoFactorEnabled).length
    const disabled = total - enabled
    const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0

    return { total, enabled, disabled, percentage }
  }

  const stats = getTwoFactorStats()

  return (
    <div className={className}>
      {/* Stats Overview */}
      <ResponsiveCard padding="lg" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Shield className="h-5 w-5 mr-2 text-sky-600" />
            2FA Management Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <User className="h-8 w-8 text-slate-500" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">2FA Enabled</p>
                <p className="text-2xl font-bold text-green-900">{stats.enabled}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">2FA Disabled</p>
                <p className="text-2xl font-bold text-red-900">{stats.disabled}</p>
              </div>
              <ShieldX className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-sky-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sky-600">Adoption Rate</p>
                <p className="text-2xl font-bold text-sky-900">{stats.percentage}%</p>
              </div>
              <Settings className="h-8 w-8 text-sky-500" />
            </div>
          </div>
        </div>
      </ResponsiveCard>

      {/* User List */}
      <ResponsiveCard padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">User 2FA Status</h3>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">2FA Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Last Login</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Quick Actions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        {user.isSuperAdmin && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Super Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {user.twoFactorEnabled ? (
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <ShieldX className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        user.twoFactorEnabled ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <QuickUserToggle
                      userId={user._id}
                      userName={`${user.firstName} ${user.lastName}`}
                      isActive={user.isActive}
                      twoFactorEnabled={user.twoFactorEnabled || false}
                      onUpdate={onRefresh}
                    />
                  </td>

                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {onEditUser && (
                        <Button
                          onClick={() => onEditUser(user)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}

                      {user.twoFactorEnabled && (
                        <Button
                          onClick={() => handleForceDisable2FA(user._id, `${user.firstName} ${user.lastName}`)}
                          disabled={loadingUsers.has(user._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Force Disable
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </ResponsiveCard>
    </div>
  )
}
