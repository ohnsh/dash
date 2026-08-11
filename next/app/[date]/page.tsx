// import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { dbQuery } from '@/lib/turso'
import VodPlayer from '@/components/vod-player'
import ThumbStrip from '@/components/thumbstrip'
import { BUCKET_URL } from '@/lib/vod-new'
import { type Meta, MetaSchema } from '@/lib/vod-schema'

// this can be optimized, especially for days that are over
// const getInventories = unstable_cache(
//   ['inventories'],
//   { revalidate: false },
const getInventories = async (date: string) => {
  return await dbQuery({
    sql: `
      SELECT inventory_path, date
      FROM vod_index
      WHERE date = ?`,
    args: [date],
  })
}

const validateDate = (date: string) => /\d{4}-\d{2}-\d{2}/.test(date)

export default async function Vod({
  params,
  searchParams,
}: PageProps<'/[date]'>) {
  const { date } = await params
  // const sp = await searchParams
  // const v = Array.isArray(sp.v) ? sp.v[0] : sp.v

  if (!validateDate(date)) {
    notFound()
  }

  const rows = await getInventories(date)
  if (rows.length === 0) {
    notFound()
  }

  let formattedDate: string
  try {
    formattedDate = new Date(date).toLocaleDateString(undefined, {
      dateStyle: 'long',
    })
  } catch {
    formattedDate = '[invalid date]'
  }

  return (
    <div>
      <VodPlayer />
      <h2>{formattedDate}</h2>
      {rows.map((row) => (
        <ServerThumbStrip
          key={row.inventory_path}
          inventoryPath={row.inventory_path}
        />
      ))}
    </div>
  )
}

function ServerThumbStrip({ inventoryPath }: { inventoryPath: string }) {
  // TODO: cache when the inventory is more than a day or two old.
  const inventory: Promise<Meta[]> = fetch(new URL(inventoryPath, BUCKET_URL))
    .then((r) => r.json())
    .then((items) => items.map(MetaSchema.parse))

  return (
    <ThumbStrip inventoryPromise={inventory} inventoryPath={inventoryPath} />
  )
}
