'use client'

import Link from 'next/link'
import { useState } from 'react'
import { tsToString } from '@/lib/vod-new'
// import { r2PathToRoute } from '@/lib/vod'
import { useInventory } from './inventory-provider'
import { useSidebarState } from './sidebar-state-provider'

export default function InventoryList({ numShown = 8 }: { numShown?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { inventoryMap } = useInventory()
  const { close: closeSidebar } = useSidebarState()

  if (!inventoryMap) return null

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }
  const dates = Object.entries(inventoryMap)
    .filter(([, paths]) => (paths?.length ?? 0) > 0)
    .map(([date]) => date)
  const visibleDates = isExpanded ? dates : dates.slice(0, numShown)

  return (
    <section>
      <ul>
        {visibleDates.map((date) => (
          <li key={date}>
            <Link href={`/${date}`} onClick={closeSidebar}>
              {tsToString(date, { month: 'short', day: 'numeric' })}
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" onClick={toggleExpanded}>
        {isExpanded ? 'See less' : 'See more'}
      </button>
    </section>
  )
}

/*
  return (
    <details>
      <summary>
        <Link href={`/${date}`}>{date}</Link>
      </summary>
      <ul>
        {inventories.map((inventory) => (
          <InventoryItem key={inventory} inventory={inventory} />
        ))}
      </ul>
    </details>
  )
*/
