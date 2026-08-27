import VODView from '@/components/vod-view'
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

  if (!v) {
    return (
      <>
        <ChartDemo />
        <VODView vKey={v} onlySpeech headless />
      </>
    )
  }

  return <VODView vKey={v} onlySpeech />
}
