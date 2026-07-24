import HlsSwitch from './hls-switch'

export default async function (props: PageProps<'/hls'>) {
  return (
    <main>
      <HlsSwitch className="mx-auto" />
    </main>
  )
}
