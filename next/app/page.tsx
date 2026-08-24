import { getSpeechTotal } from '@dash/vod/util'
import { desc, gte } from 'drizzle-orm'
import { Suspense } from 'react'
import { SensorChartPromise } from '@/components/sensor-chart'
import VODView from '@/components/vod-view'
import { type DashVideo, MIN_CONFIDENCE } from '@/lib/dash-video'
import { getSensorData } from '@/lib/sensor'
import { db, invs } from '@/lib/turso'
import css from './charts.module.css'

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

  if (!v) {
    return (
      <div className={css.container}>
        <h2>Recharts Demo 📡</h2>
        <p>
          Using live data from my apartment (
          <a
            href="https://github.com/ohnsh/dash/blob/main/dashd/src/index.ts"
            target="_blank"
            rel="noopener"
          >
            view server source
          </a>
          ).
        </p>
        <section>
          <Suspense fallback={`Loading chart...`}>
            <SensorChartPromise
              promise={getSensorData('encore_main')}
              title="Apartment (main HomePod)"
            />
          </Suspense>
          <Suspense fallback={`Loading chart...`}>
            <SensorChartPromise
              promise={getSensorData('encore_bedroom')}
              title="Apartment (bedroom HomePod)"
            />
          </Suspense>
        </section>
        <h2>Clips with Speech</h2>
        <p>
          <a
            href="https://days.ohn.sh/2026/08/dash-vad/"
            target="_blank"
            rel="noopener"
          >
            Detected with Silero VAD.
          </a>
        </p>
        <VODView rows={rows} vKey={v} filter={filter} headless />
      </div>
    )
  }

  return <VODView rows={rows} vKey={v} filter={filter} />
}
