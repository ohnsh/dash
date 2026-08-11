'use client'

import Link from 'next/link'
// import { r2PathToRoute } from '@/lib/vod'
import { useInventory } from './inventory-provider'
import { useSidebarState } from './sidebar-state-provider'

export default function InventoryList() {
  const { inventoryMap } = useInventory()

  if (!inventoryMap) return null

  return (
    <ul>
      {Object.entries(inventoryMap).map(
        ([date, paths]) =>
          paths && (
            <li key={date}>
              <DayMenu date={date} inventories={paths} />
            </li>
          ),
      )}
    </ul>
  )
}

function DayMenu({
  date,
  inventories,
}: {
  date: string
  inventories: string[]
}) {
  const { close: closeSidebar } = useSidebarState()

  return (
    <Link href={`/${date}`} onClick={closeSidebar}>
      {date}
    </Link>
  )
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
}

// function InventoryItem({ inventory }: { inventory: string }) {
//   const route = r2PathToRoute(inventory)
//   const cam = route.split('/').at(-1)
//   return (
//     <li>
//       <Link href={route}>{cam}</Link>
//     </li>
//   )
// }
