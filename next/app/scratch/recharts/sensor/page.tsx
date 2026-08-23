import SensorChart from './sensor-chart'

export default function Page() {
  return (
    <>
      <SensorChart location="encore_main" />
      <SensorChart location="encore_bedroom" />
    </>
  )
}
