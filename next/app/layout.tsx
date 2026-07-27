import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Footer from './footer.mdx'
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
  title: 'dash.ohn.sh',
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
          <h1>
            <a href="/">
              <code>d</code>
              <code>a</code>
              <code>s</code>
              <code>h</code>
            </a>
          </h1>
        </header>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/hls.js@latest"
          strategy="beforeInteractive"
        />
        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  )
}
