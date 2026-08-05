import Link from 'next/link'
import React from 'react'
import { DASHD_BASE, type Path, type PathResponse } from './hls/dashd'
import { isValidStream } from './hls/util'
import css from './layout.module.css'
import InventoryList from './vod/inv-list'

export default function Sidebar() {
  return (
    <aside className={css.sidebar}>
      <nav>
        <h2>Live Streams</h2>
        <React.Suspense fallback={<div>loading stream menu...</div>}>
          <StreamMenu />
        </React.Suspense>

        <h2>VOD playlists</h2>
        <React.Suspense fallback={<div>loading VOD inventory...</div>}>
          <InventoryList />
        </React.Suspense>
      </nav>
    </aside>
  )
}

async function StreamMenu() {
  // test fallback content
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  const resp = await fetch(`${DASHD_BASE}/paths/list`)
  if (!resp.ok) {
    return (
      <div>
        Error: {resp.status} {resp.statusText}
      </div>
    )
  }

  const { items } = (await resp.json()) as PathResponse
  if (!items || items.length === 0) {
    return <div>No streams found</div>
  }

  return (
    <menu>
      {items
        .filter((item) => isValidStream(item.name))
        .map((item) => (
          <StreamMenuItem key={item.name} item={item} />
        ))}
    </menu>
  )
}

function StreamMenuItem({ item }: { item: Path }) {
  // classes `text-online` and `text-offline` made available through tailwind @theme
  // config.
  const indicator = (
    <span
      className={item.online ? 'text-online' : 'text-offline'}
      title={item.online ? 'Available' : 'Not available'}
    >
      ⚫︎
    </span>
  )

  return (
    <li>
      <Link href={`/hls?stream=${item.name}`}>{item.name}</Link> {indicator}
    </li>
  )
}
