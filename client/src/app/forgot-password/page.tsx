'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoginLogo } from '@/components/ui/Logo'
import { useForgotPasswordMutation } from '@/lib/api/authApi'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data).unwrap()
      setIsSubmitted(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      toast.error(error?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex">
        {/* Left Side - Logo and Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-sky-50 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <LoginLogo size="lg" />
              <h1 className="text-3xl font-bold text-sky-900 mb-4 mt-4">
                ERP Management System
              </h1>
              <p className="text-sky-700 text-lg">
                Complete business management solution for textile and manufacturing industries
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <LoginLogo size="md" />
              <h1 className="text-2xl font-bold text-gray-900 mt-4">ERP System</h1>
            </div>

            {/* Success Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Check Your Email
                </h2>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  We've sent a password reset link to{' '}
                  <span className="font-semibold text-gray-900">
                    {getValues('email')}
                  </span>
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Didn't receive the email?</strong>
                    <br />
                    Check your spam folder or try again in a few minutes.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Try Different Email
                  </Button>
                  
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Logo and Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-sky-50 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <LoginLogo size="lg" />
            <h1 className="text-3xl font-bold text-sky-900 mb-4 mt-4">
              ERP Management System
            </h1>
            <p className="text-sky-700 text-lg">
              Complete business management solution for textile and manufacturing industries
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <LoginLogo size="md" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">ERP System</h1>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-sky-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  className={errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/login"
                className="text-sm text-sky-600 hover:text-sky-800 font-medium inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
