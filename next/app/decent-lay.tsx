'use client'

import { useState } from 'react'
import FooterContent from './footer.mdx'
import css from './layout.module.css'
import Sidebar from './sidebar'

export default function DecentLay({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={css.container}>
      <header>
        <h1>
          <a href="/">
            <code>dash</code>
          </a>
        </h1>
      </header>
      <Sidebar />
      <main>{children}</main>
      <footer>
        <FooterContent />
      </footer>
    </div>
  )
}
