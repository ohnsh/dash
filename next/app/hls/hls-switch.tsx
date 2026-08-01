'use client'

import { useSearchParams } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import type { PathsList } from './dashd'
import css from './hls-switch.module.css'
import HlsVideo from './hls-video'

const pathMap = new Map<string, string>([
  ['wuuk-patch', 'wuuk'],
  ['wyze1-patch', 'wyze1'],
])

const defaultItems = [
  { name: 'desk' },
  { name: 'wuuk-patch' },
  { name: 'wyze1-patch' },
]

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
  const stream = searchParams.get('stream') ?? 'desk'
  const streamUrl = `https://hls.ohn.sh/${stream}/index.m3u8`

  console.log(items)

  const filteredItems = items.filter((item) => Boolean(item.name))

  return (
    <div className={cls(className, css.container)} {...divProps}>
      <ul>
        {filteredItems.map((item) => {
          const path = item.name!
          const name = pathMap.get(path) ?? path
          return (
            <li key={path}>
              <a
                href={`/hls?stream=${path}`}
                aria-current={path === stream ? 'page' : undefined}
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
