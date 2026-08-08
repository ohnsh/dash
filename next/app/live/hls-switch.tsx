'use client'

import { useSearchParams } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import type { Path } from './dashd'
import css from './hls-switch.module.css'
import HlsVideo from './hls-video'
import { pathMap, type StreamKey, isValidStream, cls } from './util'

const defaultItems = [{ name: 'desk' }, { name: 'wuuk' }, { name: 'wyze1' }]

export default function HlsSwitch({
  items = defaultItems,
  className,
  ...divProps
}: {
  items?: Path[]
} & ComponentPropsWithoutRef<'div'>) {
  const searchParams = useSearchParams()
  let stream = searchParams.get('stream')

  const filteredItems = items.filter(
    (item): item is Path & { name: StreamKey; online: true } =>
      isValidStream(item.name) && !!item.online,
  )

  if (!stream) {
    // default to first stream set to `online`
    stream = filteredItems[0]?.name
  }

  if (!stream || !isValidStream(stream)) {
    return (
      <div className={cls(className, css.container)} {...divProps}>
        {!stream ? 'No streams available.' : `Invalid stream ${stream}`}
      </div>
    )
  }

  const streamUrl = `https://hls.ohn.sh/${pathMap[stream]}/index.m3u8`

  return (
    <div className={cls(className, css.container)} {...divProps}>
      <ul>
        {filteredItems.map((item) => {
          const { name } = item
          return (
            <li key={name}>
              <a
                href={`/live?stream=${name}`}
                aria-current={name === stream ? 'page' : undefined}
              >
                {name}
              </a>
            </li>
          )
        })}
      </ul>
      <HlsVideo streamUrl={streamUrl} />
    </div>
  )
}
