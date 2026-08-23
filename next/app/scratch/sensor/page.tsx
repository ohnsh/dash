import css from './page.module.css'
import SensorChart from './sensor-chart'

export default function Page() {
  return (
    <div className={css.container}>
      <SensorChart location="encore_main" title="Apartment (main HomePod)" />
      <SensorChart
        location="encore_bedroom"
        title="Apartment (bedroom HomePod)"
      />
    </div>
  )
}
