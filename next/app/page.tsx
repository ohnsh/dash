import { getSpeechTotal } from 'dash-vod/util'
import { desc, gte } from 'drizzle-orm'
import ThumbStrip from '@/components/thumbstrip'
import VODPlayer from '@/components/vod-player'
import { fetchInventory, invPathToData } from '@/lib/dash-video'
import { db, invs } from '@/lib/turso'
import { paramsToSrc } from '@/lib/vod-new'

// minimum speech duration for inventory to be included
const MIN_SPEECH_INV_S = 10
// minimum speech duration for individual video to be included
const MIN_SPEECH_S = 5
const NUM_INVS = 50

export default async function Home({ searchParams }: PageProps<'/'>) {
  let { v } = await searchParams
  if (Array.isArray(v)) {
    v = v[0]
  }

  const rows = await db
    .select()
    .from(invs)
    .where(gte(invs.speechTotal, MIN_SPEECH_INV_S))
    .limit(NUM_INVS)
    .orderBy(desc(invs.date))

  const { inventoryPath } = rows[0]
  const { cam } = invPathToData(inventoryPath)

  const speechVids = fetchInventory(inventoryPath).then((raw) =>
    raw.filter((v) => getSpeechTotal(v) >= MIN_SPEECH_S),
  )

  const currentVid = speechVids.then((vids) =>
    vids.find((vid) => vid.key === v),
  )
  // fallback: paramsToSrc(searchParams)

  return (
    <article>
      <VODPlayer videoPromise={currentVid} />
      <ThumbStrip videosPromise={speechVids} title={cam} tail />
    </article>
  )
}
