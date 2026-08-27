import { cacheLife } from 'next/cache'

export const SENSOR_URL = 'https://d.ohn.sh/sensor'

export const sensorDataUrl = (loc: string) => {
  const url = new URL(SENSOR_URL)
  url.searchParams.set('loc', loc)
  url.searchParams.set('last', '96')
  return url.href
}

export const getSensorData = async (loc: string) => {
  'use cache'
  cacheLife('minutes')

  return fetch(sensorDataUrl(loc)).then<SensorResponse>((r) => r.json())
}

export interface DataPoint {
  timestamp: string
  temp_c: number
  humidity_rel: number
}

export interface SensorResponse {
  status: 'success' | 'error'
  result: DataPoint[]
}
