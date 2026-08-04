'use client'

import DefList from '@/components/definition-list'
import type { UnpackResult } from './dashd'
import useStats from './use-stats'
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

  console.log(`Stream: ${stream}`)

  const item = data.find(({ name }) => name === pathMap[stream])
  const numReaders = (item?.readers?.length ?? 0).toString()
  const mbOut = toMB(item?.outboundBytes ?? 0)

  return (
    <div>
      <DefList entries={Object.entries({ numReaders, mbOut })} />
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <DefList entries={Object.entries(event.data)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
