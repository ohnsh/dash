'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DataPoint {
  timestamp: string
  temp_c: number
  humidity_rel: number
}

const ctof = (c: number) => Number((32 + (c * 9) / 5).toFixed(1))

export default function SensorChart({
  location,
  title,
}: {
  location?: string
  title?: string
}) {
  const [data, setData] = useState<DataPoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = new URL('https://d.ohn.sh/sensor')
    if (location) {
      url.searchParams.set('loc', location)
    }

    const controller = new AbortController()
    const { signal } = controller

    fetch(url, { signal })
      .then((r) => r.json())
      .then((result) => {
        if (result.status === 'error') {
          setError(result.error)
        } else {
          setData(result.result)
        }
      })
      .catch((err) => {
        // explicit abort is not an error
        if (err?.name === 'AbortError') {
          return
        }
        throw err
      })

    return () => {
      controller.abort()
    }
  }, [location])

  const txData = useMemo(() => {
    if (!data) {
      return []
    }
    return data.map((point) => ({ ...point, temp_f: ctof(point.temp_c) }))
  }, [data])

  if (error) {
    return `Error: ${error}`
  }

  if (!data) {
    return 'Loading...'
  }

  return (
    <div>
      {title && <h3>{title}</h3>}
      <LineChart
        style={{ width: '100%', aspectRatio: 1.618, maxWidth: 800 }}
        responsive
        data={txData}
        margin={{
          top: 20,
          right: 20,
          bottom: 5,
          left: 0,
        }}
      >
        <CartesianGrid stroke="#aaa" strokeDasharray="2 5" />
        <Line
          type="monotone"
          yAxisId="left"
          dot={false}
          // dot={{ r: 1.5 }}
          dataKey="temp_f"
          stroke="var(--color-accent)"
          strokeWidth={2}
          name="Temperature (°F)"
        />
        <Line
          type="basis"
          yAxisId="right"
          dot={false}
          dataKey="humidity_rel"
          stroke="hsl(from var(--color-accent) calc(h + 180) s l)"
          strokeWidth={2}
          name="Relative Humidity (%)"
        />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(isoStamp) =>
            new Date(isoStamp).toLocaleString(undefined, {
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
            })
          }
        />
        <YAxis
          width="auto"
          yAxisId="left"
          // ticks=[76.0, 76.1, ...]
          // tickFormatter={(v) => v.toFixed(1)} // introduces rounding error
          orientation="left"
          stroke="var(--color-accent)"
          domain={['dataMin - 0.25', 'dataMax + 0.25']}
          label={{
            value: 'Temperature (°F)',
            position: 'insideLeft',
            angle: -90,
          }}
        />
        <YAxis
          width="auto"
          yAxisId="right"
          orientation="right"
          stroke="hsl(from var(--color-accent) calc(h + 180) s l)"
          domain={['dataMin - 0.25', 'dataMax + 0.25']}
          label={{ value: 'Humidity (%)', position: 'insideRight', angle: -90 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '5px',
            background: 'none',
            backdropFilter: 'brightness(45%) blur(2px)',
          }}
          formatter={(value, name) => {
            if (!value || typeof name !== 'string') {
              return [value, name]
            }
            return formatter(value.toString(), name)
          }}
          labelFormatter={(label) =>
            typeof label !== 'string'
              ? label
              : new Date(label).toLocaleString(undefined, {
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })
          }
        />
        <Legend align="right" />
      </LineChart>
    </div>
  )
}

function formatter(value: string, name: string): [value: string, name: string] {
  const match = name.match(/^(.+) \(([^)]+)\)$/)
  if (!match) {
    return [value, name]
  }
  const [, label, unit] = match
  return [`${value} ${unit}`, label]
}
