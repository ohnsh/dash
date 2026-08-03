import { DASHD_BASE, unpack } from './dashd'
import HlsStats from './hls-stats'
import HlsSwitch from './hls-switch'
import css from './page.module.css'

export default async function (props: PageProps<'/hls'>) {
  let { stream } = await props.searchParams
  if (Array.isArray(stream)) {
    stream = stream[0]
  }

  const resp = await fetch(`${DASHD_BASE}/paths/list`)
  const { data, error } = await unpack<'pathsList'>(resp)

  if (error) {
    return (
      <article className={css.container}>
        <HlsSwitch className="mx-auto" />
        <section className="h-50 mt-4 text-center font-bold overflow-y-scroll">
          Error reaching dashd
        </section>
      </article>
    )
    // throw error
  }

  if (!stream || !data.items?.find((item) => item.name === stream)) {
    // if no (valid) stream in query params, use the first that's set to `online`
    stream = data.items?.find((item) => item.online)?.name
  }

  return (
    <article className={css.container}>
      <HlsSwitch className="mx-auto" items={data.items} />
      <section className="h-50 overflow-y-scroll">
        {stream && <HlsStats stream={stream} init={{ data, error }} />}
      </section>
    </article>
  )
}
