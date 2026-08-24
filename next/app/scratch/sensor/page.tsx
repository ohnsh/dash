import { unstable_cache } from 'next/cache'
import css from './page.module.css'
import { SensorChartEffect, SensorChartPromise } from './sensor-chart'

const SENSOR_URL = 'https://d.ohn.sh/sensor'

const getSensorData = unstable_cache(
  (url: string) => fetch(url).then((r) => r.json()),
  undefined,
  { revalidate: 3600 }, // 60 min
)

export default function Page() {
  const mainUrl = new URL(SENSOR_URL)
  mainUrl.searchParams.set('loc', 'encore_main')

  const bedroomUrl = new URL(SENSOR_URL)
  bedroomUrl.searchParams.set('loc', 'encore_bedroom')

  return (
    <div className={css.container}>
      <h2>Fetched on Server (revalidate: 60 min)</h2>
      <section>
        <SensorChartPromise
          promise={getSensorData(mainUrl.href)}
          title="Apartment (main HomePod)"
        />
        <SensorChartPromise
          promise={getSensorData(bedroomUrl.href)}
          title="Apartment (bedroom HomePod)"
        />
      </section>

      {/* works but mostly a curiosity
      <SensorChartPromise url={mainUrl.href} title="Apartment (main HomePod)" />
      <SensorChartPromise
        url={bedroomUrl.href}
        title="Apartment (bedroom HomePod)"
      />
    */}

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
