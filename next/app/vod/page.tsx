import Link from 'next/link'
import { MetaSchema, type Meta } from './schema'
import css from './vod.module.css'

const ROOT_INV = 'https://vod.ohn.sh/root.txt'

export default async function Vod({ searchParams }: PageProps<'/vod'>) {
  let { inv: _inv } = await searchParams
  _inv = Array.isArray(_inv) ? _inv[0] : (_inv ?? '')
  let invURL: URL
  if (_inv) {
    invURL = new URL(_inv)
  } else {
    const rootList = await fetch(ROOT_INV)
      .then((r) => r.text())
      .then((t) => t.split('\n'))
    invURL = new URL(rootList[0], 'https://vod.ohn.sh')
  }
  if (!invURL) {
    throw new Error('No inventory available')
  }

  const inv = await fetch(invURL)
    .then((r) => r.json() as Promise<Array<Meta>>)
    .then((j) => j.map((i) => MetaSchema.parse(i)))

  const thumbUrl = (name: string) =>
    new URL(
      `${name}+meta/thumb.webp`,
      // `${name}+meta/${name.replace(/\.[^.]+$/, '.webp')}`,
      invURL,
    ).toString()

  return (
    <main className={css.container}>
      <h2>{invURL.toString()}</h2>
      <ul>
        {inv.map((item) => (
          <li
            key={item.name}
            className={item.meta_ffprobe.isPortrait ? 'portrait' : 'landscape'}
          >
            <Link href={`?v=${item.name}`}>
              <img alt="" src={thumbUrl(item.name)} />
            </Link>
          </li>
        ))}
      </ul>
      <video autoPlay playsInline src="" />
    </main>
  )
}
