import CamPage from './cam-page'
import { dbQuery } from '@/lib/turso'
import Playlist from './playlist'
import { BUCKET_URL } from '@/lib/vod'
import { type Meta, MetaSchema } from '@/lib/vod-schema'

export default async function Vod({
  searchParams,
  params,
}: PageProps<'/[...slug]'>) {
  const { slug } = await params

  if (!slug.at(-1)?.match(/^\d{2}$/)) {
    return <CamPage searchParams={searchParams} params={params} />
  }

  // the first three elements are year, month, day
  // (the only three, in this case, but generalizing)
  const date = slug.slice(0, 3).join('-')

  const rows = await dbQuery({
    sql: `
    SELECT inventory_path, date
    FROM vod_index
    WHERE date = ?`,
    args: [date],
  })

  return (
    <>
      {rows.map((row) => (
        <CamDisplay
          key={row.inventory_path}
          slug={slug}
          inventoryPath={row.inventory_path}
        />
      ))}
    </>
  )
}

async function CamDisplay({
  slug,
  inventoryPath,
}: {
  slug: string[]
  inventoryPath: string
}) {
  const inventory = await fetch(new URL(inventoryPath, BUCKET_URL))
    .then((r) => r.json() as Promise<Record<string, Meta>>)
    .then((j) =>
      Object.values(j).map((i) =>
        i.type === 'hls' ? i : (MetaSchema.parse(i) as Meta),
      ),
    )
  return <Playlist slug={slug} inventory={inventory} />
}
