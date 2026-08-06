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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={css.container}>
      <Header toggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <aside className={sidebarOpen ? css.sidebarOpen : ''}>{sidebar}</aside>
      <main>{children}</main>
      <footer>
        <FooterContent />
      </footer>
    </div>
  )
}
