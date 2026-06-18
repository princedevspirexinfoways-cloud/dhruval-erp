'use client'

import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/lib/features/ui/uiSlice'

export function ThemeSync() {
    const theme = useSelector(selectTheme)

    useEffect(() => {
        if (typeof document === 'undefined') return

        const applyTheme = (t: 'light' | 'dark') => {
            if (t === 'dark') {
                document.documentElement.classList.add('dark')
                document.documentElement.setAttribute('data-theme', 'dark')
                document.body.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
                document.documentElement.setAttribute('data-theme', 'light')
                document.body.classList.remove('dark')
            }
            const meta = document.querySelector('meta#theme-color[name="theme-color"]')
            if (meta) {
                meta.setAttribute('content', t === 'dark' ? '#0f172a' : '#ffffff')
            }
            // Debug
            try {
                // eslint-disable-next-line no-console
                console.log('[ThemeSync] applied:', t, '| html:', document.documentElement.className, '| data-theme:', document.documentElement.getAttribute('data-theme'), '| body:', document.body.className)
            } catch { }
        }

        applyTheme(theme)

        // Briefly re-assert after a tick to win over late mutations
        const t1 = setTimeout(() => applyTheme(theme), 50)
        const t2 = setTimeout(() => applyTheme(theme), 200)

        // Guard against other scripts removing the class
        const observer = new MutationObserver(() => {
            const hasDarkHtml = document.documentElement.classList.contains('dark')
            const hasDarkBody = document.body.classList.contains('dark')
            if (theme === 'dark') {
                if (!hasDarkHtml || !hasDarkBody) applyTheme('dark')
            } else {
                if (hasDarkHtml || hasDarkBody) applyTheme('light')
            }
        })

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

        // Sync across tabs and any manual updates
        const storageHandler = (e: StorageEvent) => {
            if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
                applyTheme(e.newValue)
            }
        }
        window.addEventListener('storage', storageHandler)

        // Listen for custom themeChanged events if any component fires them
        const customHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail?.theme
            if (detail === 'light' || detail === 'dark') applyTheme(detail)
        }
        window.addEventListener('themeChanged', customHandler as EventListener)

        return () => {
            observer.disconnect()
            clearTimeout(t1)
            clearTimeout(t2)
            window.removeEventListener('storage', storageHandler)
            window.removeEventListener('themeChanged', customHandler as EventListener)
        }
    }, [theme])

    return null
}


