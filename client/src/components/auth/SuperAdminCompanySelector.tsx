'use client'

import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Search,
  Users,
  Activity,
  Settings
} from 'lucide-react'
import { 
  selectCurrentUser, 
  selectCurrentCompany, 
  selectIsSuperAdmin,
  switchCompany 
} from '@/lib/features/auth/authSlice'
import { useGetAllCompaniesQuery, useSwitchCompanyMutation } from '@/lib/api/authApi'
import clsx from 'clsx'

export function SuperAdminCompanySelector() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const currentCompany = useSelector(selectCurrentCompany)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch all companies for super admin
  const { data: companiesData, isLoading } = useGetAllCompaniesQuery(undefined, {
    skip: !isSuperAdmin
  })
  
  const [switchCompanyMutation] = useSwitchCompanyMutation()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't show for non-super admins
  if (!isSuperAdmin) {
    return null
  }

  const companies = companiesData?.data || []
  
  // Filter companies based on search
  const filteredCompanies = companies.filter(company =>
    company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.companyCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCompanySwitch = async (company: any) => {
    try {
      // Update local state immediately for better UX
      dispatch(switchCompany(company))
      
      // Call API to switch company context
      await switchCompanyMutation({ companyId: company._id }).unwrap()
      
      setIsOpen(false)
      setSearchQuery('')
      
      // Refresh the page to load new company data
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch company:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Company Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border-2 border-sky-500 rounded-lg hover:border-black transition-colors min-w-[200px] text-left"
      >
        <Building2 className="h-4 w-4 text-sky-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-black truncate">
            {currentCompany?.companyName || 'Select Company'}
          </p>
          <p className="text-xs text-black opacity-60 truncate">
            {currentCompany?.companyCode || 'No company selected'}
          </p>
        </div>
        <ChevronDown className={clsx(
          "h-4 w-4 text-black transition-transform flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-sky-500 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-sky-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-500" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>
          </div>

          {/* Companies List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500 mx-auto"></div>
                <p className="text-sm text-black opacity-60 mt-2">Loading companies...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-black opacity-60">No companies found</p>
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <button
                  key={company._id}
                  onClick={() => handleCompanySwitch(company)}
                  className={clsx(
                    "w-full px-4 py-3 text-left hover:bg-sky-50 transition-colors border-b border-sky-100 last:border-b-0",
                    currentCompany?._id === company._id && "bg-sky-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-sky-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">
                            {company.companyName}
                          </p>
                          <p className="text-xs text-black opacity-60 truncate">
                            {company.companyCode}
                          </p>
                        </div>
                      </div>
                      
                      {/* Company Stats */}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-black opacity-60">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{company.userCount || 0} users</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span className={clsx(
                            company.status === 'active' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {company.status || 'inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {currentCompany?._id === company._id && (
                      <Check className="h-4 w-4 text-sky-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-sky-200 bg-sky-50">
            <div className="flex items-center justify-between text-xs text-black opacity-60">
              <span>{filteredCompanies.length} companies available</span>
              <div className="flex items-center space-x-1">
                <Settings className="h-3 w-3" />
                <span>Super Admin Mode</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
