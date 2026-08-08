import Link from 'next/link'
import { dbQuery } from '@/lib/turso'
import { r2PathToSlug, slugToTitle } from '@/lib/vod'

export default async function InventoryList() {
  // test fallback content
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  const rows = await dbQuery(`SELECT * FROM vod_index`)

  return (
    <ul>
      {rows.map(({ inventory_path }) => {
        const slug = r2PathToSlug(inventory_path)
        return (
          <li key={inventory_path}>
            <Link href={`/vod/${slug.join('/')}`}>{slugToTitle(slug)}</Link>
          </li>
        )
      })}
    </ul>
  )
}
