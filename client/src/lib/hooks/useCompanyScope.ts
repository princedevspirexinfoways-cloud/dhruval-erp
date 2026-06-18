import { useSelector } from 'react-redux'
import { selectIsSuperAdmin, selectCurrentCompanyId } from '@/lib/features/auth/authSlice'

export function useCompanyScope() {
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const currentCompanyId = useSelector(selectCurrentCompanyId)

  // Returns the companyId to use for queries. For super admin, allow undefined for all companies.
  const companyParam = isSuperAdmin ? undefined : currentCompanyId || undefined

  return { isSuperAdmin, currentCompanyId, companyParam }
}



