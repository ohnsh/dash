import Link from 'next/link'
import { BUCKET_URL, invPathToComponents, thumbUrl } from '@/lib/vod-new'
import { type Meta, MetaSchema } from '@/lib/vod-schema'
import css from './thumbstrip.module.css'

export default async function ThumbStrip({
  inventoryPath,
}: {
  inventoryPath: string
}) {
  const inventory: Meta[] = await fetch(new URL(inventoryPath, BUCKET_URL))
    .then((r) => r.json())
    .then((items) => items.map(MetaSchema.parse))

  const { cam } = invPathToComponents(inventoryPath)

  return (
    <article className={css.thumbstrip}>
      <h2>{inventoryPath}</h2>
      <ul>
        {inventory.map((item) => (
          <Thumbnail
            key={item.name}
            href={`?v=${cam}/${item.name}`}
            src={thumbUrl(inventoryPath, item.assets[0])}
            isPortrait={item.meta_ffprobe.isPortrait}
          />
        ))}
      </ul>
    </article>
  )
}

function Thumbnail({
  href,
  src,
  isPortrait,
}: {
  href: string
  src: string
  isPortrait: boolean
}) {
  return (
    <li className={isPortrait ? 'portrait' : 'landscape'}>
      <Link href={href}>
        <img alt="" src={src} />
      </Link>
    </li>
  )
}
