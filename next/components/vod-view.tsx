import { Suspense } from 'react'
import ThumbStrip from '@/components/thumbstrip'
import VODPlayer from '@/components/vod-player'
import { type DashVideo, fetchInventory, invPathToData } from '@/lib/dash-video'
import type { InventoryRecord } from '@/lib/turso'
import { keyToFullKey, keyToSrc, tsToString } from '@/lib/vod-new'

export default async function VODView({
  rows,
  vKey,
  filter,
  date,
}: {
  rows: InventoryRecord[]
  vKey: string | undefined
  filter?: (vids: DashVideo[]) => DashVideo[]
  date?: string
}) {
  const inventories = rows.map((row) => ({
    ...row,
    videosPromise: fetchInventory(row.inventoryPath).then(
      filter ? filter : (vids) => vids,
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
        <VODPlayer />
      )}
      <div>
        {inventories.map((inv) => (
          <ThumbStrip
            key={inv.inventoryPath}
            // including the record is a hack to preserve client-side filtering.
            record={inv}
            videosPromise={inv.videosPromise}
            title={getTitle(inv)}
            tail
          />
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
