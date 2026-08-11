import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import SidebarStateProvider from '@/components/sidebar-state-provider'
import Header from './header'
import InventoryContainer from './inventory-container'
import css from './layout.module.css'
import Sidebar, { SidebarBackdrop } from './sidebar'

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
      <body className={css.body}>
        <InventoryContainer>
          <SidebarStateProvider>
            <div className={css.container}>
              <Header />
              <SidebarBackdrop />
              <Sidebar />
              <main>{children}</main>
            </div>
          </SidebarStateProvider>
        </InventoryContainer>
      </body>
    </html>
  )
}
