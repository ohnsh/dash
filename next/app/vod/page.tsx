import Link from 'next/link'
import { MetaSchema, type Meta } from './schema'
import css from './vod.module.css'

const ROOT_INV = 'https://vod.ohn.sh/root.txt'

export default async function Vod({ searchParams }: PageProps<'/vod'>) {
  let { inv = '', v = '' } = await searchParams
  inv = Array.isArray(inv) ? inv[0] : inv
  v = Array.isArray(v) ? v[0] : v

  const rootList = await fetch(ROOT_INV)
    .then((r) => r.text())
    .then((t) => t.split('\n'))

  const invURL = new URL(inv || rootList[0], 'https://vod.ohn.sh')
  if (!invURL) {
    throw new Error('No inventory available')
  }

  const inventory = await fetch(invURL)
    .then((r) => r.json() as Promise<Array<Meta>>)
    .then((j) => j.map((i) => MetaSchema.parse(i)))

  const thumbUrl = (name: string) =>
    new URL(
      `${name}+meta/thumb.webp`,
      // `${name}+meta/${name.replace(/\.[^.]+$/, '.webp')}`,
      invURL,
    ).toString()

  const vidUrl = (name: string) => new URL(name, invURL).toString()

  return (
    <main className={css.container}>
      <header>
        <ul>
          {rootList.map((i) => (
            <li key={i}>
              <Link href={`?inv=${i}`}>{i}</Link>
            </li>
          ))}
        </ul>
      </header>
      <h2>{invURL.toString()}</h2>
      <ul>
        {inventory.map((item) => (
          <li
            key={item.name}
            className={item.meta_ffprobe.isPortrait ? 'portrait' : 'landscape'}
          >
            <Link href={`?inv=${inv}&v=${item.name}`}>
              <img alt="" src={thumbUrl(item.name)} />
            </Link>
          </li>
        ))}
      </ul>
      {v && <video autoPlay controls playsInline src={vidUrl(v)} />}
    </main>
  )
}
