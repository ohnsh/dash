'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { use, useEffect, useRef } from 'react'
import type { DashVideo } from '@/lib/dash-video'
import { tsToTimeString } from '@/lib/vod-new'
import css from './thumbstrip.module.css'

export default function Thumbstrip({
  videosPromise,
  title,
  tail = false,
}: {
  videosPromise: Promise<DashVideo[]>
  title: string
  tail?: boolean
}) {
  const videos = use(videosPromise)
  const stripRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!stripRef.current) return
    const fallback = tail ? 'right' : undefined
    scrollSelected(stripRef.current, fallback)
  }, [tail])

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
  const isSelected = v === video.key
  const { width, height } = video.meta_ffprobe
  const timestamp =
    video.timestamp &&
    tsToTimeString(video.timestamp, undefined, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })

  return (
    <Link
      href={`?v=${video.key}`}
      aria-current={isSelected ? 'page' : undefined}
    >
      <Image
        alt=""
        width={width}
        height={height}
        src={video.thumb}
        unoptimized
      />
      {timestamp && <span>{timestamp}</span>}
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
