'use client'

import type { VoiceResult } from '@dash/vod/schema'
import { getSpeechTotal } from '@dash/vod/util'
import { use, useEffect, useRef, useState } from 'react'
import { type DashVideo, MIN_CONFIDENCE } from '@/lib/dash-video'
// import useCrop from '@/lib/use-crop'
import { tsToString } from '@/lib/vod-new'
// src from pathname and searchparams
// import { clientParamsToSrc } from '@/lib/vod-new'
import css from './vod-player.module.css'

export default function VODPlayer({
  src,
  videoPromise,
}: {
  src?: string
  videoPromise?: Promise<DashVideo | undefined>
}) {
  const dv = videoPromise && use(videoPromise)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  src ??= dv?.src
  // useCrop(src, videoRef)

  useEffect(() => {
    const $video = videoRef.current
    if (!$video || !src) return

    $video.src = src
    // $video.load()

    // generate text track from voice segment data
    // (equivalent to <track> pointing to a VTT file)
    if (!dv?.voiceSegments || !getSpeechTotal(dv.voiceSegments)) return

    const vtt = $video.addTextTrack('chapters', 'speech', 'en')
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

      for (const [i, { start, end }] of segments.entries()) {
        if ($video.currentTime < start) {
          nextStart = start
          break
        }
        if ($video.currentTime < end) {
          setActiveIndex(i)
          return
        }
      }
      setActiveIndex(undefined)
      // Experiment to automatically skip from one voice segment to the next.
      // This first-pass implementation is not really usable because it prevents
      // seeking/scrubbing and is just disorienting.
      // $video.currentTime = nextStart ? nextStart : $video.duration
    }
    $video.addEventListener('timeupdate', timeupdateHandler)

    return () => {
      // Works much better than using the key prop. (Tried adding key={src} to <video>
      // to unmount/remount it on src change, but still heard phantom audio from previous
      // sources.) Another option is to force a navigation using <a> instead of <Link>

      // if ($video.isConnected)
      $video.pause()
      $video.removeAttribute('src')
      $video.load()
      // there is no API to remove a text track once added.
      vtt.mode = 'disabled'

      $video.removeEventListener('timeupdate', timeupdateHandler)
    }
  }, [src, dv])

  const width = dv?.meta_ffprobe.width ?? 1920
  const height = dv?.meta_ffprobe.height ?? 1080

  return (
    <div className={css.container}>
      {/* wrapper to reserve space even when <video> isn't rendered */}
      <div className={css.player}>
        <span>Select a video</span>
        {src && (
          <video
            ref={videoRef}
            width={width}
            height={height}
            crossOrigin="anonymous"
            // autoPlay
            controls
            playsInline
          >
            <a href={src} download={dv?.name ?? 'video.mp4'}>
              Download MP4
            </a>
          </video>
        )}
      </div>
      <div className={css.vidFooter}>{dv && <Timestamp dashVideo={dv} />}</div>
      {dv?.voiceSegments && (
        <VoiceSegments
          voiceSegments={dv.voiceSegments}
          updatePosition={(pos: number) => {
            if (!videoRef.current) return

            videoRef.current.currentTime = pos
            videoRef.current.play()
          }}
          activeIndex={activeIndex}
        />
      )}
    </div>
  )
}

function Timestamp({ dashVideo: dv }: { dashVideo: DashVideo }) {
  const timestamp = dv.timestamp || dv.date
  let fmtTime: string

  try {
    fmtTime = tsToString(timestamp, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    })
  } catch {
    return null
  }

  return <div className={css.timestamp}>{fmtTime}</div>
}

function VoiceSegments({
  voiceSegments,
  updatePosition,
  activeIndex,
}: {
  voiceSegments: VoiceResult
  updatePosition: (pos: number) => void
  activeIndex?: number
}) {
  const { segments } = voiceSegments
  const speechTotal = getSpeechTotal(voiceSegments, {
    minConfidence: MIN_CONFIDENCE,
  })

  if (!speechTotal) return null

  return (
    <div className={css.segments}>
      <span
        title="Automatically detected voice activity"
        role="img"
        aria-label="Automatically detected voice activity"
      >
        ★
      </span>
      <ul>
        {segments.map((seg, i) => {
          // -1 can sneak into the data
          const start = Math.max(seg.start, 0)
          const sec = start % 60
          const min = Math.floor(start / 60) % 60
          const hour = Math.floor(start / 3600)

          const time = (hour > 0 ? [hour, min, sec] : [min, sec])
            .map((n) => String(n).padStart(2, '0'))
            .join(':')
            .replace(/^0/, '')

          return (
            <li
              key={start}
              className={i === activeIndex ? css.active : undefined}
            >
              <button type="button" onClick={() => updatePosition(start)}>
                {time}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
