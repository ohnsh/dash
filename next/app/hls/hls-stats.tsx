'use client'

import DefList from '@/components/definition-list'
import type { DashdEvent, UnpackResult } from './dashd'
import css from './hls-stats.module.css'
import { type Path, PathSchema } from './MtxPath'
import useStats from './use-stats'
import { isValidStream, pathMap } from './util'

const formatMB = (num: number) =>
  (num / 2 ** 20).toLocaleString(undefined, {
    maximumSignificantDigits: 5,
  })

export default function HlsStats({
  stream,
  init,
}: {
  stream: string
  init?: UnpackResult<'pathsList'>
}) {
  const { error, data, loading, events } = useStats({ init })

  if (error) {
    return <div>Error loading stats: {JSON.stringify(error)}</div>
  }
  if (!isValidStream(stream)) {
    return <div>Invalid stream {stream}</div>
  }
  if (loading && !data) {
    return <div>Loading...</div>
  }

  const item = data.find(({ name }) => name === pathMap[stream])

  if (!item) {
    return <div>No data for {stream}</div>
  }

  const parsedItem = PathSchema.parse(item)

  return (
    <div className={css.container}>
      <StatDisplay item={parsedItem} />
      <table>
        <caption>Events</caption>
        <tbody>
          {events.map((event) => (
            <StreamEvent key={event.id} event={event} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatDisplay({ item }: { item: Path }) {
  const numReaders = item.readers.length.toString()
  const mbOut = formatMB(item.outboundBytes)

  return <DefList entries={Object.entries({ numReaders, mbOut })} />
}

function StreamEvent({ event }: { event: DashdEvent }) {
  const protocol = event.reader_type.replace(/session$/i, '')
  return (
    <tr>
      <td>{event.timestamp.toLocaleTimeString('en-US', { hour12: false })}</td>
      <td>{event.event}</td>
      <td>{event.path}</td>
      <td>{protocol}</td>
    </tr>
  )
  // <DefList entries={Object.entries(event.data)} />
}
