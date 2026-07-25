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
  const mbSent = Math.round(bytesSent / 2 ** 20)
  const mbRecv = Math.round(bytesReceived / 2 ** 20)

  return (
    <pre>
      <code>
        {JSON.stringify({ numReaders, mbSent, mbRecv }, undefined, 2)}
      </code>
      <code>{JSON.stringify({ bytesSent, bytesReceived }, undefined, 2)}</code>
    </pre>
  )
}
