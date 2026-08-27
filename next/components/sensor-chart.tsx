'use client'

import { cache, use, useEffect, useMemo, useState } from 'react'
import {
  // CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Formatter } from 'recharts/types/component/DefaultTooltipContent'
import type { DataPoint, SensorResponse } from '@/lib/sensor'

const ctof = (c: number) => Number((32 + (c * 9) / 5).toFixed(1))

export function SensorChartEffect({
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

  if (error) {
    return `Error: ${error}`
  }

  if (!data) {
    return 'Loading...'
  }

  return <SensorChart {...{ title, data }} />
}

const fetchCache = new Map<string, Promise<SensorResponse>>()

function getSensorData(url: string) {
  let promise = fetchCache.get(url)
  if (promise) return promise
  promise = fetch(url)
    .then<SensorResponse>((r) => r.json())
    .catch(() => ({ status: 'error', result: [] }))
  fetchCache.set(url, promise)
  return promise
}

export function SensorChartPromise({
  promise,
  url,
  title,
}: {
  promise?: Promise<SensorResponse>
  url?: string
  title: string
}) {
  // Still not sure what's the best way to create a client-only promise. `use(browser())`
  // looks promising (suspends on the server without awaiting or resuming, and without
  // causing a hydration mismatch when the client bypasses it and renders)

  const data = promise
    ? use(promise).result
    : url
      ? use(getSensorData(url))?.result
      : []

  return <SensorChart {...{ title, data }} />
}

export function SensorChart({
  data,
  title,
}: {
  data: DataPoint[] | undefined
  title?: string
}) {
  const txData = useMemo(() => {
    if (!data) {
      return []
    }
    return data.map((point) => ({ ...point, temp_f: ctof(point.temp_c) }))
  }, [data])

  return (
    <div>
      {title && <h3>{title}</h3>}
      <LineChart
        style={{
          width: '100%',
          aspectRatio: 1.8,
          maxWidth: 800,
          fontSize: 'var(--text-sm)',
        }}
        responsive
        data={txData}
        margin={{
          top: 20,
          right: 20,
          bottom: 5,
          left: 0,
        }}
      >
        {/*<CartesianGrid stroke="#aaa" strokeDasharray="2 5" />*/}
        <Line
          type="basis" // "monotone"
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
          type="auto" // "number" with Unix timestamps and formatter
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
          // tickFormatter={(v) => v.toLocaleString()} // introduces rounding error
          // domain={['dataMin - 0.3', 'dataMax + 0.3']}
          // below values seem to fix most axis issues
          niceTicks="snap125" // "snap125" is also pretty reliable, tends to result in whole numbers
          domain={['auto', 'auto']}
          orientation="left"
          stroke="var(--color-accent)"
          // label={{
          //   value: 'Temperature (°F)',
          //   position: 'insideLeft',
          //   angle: -90,
          // }}
        />
        <YAxis
          width="auto"
          yAxisId="right"
          niceTicks="snap125"
          domain={['dataMin - 1', 'dataMax + 1']}
          orientation="right"
          stroke="hsl(from var(--color-accent) calc(h + 180) s l)"
          // label={{
          //   value: 'Humidity (%)',
          //   position: 'insideRight',
          //   angle: 90,
          // }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '5px',
            background: 'none',
            backdropFilter: 'brightness(45%) blur(2px)',
          }}
          formatter={tooltipFormatter}
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
        <Legend position="bottom" />
      </LineChart>
    </div>
  )
}

const tooltipFormatter: Formatter = (value, name) => {
  if (!value || typeof name !== 'string') {
    return [value, name]
  }
  const match = name.match(/^(.+) \(([^)]+)\)$/)
  if (!match) {
    return [value, name]
  }
  const [, label, unit] = match
  return [`${value} ${unit}`, label]
}
