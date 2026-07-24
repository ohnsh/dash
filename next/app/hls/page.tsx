import HlsSwitch from './hls-switch'

export default async function (props: PageProps<'/hls'>) {
  return (
    <main>
      <h1 className="text-2xl font-bold">Dash</h1>
      <HlsSwitch className="mx-auto" />
    </main>
  )
}
