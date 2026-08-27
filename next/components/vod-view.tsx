import { getSpeechTotal } from '@dash/vod/util'
import { Suspense } from 'react'
import ThumbStrip from '@/components/thumbstrip'
import VODPlayer from '@/components/vod-player'
import {
  type DashVideo,
  fetchInventory,
  invPathToData,
  MIN_CONFIDENCE,
} from '@/lib/dash-video'
import { getInventories } from '@/lib/query'
import type { InventoryRecord } from '@/lib/turso'
import { keyToFullKey, keyToSrc, tsToString } from '@/lib/vod-new'

// minimum speech duration for inventory to be included
const MIN_SPEECH_INV_S = 10
// minimum speech duration for individual video to be included
const MIN_SPEECH_S = 5

export default async function VODView({
  vKey,
  date,
  onlySpeech = false,
  headless = false,
}: {
  vKey: string | undefined
  date?: string
  onlySpeech?: boolean
  headless?: boolean
}) {
  const rows = await getInventories({
    minSpeech: onlySpeech ? MIN_SPEECH_INV_S : undefined,
    date,
  })
  const speechFilter = (vids: DashVideo[]) =>
    vids.filter(
      (v) =>
        v.tags ||
        getSpeechTotal(v.voiceSegments, { minConfidence: MIN_CONFIDENCE }) >=
          MIN_SPEECH_S,
    )
  const inventories = rows.map((row) => ({
    ...row,
    videosPromise: fetchInventory(row.inventoryPath).then(
      onlySpeech ? speechFilter : (vids) => vids,
    ),
  }))

  const fullKey = vKey && keyToFullKey(vKey, date)
  const src = fullKey && keyToSrc(fullKey)

  // VODPlayer will get a promise that resolves to the currently playing DashVideo object.
  // This is pretty fragile; we should probably fetch the exact inventory to which the
  // video belongs, relying on Next.js fetch de-duplication to use the same network
  // request as the corresponding ThumbStrip
  let videoPromise: Promise<DashVideo> | undefined

  if (fullKey) {
    let resolveVideo: (value: DashVideo) => void
    videoPromise = new Promise((resolve) => {
      resolveVideo = resolve
    })
    inventories.forEach((inv) => {
      inv.videosPromise.then((vids) => {
        const currentVid = vids.find(({ key }) => key === fullKey)
        if (currentVid) {
          resolveVideo(currentVid)
        }
      })
    })
  }

  return (
    <article className="flex flex-col">
      {fullKey ? (
        <Suspense fallback={<VODPlayer src={src} />}>
          <VODPlayer videoPromise={videoPromise} />
        </Suspense>
      ) : (
        !headless && <VODPlayer />
      )}
      <div>
        {inventories.map((inv) => (
          <Suspense key={inv.inventoryPath} fallback={`Loading ...`}>
            <ThumbStrip
              // including the record is a hack to preserve client-side filtering.
              record={inv}
              videosPromise={inv.videosPromise}
              title={getTitle(inv)}
              tail
            />
          </Suspense>
        ))}
      </div>
    </article>
  )
}

const getTitle = (inv: InventoryRecord) => {
  const { cam, date } = invPathToData(inv.inventoryPath)
  const fmtDate = tsToString(date, {
    month: 'short',
    day: 'numeric',
  })
  return `${cam} / ${fmtDate}`
}
