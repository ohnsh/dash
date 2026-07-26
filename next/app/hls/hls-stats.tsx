import DefList from '@/components/definition-list'

export default async function HlsStats({ stream }: { stream: string }) {
  const stats = await fetch(`https://d.ohn.sh/mx/streams/${stream}`).then((r) =>
    r.json(),
  )

  const {
    tracks2,
    readers,
    bytesSent,
    bytesReceived,
    name,
    source,
    online,
    onlineTime,
  } = stats

  const numReaders = readers?.length ?? 0
  const mbSent = (bytesSent / 2 ** 20).toFixed(2)
  const mbRecv = (bytesReceived / 2 ** 20).toFixed(2)

  return (
    <div>
      <DefList entries={Object.entries({ numReaders, mbSent, mbRecv })} />
    </div>
  )
}
