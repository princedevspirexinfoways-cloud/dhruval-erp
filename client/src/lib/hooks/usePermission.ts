import { useSelector } from 'react-redux'
import { selectPermissions, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'

export function usePermission() {
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const permissions = useSelector(selectPermissions)

  const has = (moduleKey: string, action: string): boolean => {
    if (isSuperAdmin) return true
    const mod = (permissions as any)?.[moduleKey]
    if (!mod) return false
    if (Array.isArray(mod)) return mod.includes(action)
    if (typeof mod === 'object') return Boolean(mod[action])
    return false
  }

  return { has, isSuperAdmin }
}



