export interface DataPoint {
  timestamp: string
  temp_c: number
  humidity_rel: number
}

export interface SensorResponse {
  status: 'success'
  result: DataPoint[]
}
