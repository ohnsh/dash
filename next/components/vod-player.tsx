'use client'

import type { VoiceResult } from 'dash-vod/schema'
import { getSpeechTotal } from 'dash-vod/util'
import { use, useEffect, useRef } from 'react'
import type { DashVideo } from '@/lib/dash-video'
// src from pathname and searchparams
// import { clientParamsToSrc } from '@/lib/vod-new'
import css from './vod-player.module.css'

export default function VodPlayer({
  src,
  videoPromise,
}: {
  src?: string
  videoPromise?: Promise<DashVideo | undefined>
}) {
  const dv = videoPromise && use(videoPromise)
  const videoRef = useRef<HTMLVideoElement>(null)
  src ??= dv?.src

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    video.src = src
    // video.load()

    if (!dv?.voiceSegments || !getSpeechTotal(dv)) return

    const vtt = video.addTextTrack('chapters', 'speech', 'en')
    const { segments } = dv.voiceSegments
    const cues = segments.map(
      (seg) => new VTTCue(seg.start, seg.end, '[speech]'),
    )
    for (const cue of cues) {
      vtt.addCue(cue)
    }
    vtt.activeCues
    vtt.mode = 'showing'

    const timeupdateHandler = (_: Event) => {
      let nextStart: number | undefined
      for (const { start, end } of segments) {
        if (video.currentTime < start) {
          nextStart = start
          break
        }
        if (video.currentTime < end) {
          return
        }
      }
      video.currentTime = nextStart ? nextStart : video.duration
    }
    // too much
    // video.addEventListener('timeupdate', timeupdateHandler)

    return () => {
      // if (video.isConnected)
      video.pause()
      video.removeAttribute('src')
      video.load()
      // there is no API to remove a text track once added.
      vtt.mode = 'disabled'

      // video.removeEventListener('timeupdate', timeupdateHandler)
    }
  }, [src, dv])

  const width = dv?.meta_ffprobe.width ?? 1920
  const height = dv?.meta_ffprobe.height ?? 1080

  // adding key={src} to <video> to unmount/remount it on src change.
  // still hearing phantom audio from previous sources, however.
  // it may be best to force a navigation using <a> instead of <Link>
  // EDIT: the above effect works much better than using the key prop.
  return (
    <div className={css.container}>
      <span>VOD player babyyyyyy</span>
      {src && (
        <video
          ref={videoRef}
          width={width}
          height={height}
          crossOrigin="anonymous"
          autoPlay
          controls
          playsInline
        >
          <a href={src} download={dv?.name ?? 'video.mp4'}>
            Download MP4
          </a>
        </video>
      )}
      {dv?.voiceSegments && (
        <VoiceSegments
          voiceSegments={dv.voiceSegments}
          updatePosition={(pos: number) => {
            if (!videoRef.current) return

            videoRef.current.currentTime = pos
            videoRef.current.play()
          }}
        />
      )}
    </div>
  )
}

function VoiceSegments({
  voiceSegments,
  updatePosition,
}: {
  voiceSegments: VoiceResult
  updatePosition: (pos: number) => void
}) {
  const { segments } = voiceSegments

  return (
    <ul className={css.segments}>
      {segments.map((seg) => {
        const sec = seg.start % 60
        const min = Math.floor(seg.start / 60) % 60
        const hour = Math.floor(seg.start / 3600)

        const time = (hour > 0 ? [hour, min, sec] : [min, sec])
          .map((n) => String(n).padStart(2, '0'))
          .join(':')
          .replace(/^0/, '')

        return (
          <li key={seg.start}>
            <button type="button" onClick={() => updatePosition(seg.start)}>
              {time}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
