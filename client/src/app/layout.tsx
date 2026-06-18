import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import PWAManager from "@/components/pwa/PWAManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ERP System - Textile Business Management",
    template: "%s | ERP System"
  },
  description: "Complete ERP solution for textile and fabric printing business with multi-company support, inventory management, sales, purchase, and production tracking.",
  keywords: "ERP, textile, fabric, printing, inventory, warehouse, invoicing, business management, PWA, offline",
  authors: [{ name: "ERP System Team" }],
  creator: "ERP System",
  publisher: "ERP System",
  manifest: "/manifest.json",
  metadataBase: new URL('https://erp.dhruvalexim.com'),
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ERP System",
    startupImage: [
      {
        url: '/icons/apple-touch-icon-180x180.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-touch-icon-180x180.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-touch-icon-180x180.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-57x57.png', sizes: '57x57' },
      { url: '/icons/apple-touch-icon-60x60.png', sizes: '60x60' },
      { url: '/icons/apple-touch-icon-72x72.png', sizes: '72x72' },
      { url: '/icons/apple-touch-icon-76x76.png', sizes: '76x76' },
      { url: '/icons/apple-touch-icon-114x114.png', sizes: '114x114' },
      { url: '/icons/apple-touch-icon-120x120.png', sizes: '120x120' },
      { url: '/icons/apple-touch-icon-144x144.png', sizes: '144x144' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/logo.png',
        color: '#0ea5e9',
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "ERP Management System",
    title: "ERP System - Textile Business Management",
    description: "Complete ERP solution for textile and fabric printing business with multi-company support",
    url: 'https://erp.dhruvalexim.com',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'ERP System Logo',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: "summary_large_image",
    title: "ERP System - Textile Business Management",
    description: "Complete ERP solution for textile and fabric printing business with multi-company support",
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'ERP System',
    'application-name': 'ERP System',
    'msapplication-TileColor': '#0ea5e9',
    'msapplication-TileImage': '/icons/icon-144x144.png',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Single controllable theme-color meta for dynamic updates */}
        <meta name="theme-color" id="theme-color" content="#ffffff" />
        <meta name="application-name" content="ERP System" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ERP System" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-tap-highlight" content="no" />

        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    // Always check for saved theme preference first
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
      console.log('Applied saved dark theme');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
      console.log('Applied saved light theme');
    } else {
      // No saved preference - default to light theme (don't auto-detect system)
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      console.log('No saved theme, defaulting to light');
    }
  } catch (error) {
    // Fallback to light theme
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    console.log('Error in theme script, defaulting to light');
  }
})();`,
          }}
        />

        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0ea5e9" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yourapp.com" />
        <meta name="twitter:title" content="ERP System" />
        <meta name="twitter:description" content="Complete ERP solution for textile business" />
        <meta name="twitter:image" content="https://yourapp.com/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@yourhandle" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ERP System" />
        <meta property="og:description" content="Complete ERP solution for textile business" />
        <meta property="og:site_name" content="ERP System" />
        <meta property="og:url" content="https://yourapp.com" />
        <meta property="og:image" content="https://yourapp.com/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-300`} suppressHydrationWarning>
        <Providers>
          {children}
          <PWAManager />
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
