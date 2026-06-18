declare module 'next-pwa' {
  import { NextConfig } from 'next'
  
  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    runtimeCaching?: Array<{
      urlPattern: RegExp | string
      handler: string
      options?: {
        cacheName?: string
        expiration?: {
          maxEntries?: number
          maxAgeSeconds?: number
        }
        cacheKeyWillBeUsed?: unknown
        cacheWillUpdate?: unknown
        cacheableResponse?: unknown
        broadcastUpdate?: unknown
        matchOptions?: unknown
        plugins?: unknown[]
      }
    }>
    buildExcludes?: Array<string | RegExp | ((chunk: unknown) => boolean)>
    exclude?: Array<string | RegExp | ((url: string) => boolean)>
    include?: Array<string | RegExp | ((url: string) => boolean)>
    precacheEntries?: string[]
    cleanupOutdatedCaches?: boolean
    clientsClaim?: boolean
    navigateFallback?: string
    navigateFallbackDenylist?: RegExp[]
    offlineGoogleAnalytics?: boolean | object
    mode?: 'production' | 'development'
    scope?: string
    sw?: string
    publicExcludes?: string[]
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
  }

  function withPWA(pwaConfig: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
