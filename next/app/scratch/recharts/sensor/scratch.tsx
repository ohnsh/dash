import React, { useMemo } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// compute numeric ticks up-front
// make sure midnight is included
// (because they're numeric, they don't have to exactly match a data point)
// separately, in tickFormatter, format midnight ticks as date instead of time
export const FlexibleTimeChart = ({ rawData }) => {
  // 1. Transform raw timestamp strings into Unix numbers
  const chartData = useMemo(() => {
    return rawData.map((item) => ({
      ...item,
      // Convert "2026-08-23T12:00:00Z" to 1787496000000
      numericTimestamp: new Date(item.timestamp).getTime(),
    }))
  }, [rawData])

  // 2. Generate ticks (these can be arbitrary times, e.g., exactly midnight)
  const customTicks = useMemo(() => {
    // You can generate ticks for exactly 12:00 AM, 6:00 AM, etc.
    // They do NOT need to exist in the chartData array!
    return [
      1787443200000, // Midnight Day 1
      1787464800000, // 6:00 AM
      1787529600000, // Midnight Day 2
    ]
  }, [])

  // ALT APPROACH
  const calculatedTicks = useMemo(() => {
    if (!rawData || rawData.length === 0) return []

    const ticks: string[] = []
    let lastDateStr: string | null = null

    rawData.forEach((item, index) => {
      const dateObj = new Date(item.timestamp)
      const currentDateStr = dateObj.toLocaleDateString()

      // Rule 1: ALWAYS include the very first item and any date changes
      if (index === 0 || currentDateStr !== lastDateStr) {
        ticks.push(item.timestamp)
        lastDateStr = currentDateStr
      }
      // Rule 2: Fill in between times (e.g., every 4th data point)
      // Adjust the modulo (%) number depending on your data density
      else if (index % 4 === 0) {
        ticks.push(item.timestamp)
      }
    })

    return ticks
  }, [rawData])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="numericTimestamp" // Must point to the number field
          type="number" // Essential: tells Recharts to use a linear scale
          domain={['dataMin', 'dataMax']} // Spans the axis across your data range
          ticks={customTicks} // Can be any timestamp sequence
          tickFormatter={(tick) => new Date(tick).toLocaleTimeString()}
        />
        <YAxis />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
