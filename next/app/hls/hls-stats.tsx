'use client'

import { useState } from 'react'
import type { DashdEvent, Path, UnpackResult } from './dashd'
import css from './hls-stats.module.css'
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

  // const parsedItem = PathSchema.parse(item)

  return (
    <div className={css.container}>
      <TabInterface>
        <Tab name="Stats">
          <StatTable item={item} />
        </Tab>
        <Tab name="Events">
          <EventTable events={events} />
        </Tab>
      </TabInterface>
    </div>
  )
}

function TabInterface({
  children,
}: {
  children: React.ReactElement<TabProps>[]
}) {
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    const defaultIndex = children.findIndex((tab) => tab.props.default)
    return defaultIndex !== -1 ? defaultIndex : 0
  })

  return (
    <div className={css.tabInterface}>
      <div role="tablist">
        {children.map((tab, index) => (
          <button
            role="tab"
            type="button"
            aria-selected={activeTabIndex === index || undefined}
            key={tab.props.name}
            onClick={() => setActiveTabIndex(index)}
          >
            {tab.props.name}
          </button>
        ))}
      </div>
      <div role="tabpanel">{children[activeTabIndex]}</div>
    </div>
  )
}

interface TabProps {
  name: string
  default?: boolean
  children: React.ReactNode | React.ReactNode[]
}

function Tab({ children }: TabProps) {
  return children
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

function StatTable({ item }: { item: Path }) {
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
          <tr>
            <td>{item.name}</td>
            <td>{item.readers?.length ?? 0}</td>
            <td>{formatMB(item.outboundBytes ?? 0)}</td>
            <td>
              <span className={item.available ? 'text-online' : 'text-offline'}>
                ⚫︎
              </span>
              <span className={item.online ? 'text-online' : 'text-offline'}>
                ⚫︎
              </span>
            </td>
            <td>{item.source?.type?.replace(/(Conn|Session)$/i, '')}</td>
            <td>{item.tracks2?.map((track) => track.codec).join(', ')}</td>
          </tr>
        </tbody>
      </table>
    </section>
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
