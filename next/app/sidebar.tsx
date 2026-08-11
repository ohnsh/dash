'use client'

import React from 'react'
import InventoryList from '@/components/inventory-list'
import { useSidebarState } from '@/components/sidebar-state-provider'
import StreamMenu from '@/components/stream-menu'
import FooterContent from './footer.mdx'
import css from './sidebar.module.css'

export default function Sidebar() {
  const { isOpen } = useSidebarState()

  return (
    <aside className={`${css.sidebar} ${isOpen ? css.sidebarOpen : ''}`}>
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

export function SidebarBackdrop() {
  const { isOpen, close } = useSidebarState()

  return (
    isOpen && (
      <button
        type="button"
        className={css.backdrop}
        onClick={close}
        aria-label="Close menu"
      ></button>
    )
  )
}
