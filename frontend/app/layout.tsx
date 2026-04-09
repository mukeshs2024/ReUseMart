import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { AuthProvider } from '@/components/layout/AuthProvider'

export const metadata: Metadata = {
  title: {
    default: 'ReUse Mart — Buy & Sell Smarter',
    template: '%s | ReUse Mart',
  },
  description:
    'ReUse Mart is the smarter marketplace for buying and selling everyday items. Discover value, sell effortlessly.',
  keywords: ['marketplace', 'buy', 'sell', 'second-hand', 'reusemart'],
  openGraph: {
    title: 'ReUse Mart — Buy & Sell Smarter',
    description: 'Discover value. Live better.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme — runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = JSON.parse(localStorage.getItem('reusemart-theme') || '{}');
                if (s.state?.theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider />
        <ThemeProvider />
        <Navbar />
        <main className="min-h-screen pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
