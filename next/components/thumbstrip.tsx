'use client'

import type { VODVideo } from 'dash-vod/schema'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { use, useEffect, useRef } from 'react'
import { invPathToComponents, thumbUrl, timeFromFilename } from '@/lib/vod-new'
import css from './thumbstrip.module.css'

export default function ThumbStrip({
  inventoryPromise,
  inventoryPath,
}: {
  inventoryPromise: Promise<VODVideo[]>
  inventoryPath: string
}) {
  const inventory = use(inventoryPromise)
  const searchParams = useSearchParams()
  const stripRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    const ul = stripRef.current
    if (!ul) return
    const selectedItem = ul.querySelector('[aria-current]')
    if (selectedItem) {
      const itemRect = selectedItem.getBoundingClientRect()
      const ulRect = ul.getBoundingClientRect()
      // left edge of selected item relative to scroll container
      const leftRelative = itemRect.left - ulRect.left + ul.scrollLeft
      // offset to place the item in the center of the scroll container
      const left = leftRelative - ulRect.width / 2 + itemRect.width / 2
      ul.scroll({ left })
    } else {
      // this list does not contain the selected (playing) video
      // scroll all the way to the right, for the most recent thumbnails
      ul.scroll({ left: ul.scrollWidth })
    }
  }, [])

  const { cam } = invPathToComponents(inventoryPath)
  const v = searchParams.get('v')

  return (
    <article className={css.thumbstrip}>
      <h3>{cam}</h3>
      <ul ref={stripRef}>
        {inventory.map((item) => {
          const timestamp = timeFromFilename(item.name)
          const v_href = `${cam}/${item.name}`
          return (
            <Thumbnail
              key={item.name}
              timestamp={timestamp}
              href={`?v=${v_href}`}
              src={thumbUrl(inventoryPath, item.assets[0])}
              isSelected={v === v_href}
              isPortrait={item.meta_ffprobe.isPortrait}
              width={item.meta_ffprobe.width}
              height={item.meta_ffprobe.height}
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
  timestamp,
  width,
  height,
  isSelected,
  isPortrait,
}: {
  href: string
  src: string
  timestamp?: string
  width?: number
  height?: number
  isSelected: boolean
  isPortrait: boolean
}) {
  return (
    <li className={isPortrait ? 'portrait' : 'landscape'}>
      <Link href={href} aria-current={isSelected ? 'page' : undefined}>
        <Image alt="" width={width} height={height} src={src} unoptimized />
        {timestamp && <span>{timestamp}</span>}
      </Link>
    </li>
  )
}
