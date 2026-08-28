import { getSpeechTotal } from '@dash/vod/util'
import { Suspense } from 'react'
import ThumbStrip, { ThumbStripFallback } from '@/components/thumbstrip'
import VODPlayer from '@/components/vod-player'
import {
  type DashVideo,
  fetchInventory,
  invPathToData,
  MIN_CONFIDENCE,
  fromKey,
} from '@/lib/dash-video'
import { getInventories } from '@/lib/query'
import type { InventoryRecord } from '@/lib/turso'
import { keyToFullKey, keyToSrc, tsToString } from '@/lib/vod-new'
import { PageNav } from './page-nav'

// minimum speech duration for inventory to be included
const MIN_SPEECH_INV_S = 10
// minimum speech duration for individual video to be included
const MIN_SPEECH_S = 5
const PAGE_SIZE = 5

export default async function VODView({
  searchParams,
  date,
  onlySpeech = false,
  headless = false,
}: {
  // TODO: get type right
  searchParams: Promise<{
    v?: string
    date?: string
    page?: string
    n?: string
  }>
  date?: string
  onlySpeech?: boolean
  headless?: boolean
}) {
  const rsp = await searchParams
  const { v } = rsp
  date ??= rsp.date
  const minSpeech = onlySpeech ? MIN_SPEECH_INV_S : undefined

  const page = Number.isInteger(Number(rsp.page)) ? Number(rsp.page) : 1
  const n = Number.isInteger(Number(rsp.n)) ? Number(rsp.n) : PAGE_SIZE

  const rows = await getInventories({
    minSpeech,
    date,
  })

  const showNav = !date && rows.length > n

  const speechFilter = (vids: DashVideo[]) =>
    vids.filter(
      (v) =>
        v.tags ||
        getSpeechTotal(v.voiceSegments, { minConfidence: MIN_CONFIDENCE }) >=
          MIN_SPEECH_S,
    )

  const offset = (page - 1) * n
  const activeRows = date ? rows : rows.slice(offset, offset + n)

  const inventories = activeRows.map((row) => ({
    ...row,
    videosPromise: fetchInventory(row.inventoryPath).then(
      onlySpeech ? speechFilter : (vids) => vids,
    ),
  }))

  const fullKey = v && keyToFullKey(v, date)
  const src = fullKey && keyToSrc(fullKey)

  let videoPromise: Promise<DashVideo | undefined> | undefined

  if (fullKey) {
    // videoPromise = new Promise((resolve, reject) => {
    //   setTimeout(reject, 3000)
    //   inventories.forEach((inv) => {
    //     inv.videosPromise.then((vids) => {
    //       const currentVid = vids.find(({ key }) => key === fullKey)
    //       if (currentVid) {
    //         resolve(currentVid)
    //       }
    //     })
    //   })
    // })

    // fix a severe bug by fetching the video directly, relying on next.js fetch
    // de-duplication to only create one network request (when the underlying
    // inventory.json is already fetched for the thumbnail strip)
    videoPromise = fromKey(fullKey)
  }

  return (
    <article className="flex flex-col">
      {fullKey ? (
        <Suspense fallback={<VODPlayer src={src} />}>
          <VODPlayer
            videoPromise={videoPromise?.catch(() => undefined)}
            src={src}
          />
        </Suspense>
      ) : (
        !headless && <VODPlayer />
      )}
      <section>
        {showNav && <PageNav />}
        <div>
          {inventories.map((inv) => (
            <Suspense key={inv.inventoryPath} fallback={<ThumbStripFallback />}>
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
        {showNav && inventories.length > 2 && <PageNav />}
      </section>
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
