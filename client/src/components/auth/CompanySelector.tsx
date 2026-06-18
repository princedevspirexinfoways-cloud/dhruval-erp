'use client'

import { useState, Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import {
  selectCompanies,
  selectCurrentCompany,
  selectCurrentUser,
  selectIsSuperAdmin,
  switchCompany,
  Company
} from '@/lib/features/auth/authSlice'
import { useSwitchCompanyMutation } from '@/lib/api/authApi'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export function CompanySelector() {
  const dispatch = useDispatch()
  const companies = useSelector(selectCompanies)
  const currentCompany = useSelector(selectCurrentCompany)
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [switchCompanyMutation, { isLoading }] = useSwitchCompanyMutation()

  const handleCompanyChange = async (company: Company) => {
    if (company._id === currentCompany?._id) return

    try {
      const result = await switchCompanyMutation({ companyId: company._id }).unwrap()
      
      if (result.success) {
        dispatch(switchCompany(company))
        toast.success(`Switched to ${company.companyName}`)
        
        // Reload the page to refresh all data for the new company
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to switch company')
    }
  }

  // Show selector for super admin even with one company, or if user has multiple companies
  if (!companies || (companies.length <= 1 && !isSuperAdmin)) {
    return null
  }

  return (
    <div className="relative">
      <Listbox value={currentCompany} onChange={handleCompanyChange} disabled={isLoading}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-sky-500 hover:border-black focus:outline-none focus:border-black sm:text-sm">
            <span className="flex items-center">
              <div className={`p-1.5 rounded-md mr-3 ${isSuperAdmin ? 'bg-sky-100' : 'bg-sky-100'}`}>
                <BuildingOfficeIcon className={`h-4 w-4 ${isSuperAdmin ? 'text-sky-600' : 'text-sky-600'}`} />
              </div>
              <div className="flex flex-col">
                <span className="block truncate font-medium text-black">
                  {currentCompany?.companyName || 'Select Company'}
                </span>
                {isSuperAdmin && (
                  <span className="text-xs text-sky-600 font-medium">Super Admin</span>
                )}
                {currentCompany?.companyCode && (
                  <span className="text-xs text-black">Code: {currentCompany.companyCode}</span>
                )}
              </div>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-black" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-2 max-h-80 w-full overflow-auto rounded-lg bg-white py-2 text-base border-2 border-sky-500 focus:outline-none sm:text-sm">
              {isSuperAdmin && (
                <div className="px-4 py-2 text-xs font-semibold text-sky-600 bg-sky-50 border-b border-sky-200">
                  Super Admin - All Companies Access
                </div>
              )}
              {companies.map((company) => (
                <Listbox.Option
                  key={company._id}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-pointer select-none py-3 pl-4 pr-10',
                      active ? 'bg-sky-50 text-gray-900' : 'text-gray-900 hover:bg-sky-50'
                    )
                  }
                  value={company}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <div className={`p-1.5 rounded-md mr-3 ${active ? 'bg-sky-100' : 'bg-sky-100'}`}>
                          <BuildingOfficeIcon className={`h-4 w-4 ${active ? 'text-sky-600' : 'text-sky-600'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className={clsx('block truncate', selected ? 'font-semibold' : 'font-medium')}>
                            {company.companyName}
                          </span>
                          {company.companyCode && (
                            <span className={clsx('text-xs', active ? 'text-sky-600' : 'text-black')}>
                              Code: {company.companyCode}
                            </span>
                          )}
                          {company.legalName && company.legalName !== company.companyName && (
                            <span className={clsx('text-xs', active ? 'text-sky-500' : 'text-black')}>
                              {company.legalName}
                            </span>
                          )}
                        </div>
                      </div>

                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <div className="p-1 rounded-full bg-sky-600">
                            <CheckIcon className="h-3 w-3 text-white" aria-hidden="true" />
                          </div>
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

// Compact version for header
export function CompanySelectorCompact() {
  const dispatch = useDispatch()
  const companies = useSelector(selectCompanies)
  const currentCompany = useSelector(selectCurrentCompany)
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [switchCompanyMutation, { isLoading }] = useSwitchCompanyMutation()

  const handleCompanyChange = async (company: Company) => {
    if (company._id === currentCompany?._id) return

    try {
      const result = await switchCompanyMutation({ companyId: company._id }).unwrap()
      
      if (result.success) {
        dispatch(switchCompany(company))
        toast.success(`Switched to ${company.companyName}`)
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to switch company')
    }
  }

  if (!companies || (companies.length <= 1 && !isSuperAdmin)) {
    return (
      <div className="flex items-center text-sm text-black">
        <div className={`p-1 rounded mr-2 ${isSuperAdmin ? 'bg-sky-100' : 'bg-sky-100'}`}>
          <BuildingOfficeIcon className={`h-3 w-3 ${isSuperAdmin ? 'text-sky-600' : 'text-sky-600'}`} />
        </div>
        <div className="flex flex-col">
          <span className="font-medium">{currentCompany?.companyName || 'No Company'}</span>
          {isSuperAdmin && <span className="text-xs text-sky-600">Super Admin</span>}
        </div>
      </div>
    )
  }

  return (
    <Listbox value={currentCompany} onChange={handleCompanyChange} disabled={isLoading}>
      <div className="relative">
        <Listbox.Button className="flex items-center text-sm text-black hover:text-black px-3 py-2 rounded-lg hover:bg-sky-50 border border-sky-500">
          <div className={`p-1 rounded mr-2 ${isSuperAdmin ? 'bg-sky-100' : 'bg-sky-100'}`}>
            <BuildingOfficeIcon className={`h-3 w-3 ${isSuperAdmin ? 'text-sky-600' : 'text-sky-600'}`} />
          </div>
          <div className="flex flex-col items-start">
            <span className="truncate max-w-32 font-medium">
              {currentCompany?.companyName || 'Select Company'}
            </span>
            {isSuperAdmin && <span className="text-xs text-sky-600">Super Admin</span>}
          </div>
          <ChevronUpDownIcon className="h-3 w-3 ml-2" />
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-60 w-64 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {companies.map((company) => (
              <Listbox.Option
                key={company._id}
                className={({ active }) =>
                  clsx(
                    'relative cursor-pointer select-none py-2 pl-3 pr-9',
                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                  )
                }
                value={company}
              >
                {({ selected, active }) => (
                  <>
                    <div className="flex items-center">
                      <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                        {company.companyName}
                      </span>
                      {company.companyCode && (
                        <span className={clsx('ml-2 text-sm', active ? 'text-blue-200' : 'text-gray-500')}>
                          ({company.companyCode})
                        </span>
                      )}
                    </div>

                    {selected && (
                      <span
                        className={clsx(
                          'absolute inset-y-0 right-0 flex items-center pr-4',
                          active ? 'text-white' : 'text-blue-600'
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}
