import Link from 'next/link'

const DEFAULT_INV = 'https://vod.ohn.sh/root.json'

export default async function Vod({ searchParams }: PageProps<'/vod'>) {
  let { inv = DEFAULT_INV } = await searchParams
  if (Array.isArray(inv)) {
    inv = inv[0]
  }

  // const sp = useSearchParams()
  // const inv = sp.get('inv') ?? DEFAULT_INV
  // const url = new URL(inv)

  const resp = await fetch(inv)
  const json = await resp.json()

  return (
    <main>
      <ul>
        {json.map((item) => (
          <li key={item.id}>
            <Link href={item.url}>{item.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
