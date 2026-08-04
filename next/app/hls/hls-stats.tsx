'use client'

import DefList from '@/components/definition-list'
import type { UnpackResult } from './dashd'
import css from './hls-stats.module.css'
import { type Path, PathSchema } from './MtxPath'
import useStats, { type DashdEvent } from './use-stats'
import { isValidStream, pathMap } from './util'

const format = (num: number) =>
  num.toLocaleString(undefined, {
    maximumSignificantDigits: 5,
  })
const toMB = (num: number) => format(num / 2 ** 20)

export default function HlsStats({
  stream,
  init,
}: {
  stream: string
  init?: UnpackResult<'pathsList'>
}) {
  const { error, data, status, events } = useStats(init)

  if (error) {
    return <div>{JSON.stringify(error)}</div>
  }
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  if (status === 'init') {
    return <div>Loading...</div>
  }
  if (!isValidStream(stream)) {
    return <div>Invalid stream {stream}</div>
  }

  const item = data.find(({ name }) => name === pathMap[stream])

  if (!item) {
    return <div>No data for {stream}</div>
  }

  const parsedItem = PathSchema.parse(item)

  const numReaders = parsedItem.readers.length.toString()
  const mbOut = toMB(parsedItem.outboundBytes)

  return (
    <div className={css.container}>
      <DefList entries={Object.entries({ numReaders, mbOut })} />
      <table>
        <caption>Events</caption>
        {events.map((event) => (
          <StreamEvent key={event.id} event={event} />
        ))}
      </table>
    </div>
  )
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
