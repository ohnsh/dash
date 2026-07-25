import HlsStatStream from './hls-sse'
import HlsStats from './hls-stats'
import HlsSwitch from './hls-switch'

export default async function (props: PageProps<'/hls'>) {
  let { stream = 'desk' } = await props.searchParams
  if (Array.isArray(stream)) {
    stream = stream[0]
  }

  return (
    <main>
      <HlsSwitch className="mx-auto" />
      <HlsStats stream={stream} />
      <HlsStatStream stream={stream} />
    </main>
  )
}
