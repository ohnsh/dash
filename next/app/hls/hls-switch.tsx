'use client'

import { useSearchParams } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import type { Path, PathsList } from './dashd'
import css from './hls-switch.module.css'
import HlsVideo from './hls-video'

const pathMap = {
  wuuk: 'wuuk-patch',
  wyze1: 'wyze1-patch',
  desk: 'desk',
} as const

const defaultItems = [{ name: 'desk' }, { name: 'wuuk' }, { name: 'wyze1' }]

type StreamKey = keyof typeof pathMap

const isValidStream = (name: unknown): name is StreamKey =>
  typeof name === 'string' && Object.hasOwn(pathMap, name)

const cls = (...classes: Array<string | string[] | undefined>) =>
  classes.flat().filter(Boolean).join(' ')

export default function HlsSwitch({
  items = defaultItems,
  className,
  ...divProps
}: {
  items?: PathsList
} & ComponentPropsWithoutRef<'div'>) {
  const searchParams = useSearchParams()
  let stream = searchParams.get('stream')

  const filteredItems = items.filter(
    (item): item is Path & { name: StreamKey } => isValidStream(item.name),
  )

  if (!stream) {
    // default to first stream set to `online`
    stream = filteredItems.find((item) => item.online)?.name ?? null
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
                href={`/hls?stream=${name}`}
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
