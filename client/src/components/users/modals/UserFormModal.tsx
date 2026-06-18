import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useSelector } from 'react-redux'
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal'
import {
  User as UserType,
  useCreateUserMutation,
  useUpdateUserMutation
} from '@/lib/features/users/usersApi'
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi'
import { selectCurrentUser, selectIsSuperAdmin, selectCurrentCompanyId } from '@/lib/features/auth/authSlice'
import { usePermission } from '@/lib/hooks/usePermission'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (operation: 'create' | 'update') => void
  user?: UserType
}

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  middleName: string
  phone: string
  alternatePhone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other' | ''
  primaryCompanyId: string
  role: string
  department: string
  designation: string
  isActive: boolean
  isSuperAdmin: boolean
  // Permissions
  permissions: {
    [module: string]: {
      [action: string]: boolean
    }
  }
}

// Department options
const DEPARTMENTS = [
  { value: 'Management', label: 'Management' },
  { value: 'Production', label: 'Production' },
  { value: 'Sales', label: 'Sales & Marketing' },
  { value: 'Purchase', label: 'Purchase & Procurement' },
  { value: 'Accounts', label: 'Accounts & Finance' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'Quality', label: 'Quality Control' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Security', label: 'Security' },
  { value: 'IT', label: 'Information Technology' }
]

// Role options - must match server enum values
const ROLES = [
  { value: 'helper', label: 'Helper', description: 'Production helper with basic access' },
  { value: 'operator', label: 'Operator', description: 'Machine operator with production access' },
  { value: 'production_manager', label: 'Production Manager', description: 'Production department manager' },
  { value: 'manager', label: 'Manager', description: 'General manager with team access' },
  { value: 'accountant', label: 'Accountant', description: 'Financial and accounting access' },
  { value: 'sales_executive', label: 'Sales Executive', description: 'Sales and customer access' },
  { value: 'security_guard', label: 'Security Guard', description: 'Security and access control' },
  { value: 'owner', label: 'Owner', description: 'Company owner with full access' },
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access across all companies' }
]

// Permission presets for different roles
const PERMISSION_PRESETS: { [key: string]: { [module: string]: { [action: string]: boolean } } } = {
  helper: {
    inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
    production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false, startProcess: false, qualityCheck: false },
    orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false, dispatch: false },
    financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false, bankTransactions: false },
    security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false },
    hr: { viewEmployees: false, manageAttendance: false, manageSalary: false, viewReports: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false },
    customers: { view: true, create: false, edit: false, delete: false, viewReports: false },
    suppliers: { view: false, create: false, edit: false, delete: false, viewReports: false },
    purchase: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    gatePass: { view: false, create: false, approve: false, delete: false },
    batches: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    greyFabricInward: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    sales: { view: true, create: false, edit: false, delete: false, viewReports: false }
  },
  operator: {
    inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
    production: { view: true, create: true, edit: false, delete: false, approve: false, viewReports: false, startProcess: true, qualityCheck: false },
    orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false, dispatch: false },
    financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false, bankTransactions: false },
    security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false },
    hr: { viewEmployees: false, manageAttendance: false, manageSalary: false, viewReports: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false },
    customers: { view: true, create: false, edit: false, delete: false, viewReports: false },
    suppliers: { view: false, create: false, edit: false, delete: false, viewReports: false },
    purchase: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    gatePass: { view: false, create: false, approve: false, delete: false },
    batches: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
    greyFabricInward: { view: true, create: true, edit: false, delete: false, approve: false, viewReports: false },
    sales: { view: true, create: false, edit: false, delete: false, viewReports: false }
  },
  production_manager: {
    inventory: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    production: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true, startProcess: true, qualityCheck: true },
    orders: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true, dispatch: true },
    financial: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true, bankTransactions: false },
    security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false },
    hr: { viewEmployees: true, manageAttendance: true, manageSalary: false, viewReports: true },
    admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false },
    customers: { view: true, create: true, edit: true, delete: false, viewReports: true },
    suppliers: { view: true, create: true, edit: true, delete: false, viewReports: true },
    purchase: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    gatePass: { view: true, create: true, approve: true, delete: false },
    batches: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    greyFabricInward: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    sales: { view: true, create: true, edit: true, delete: false, viewReports: true }
  },
  manager: {
    inventory: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    production: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true, startProcess: true, qualityCheck: true },
    orders: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true, dispatch: true },
    financial: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true, bankTransactions: false },
    security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false },
    hr: { viewEmployees: true, manageAttendance: true, manageSalary: false, viewReports: true },
    admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false },
    customers: { view: true, create: true, edit: true, delete: false, viewReports: true },
    suppliers: { view: true, create: true, edit: true, delete: false, viewReports: true },
    purchase: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    gatePass: { view: true, create: true, approve: true, delete: false },
    batches: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    greyFabricInward: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
    sales: { view: true, create: true, edit: true, delete: false, viewReports: true }
  },
  accountant: {
    inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true },
    production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true, startProcess: false, qualityCheck: false },
    orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true, dispatch: false },
    financial: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true, bankTransactions: true },
    security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false },
    hr: { viewEmployees: false, manageAttendance: false, manageSalary: true, viewReports: true },
    admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false },
    customers: { view: true, create: false, edit: false, delete: false, viewReports: true },
    suppliers: { view: true, create: false, edit: false, delete: false, viewReports: true },
    purchase: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true },
    gatePass: { view: false, create: false, approve: false, delete: false },
    batches: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true },
    greyFabricInward: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true },
    sales: { view: true, create: false, edit: false, delete: false, viewReports: true }
  },
  sales_executive: {
    inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true },
    production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true, startProcess: false, qualityCheck: false },
    orders: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true, dispatch: false },
    financial: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true, bankTransactions: false },
    security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false },
    hr: { viewEmployees: false, manageAttendance: false, manageSalary: false, viewReports: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false },
    customers: { view: true, create: true, edit: true, delete: false, viewReports: true },
    suppliers: { view: false, create: false, edit: false, delete: false, viewReports: false },
    purchase: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    gatePass: { view: false, create: false, approve: false, delete: false },
    batches: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true },
    greyFabricInward: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true },
    sales: { view: true, create: true, edit: true, delete: false, viewReports: true }
  },
  security_guard: {
    inventory: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    production: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false, startProcess: false, qualityCheck: false },
    orders: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false, dispatch: false },
    financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false, bankTransactions: false },
    security: { gateManagement: true, visitorManagement: true, vehicleTracking: true, cctvAccess: true, emergencyResponse: true },
    hr: { viewEmployees: false, manageAttendance: false, manageSalary: false, viewReports: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false },
    customers: { view: false, create: false, edit: false, delete: false, viewReports: false },
    suppliers: { view: false, create: false, edit: false, delete: false, viewReports: false },
    purchase: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    gatePass: { view: true, create: true, approve: false, delete: false },
    batches: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    greyFabricInward: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
    sales: { view: false, create: false, edit: false, delete: false, viewReports: false }
  },
  owner: {
    inventory: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    production: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, startProcess: true, qualityCheck: true },
    orders: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, dispatch: true },
    financial: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, bankTransactions: true },
    security: { gateManagement: true, visitorManagement: true, vehicleTracking: true, cctvAccess: true, emergencyResponse: true },
    hr: { viewEmployees: true, manageAttendance: true, manageSalary: true, viewReports: true },
    admin: { userManagement: true, systemSettings: true, backupRestore: true, auditLogs: true },
    customers: { view: true, create: true, edit: true, delete: true, viewReports: true },
    suppliers: { view: true, create: true, edit: true, delete: true, viewReports: true },
    purchase: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    gatePass: { view: true, create: true, approve: true, delete: true },
    batches: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    greyFabricInward: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    sales: { view: true, create: true, edit: true, delete: true, viewReports: true }
  },
  super_admin: {
    inventory: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    production: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, startProcess: true, qualityCheck: true },
    orders: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, dispatch: true },
    financial: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, bankTransactions: true },
    security: { gateManagement: true, visitorManagement: true, vehicleTracking: true, cctvAccess: true, emergencyResponse: true },
    hr: { viewEmployees: true, manageAttendance: true, manageSalary: true, viewReports: true },
    admin: { userManagement: true, systemSettings: true, backupRestore: true, auditLogs: true },
    customers: { view: true, create: true, edit: true, delete: true, viewReports: true },
    suppliers: { view: true, create: true, edit: true, delete: true, viewReports: true },
    purchase: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    gatePass: { view: true, create: true, approve: true, delete: true },
    batches: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    greyFabricInward: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
    sales: { view: true, create: true, edit: true, delete: true, viewReports: true }
  }
}

