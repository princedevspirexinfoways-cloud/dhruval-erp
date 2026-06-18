import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Company {
  _id: string
  companyCode: string
  companyName: string
  legalName: string
  isActive: boolean
  status?: string
  industry?: string
  userCount?: number
  activeUsers?: number
  createdAt?: string
  contactInfo?: {
    emails?: Array<{ email: string; type: string }>
    phones?: Array<{ phone: string; type: string }>
  }
  address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
}

export interface Role {
  _id: string
  roleName: string
  permissions: {
    [module: string]: string[]
  }
  companyId: string
}

export interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  companyId?: string
  currentCompanyId?: string
  isSuperAdmin: boolean
  isActive: boolean
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
  passwordChangedAt?: string
  personalInfo?: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  roles: {
    roleId: string
    companyId: string
    assignedAt: string
    expiresAt?: string
  }[]
  companyAccess: {
    companyId: string
    role: string
    permissions: Record<string, unknown>
    isActive: boolean
  }[]
  permissions?: { [module: string]: string[] }
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  companies: Company[]
  currentCompany: Company | null
  currentCompanyId: string | null
  permissions: { [module: string]: string[] }
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  companies: [],
  currentCompany: null,
  currentCompanyId: null,
  permissions: {},
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken?: string;
        companies?: Company[];
        permissions?: { [module: string]: string[] };
      }>
    ) => {
      const { user, token, refreshToken, companies, permissions } = action.payload
      
      console.log('AuthSlice: setCredentials called with:', { 
        user: user._id, 
        token: !!token, 
        companies: companies?.length, 
        permissions: Object.keys(permissions || {}) 
      })
      
      state.user = user
      state.token = token
      state.refreshToken = refreshToken || null
      state.isAuthenticated = true
      state.error = null

      if (companies) {
        state.companies = companies
      }

      if (permissions) {
        state.permissions = permissions
      }

      // Set current company if user has access to companies
      if (companies && companies.length > 0) {
        // Check localStorage for previously selected company (for super admin)
        let savedCompanyId = null;
        if (typeof window !== 'undefined') {
          savedCompanyId = localStorage.getItem('currentCompanyId');
        }

        if (savedCompanyId && companies.find(c => c._id === savedCompanyId)) {
          state.currentCompany = companies.find(c => c._id === savedCompanyId) || companies[0]
          state.currentCompanyId = savedCompanyId
        } else if (user.currentCompanyId) {
          state.currentCompany = companies.find(c => c._id === user.currentCompanyId) || companies[0]
          state.currentCompanyId = user.currentCompanyId
        } else {
          state.currentCompany = companies[0]
          state.currentCompanyId = companies[0]._id

          // Save to localStorage for super admin
          if (typeof window !== 'undefined' && user.isSuperAdmin) {
            localStorage.setItem('currentCompanyId', companies[0]._id);
          }
        }
      }

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
        if (companies) localStorage.setItem('companies', JSON.stringify(companies))
        if (permissions) localStorage.setItem('permissions', JSON.stringify(permissions))
        // Persist the selected company (full object + id) for all users so the
        // navbar dropdown keeps its selection across reloads.
        if (state.currentCompany) localStorage.setItem('currentCompany', JSON.stringify(state.currentCompany))
        if (state.currentCompanyId) localStorage.setItem('currentCompanyId', state.currentCompanyId)
        
        // Verify token was stored correctly
        const storedToken = localStorage.getItem('token')
        if (storedToken !== token) {
          console.error('AuthSlice: Token storage verification failed in setCredentials!')
        } else {
          console.log('AuthSlice: Token successfully stored in localStorage during setCredentials')
        }
      }

      console.log('AuthSlice: setCredentials completed, state updated:', {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        hasToken: !!state.token,
        companiesCount: state.companies.length
      })
    },

    switchCompany: (state, action: PayloadAction<Company>) => {
      const company = action.payload

      if (company) {
        state.currentCompany = company
        state.currentCompanyId = company._id

        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentCompanyId', company._id)
          localStorage.setItem('currentCompany', JSON.stringify(company))
        }
      }
    },

    logout: (state) => {
      console.log('AuthSlice: logout called, clearing authentication state');
      
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      state.companies = []
      state.currentCompany = null
      state.currentCompanyId = null
      state.permissions = {}

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('companies')
        localStorage.removeItem('permissions')
        localStorage.removeItem('currentCompany')
        console.log('AuthSlice: localStorage cleared during logout')
      }

      console.log('AuthSlice: logout completed, state cleared');
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(state.user))
        }
      }
    },
    


    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('companies', JSON.stringify(action.payload))
      }
    },

    setPermissions: (state, action: PayloadAction<{ [module: string]: string[] }>) => {
      state.permissions = action.payload

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('permissions', JSON.stringify(action.payload))
      }
    },

    initializeAuth: (state) => {
      console.log('AuthSlice: initializeAuth called');
      
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        const refreshToken = localStorage.getItem('refreshToken')
        const userStr = localStorage.getItem('user')
        const companiesStr = localStorage.getItem('companies')
        const permissionsStr = localStorage.getItem('permissions')
        const currentCompanyStr = localStorage.getItem('currentCompany')
        const currentCompanyId = localStorage.getItem('currentCompanyId')

        console.log('AuthSlice: initializeAuth - localStorage data:', {
          hasToken: !!token,
          hasUser: !!userStr,
          hasCompanies: !!companiesStr,
          hasPermissions: !!permissionsStr,
          tokenLength: token?.length || 0
        })

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            console.log('AuthSlice: initializeAuth - setting authenticated state for user:', user._id)
            state.user = user
            state.token = token
            state.refreshToken = refreshToken
            state.isAuthenticated = true

            if (companiesStr) {
              state.companies = JSON.parse(companiesStr)
            }

            if (permissionsStr) {
              state.permissions = JSON.parse(permissionsStr)
            }

            if (currentCompanyStr) {
              state.currentCompany = JSON.parse(currentCompanyStr)
            }

            if (currentCompanyId) {
              state.currentCompanyId = currentCompanyId
            }

            // Default-select a company if none was restored but companies exist,
            // so the navbar company dropdown always shows a selection on load.
            if (!state.currentCompany && state.companies.length > 0) {
              const byId = currentCompanyId
                ? state.companies.find((c: any) => c._id === currentCompanyId)
                : null
              const defaultCompany = byId || state.companies[0]
              state.currentCompany = defaultCompany
              state.currentCompanyId = defaultCompany._id
              localStorage.setItem('currentCompany', JSON.stringify(defaultCompany))
              localStorage.setItem('currentCompanyId', defaultCompany._id)
            }

            console.log('AuthSlice: initializeAuth - authentication state restored successfully')
          } catch (error) {
            console.error('AuthSlice: initializeAuth - error parsing localStorage data:', error)
            // Clear invalid data
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            localStorage.removeItem('companies')
            localStorage.removeItem('permissions')
            localStorage.removeItem('currentCompany')
            localStorage.removeItem('currentCompanyId')
            state.isAuthenticated = false
            state.user = null
            state.token = null
            state.refreshToken = null
            state.companies = []
            state.permissions = {}
            state.currentCompany = null
            state.currentCompanyId = null
          }
        } else {
          console.log('AuthSlice: initializeAuth - no valid authentication data found in localStorage')
        }
      }

      state.isLoading = false
      state.isInitialized = true
      console.log('AuthSlice: initializeAuth completed, isAuthenticated:', state.isAuthenticated)
    },
  },
})

export const {
  setCredentials,
  switchCompany,
  logout,
  setLoading,
  setError,
  updateUser,
  setCompanies,
  setPermissions,
  initializeAuth,
} = authSlice.actions

export default authSlice.reducer

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.isInitialized
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectCompanies = (state: { auth: AuthState }) => state.auth.companies
export const selectCurrentCompany = (state: { auth: AuthState }) => state.auth.currentCompany
export const selectCurrentCompanyId = (state: { auth: AuthState }) => state.auth.currentCompanyId
export const selectPermissions = (state: { auth: AuthState }) => state.auth.permissions
export const selectIsSuperAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.isSuperAdmin ||
  state.auth.user?.companyAccess?.some(access => access.role === 'super_admin') ||
  false

// Permission helper selectors
export const selectHasPermission = (module: string, action: string) => (state: { auth: AuthState }) => {
  const permissions = state.auth.permissions[module]
  return permissions ? permissions.includes(action) : false
}

export const selectCanAccess = (module: string) => (state: { auth: AuthState }) => {
  return !!state.auth.permissions[module]
}
