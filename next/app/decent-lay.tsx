'use client'

import { useState } from 'react'
import Header from './header'
import css from './layout.module.css'
import Sidebar from './sidebar'

export default function DecentLay({ children }: { children: React.ReactNode }) {
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
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <main>{children}</main>
    </div>
  )
}
