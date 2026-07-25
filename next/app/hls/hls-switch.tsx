'use client'

import { useSearchParams } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import css from './hls-switch.module.css'
import HlsVideo from './hls-video'

const streams = [
  { name: 'desk', path: 'desk' },
  { name: 'wuuk', path: 'wuuk-patch' },
  { name: 'wyze1', path: 'wyze1-patch' },
]
const cls = (...classes: Array<string | string[] | undefined>) =>
  classes.flat().filter(Boolean).join(' ')

export default function HlsSwitch({
  className,
  ...divProps
}: {
  className?: string
  divProps?: ComponentPropsWithoutRef<'div'>
}) {
  const searchParams = useSearchParams()
  const stream = searchParams.get('stream') ?? 'desk'
  const streamUrl = `https://hls.ohn.sh/${stream}/index.m3u8`

  return (
    <div className={cls(className, css.container)} {...divProps}>
      <ul>
        {streams.map(({ name, path }) => (
          <li key={name}>
            <a
              href={`/hls?stream=${path}`}
              aria-current={path === stream ? 'page' : undefined}
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
      <HlsVideo streamUrl={streamUrl} />
    </div>
  )
}
