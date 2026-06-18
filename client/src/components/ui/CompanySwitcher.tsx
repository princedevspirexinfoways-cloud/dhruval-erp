'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ChevronDown, Building2, Check } from 'lucide-react'
import { 
  selectCurrentCompany, 
  selectCompanies, 
  selectIsSuperAdmin,
  switchCompany 
} from '@/lib/features/auth/authSlice'
import clsx from 'clsx'

export function CompanySwitcher() {
  const dispatch = useDispatch()
  const currentCompany = useSelector(selectCurrentCompany)
  const companies = useSelector(selectCompanies)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [isOpen, setIsOpen] = useState(false)

  // Only show company switcher for super admin or users with multiple company access
  if (!isSuperAdmin && companies.length <= 1) {
    return null
  }

  const handleCompanySwitch = (companyId: string) => {
    const company = companies.find(c => c._id === companyId)
    if (company) {
      dispatch(switchCompany(company))
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
      >
        <Building2 className="h-4 w-4 text-gray-500" />
        <div className="flex flex-col items-start">
          <span className="font-medium text-gray-900 truncate max-w-20 sm:max-w-32">
            {currentCompany?.companyName || 'Select Company'}
          </span>
          {currentCompany?.companyCode && (
            <span className="text-xs text-gray-500 hidden sm:block">
              {currentCompany.companyCode}
            </span>
          )}
        </div>
        <ChevronDown className={clsx(
          "h-4 w-4 text-gray-500 transition-transform hidden sm:block",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isSuperAdmin ? 'All Companies' : 'Your Companies'}
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {companies.map((company) => (
                  <button
                    key={company._id}
                    onClick={() => handleCompanySwitch(company._id)}
                    className={clsx(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                      currentCompany?._id === company._id && "bg-sky-50 text-sky-700"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                        currentCompany?._id === company._id 
                          ? "bg-sky-100 text-sky-700" 
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {company.companyName?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium truncate max-w-40">
                          {company.companyName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {company.companyCode}
                        </span>
                      </div>
                    </div>
                    
                    {currentCompany?._id === company._id && (
                      <Check className="h-4 w-4 text-sky-600" />
                    )}
                  </button>
                ))}
              </div>
              
              {companies.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  No companies available
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
