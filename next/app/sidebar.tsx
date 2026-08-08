import React from 'react'
import InventoryList from '@/components/inventory-list'
import StreamMenu from '@/components/stream-menu'
import css from './sidebar.module.css'

export default function Sidebar() {
  return (
    <nav className={css.sidebar}>
      <h2>Live Streams</h2>
      <React.Suspense fallback={<div>loading stream menu...</div>}>
        <StreamMenu />
      </React.Suspense>

      <h2>VOD playlists</h2>
      <React.Suspense fallback={<div>loading VOD inventory...</div>}>
        <InventoryList />
      </React.Suspense>
    </nav>
  )
}
