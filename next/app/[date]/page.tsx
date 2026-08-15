// import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { db, invs } from '@/lib/turso'
import { eq } from 'drizzle-orm'
import VodPlayer from '@/components/vod-player'
import ThumbStrip from '@/components/thumbstrip'
import { fetchInventory, invPathToData } from '@/lib/dash-video'
import { paramsToSrc, timestampFromFilename, tsToString } from '@/lib/vod-new'

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
  const sp = await searchParams
  const v = Array.isArray(sp.v) ? sp.v[0] : sp.v

  if (!validateDate(date)) {
    notFound()
  }

  const rows = await getInventories(date)
  if (rows.length === 0) {
    notFound()
  }

  const filename = v && v.split('/').at(-1)
  const src = await paramsToSrc(searchParams, params)
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

  return (
    <div>
      <VodPlayer src={src} />
      <h2>{fmtTime}</h2>
      {rows.map((row) => (
        <ThumbStrip
          key={row.inventoryPath}
          videosPromise={fetchInventory(row.inventoryPath)}
          title={invPathToData(row.inventoryPath).cam}
        />
      ))}
    </div>
  )
}
