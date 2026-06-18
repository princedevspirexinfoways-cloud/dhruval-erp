'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Building2, Lock, Mail, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useLoginMutation } from '@/lib/api/authApi'
import { setCredentials, selectIsAuthenticated, setCompanies, setPermissions } from '@/lib/features/auth/authSlice'
import { addNotification } from '@/lib/features/ui/uiSlice'
import { LoginTwoFactorVerification } from '@/components/auth/LoginTwoFactorVerification'
import { LoginLogo } from '@/components/ui/Logo'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [loginToken, setLoginToken] = useState('')
  const router = useRouter()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [login, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false,
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Check if there's an intended route to redirect to
      if (typeof window !== 'undefined') {
        const intendedRoute = localStorage.getItem('intendedRoute')
        if (intendedRoute && intendedRoute !== '/login') {
          localStorage.removeItem('intendedRoute')
          router.push(intendedRoute)
          return
        }
      }
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Login: Attempting login with credentials:', {
        username: data.emailOrPhone,
        hasPassword: !!data.password,
        rememberMe: data.rememberMe
      });

      // Send email or phone as username since backend expects username field
      const loginData = {
        username: data.emailOrPhone,  // Backend accepts email or phone in username field
        password: data.password,
        rememberMe: data.rememberMe
      }

      const result = await login(loginData).unwrap()

      console.log('Login: Login API response:', {
        success: result.success,
        hasUser: !!result.data?.user,
        hasToken: !!result.data?.tokens?.accessToken,
        message: result.message
      });

      if (result.success) {
        // Check if 2FA is required (server returns this at root level)
        if (result.requiresTwoFactor) {
          if (!result.tempToken) {
            toast.error('Invalid 2FA session. Please try logging in again.')
            return
          }
          setLoginToken(result.tempToken)
          setRequiresTwoFactor(true)
          toast.success('Please complete two-factor authentication')
          return
        }

        // Handle the updated backend response structure with JWT tokens
        const userData = result.data.user // User data is in result.data.user
        const tokens = result.data.tokens // JWT tokens from server

        console.log('Login: Processing successful login for user:', userData._id);

        // Create a mapping of company IDs to names (we'll improve this later with actual company data)
        const companyNames: Record<string, string> = {
          '68aed30c8d1ce6852fdc5e07': 'Dhruval Exim Private Limited',
          '68aed30c8d1ce6852fdc5e0d': 'Jinal Industries (Amar)',
          '68aed30c8d1ce6852fdc5e10': 'Vimal Process'
        }

        // Extract companies from user's companyAccess
        const companies = userData.companyAccess?.map((access, index) => ({
          _id: access.companyId,
          companyCode: `COMP${index + 1}`,
          companyName: companyNames[access.companyId] || `Company ${index + 1}`,
          legalName: companyNames[access.companyId] || `Company ${index + 1}`,
          isActive: access.isActive || true
        })) || []

        // Set primary company as current
        const primaryCompanyId = (userData as any).primaryCompanyId
        const primaryCompany = companies.find(c => c._id === primaryCompanyId) || companies[0]

        const currentCompany = companies.length > 0 ? {
          id: primaryCompany._id,
          name: primaryCompany.companyName,
          code: primaryCompany.companyCode,
          role: userData.companyAccess?.find(c => c.companyId === primaryCompanyId)?.role || userData.companyAccess?.[0]?.role || 'helper',
          permissions: []
        } : null

        // Extract and transform permissions from first company access
        const rawPermissions = (userData.companyAccess?.[0]?.permissions as any) || {}
        const permissions: { [module: string]: string[] } = {}

        // Transform boolean permissions to string arrays
        Object.keys(rawPermissions).forEach(module => {
          const modulePermissions = rawPermissions[module]
          if (typeof modulePermissions === 'object' && modulePermissions !== null) {
            permissions[module] = Object.keys(modulePermissions).filter(key =>
              (modulePermissions as any)[key] === true
            )
          }
        })

        // Update user with current company info
        const userWithCompany = {
          ...userData,
          currentCompanyId: currentCompany?.id,
          isSuperAdmin: userData.isSuperAdmin || false,
          firstName: userData.personalInfo?.firstName || userData.firstName || 'User',
          lastName: userData.personalInfo?.lastName || userData.lastName || '',
          email: userData.email,
          phone: userData.personalInfo?.phone || userData.phone
        }

        // Store token in localStorage first to ensure it's available
        if (typeof window !== 'undefined' && tokens?.accessToken) {
          localStorage.setItem('token', tokens.accessToken)
          console.log('Login: Token stored in localStorage, length:', tokens.accessToken.length);
        }

        // Store user data
        if (typeof window !== 'undefined' && userWithCompany) {
          localStorage.setItem('user', JSON.stringify(userWithCompany))
          console.log('Login: User data stored in localStorage');
        }

        // Store companies if available
        if (typeof window !== 'undefined' && companies.length > 0) {
          localStorage.setItem('companies', JSON.stringify(companies))
          console.log('Login: Companies stored in localStorage, count:', companies.length);
        }

        // Store permissions if available
        if (typeof window !== 'undefined' && Object.keys(permissions).length > 0) {
          localStorage.setItem('permissions', JSON.stringify(permissions))
          console.log('Login: Permissions stored in localStorage, modules:', Object.keys(permissions));
        }

        // Set current company if available
        if (typeof window !== 'undefined' && currentCompany) {
          localStorage.setItem('currentCompany', JSON.stringify(currentCompany))
          localStorage.setItem('currentCompanyId', currentCompany.id)
          console.log('Login: Current company set:', currentCompany.name);
        }

        // Now dispatch the Redux action to update the authentication state
        console.log('Login: Dispatching setCredentials to Redux...');
        dispatch(setCredentials({
          user: userWithCompany,
          token: tokens.accessToken,
          companies: companies,
          permissions: permissions
        }));

        // Also dispatch companies and permissions separately to ensure they're set
        if (companies.length > 0) {
          dispatch(setCompanies(companies));
        }
        if (Object.keys(permissions).length > 0) {
          dispatch(setPermissions(permissions));
        }

        console.log('Login: Login successful, redirecting...')

        // Test if cookies are being received
        if (typeof document !== 'undefined') {
          console.log('Login: Available cookies after login:', document.cookie);

          // Test the server's cookie endpoint

        }

        // Wait for state to be updated
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        console.error('Login: Login failed, no token received');
        toast.error(result.message || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login: Login error:', error);
      toast.error(error?.data?.message || error?.message || 'Login failed')
    }
  }

  const handleTwoFactorCancel = () => {
    // Reset 2FA state and go back to login form
    setRequiresTwoFactor(false)
    setLoginToken('')
  }

  // Show 2FA verification if required
  if (requiresTwoFactor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginTwoFactorVerification
            tempToken={loginToken}
            onCancel={handleTwoFactorCancel}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile and Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Left Side - Logo and Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-sky-50 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <LoginLogo size="lg" />
              <p className="text-xl text-black mt-4">Complete Manufacturing Management Solution</p>
            </div>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-black">Production Management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-black">Inventory Control</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-black">Quality Management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-black">Financial Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="text-center mb-8 lg:hidden">
              <LoginLogo size="md" />
              <h2 className="text-3xl font-bold text-black mb-2 mt-4">Welcome Back</h2>
              <p className="text-black">Sign in to your Factory ERP account</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-4xl font-bold text-black mb-3">Welcome Back</h2>
              <p className="text-black text-lg">Sign in to your Factory ERP account</p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-2xl border-2 border-sky-500 p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email or Phone Field */}
                <div>
                  <label htmlFor="emailOrPhone" className="block text-sm font-medium text-black mb-2">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register('emailOrPhone')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border-2 border-sky-500 rounded-lg focus:outline-none focus:border-black bg-white text-black"
                      placeholder="Enter your email or phone number"
                    />
                  </div>
                  {errors.emailOrPhone && (
                    <p className="mt-1 text-sm text-black">{errors.emailOrPhone.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full pl-10 pr-10 py-3 border-2 border-sky-500 rounded-lg focus:outline-none focus:border-black bg-white text-black"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-black hover:text-sky-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-black hover:text-sky-500" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-black">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      {...register('rememberMe')}
                      type="checkbox"
                      className="h-4 w-4 text-sky-500 focus:ring-sky-500 border-sky-500 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-black">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-sky-500 hover:text-black font-medium"
                    onClick={() => router.push('/forgot-password')}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border-2 border-sky-500 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-black hover:border-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Demo Login Section */}
              {/* Demo Login Section */}
              <div className="mt-6 p-5 bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-300 rounded-xl shadow-sm">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-sky-700 mb-1">🚀 Try Demo Login</p>
                  <p className="text-xs text-sky-600">Click to auto-fill verified credentials & explore the system</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('emailOrPhone', 'superadmin');
                      setValue('password', 'password123');
                      toast.success('Super Admin credentials loaded! Click "Sign In" to login.');
                    }}
                    className="flex flex-col items-center p-4 bg-white border-2 border-sky-200 rounded-xl hover:border-sky-500 hover:bg-sky-50 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔑</div>
                    <div className="text-sm font-bold text-black">Super Admin</div>
                    <div className="text-xs text-sky-600 text-center">Full System Access</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-black">
                Need access?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="font-medium text-sky-500 hover:text-black underline"
                >
                  Contact Administrator
                </button>
              </p>
              <p className="text-xs text-black opacity-75 mt-2">
                © 2024 Factory ERP. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
