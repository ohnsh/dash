'use client'

import type { DashdEvent, Path, UnpackResult } from './dashd'
import css from './hls-stats.module.css'
import { Tab, TabInterface } from './tab-interface'
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

  // const parsedItem = PathSchema.parse(item)

  return (
    <div className={css.container}>
      <TabInterface>
        <Tab name="Stats">
          <StatTable data={data} activeStream={stream} />
        </Tab>
        <Tab name="Events">
          <EventTable events={events} />
        </Tab>
      </TabInterface>
    </div>
  )
}

function EventTable({ events }: { events: DashdEvent[] }) {
  return (
    <section className={css.tableWrapper}>
      <table>
        <caption>Event Stream</caption>
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Stream</th>
            <th>Protocol</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <StreamEvent key={event.id} event={event} />
          ))}
        </tbody>
      </table>
    </section>
  )
}

function StatTable({
  data,
  activeStream,
}: {
  data: Path[]
  activeStream: string
}) {
  const filteredData = data.filter((item) => !item.name?.endsWith('-rec'))

  return (
    <section className={css.tableWrapper}>
      <table>
        <caption></caption>
        <thead>
          <tr>
            <th>Stream</th>
            <th>Readers</th>
            <th>Sent (MB)</th>
            <th>Status</th>
            <th>Source</th>
            <th>Tracks</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <StatRow key={item.name} item={item} />
          ))}
        </tbody>
      </table>
    </section>
  )
}

function formatSourceType(type: string) {
  if (type.endsWith('Source')) {
    const proto = type.replace(/Source$/, '').toUpperCase()
    return `${proto} / server`
  }
  if (type.endsWith('Conn')) {
    const proto = type.replace(/Conn$/, '').toUpperCase()
    return `${proto} / client`
  }
  if (type.endsWith('Session')) {
    const proto = type.replace(/Session$/, '').toUpperCase()
    return `${proto} / client`
  }
  return type
}

function StatRow({ item }: { item: Path }) {
  const formattedType = item.source?.type
    ? formatSourceType(item.source.type)
    : ''

  return (
    <tr>
      <td>{item.name}</td>
      <td>{item.readers?.length ?? 0}</td>
      <td>{formatMB(item.outboundBytes ?? 0)}</td>
      <td>
        <span
          className={item.available ? 'text-online' : 'text-offline'}
          title={item.available ? 'Available' : 'Not available'}
        >
          ⚫︎
        </span>
        <span
          className={item.online ? 'text-online' : 'text-offline'}
          title={item.available ? 'Online' : 'Not online'}
        >
          ⚫︎
        </span>
      </td>
      <td>{formattedType}</td>
      <td>{item.tracks2?.map((track) => track.codec).join(', ')}</td>
    </tr>
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
