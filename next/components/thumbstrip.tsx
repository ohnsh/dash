'use client'

import { getSpeechTotal } from '@dash/vod/util'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { use, useEffect, useRef } from 'react'
import { type DashVideo, MIN_CONFIDENCE } from '@/lib/dash-video'
import type { InventoryRecord } from '@/lib/turso'
import {
  clientParamsToKey,
  dateInPathname,
  keyToShortKey,
  tsToString,
} from '@/lib/vod-new'
import { useInventory } from './inventory-provider'
import css from './thumbstrip.module.css'

export default function Thumbstrip({
  videosPromise,
  title,
  record,
  tail = false,
}: {
  videosPromise: Promise<DashVideo[]>
  title: string
  record: InventoryRecord
  tail?: boolean
}) {
  const videos = use(videosPromise)
  const stripRef = useRef<HTMLUListElement>(null)
  const { inventoryFilter } = useInventory()

  useEffect(() => {
    if (!stripRef.current) return
    const fallback = tail ? 'right' : undefined
    scrollSelected(stripRef.current, fallback)
  }, [tail])

  // hack to preserve client-side filtering
  if (inventoryFilter([record]).length === 0) {
    return null
  }

  return (
    <article className={css.thumbstrip}>
      <h3>{title}</h3>
      <ul ref={stripRef}>
        {videos.map((video) => {
          return <DashThumb video={video} key={video.name} />
        })}
      </ul>
    </article>
  )
}

export function DashThumb({ video }: { video: DashVideo }) {
  const v = useSearchParams().get('v')
  const pathname = usePathname()

  const fullKey = v ? clientParamsToKey(v, pathname) : undefined
  const isSelected = fullKey === video.key

  const { width, height } = video.meta_ffprobe
  const timestamp =
    video.timestamp &&
    tsToString(video.timestamp, {
      hour: 'numeric',
      minute: 'numeric',
    })
  const hrefKey = dateInPathname(pathname)
    ? keyToShortKey(video.key)
    : video.key

  const speechTotal = getSpeechTotal(video.voiceSegments, {
    minConfidence: MIN_CONFIDENCE,
  })

  return (
    <Link href={`?v=${hrefKey}`} aria-current={isSelected ? 'page' : undefined}>
      <Image
        alt=""
        width={width}
        height={height}
        src={video.thumb}
        unoptimized
      />
      {(timestamp || speechTotal > 0) && (
        <span>
          {speechTotal > 0 && '★'} {timestamp}
        </span>
      )}
    </Link>
  )
}

function scrollSelected(
  container: HTMLElement,
  fallback?: 'right' | 'left' | undefined,
) {
  if (!container) return
  const { scrollWidth, scrollLeft } = container
  const selectedItem = container.querySelector('[aria-current]')

  if (selectedItem) {
    const itemRect = selectedItem.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    // left edge of selected item relative to scroll container
    const leftRelative = itemRect.left - containerRect.left + scrollLeft
    // offset to place the item in the center of the scroll container
    const left = leftRelative - containerRect.width / 2 + itemRect.width / 2
    container.scroll({ left })
  } else if (fallback) {
    const left = fallback === 'right' ? scrollWidth : 0
    // this list does not contain the selected (playing) video
    // scroll all the way to the right, for the most recent thumbnails
    container.scroll({ left })
  }
}
