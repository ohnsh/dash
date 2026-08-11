'use client'

import React from 'react'
import InventoryList from '@/components/inventory-list'
import StreamMenu from '@/components/stream-menu'
import FooterContent from './footer.mdx'
import layoutCss from './layout.module.css'
import css from './sidebar.module.css'

export default function Sidebar({
  isSidebarOpen,
  toggleSidebar,
}: {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}) {
  return (
    <aside
      className={`${css.sidebar} ${isSidebarOpen ? layoutCss.sidebarOpen : ''}`}
    >
      <nav>
        <h2>Live Streams</h2>
        <React.Suspense fallback={<div>loading stream menu...</div>}>
          <StreamMenu />
        </React.Suspense>

        <h2>Archive</h2>
        <React.Suspense fallback={<div>loading VOD inventory...</div>}>
          <InventoryList />
        </React.Suspense>
      </nav>
      <footer>
        <FooterContent />
      </footer>
    </aside>
  )
}
