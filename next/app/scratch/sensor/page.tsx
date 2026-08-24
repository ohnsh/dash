import { Suspense } from 'react'
import {
  SensorChartEffect,
  SensorChartPromise,
} from '@/components/sensor-chart'
import { getSensorData, sensorDataUrl } from '@/lib/sensor'
import css from './page.module.css'

export default function Page() {
  return (
    <div className={css.container}>
      <h2>Fetched on Server (revalidate: 60 min)</h2>
      <section>
        <SensorChartPromise
          promise={getSensorData('encore_main')}
          title="Apartment (main HomePod)"
        />
        <SensorChartPromise
          promise={getSensorData('encore_bedroom')}
          title="Apartment (bedroom HomePod)"
        />
      </section>

      {/* works but mostly a curiosity */}
      <section>
        <Suspense fallback={`Loading...`}>
          <SensorChartPromise
            url={sensorDataUrl('encore_main')}
            title="Apartment (main HomePod)"
          />
        </Suspense>
        <Suspense fallback={`Loading...`}>
          <SensorChartPromise
            url={sensorDataUrl('encore_bedroom')}
            title="Apartment (bedroom HomePod)"
          />
        </Suspense>
      </section>

      <h2>Fetched on Client</h2>
      <section>
        <SensorChartEffect
          location="encore_main"
          title="Apartment (main HomePod)"
        />
        <SensorChartEffect
          location="encore_bedroom"
          title="Apartment (bedroom HomePod)"
        />
      </section>
    </div>
  )
}
