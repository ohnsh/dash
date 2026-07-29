'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Meta } from '../schema'
import css from './playlist.module.css'
import { vodSlugToTitle, vodSlugToR2URL } from '../util'

export default function Playlist({
  slug,
  inventory,
}: {
  slug: string[]
  inventory: Meta[]
}) {
  const sParams = useSearchParams()
  const v = sParams.get('v')
  const url = vodSlugToR2URL(slug)

  const thumbUrl = (name: string) =>
    new URL(
      `${name}+meta/thumb.webp`,
      // `${name}+meta/${name.replace(/\.[^.]+$/, '.webp')}`,
      url,
    ).toString()

  const vidUrl = (name: string) => new URL(name, url).toString()

  return (
    <section className={css.container}>
      <h2>{vodSlugToTitle(slug)}</h2>
      <ul>
        {inventory.map((item) => (
          <li
            key={item.name}
            className={item.meta_ffprobe.isPortrait ? 'portrait' : 'landscape'}
          >
            <Link href={`?v=${item.name}`}>
              <img alt="" src={thumbUrl(item.name)} />
            </Link>
          </li>
        ))}
      </ul>
      {v && <video autoPlay controls playsInline src={vidUrl(v)} />}
    </section>
  )
}
