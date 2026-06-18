import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  loading: boolean
  notifications: Notification[]
  modals: {
    [key: string]: boolean
  }
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
  read: boolean
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  
  // Always check localStorage first - prioritize user choice
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }
  
  // Default to light theme - don't auto-detect system preference
  return 'light'
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: getInitialTheme(),
  loading: false,
  notifications: [],
  modals: {},
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    initializeTheme: (state) => {
      console.log('=== INITIALIZING THEME ===')
      console.log('Initial theme from state:', state.theme)
      
      if (typeof window !== 'undefined') {
        // Apply theme to document
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark')
          document.body.classList.add('dark')
          console.log('Applied dark theme to document')
        } else {
          document.documentElement.classList.remove('dark')
          document.body.classList.remove('dark')
          console.log('Applied light theme to document')
        }
        
        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', state.theme === 'dark' ? '#0f172a' : '#ffffff')
        }
        
        console.log('Document classes after init:', document.documentElement.className)
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(action.payload))
      }
    },
    
    toggleTheme: (state) => {
      console.log('=== UI SLICE TOGGLE THEME ===')
      console.log('Current state theme:', state.theme)
      
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      state.theme = newTheme
      
      console.log('New state theme:', state.theme)
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
        console.log('UI Slice: Saved theme to localStorage:', newTheme)

        // Apply theme class to document and body for immediate effect
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark')
          document.body.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
          document.body.classList.remove('dark')
        }

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0f172a' : '#ffffff')
        }
      }
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      console.log('UI Slice: Setting theme to', action.payload)
      state.theme = action.payload
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload)
        console.log('UI Slice: Saved theme to localStorage:', action.payload)

        // Apply theme class to document and body for immediate effect
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark')
          document.body.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
          document.body.classList.remove('dark')
        }

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', action.payload === 'dark' ? '#0f172a' : '#ffffff')
        }
      }
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      }
      state.notifications.unshift(notification)
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    },
    
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true
      })
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true
    },
    
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false
    },
    
    toggleModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = !state.modals[action.payload]
    },
    
    initializeUI: (state) => {
      console.log('=== INITIALIZE UI ===')
      if (typeof window !== 'undefined') {
        // Initialize theme - check if already set by the script in layout.tsx
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        const hasDarkClass = document.documentElement.classList.contains('dark')
        
        console.log('Saved theme from localStorage:', savedTheme)
        console.log('Document has dark class:', hasDarkClass)
        
        if (savedTheme) {
          state.theme = savedTheme
          console.log('Using saved theme:', savedTheme)
          // Ensure the document class matches the saved theme
          if (savedTheme === 'dark' && !hasDarkClass) {
            document.documentElement.classList.add('dark')
            document.body.classList.add('dark')
            console.log('Added dark class to document and body')
          } else if (savedTheme === 'light' && hasDarkClass) {
            document.documentElement.classList.remove('dark')
            document.body.classList.remove('dark')
            console.log('Removed dark class from document and body')
          }
        } else {
          // If no saved theme, default to light (don't auto-detect system)
          state.theme = 'light'
          
          console.log('No saved theme, defaulting to light')
          
          // Apply light theme to document
          document.documentElement.classList.remove('dark')
          document.body.classList.remove('dark')
          console.log('Applied light theme to document and body')
          
          // Save the initial theme preference
          localStorage.setItem('theme', 'light')
          console.log('Saved initial theme to localStorage: light')
        }
        
        console.log('Final theme state:', state.theme)
        console.log('Final document classes:', document.documentElement.className)
        
        // Initialize sidebar collapsed state
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed')
        if (sidebarCollapsed) {
          state.sidebarCollapsed = JSON.parse(sidebarCollapsed)
        }
      }
    },
  },
})

export const {
  initializeTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  toggleTheme,
  setTheme,
  setLoading,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  toggleModal,
  initializeUI,
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed
export const selectTheme = (state: { ui: UIState }) => state.ui.theme
export const selectUILoading = (state: { ui: UIState }) => state.ui.loading
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications
export const selectUnreadNotifications = (state: { ui: UIState }) => 
  state.ui.notifications.filter(n => !n.read)
export const selectModalState = (modalName: string) => (state: { ui: UIState }) => 
  state.ui.modals[modalName] || false
