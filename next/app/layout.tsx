import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import css from './layout.module.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Dash',
  description: '',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* No need to keep this, but for the CDN experiment it's essential
      for it to be above the client-side navigation boundary. */}
      <body className={`${css.body}`}>
        <header>
          <h1 className="text-2xl font-bold">
            <a href="/">Dash</a>
          </h1>
        </header>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/hls.js@latest"
          strategy="beforeInteractive"
        />
        <footer>j@ohn.sh</footer>
      </body>
    </html>
  )
}
