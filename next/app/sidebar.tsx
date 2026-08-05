import Link from 'next/link'
import { DASHD_BASE, type PathResponse } from './hls/dashd'
import { isValidStream } from './hls/util'
import css from './layout.module.css'
import Content from './sidebar.mdx'
import InventoryList from './vod/inv-list'

export default async function Sidebar() {
  const resp = await fetch(`${DASHD_BASE}/paths/list`)
  let streamMenu: React.ReactElement
  if (!resp.ok) {
    streamMenu = (
      <div>
        Error: {resp.status} {resp.statusText}
      </div>
    )
  } else {
    const { items } = (await resp.json()) as PathResponse
    if (!items || items.length === 0) {
      streamMenu = <div>No streams found</div>
    } else {
      streamMenu = (
        <ul>
          {items
            .filter((item) => isValidStream(item.name))
            .map((item) => (
              <li key={item.name}>
                <Link href={`/hls?stream=${item.name}`}>{item.name}</Link>
              </li>
            ))}
        </ul>
      )
    }
  }

  let vodMenu = (
    <ul>
      <li>VOD Menu</li>
    </ul>
  )

  return (
    <aside className={css.sidebar}>
      <Content />
      {streamMenu}
      <InventoryList />
    </aside>
  )
}
