import { unstable_cache } from 'next/cache'

export const SENSOR_URL = 'https://d.ohn.sh/sensor'

export const sensorDataUrl = (loc: string) => {
  const url = new URL(SENSOR_URL)
  url.searchParams.set('loc', loc)
  url.searchParams.set('last', '96')
  return url.href
}

export const getSensorData = unstable_cache(
  (loc: string) =>
    fetch(sensorDataUrl(loc)).then<SensorResponse>((r) => r.json()),
  undefined,
  { revalidate: 3600 }, // 60 min
)

export interface DataPoint {
  timestamp: string
  temp_c: number
  humidity_rel: number
}

export interface SensorResponse {
  status: 'success' | 'error'
  result: DataPoint[]
}
