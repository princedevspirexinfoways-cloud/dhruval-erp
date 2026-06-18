'use client'

import { Briefcase, User, Calendar, DollarSign, ArrowRight } from 'lucide-react'
import { useGetJobWorkByIdQuery } from '@/lib/api/jobWorkApi'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatDate } from '../utils'

interface MovementJobWorkReturnProps {
  theme: 'light' | 'dark'
  referenceDocument: {
    documentType?: string
    documentNumber?: string
  }
}

export function MovementJobWorkReturn({ theme, referenceDocument }: MovementJobWorkReturnProps) {
  const router = useRouter()
  
  // Extract job work ID from reference document number
  // Format: "JOB-WORK-{id}-RETURN"
  const extractJobWorkId = (docNumber: string): string | null => {
    if (!docNumber) return null
    const match = docNumber.match(/JOB-WORK-([^-]+)-RETURN/)
    return match ? match[1] : null
  }

  const jobWorkId = referenceDocument.documentNumber 
    ? extractJobWorkId(referenceDocument.documentNumber)
    : null

  const { data: jobWorkData, isLoading } = useGetJobWorkByIdQuery(jobWorkId || '', {
    skip: !jobWorkId || referenceDocument.documentType !== 'return_note'
  })
  
  // Handle the response structure - it might be { data: JobWork } or { success: true, data: JobWork }
  const jobWork = jobWorkData?.data || (jobWorkData as any)

  if (referenceDocument.documentType !== 'return_note' || !jobWorkId) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`rounded-xl border p-6 transition-theme ${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          <Briefcase className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
          <span>Job Work Return Information</span>
        </h3>
        <div className="text-center py-4">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading job work details...
          </p>
        </div>
      </div>
    )
  }

  if (!jobWork) {
    return (
      <div className={`rounded-xl border p-6 transition-theme ${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          <Briefcase className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
          <span>Job Work Return Information</span>
        </h3>
        <div className="text-center py-4">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Job work details not found
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gradient-to-r from-orange-900/20 to-amber-900/20 border-orange-700/50'
        : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          <Briefcase className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
          <span>Job Work Return Information</span>
        </h3>
        <Button
          onClick={() => router.push(`/job-work/${jobWork._id}`)}
          variant="outline"
          size="sm"
          className={`${
            theme === 'dark'
              ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20'
              : 'border-orange-300 text-orange-600 hover:bg-orange-50'
          }`}
        >
          View Job Work
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Job Work ID</label>
          <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {(jobWork as any).jobWorkNumber || jobWork._id}
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Job Worker</label>
          <div className="flex items-center space-x-2">
            <User className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
              {jobWork.jobWorkerName || 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Job Work Type</label>
          <p className={`capitalize ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {jobWork.jobWorkType || 'N/A'}
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Quantity</label>
          <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
            {jobWork.quantity || 0} {jobWork.unit || 'PCS'}
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Status</label>
          <p className={`capitalize ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {jobWork.status?.replace('_', ' ') || 'N/A'}
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Expected Delivery</label>
          <div className="flex items-center space-x-2">
            <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
              {jobWork.expectedDelivery ? formatDate(jobWork.expectedDelivery) : 'N/A'}
            </p>
          </div>
        </div>

        {jobWork.jobWorkerRate && (
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Worker Rate</label>
            <div className="flex items-center space-x-2">
              <DollarSign className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                ₹{jobWork.jobWorkerRate}
              </p>
            </div>
          </div>
        )}

        {jobWork.jobWorkCost && (
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Total Cost</label>
            <div className="flex items-center space-x-2">
              <DollarSign className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                ₹{jobWork.jobWorkCost}
              </p>
            </div>
          </div>
        )}

        {jobWork.paymentStatus && (
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Payment Status</label>
            <p className={`capitalize ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
              {jobWork.paymentStatus}
            </p>
          </div>
        )}
      </div>

      {(jobWork.remarks || (jobWork as any).notes) && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Job Work Notes</label>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {jobWork.remarks || (jobWork as any).notes}
          </p>
        </div>
      )}
    </div>
  )
}

