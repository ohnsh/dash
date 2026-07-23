import Script from 'next/script'
import Client from './client'
import ClientNpm from './client-npm'
import Hlsjs from './hlsjs'
import Native from './native'

const streamUrl = 'https://hls.ohn.sh/wuuk/index.m3u8'
const frameUrl = 'https://hls.ohn.sh/wyze1'

export default async function Home({ searchParams }: PageProps<'/hls'>) {
  const { tech = 'hls.js' } = await searchParams

  if (tech === 'iframe') {
    return (
      <main>
        <iframe
          title="MediaMTX iframe"
          src={frameUrl}
          width="640"
          height="360"
          allow="autoplay"
          className="border-0"
        ></iframe>
      </main>
    )
  } else if (tech === 'native') {
    return (
      <main>
        <Native streamUrl={streamUrl} />
      </main>
    )
  } else if (tech === 'client') {
    return (
      <main>
        <Client streamUrl={streamUrl} />
      </main>
    )
  } else if (tech === 'client-npm') {
    return (
      <main>
        <ClientNpm streamUrl={streamUrl} />
      </main>
    )
  } else {
    return (
      <main>
        <Hlsjs streamUrl={streamUrl} />
      </main>
    )
  }
}
