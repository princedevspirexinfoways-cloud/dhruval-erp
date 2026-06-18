'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import { X, User, Mail, Phone, Building2, Shield, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ResponsiveCard } from '@/components/ui/ResponsiveCard'
import {
  useGetCompaniesQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation
} from '@/lib/api/adminApi'
import toast from 'react-hot-toast'

interface Company {
  _id: string
  companyName: string
  companyCode: string
  isActive: boolean
}

interface UserFormData {
  username: string
  email: string
  firstName: string
  lastName: string
  phone: string
  password: string
  confirmPassword: string
  companyId: string
  role: string
  department: string
  designation: string
  isActive: boolean
}

interface UserCrudModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: any // For edit mode
  mode: 'create' | 'edit'
}

export function UserCrudModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user, 
  mode 
}: UserCrudModalProps) {
  const currentUser = useSelector(selectCurrentUser)

  // RTK Query hooks
  const { data: companiesResponse, isLoading: companiesLoading } = useGetCompaniesQuery()
  const [createUser, { isLoading: isCreating }] = useCreateAdminUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateAdminUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation()

  const companies = companiesResponse?.data || []
  const loading = isCreating || isUpdating || isDeleting

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyId: '',
    role: 'helper',
    department: '',
    designation: '',
    isActive: true
  })

  const roles = [
    { value: 'helper', label: 'Helper' },
    { value: 'operator', label: 'Operator' },
    { value: 'production_manager', label: 'Production Manager' },
    { value: 'manager', label: 'Manager' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'sales_executive', label: 'Sales Executive' },
    { value: 'security_guard', label: 'Security Guard' },
    { value: 'owner', label: 'Owner' },
    ...(currentUser?.isSuperAdmin ? [{ value: 'super_admin', label: 'Super Admin' }] : [])
  ]

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          password: '',
          confirmPassword: '',
          companyId: user.companyAccess?.[0]?.companyId || '',
          role: user.companyAccess?.[0]?.role || 'helper',
          department: user.companyAccess?.[0]?.department || '',
          designation: user.companyAccess?.[0]?.designation || '',
          isActive: user.isActive ?? true
        })
      } else {
        // For create mode, set current admin's company if not super admin
        setFormData(prev => ({
          ...prev,
          companyId: currentUser?.isSuperAdmin ? '' : currentUser?.companyId || ''
        }))
      }
    }
  }, [isOpen, mode, user, currentUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'create' && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (mode === 'create' && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (!formData.companyId) {
      toast.error('Please select a company')
      return
    }

    try {
      if (mode === 'create') {
        await createUser(formData).unwrap()
        toast.success('User created successfully')
      } else {
        const payload = {
          ...formData,
          ...(mode === 'edit' && !formData.password ? { password: undefined, confirmPassword: undefined } : {})
        }
        await updateUser({ userId: user!._id, userData: payload }).unwrap()
        toast.success('User updated successfully')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${mode} user`)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete user ${user?.username}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteUser(user!._id).unwrap()
      toast.success('User deleted successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete user')
    }
  }

  if (!isOpen) return null

  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <ResponsiveCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <User className="h-5 w-5 mr-2 text-sky-600" />
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username *
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Name *
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Name *
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Password Fields (Create mode or Edit with password change) */}
          {mode === 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
          )}

          {/* Company and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company *
              </label>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
                disabled={!currentUser?.isSuperAdmin}
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.companyName} ({company.companyCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Department
              </label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Designation
              </label>
              <Input
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Enter designation"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Active User
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div>
              {mode === 'edit' && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === 'create' ? 'Create User' : 'Update User'}
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveCard>
    </div>
  )
}
