import Client from './client'
import ClientNpm from './client-npm'
import Content from './experiment.mdx'
import Hlsjs from './hlsjs'
import Native from './native'

const streamUrl = 'https://hls.ohn.sh/wuuk/index.m3u8'
const frameUrl = 'https://hls.ohn.sh/wyze1'

const Experiment = ({
  tech,
  streamUrl,
}: {
  tech: string
  streamUrl: string
}) => {
  switch (tech) {
    case 'iframe': {
      return (
        <iframe
          title="MediaMTX iframe"
          src={frameUrl}
          width="640"
          height="360"
          allow="autoplay"
          className="border-0"
        ></iframe>
      )
    }
    case 'native': {
      return <Native streamUrl={streamUrl} />
    }
    case 'client': {
      return <Client streamUrl={streamUrl} />
    }
    case 'client-npm': {
      return <ClientNpm streamUrl={streamUrl} />
    }
    default: {
      return <Hlsjs streamUrl={streamUrl} />
    }
  }
}

export default async function Home({
  searchParams,
}: PageProps<'/hls/experiment'>) {
  let { tech = 'hls.js' } = await searchParams
  if (Array.isArray(tech)) {
    tech = tech[0]
  }

  return (
    <article className="py-5 px-10 mx-auto max-w-5xl">
      <section className="my-6">
        <Experiment tech={tech} streamUrl={streamUrl} />
      </section>
      <section className="my-6">
        <Content />
      </section>
    </article>
  )
}
