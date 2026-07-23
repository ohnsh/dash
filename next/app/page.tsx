import Link from 'next/link'

export default function Home() {
  return (
    <main className="p-5">
      HLS experiments:
      <ul className="list-disc pl-5">
        <li>
          <a className="text-accent underline" href="/hls?tech=hls.js">
            hls.js server component
          </a>{' '}
          with next.js {`<Script>`}
        </li>
        <li>
          <a className="text-accent underline" href="/hls?tech=client">
            hls.js client component
          </a>
        </li>
        <li>
          <Link className="text-accent underline" href="/hls?tech=native">
            native browser HLS
          </Link>{' '}
          (unreliable, likely due either to codecs or the low-latency HLS
          variant served by MediaMTX, which periodically logs
          <blockquote className="ml-5">
            <code>
              part duration changed from 267ms to 241ms - this will cause an
              error in iOS clients
            </code>
          </blockquote>
        </li>
        <li>
          <Link className="text-accent underline" href="/hls?tech=iframe">
            MediaMTX interface in iframe
          </Link>{' '}
          (for good measure)
        </li>
      </ul>
    </main>
  )
}