export default function UserFormModal({ isOpen, onClose, onSuccess, user }: UserFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: '',
    primaryCompanyId: '',
    role: 'helper',
    department: '',
    designation: '',
    isActive: true,
    isSuperAdmin: false,
    permissions: PERMISSION_PRESETS.helper
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [apiErrors, setApiErrors] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isServerReachable, setIsServerReachable] = useState(true)
  const [generatedUsername, setGeneratedUsername] = useState<string>('')

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  // Get current user for permissions
  const currentUser = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const currentCompanyId = useSelector(selectCurrentCompanyId)
  const { has } = usePermission()

  // Fetch companies for selection
  const { data: companiesResponse, isLoading: companiesLoading } = useGetAllCompaniesQuery(undefined, { skip: !isSuperAdmin })
  const companies = isSuperAdmin ? (companiesResponse?.data || []) : []

  const isEditing = !!user
  const isLoading = isCreating || isUpdating || showSuccess

  // Helper function to get user ID
  const getUserId = (user: UserType) => user.id || user._id

  // Function to update permissions when role changes
  const updatePermissionsForRole = (role: string) => {
    const rolePermissions = PERMISSION_PRESETS[role as keyof typeof PERMISSION_PRESETS]
    if (rolePermissions) {
      setFormData(prev => ({
        ...prev,
        permissions: rolePermissions
      }))
    }
  }

  // Function to generate username suggestions
  const generateUsernameSuggestions = (firstName: string, email?: string): string[] => {
    const suggestions: string[] = []

    // Clean first name
    const cleanFirstName = firstName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10)

    // Add first name based suggestions
    if (cleanFirstName && cleanFirstName.length >= 2) {
      suggestions.push(cleanFirstName)
      suggestions.push(`${cleanFirstName}1`)
      suggestions.push(`${cleanFirstName}2`)
    }

    // Add email based suggestions if available
    if (email) {
      const emailPrefix = email.split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10)

      if (emailPrefix && emailPrefix.length >= 3) {
        suggestions.push(emailPrefix)
        suggestions.push(`${emailPrefix}1`)
      }
    }

    // Remove duplicates and limit to 5 suggestions
    return [...new Set(suggestions)].slice(0, 5)
  }

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          email: user.email || '',
          password: '',
          confirmPassword: '',
          firstName: user.personalInfo?.firstName || '',
          lastName: user.personalInfo?.lastName || '',
          middleName: user.personalInfo?.middleName || '',
          phone: user.personalInfo?.phone || '',
          alternatePhone: user.personalInfo?.alternatePhone || '',
          dateOfBirth: user.personalInfo?.dateOfBirth || '',
          gender: user.personalInfo?.gender || '',
          primaryCompanyId: typeof user.primaryCompanyId === 'string'
            ? user.primaryCompanyId
            : (typeof user.companyAccess?.[0]?.companyId === 'string'
              ? user.companyAccess?.[0]?.companyId
              : user.companyAccess?.[0]?.companyId?._id || ''),
          role: user.companyAccess?.[0]?.role || user.role || 'helper',
          department: user.department || '',
          designation: user.designation || '',
          isActive: user.isActive ?? true,
          isSuperAdmin: user.isSuperAdmin || false,
          permissions: user.companyAccess?.[0]?.permissions || PERMISSION_PRESETS.helper
        })
        setGeneratedUsername(user.username || '')
      } else {
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          middleName: '',
          phone: '',
          alternatePhone: '',
          dateOfBirth: '',
          gender: '',
          primaryCompanyId: '',
          role: 'helper',
          department: '',
          designation: '',
          isActive: true,
          isSuperAdmin: false,
          permissions: PERMISSION_PRESETS.helper
        })
        setGeneratedUsername('')
      }
      setErrors({})
      setApiErrors([])
      setShowSuccess(false)
      setIsServerReachable(true)
    }
  }, [user, isOpen])

  // Set default company when companies are loaded and no user is being edited
  useEffect(() => {
    if (!user && companies.length > 0 && !formData.primaryCompanyId) {
      // For super admin, don't auto-select company
      // For regular admin, select their company
      const defaultCompany = isSuperAdmin ? '' : (currentCompanyId || (currentUser as any)?.companyId || '')
      setFormData(prev => ({
        ...prev,
        primaryCompanyId: defaultCompany
      }))
    }
  }, [companies, user, formData.primaryCompanyId, currentUser, isSuperAdmin, currentCompanyId])

  // Ensure permissions are always initialized
  useEffect(() => {
    if (!formData.permissions || Object.keys(formData.permissions).length === 0) {
      setFormData(prev => ({
        ...prev,
        permissions: PERMISSION_PRESETS.helper
      }))
    }
  }, [formData.permissions])

  // Generate username suggestions when first name or email changes
  useEffect(() => {
    if (!isEditing && formData.firstName) {
      const suggestions = generateUsernameSuggestions(formData.firstName, formData.email)
      if (suggestions.length > 0) {
        setGeneratedUsername(suggestions[0])
      }
    }
  }, [formData.firstName, formData.email, isEditing])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[+]?[1-9][\d\s\-\(\)]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    if (!formData.primaryCompanyId && !formData.isSuperAdmin) {
      newErrors.primaryCompanyId = 'Company selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous API errors
    setApiErrors([])

    if (!validateForm()) {
      return
    }

    // Add loading state
    const startTime = Date.now()

    try {
      if (isEditing && user) {
        // Note: Password is NOT included in update payload to prevent double hashing
        // Password updates are handled separately through dedicated password change endpoints
        const updatePayload = {
          id: getUserId(user),
          user: {
            email: formData.email,
            personalInfo: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              middleName: formData.middleName,
              phone: formData.phone,
              alternatePhone: formData.alternatePhone,
              dateOfBirth: formData.dateOfBirth,
              gender: formData.gender,
              displayName: `${formData.firstName} ${formData.lastName}`
            },
            primaryCompanyId: formData.primaryCompanyId,
            companyAccess: formData.primaryCompanyId ? [{
              companyId: formData.primaryCompanyId,
              role: formData.role,
              department: formData.department,
              designation: formData.designation,
              permissions: formData.permissions,
              isActive: true,
              joinedAt: new Date().toISOString()
            }] : [],
            isActive: formData.isActive,
            isSuperAdmin: formData.isSuperAdmin
          }
        }
        console.log('Update user payload:', updatePayload)
        await updateUser(updatePayload).unwrap()
        // Success message is handled by parent component's onSuccess callback
      } else {
        const createPayload = {
          email: formData.email,
          password: formData.password,
          personalInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleName: formData.middleName,
            phone: formData.phone,
            alternatePhone: formData.alternatePhone,
            dateOfBirth: formData.dateOfBirth || undefined,
            gender: formData.gender || undefined,
            displayName: `${formData.firstName} ${formData.lastName}`
          },
          primaryCompanyId: isSuperAdmin ? formData.primaryCompanyId : (currentCompanyId || formData.primaryCompanyId),
          companyAccess: formData.primaryCompanyId ? [{
            companyId: isSuperAdmin ? formData.primaryCompanyId : (currentCompanyId || formData.primaryCompanyId),
            role: formData.role,
            department: formData.department,
            designation: formData.designation,
            permissions: formData.permissions,
            isActive: true,
            joinedAt: new Date().toISOString()
          }] : [],
          isSuperAdmin: isSuperAdmin ? formData.isSuperAdmin : false,
          // Legacy fields for backward compatibility
          role: formData.role,
          department: formData.department,
          designation: formData.designation
        }
        console.log('Create user payload:', createPayload)
        await createUser(createPayload).unwrap()
        // Success message is handled by parent component's onSuccess callback
      }

      // Log success timing
      const endTime = Date.now()
      console.log(`${isEditing ? 'Update' : 'Create'} user successful in ${endTime - startTime}ms`)

      // Show success message
      setShowSuccess(true)

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onSuccess(isEditing ? 'update' : 'create')
        onClose()
      }, 1500)
    } catch (error: any) {
      // Enhanced error logging for debugging
      console.error(`${isEditing ? 'Update' : 'Create'} user error:`, error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      console.error('Error stringified:', JSON.stringify(error, null, 2))
      console.error('Error stack:', error?.stack)
      console.error('Error occurred after:', Date.now() - startTime, 'ms')

      // Handle different types of errors and collect them
      const errorMessages: string[] = []

      // Handle RTK Query specific error structure
      if (error?.data) {
        console.log('Error data found:', error.data)

        // Handle validation errors from server
        if (error.data.errors && Array.isArray(error.data.errors)) {
          error.data.errors.forEach((err: any) => {
            if (err.field && err.message) {
              errorMessages.push(`${err.field}: ${err.message}`)

              // Map server field errors to form field errors
              const fieldMap: { [key: string]: keyof FormData } = {
                'email': 'email',
                'password': 'password',
                'firstName': 'firstName',
                'lastName': 'lastName',
                'phone': 'phone',
                'primaryCompanyId': 'primaryCompanyId'
              }

              const formField = fieldMap[err.field]
              if (formField) {
                setErrors(prev => ({
                  ...prev,
                  [formField]: err.message
                }))
              }
            } else if (err.message) {
              errorMessages.push(err.message)
            }
          })
        }

        // Handle single error message
        if (error.data.message) {
          // Handle specific validation errors with user-friendly messages
          if (error.data.message.includes('username already exists')) {
            errorMessages.push('This username is already taken. Please choose a different username.')
          } else if (error.data.message.includes('email already exists')) {
            errorMessages.push('This email address is already registered. Please use a different email or leave it empty.')
          } else if (error.data.message.includes('User with this username or email already exists')) {
            errorMessages.push('A user with this username or email already exists. Please choose different credentials.')
          } else {
            errorMessages.push(error.data.message)
          }
        } else if (error.data.error) {
          errorMessages.push(error.data.error)
        }
      }

      // Handle error message directly
      if (error?.message) {
        errorMessages.push(error.message)
      }

      // Handle specific HTTP status codes
      if (error?.status === 500) {
        errorMessages.push('Server error occurred. Please try again later.')
      } else if (error?.status === 400) {
        // Don't add generic message here as we handle specific 400 errors above
        if (!errorMessages.length) {
          errorMessages.push('Invalid data provided. Please check your inputs.')
        }
      } else if (error?.status === 409) {
        errorMessages.push('Username or email already exists.')
      } else if (error?.status === 401) {
        errorMessages.push('Unauthorized. Please check your permissions.')
      } else if (error?.status === 403) {
        errorMessages.push('Forbidden. You do not have permission to perform this action.')
      } else if (error?.status === 404) {
        errorMessages.push('Resource not found.')
      } else if (error?.status === 422) {
        errorMessages.push('Validation error. Please check your input data.')
      }

      // Handle network errors
      if (error?.error) {
        if (error.error === 'FETCH_ERROR') {
          errorMessages.push('Network error. Please check your internet connection.')
        } else if (error.error === 'TIMEOUT_ERROR') {
          errorMessages.push('Request timeout. Please try again.')
        } else if (error.error === 'PARSING_ERROR') {
          errorMessages.push('Server response error. Please try again.')
        } else {
          errorMessages.push(`Network error: ${error.error}`)
        }
      }

      // Handle CORS errors
      if (error?.status === 0) {
        errorMessages.push('CORS error or server unreachable. Please check if the server is running.')
        setIsServerReachable(false)
      }

      // Handle specific error types
      if (error?.originalStatus) {
        console.log('Original status:', error.originalStatus)
        if (error.originalStatus === 500) {
          errorMessages.push('Internal server error. Please try again later.')
        } else if (error.originalStatus === 503) {
          errorMessages.push('Service temporarily unavailable. Please try again later.')
        } else if (error.originalStatus === 400) {
          // Handle validation errors with more specific messages
          if (error?.data?.message) {
            if (error.data.message.includes('username already exists')) {
              errorMessages.push('This username is already taken. Please choose a different username.')
            } else if (error.data.message.includes('email already exists')) {
              errorMessages.push('This email address is already registered. Please use a different email or leave it empty.')
            } else {
              errorMessages.push(error.data.message)
            }
          }
        }
      }

      // Handle empty error object case
      if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        errorMessages.push('Unknown error occurred. Please try again.')
        console.error('Empty error object detected - this might indicate a network issue or server problem')
      }

      // Handle null or undefined error
      if (!error) {
        errorMessages.push('No error information available. Please check your connection and try again.')
        console.error('Error object is null or undefined')
      }

      // If no specific errors found, add a generic message
      if (errorMessages.length === 0) {
        errorMessages.push(`Failed to ${isEditing ? 'update' : 'create'} user. Please try again.`)
      }

      // Set API errors to display in the form
      setApiErrors(errorMessages)

      // Also show toast for immediate feedback
      toast.error(errorMessages[0] || `Failed to ${isEditing ? 'update' : 'create'} user`)

      // Additional debugging information
      console.log('Final error messages:', errorMessages)
      console.log('Error status:', error?.status)
      console.log('Error data:', error?.data)
      console.log('Error originalStatus:', error?.originalStatus)
    }
  }



  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates }

      // If role changes, apply permission preset
      if (updates.role && updates.role !== prev.role) {
        const preset = PERMISSION_PRESETS[updates.role as keyof typeof PERMISSION_PRESETS]
        if (preset) {
          newData.permissions = preset
        }
      }

      return newData
    })

    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key as keyof FormData]
    })
    setErrors(newErrors)

    // Clear API errors when user starts editing
    if (apiErrors.length > 0) {
      setApiErrors([])
    }

    // Clear success message when user starts editing
    if (showSuccess) {
      setShowSuccess(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Create New User'}
      subtitle={isEditing ? 'Update user information' : 'Add a new user to the system'}
      size="lg"
    >
      <ModalContent>
        <form id="user-form" onSubmit={handleSubmit}>
          {/* Success Message Display */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                      Success!
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      User {isEditing ? 'updated' : 'created'} successfully. Closing modal...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Server Status Indicator */}
          {!isServerReachable && (
            <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <svg className="w-5 h-5 text-orange-500 dark:text-orange-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>

                </div>
              </div>
            </div>
          )}

          {/* API Errors Display */}
          {apiErrors.length > 0 && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                      {apiErrors.length === 1 ? 'Error occurred:' : `${apiErrors.length} errors occurred:`}
                    </h4>
                    <ul className="space-y-1">
                      {apiErrors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 dark:text-red-300 font-medium">
                          • {error}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setApiErrors([])}
                        className="px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded border border-red-300 dark:border-red-600 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApiErrors([])
                          handleSubmit(new Event('submit') as any)
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApiErrors([])}
                  className="ml-4 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  title="Dismiss errors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-6 border border-sky-200 dark:border-sky-700 transition-all duration-300">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-sky-600 dark:text-sky-400" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Generated Username
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all duration-300">
                    {isEditing ? (user?.username || 'N/A') : (generatedUsername || 'Will be generated based on first name')}
                  </div>
                  {!isEditing && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Username will be automatically generated based on first name and email
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateFormData({ firstName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.firstName ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateFormData({ lastName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.lastName ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Email Address <span className="text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData({ email: e.target.value.toLowerCase() })}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.email ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      placeholder="Enter email address (optional)"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.phone ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <select
                      value={formData.department}
                      onChange={(e) => updateFormData({ department: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium appearance-none"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => updateFormData({ designation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    placeholder="Enter designation"
                  />
                </div>
              </div>
            </div>

            {/* Company Assignment */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700 transition-all duration-300">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Company Assignment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Primary Company *
                  </label>
                  <select
                    required
                    value={formData.primaryCompanyId}
                    onChange={(e) => updateFormData({ primaryCompanyId: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium ${errors.primaryCompanyId ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    disabled={companiesLoading}
                  >
                    <option value="">Select Company</option>
                    {isSuperAdmin ? companies
                      .filter(company => company.isActive)
                      .sort((a, b) => a.companyName.localeCompare(b.companyName))
                      .map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.companyName} ({company.companyCode})
                        </option>
                      )) : (
                      <option value={currentCompanyId || ''}>
                        {currentCompanyId ? 'Current Company' : 'No company assigned'}
                      </option>
                    )}
                  </select>
                  {errors.primaryCompanyId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.primaryCompanyId}</p>
                  )}
                  {companiesLoading && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading companies...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateFormData({ gender: e.target.value as 'Male' | 'Female' | 'Other' | '' })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Role & Status */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 transition-all duration-300">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Role & Status
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value
                      updateFormData({ role: newRole as UserType['role'] })
                      updatePermissionsForRole(newRole)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  >
                    {ROLES.filter(r => r.value !== 'super_admin' || isSuperAdmin).map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {ROLES.find(r => r.value === formData.role)?.description}
                  </p>
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-4 pt-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={formData.isActive}
                          onChange={() => updateFormData({ isActive: true })}
                          className="mr-2 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400"
                        />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={!formData.isActive}
                          onChange={() => updateFormData({ isActive: false })}
                          className="mr-2 text-red-600 dark:text-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                        />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">Inactive</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Super Admin Toggle */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Super Admin Privileges
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSuperAdmin}
                        onChange={(e) => updateFormData({ isSuperAdmin: isSuperAdmin ? e.target.checked : false })}
                        className="mr-2 w-4 h-4 text-purple-600 dark:text-purple-400 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-400"
                        disabled={!isSuperAdmin}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Grant Super Admin Access
                      </span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Super Admin users have full access to all companies and system settings
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 transition-all duration-300">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Access & Permissions
              </h3>

              <div className="space-y-6">
                {/* Role-based Permission Presets */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Role Preset</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Select a role to automatically apply permission presets, or customize individual permissions below.
                  </p>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value
                      updateFormData({ role: newRole as UserType['role'] })
                      updatePermissionsForRole(newRole)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>

                  {/* Permission Summary */}
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-300">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permission Summary:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${formData.permissions.inventory.view ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                        <span className="text-gray-700 dark:text-gray-300">Inventory: {formData.permissions.inventory.view ? 'View' : 'No Access'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${formData.permissions.production.view ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                        <span className="text-gray-700 dark:text-gray-300">Production: {formData.permissions.production.view ? 'View' : 'No Access'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${formData.permissions.orders.view ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                        <span className="text-gray-700 dark:text-gray-300">Orders: {formData.permissions.orders.view ? 'View' : 'No Access'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${formData.permissions.hr.viewEmployees ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                        <span className="text-gray-700 dark:text-gray-300">HR: {formData.permissions.hr.viewEmployees ? 'View' : 'No Access'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-all duration-300">
                    <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Quick Actions:</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateFormData({ permissions: PERMISSION_PRESETS.helper })}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                      >
                        Reset to Helper
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData({ permissions: PERMISSION_PRESETS.manager })}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                      >
                        Set Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData({ permissions: PERMISSION_PRESETS.owner })}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                      >
                        Set Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allPermissions = {
                            inventory: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
                            production: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, startProcess: true, qualityCheck: true },
                            orders: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, dispatch: true },
                            financial: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, bankTransactions: true },
                            security: { gateManagement: true, visitorManagement: true, vehicleTracking: true, cctvAccess: true, emergencyResponse: true },
                            hr: { viewEmployees: true, manageAttendance: true, manageSalary: true, viewReports: true },
                            admin: { userManagement: true, systemSettings: true, backupRestore: true, auditLogs: true }
                          }
                          updateFormData({ permissions: allPermissions })
                        }}
                        className="px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded border border-green-300 dark:border-green-600 hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                      >
                        All Permissions
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inventory Permissions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Inventory Management</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.inventory.view}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            inventory: { ...formData.permissions.inventory, view: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">View</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.inventory.create}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            inventory: { ...formData.permissions.inventory, create: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Create</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.inventory.edit}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            inventory: { ...formData.permissions.inventory, edit: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Edit</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.inventory.delete}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            inventory: { ...formData.permissions.inventory, delete: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Delete</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.inventory.approve}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            inventory: { ...formData.permissions.inventory, approve: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Approve</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.inventory.viewReports}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            inventory: { ...formData.permissions.inventory, viewReports: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Reports</span>
                    </label>
                  </div>
                </div>

                {/* Production Permissions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Production Management</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.production.view}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            production: { ...formData.permissions.production, view: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">View</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.production.create}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            production: { ...formData.permissions.production, create: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Create</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.production.startProcess}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            production: { ...formData.permissions.production, startProcess: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Start Process</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.production.qualityCheck}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            production: { ...formData.permissions.production, qualityCheck: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Quality Check</span>
                    </label>
                  </div>
                </div>

                {/* Orders Permissions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Orders Management</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.orders.view}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            orders: { ...formData.permissions.orders, view: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">View</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.orders.create}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            orders: { ...formData.permissions.orders, create: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Create</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.orders.edit}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            orders: { ...formData.permissions.orders, edit: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Edit</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.orders.dispatch}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            orders: { ...formData.permissions.orders, dispatch: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Dispatch</span>
                    </label>
                  </div>
                </div>

                {/* Financial Permissions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Financial Management</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.financial.view}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            financial: { ...formData.permissions.financial, view: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">View</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.financial.create}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            financial: { ...formData.permissions.financial, create: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Create</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.financial.bankTransactions}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            financial: { ...formData.permissions.financial, bankTransactions: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Bank Transactions</span>
                    </label>
                  </div>
                </div>

                {/* Security Permissions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Security Management</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.security.gateManagement}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            security: { ...formData.permissions.security, gateManagement: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Gate Management</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.security.visitorManagement}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            security: { ...formData.permissions.security, visitorManagement: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Visitor Management</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.security.vehicleTracking}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            security: { ...formData.permissions.security, vehicleTracking: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Vehicle Tracking</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.security.cctvAccess}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            security: { ...formData.permissions.security, cctvAccess: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">CCTV Access</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.security.emergencyResponse}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            security: { ...formData.permissions.security, emergencyResponse: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Emergency Response</span>
                    </label>
                  </div>
                </div>

                {/* HR Permissions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Human Resources</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.hr.viewEmployees}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            hr: { ...formData.permissions.hr, viewEmployees: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">View Employees</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.hr.manageAttendance}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            hr: { ...formData.permissions.hr, manageAttendance: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Manage Attendance</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.hr.viewReports}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            hr: { ...formData.permissions.hr, viewReports: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">View Reports</span>
                    </label>
                  </div>
                </div>

                {/* Admin Permissions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">System Administration</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.admin.userManagement}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            admin: { ...formData.permissions.admin, userManagement: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">User Management</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.admin.systemSettings}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            admin: { ...formData.permissions.admin, systemSettings: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">System Settings</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.admin.auditLogs}
                        onChange={(e) => updateFormData({
                          permissions: {
                            ...formData.permissions,
                            admin: { ...formData.permissions.admin, auditLogs: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 transition-all duration-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Audit Logs</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Section (only for new users) */}
            {!isEditing && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700 transition-all duration-300">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Security
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => updateFormData({ password: e.target.value })}
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.password ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                          }`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.confirmPassword ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                          }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </form>
      </ModalContent>

      <ModalFooter>
        <Button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          form="user-form"
          disabled={isLoading}
          className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {showSuccess ? 'Success!' : (isEditing ? 'Update User' : 'Create User')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
