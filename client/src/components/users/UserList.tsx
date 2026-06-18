import React from 'react'
import {
  Eye,
  Edit,
  Trash2,
  Key,
  Shield,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Calculator,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { User } from '@/lib/features/users/usersApi'
import clsx from 'clsx'

interface UserListProps {
  users: User[]
  isLoading: boolean
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onChangePassword?: (user: User) => void
  onToggle2FA?: (user: User) => void
}

export default function UserList({
  users,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onChangePassword,
  onToggle2FA
}: UserListProps) {
  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
      case 'owner':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700'
      case 'manager':
      case 'production_manager':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
      case 'operator':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
      case 'helper':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
      case 'accountant':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
      case 'sales_executive':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700'
      case 'security_guard':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
    }
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'super_admin':
      case 'owner':
        return Shield
      case 'manager':
      case 'production_manager':
        return Users
      case 'operator':
      case 'helper':
        return UserCheck
      case 'accountant':
        return Calculator
      case 'sales_executive':
        return TrendingUp
      case 'security_guard':
        return Shield
      default:
        return UserCheck
    }
  }

  const getUserRole = (user: User) => {
    if (user.isSuperAdmin) return 'super_admin'
    if (user.companyAccess && user.companyAccess.length > 0) {
      return user.companyAccess[0].role
    }
    return user.role || 'helper'
  }

  const getUserName = (user: User) => {
    if (user.personalInfo?.displayName) return user.personalInfo.displayName
    if (user.personalInfo?.firstName && user.personalInfo?.lastName) {
      return `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
    }
    return user.name || user.username || 'Unnamed User'
  }

  const getUserEmail = (user: User) => {
    return user.email || `${user.username}@company.com`
  }

  const getUserPhone = (user: User) => {
    return user.personalInfo?.phone || user.phone
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-6 animate-pulse transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 p-12 text-center transition-all duration-300">
        <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Users Found</h3>
        <p className="text-gray-600 dark:text-gray-400">No users match your current filters. Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const userRole = getUserRole(user)
        const userName = getUserName(user)
        const userEmail = getUserEmail(user)
        const userPhone = getUserPhone(user)
        const RoleIcon = getRoleIcon(userRole)

        return (
          <div
            key={user._id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-700 hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-300 group overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover border-2 border-sky-200 dark:border-sky-600"
                        src={user.avatar}
                        alt={userName}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center border-2 border-sky-200 dark:border-sky-600">
                        <span className="text-white font-semibold text-lg">
                          {userName.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-black dark:text-white truncate">
                        {userName}
                      </h3>

                      {/* Role Badge */}
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        getRoleColor(userRole)
                      )}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {userRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>

                      {/* Status Badge */}
                      <div className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        user.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
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
                      </div>

                      {/* 2FA Badge */}
                      {(user.is2FAEnabled || user.twoFactorEnabled) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">
                          <Shield className="w-3 h-3 mr-1" />
                          2FA
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate max-w-xs">{userEmail}</span>
                      </div>

                      {userPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{userPhone}</span>
                        </div>
                      )}

                      {/* Company Information */}
                      {user.primaryCompany && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate max-w-xs font-medium text-gray-800 dark:text-gray-200">
                            {user.primaryCompany?.companyName || 'Unknown Company'}{user.primaryCompany?.companyCode ? ` (${user.primaryCompany.companyCode})` : ''}
                          </span>
                        </div>
                      )}

                      {/* Company Access Tags */}
                      {user.companyAccess && user.companyAccess.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Users className="w-4 h-4" />
                          {user.companyAccess.map((access, index) => (
                            <span
                              key={access._id || index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
                            >
                              {access.companyId?.companyName || 'Unknown Company'} ({access.role || 'member'})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Permission Summary */}
                      {user.companyAccess?.[0]?.permissions && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Permissions:</span>
                          {Object.entries(user.companyAccess[0].permissions).map(([module, permissions]) => {
                            const grantedPermissions = Object.values(permissions).filter(Boolean).length;
                            const totalPermissions = Object.keys(permissions).length;
                            if (grantedPermissions === 0) return null;

                            return (
                              <span
                                key={module}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
                                title={`${grantedPermissions}/${totalPermissions} ${module} permissions granted`}
                              >
                                {module.charAt(0).toUpperCase() + module.slice(1)} ({grantedPermissions})
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Last login: {formatLastLogin(user.security?.lastLogin)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Button
                    onClick={() => onView(user)}
                    className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white p-2 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => onEdit(user)}
                    className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white p-2 rounded-lg transition-colors"
                    title="Edit User"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => onChangePassword && onChangePassword(user)}
                    className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                    title="Change Password"
                  >
                    <Key className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => onToggle2FA && onToggle2FA(user)}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      (user.is2FAEnabled || user.twoFactorEnabled)
                        ? 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white'
                    )}
                    title={(user.is2FAEnabled || user.twoFactorEnabled) ? 'Disable 2FA' : 'Enable 2FA'}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => onDelete(user)}
                    className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
