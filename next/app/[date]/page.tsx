// import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { db, invs } from '@/lib/turso'
import { eq } from 'drizzle-orm'
import VODPlayer from '@/components/vod-player'
import ThumbStrip from '@/components/thumbstrip'
import { DashVideo, fetchInventory, invPathToData } from '@/lib/dash-video'
import {
  keyToFullKey,
  keyToSrc,
  paramsToKey,
  paramsToSrc,
  timestampFromFilename,
  tsToString,
} from '@/lib/vod-new'
import { Suspense } from 'react'

// this can be optimized, especially for days that are over
// const getInventories = unstable_cache(
//   ['inventories'],
//   { revalidate: false },
const getInventories = async (date: string) =>
  db.select().from(invs).where(eq(invs.date, date))

const validateDate = (date: string) => /\d{4}-\d{2}-\d{2}/.test(date)

export default async function Vod({
  params,
  searchParams,
}: PageProps<'/[date]'>) {
  const { date } = await params
  let { v } = await searchParams
  if (Array.isArray(v)) v = v[0]

  const fullKey = v && keyToFullKey(v, date)
  const filename = v && v.split('/').at(-1)
  const src = fullKey && keyToSrc(fullKey)

  if (!validateDate(date)) {
    notFound()
  }

  const rows = await getInventories(date)
  if (rows.length === 0) {
    notFound()
  }

  const timestamp = (filename && timestampFromFilename(filename)) || date
  let fmtTime: string
  try {
    fmtTime = tsToString(timestamp, undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    })
  } catch {
    fmtTime = '[invalid date]'
  }

  const inventories = rows.map((row) => ({
    ...row,
    videosPromise: fetchInventory(row.inventoryPath),
  }))

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
    inventories.forEach((inv) =>
      inv.videosPromise.then((vids) => {
        const currentVid = vids.find(({ key }) => key === fullKey)
        if (currentVid) {
          resolveVideo(currentVid)
        }
      }),
    )
  }

  return (
    <article className="flex flex-col h-full">
      {fullKey ? (
        <Suspense fallback={<VODPlayer src={src} />}>
          <VODPlayer videoPromise={videoPromise} />
        </Suspense>
      ) : (
        <VODPlayer />
      )}
      <h2>{fmtTime}</h2>
      <div className="basis-[170px] grow shrink-0 min-h-0">
        {inventories.map((inv) => (
          <ThumbStrip
            key={inv.inventoryPath}
            videosPromise={inv.videosPromise}
            title={invPathToData(inv.inventoryPath).cam}
            tail
          />
        ))}
      </div>
    </article>
  )
}
