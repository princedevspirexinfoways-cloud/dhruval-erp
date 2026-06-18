import React from 'react'
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Clock,
  Edit,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Plus,
  Settings,
  Trash2,
  FileText,
  Users,
  Lock,
  BarChart3,
  Truck,
  CreditCard,
  Camera,
  Bell,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal'
import { User as UserType } from '@/lib/features/users/usersApi'
import clsx from 'clsx'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserType
  onEdit: () => void
  onChangePassword: () => void
  onToggle2FA: () => void
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onEdit,
  onChangePassword,
  onToggle2FA
}: UserDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'manager':
      case 'production_manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'operator':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'helper':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'accountant':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'sales_executive':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'security_guard':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const userName = user.personalInfo?.displayName ||
    (user.personalInfo?.firstName && user.personalInfo?.lastName
      ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
      : user.name || user.username || 'Unnamed User')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      subtitle="View and manage user information"
      size="lg"
    >
      <ModalContent>
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-sky-50 rounded-xl p-6 border border-sky-200">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-sky-600" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-sky-100">
                  <Mail className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-black font-semibold">{user.email}</p>
                  </div>
                </div>
                
                {user.personalInfo?.phone && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-sky-100">
                    <Phone className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-black font-semibold">{user.personalInfo.phone}</p>
                    </div>
                  </div>
                )}
                
                {user.companyAccess?.[0]?.department && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-sky-100">
                    <Building2 className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Department</p>
                      <p className="text-black font-semibold">{user.companyAccess[0].department}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-black font-semibold">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Login</p>
                    <p className="text-black font-semibold">{formatLastLogin(user.security?.lastLogin)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
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
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
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
              </div>
            </div>

            {/* Permissions Section */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Access & Permissions
              </h3>
              
              <div className="space-y-4">
                {/* Role Information */}
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Role Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Primary Role:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {user.companyAccess?.[0]?.role || user.role || 'No Role Assigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Department:</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {user.companyAccess?.[0]?.department || 'Not Specified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Designation:</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {user.companyAccess?.[0]?.designation || 'Not Specified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Super Admin:</span>
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        user.isSuperAdmin 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      )}>
                        {user.isSuperAdmin ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions Display */}
                {user.companyAccess?.[0]?.permissions && (
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Detailed Permissions
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Inventory Permissions */}
                      <div className="border-b border-gray-200 pb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          Inventory Management
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(user.companyAccess[0].permissions.inventory || {}).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <span className={clsx(
                                'w-2 h-2 rounded-full',
                                allowed ? 'bg-green-500' : 'bg-gray-300'
                              )}></span>
                              <span className="text-xs text-gray-600 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Production Permissions */}
                      <div className="border-b border-gray-200 pb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Settings className="w-4 h-4 mr-2" />
                          Production Management
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(user.companyAccess[0].permissions.production || {}).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <span className={clsx(
                                'w-2 h-2 rounded-full',
                                allowed ? 'bg-green-500' : 'bg-gray-300'
                              )}></span>
                              <span className="text-xs text-gray-600 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Orders Permissions */}
                      <div className="border-b border-gray-200 pb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Truck className="w-4 h-4 mr-2" />
                          Order Management
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(user.companyAccess[0].permissions.orders || {}).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <span className={clsx(
                                'w-2 h-2 rounded-full',
                                allowed ? 'bg-green-500' : 'bg-gray-300'
                              )}></span>
                              <span className="text-xs text-gray-600 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Permissions */}
                      <div className="border-b border-gray-200 pb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Financial Management
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(user.companyAccess[0].permissions.financial || {}).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <span className={clsx(
                                'w-2 h-2 rounded-full',
                                allowed ? 'bg-green-500' : 'bg-gray-300'
                              )}></span>
                              <span className="text-xs text-gray-600 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security Permissions */}
                      <div className="border-b border-gray-200 pb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Camera className="w-4 h-4 mr-2" />
                          Security Management
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(user.companyAccess[0].permissions.security || {}).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <span className={clsx(
                                'w-2 h-2 rounded-full',
                                allowed ? 'bg-green-500' : 'bg-gray-300'
                              )}></span>
                              <span className="text-xs text-gray-600 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* HR Permissions */}
                      <div className="border-b border-gray-200 pb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Human Resources
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(user.companyAccess[0].permissions.hr || {}).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <span className={clsx(
                                'w-2 h-2 rounded-full',
                                allowed ? 'bg-green-500' : 'bg-gray-300'
                              )}></span>
                              <span className="text-xs text-gray-600 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin Permissions */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          System Administration
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(user.companyAccess[0].permissions.admin || {}).map(([action, allowed]) => (
                            <div key={action} className="flex items-center gap-2">
                              <span className={clsx(
                                'w-2 h-2 rounded-full',
                                allowed ? 'bg-green-500' : 'bg-gray-300'
                              )}></span>
                              <span className="text-xs text-gray-600 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Permission Summary */}
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Permission Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {user.companyAccess?.[0]?.permissions && Object.entries(user.companyAccess[0].permissions).map(([module, permissions]) => {
                      const totalPermissions = Object.keys(permissions).length;
                      const grantedPermissions = Object.values(permissions).filter(Boolean).length;
                      const percentage = totalPermissions > 0 ? Math.round((grantedPermissions / totalPermissions) * 100) : 0;
                      
                      return (
                        <div key={module} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-800">{percentage}%</div>
                          <div className="text-xs text-gray-600 capitalize">{module.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="text-xs text-gray-500">{grantedPermissions}/{totalPermissions} permissions</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Company Access Information */}
                {user.companyAccess && user.companyAccess.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Company Access
                    </h4>
                    <div className="space-y-2">
                      {user.companyAccess.map((access, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {typeof access.companyId === 'string' ? access.companyId : access.companyId?.companyName || 'Unknown Company'}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {access.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={clsx(
                              'px-2 py-1 rounded-full text-xs',
                              access.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            )}>
                              {access.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Alerts */}
            {(!user.isEmailVerified || (user.security?.failedLoginAttempts && user.security.failedLoginAttempts > 0)) && (
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Security Alerts
                </h3>
                
                <div className="space-y-3">
                  {!user.isEmailVerified && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-100">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Email not verified</p>
                        <p className="text-xs text-yellow-600">User should verify their email address</p>
                      </div>
                    </div>
                  )}
                  
                  {user.security?.failedLoginAttempts && user.security.failedLoginAttempts > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-100">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Failed login attempts: {user.security.failedLoginAttempts}</p>
                        <p className="text-xs text-yellow-600">Monitor for suspicious activity</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

      </ModalContent>

      <ModalFooter>
        <Button
          onClick={onChangePassword}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
        >
          <Key className="w-4 h-4 mr-2" />
          Change Password
        </Button>

        <Button
          onClick={onToggle2FA}
          className={clsx(
            'px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center',
            (user.is2FAEnabled || user.twoFactorEnabled)
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          )}
        >
          <Shield className="w-4 h-4 mr-2" />
          {(user.is2FAEnabled || user.twoFactorEnabled) ? 'Disable 2FA' : 'Enable 2FA'}
        </Button>

        <Button
          onClick={onEdit}
          className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit User
        </Button>
      </ModalFooter>
    </Modal>
  )
}
