'use client'

import Link from 'next/link'
import { useState } from 'react'
import { DASHD_BASE, type Path, type PathResponse } from '@/app/live/dashd'
import { isValidStream } from '@/app/live/util'
import { StatusIndicator } from '@/components/status-indicator'
import { useSidebarState } from './sidebar-state-provider'

let promise: Promise<void>

export default function StreamMenu() {
  // test fallback content
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  const [data, setData] = useState(null)
  const [error, setError] = useState<string | null>(null)

  if (!data && !promise && typeof window !== 'undefined') {
    promise = fetch(`${DASHD_BASE}/paths/list`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((j) => {
        setData(j)
      })
      .catch((err) => setError(JSON.stringify(err)))
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!data) {
    return <div>Loading...</div>
  }

  const { items } = data as PathResponse
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
  const { close: closeSidebar } = useSidebarState()

  return (
    <li>
      <Link href={`/live?stream=${item.name}`} onClick={closeSidebar}>
        {item.name}
      </Link>{' '}
      <StatusIndicator online={item.online ?? false} size="small" />
    </li>
  )
}
