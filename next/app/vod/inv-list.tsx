import Link from 'next/link'
import { getRootList, invPathToSlug, vodSlugToTitle } from './util'

export default async function InventoryList() {
  const list = await getRootList()

  return (
    <ul>
      {list.map((i) => {
        console.log(i)
        const slug = invPathToSlug(i)
        return (
          <li key={i}>
            <Link href={`/vod/${slug}`}>{vodSlugToTitle(slug.split('/'))}</Link>
          </li>
        )
      })}
    </ul>
  )
}
