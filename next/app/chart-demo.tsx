import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'
import ActionButton from '@/components/action-button'
import { SensorChartPromise } from '@/components/sensor-chart'
import { getSensorData } from '@/lib/sensor'
import css from './chart-demo.module.css'

export default async function ChartDemo() {
  return (
    <div className={css.container}>
      <div className={css.headerBar}>
        <h2>Recharts Demo 📡</h2>
        <ActionButton
          action={async () => {
            'use server'
            revalidatePath('/')
          }}
        >
          Revalidate
        </ActionButton>
      </div>
      <p>
        Using live data from my apartment (
        <a
          href="https://github.com/ohnsh/dash/blob/main/dashd/src/index.ts"
          target="_blank"
          rel="noopener"
        >
          server source
        </a>
        ).
      </p>
      <section>
        <Suspense fallback={`Loading chart...`}>
          <SensorChartPromise
            promise={getSensorData('encore_main')}
            title="Main HomePod"
          />
        </Suspense>
        <Suspense fallback={`Loading chart...`}>
          <SensorChartPromise
            promise={getSensorData('encore_bedroom')}
            title="Bedroom HomePod"
          />
        </Suspense>
      </section>
      <h2>Clips with Speech</h2>
      <p>
        ★ Denotes a clip with speech,{' '}
        <a
          href="https://days.ohn.sh/2026/08/dash-vad/"
          target="_blank"
          rel="noopener"
        >
          detected by Silero VAD.
        </a>
      </p>
    </div>
  )
}
