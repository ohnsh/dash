// import VODView from '@/components/vod-view'
import vodLogo from '@/public/vod-logo.svg'
import VodLogo from './vod-logo'
import Image from 'next/image'
import ChartDemo from './chart-demo'

// making this fancy so the caller's code is the same except for wrapping searchParams
// access in a function call.
function singlify<T extends string>(
  params: Record<string, string | string[] | undefined>,
  ...keys: T[]
) {
  const result = {} as { [K in T]: string | undefined }
  for (const key of keys) {
    const { [key]: val } = params
    result[key] = Array.isArray(val) ? val[0] : val
  }
  return result
}

export default async function Home({ searchParams }: PageProps<'/'>) {
  const { v } = singlify(await searchParams, 'v')

  return (
    <>
      <section className="mb-14">
        <h2 className="text-2xl mb-2">
          {/*<Image
            src={vodLogo}
            alt="VOD"
            width={130}
            className="inline align-top -mr-2.5"
          />*/}
          <VodLogo width={140} className="inline align-[-6px] -mr-2.5" />
          is Live 📼🤓⬇
        </h2>
        <iframe
          src="https://vod.ohn.sh/embed"
          title="Camera archive for October 9"
          loading="lazy"
          allow="fullscreen"
          style={{ width: '100%', aspectRatio: '16 / 9', border: 'none' }}
        ></iframe>
      </section>

      <section>
        <ChartDemo />
      </section>
    </>
  )

  // return <VODView searchParams={searchParams} onlyQuad headless={!v} />
}
