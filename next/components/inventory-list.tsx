import Link from 'next/link'
import { dbQuery } from '@/lib/turso'
import { r2PathToSlug, slugToTitle } from '@/lib/vod'

export default async function InventoryList() {
  // test fallback content
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  const rows = await dbQuery(`
    SELECT inventory_path, date
    FROM vod_index
    ORDER BY date DESC
    LIMIT 100
  `)

  const collated = rows.reduce<Record<string, string[]>>((prev, current) => {
    prev[current.date] ??= []
    prev[current.date].push(current.inventory_path)
    return prev
  }, {})

  return (
    <ul>
      {Object.entries(collated).map(([date, paths]) => (
        <li key={date}>
          <DayMenu date={date} inventories={paths} />
        </li>
      ))}
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
  return (
    <details>
      <summary>
        <Link href={date.replaceAll(/-/g, '/')}>{date}</Link>
      </summary>
      <ul>
        {inventories.map((inventory) => (
          <InventoryItem key={inventory} inventory={inventory} />
        ))}
      </ul>
    </details>
  )
}

function InventoryItem({ inventory }: { inventory: string }) {
  const slug = r2PathToSlug(inventory)
  return (
    <li>
      <Link href={`/${slug.join('/')}`}>{slugToTitle(slug)}</Link>
    </li>
  )
}
