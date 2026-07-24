'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import css from './hls-switch.module.css'
import HlsVideo from './hls-video'

const streams = ['desk', 'wuuk', 'wuuk-patch', 'wyze1', 'wyze1-patch']
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
        {streams.map((s) => (
          <li key={s}>
            <Link href={`/hls?stream=${s}`}>{s}</Link>
          </li>
        ))}
      </ul>
      <HlsVideo streamUrl={streamUrl} />
    </div>
  )
}
