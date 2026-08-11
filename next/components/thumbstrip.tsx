import Link from 'next/link'
import { BUCKET_URL, invPathToComponents, thumbUrl } from '@/lib/vod-new'
import { type Meta, MetaSchema } from '@/lib/vod-schema'
import css from './thumbstrip.module.css'

export default async function ThumbStrip({
  inventoryPath,
  v,
}: {
  inventoryPath: string
  v?: string
}) {
  const inventory: Meta[] = await fetch(new URL(inventoryPath, BUCKET_URL))
    .then((r) => r.json())
    .then((items) => items.map(MetaSchema.parse))

  const { cam } = invPathToComponents(inventoryPath)

  return (
    <article className={css.thumbstrip}>
      <h2>{cam}</h2>
      <ul>
        {inventory.map((item) => {
          const v_href = `${cam}/${item.name}`
          return (
            <Thumbnail
              key={item.name}
              href={`?v=${v_href}`}
              src={thumbUrl(inventoryPath, item.assets[0])}
              isSelected={v === v_href}
              isPortrait={item.meta_ffprobe.isPortrait}
            />
          )
        })}
      </ul>
    </article>
  )
}

function Thumbnail({
  href,
  src,
  isSelected,
  isPortrait,
}: {
  href: string
  src: string
  isSelected: boolean
  isPortrait: boolean
}) {
  return (
    <li className={isPortrait ? 'portrait' : 'landscape'}>
      <Link href={href} aria-current={isSelected ? 'page' : undefined}>
        <img alt="" src={src} />
      </Link>
    </li>
  )
}
