import { getSpeechTotal } from '@dash/vod/util'
import { desc, gte } from 'drizzle-orm'
import VODView from '@/components/vod-view'
import { type DashVideo, MIN_CONFIDENCE } from '@/lib/dash-video'
import { db, invs } from '@/lib/turso'

// minimum speech duration for inventory to be included
const MIN_SPEECH_INV_S = 10
// minimum speech duration for individual video to be included
const MIN_SPEECH_S = 5
const NUM_INVS = 10

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

  const filter = (vids: DashVideo[]) =>
    vids.filter(
      (v) =>
        v.tags ||
        getSpeechTotal(v.voiceSegments, { minConfidence: MIN_CONFIDENCE }) >=
          MIN_SPEECH_S,
    )

  return <VODView rows={rows} vKey={v} filter={filter} />
}
