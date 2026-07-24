'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import HlsVideo from './hls-video'

const streams = ['desk', 'wuuk', 'wyze1']

export default function HlsSwitch({
  ...divProps
}: {
  divProps?: ComponentPropsWithoutRef<'div'>
}) {
  const searchParams = useSearchParams()
  const stream = searchParams.get('stream') ?? 'desk'
  const streamUrl = `https://hls.ohn.sh/${stream}/index.m3u8`

  return (
    <div {...divProps}>
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
