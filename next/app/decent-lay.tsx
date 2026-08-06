'use client'

import { useState } from 'react'
import FooterContent from './footer.mdx'
import Header from './header'
import css from './layout.module.css'

export default function DecentLay({
  sidebar,
  children,
}: {
  sidebar: React.ReactElement
  children: React.ReactNode
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={css.container}>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      {isSidebarOpen && (
        <button
          type="button"
          className={css.backdrop}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        ></button>
      )}
      <aside className={isSidebarOpen ? css.sidebarOpen : ''}>{sidebar}</aside>
      <main>{children}</main>
      <footer>
        <FooterContent />
      </footer>
    </div>
  )
}
