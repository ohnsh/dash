import Link from 'next/link'

export default function Home() {
  return (
    <main className="py-5 px-10 mx-auto max-w-5xl">
      <h2 className="text-xl font-bold">HLS experiments</h2>
      <ul className="list-disc pl-6 py-4">
        <li>
          <p>
            <strong>
              <a className="text-accent underline" href="/hls?tech=hls.js">
                hls.js server component
              </a>{' '}
              with next.js {`<Script>`}
            </strong>
          </p>
          <p>
            A test to see if hls.js could be loaded via CDN from a{' '}
            <code>&lt;script&gt;</code> tag and attached to a static{' '}
            <code>&lt;video&gt;</code> element rendered by a server component.
          </p>
          <p>
            It kind of works, but client-side navigation (via{' '}
            <code>&lt;Link&gt;</code> component) breaks it because the{' '}
            <code>&lt;video&gt;</code> element is destroyed and replaced, but
            the <code>&lt;script&gt;</code> (or <code>&lt;Script&gt;</code>)
            that initializes hls.js is not re-run. In the end, it's a silly
            experiment, but it gives me a better feel for what happens to code
            in the Willy Wonka factory that is a bundler.
          </p>
        </li>
        <li>
          <strong>
            <Link className="text-accent underline" href="/hls?tech=client">
              hls.js client component
            </Link>
          </strong>
        </li>
        <li>
          <p>
            <strong>
              <Link className="text-accent underline" href="/hls?tech=native">
                native browser HLS
              </Link>
            </strong>
          </p>
          <p>
            Unreliable, likely due either to codecs or the low-latency HLS
            variant served by MediaMTX, which periodically logs
          </p>
          <blockquote className="ml-5">
            <code>
              part duration changed from 267ms to 241ms - this will cause an
              error in iOS clients
            </code>
          </blockquote>
        </li>
        <li>
          <strong>
            <Link className="text-accent underline" href="/hls?tech=iframe">
              MediaMTX interface in iframe
            </Link>
          </strong>{' '}
          (for good measure)
        </li>
      </ul>
    </main>
  )
}
