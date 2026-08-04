import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Sidebar from './sidebar'
import './globals.css'
import FooterContent from './footer.mdx'
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
      <body className={`${css.body}`}>
        <header>
          <h1>
            <a href="/">
              <code>dash</code>
            </a>
          </h1>
        </header>
        <div className={css.torso}>
          <Sidebar />
          <main>{children}</main>
        </div>
        <footer>
          <FooterContent />
        </footer>
      </body>
    </html>
  )
}
