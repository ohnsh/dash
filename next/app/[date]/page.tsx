import { unstable_cache } from 'next/cache'
import { dbQuery } from '@/lib/turso'
import VodPlayer from '@/components/vod-player'
import ThumbStrip from '@/components/thumbstrip'

const getInventories = unstable_cache(
  async (date: string) => {
    return await dbQuery({
      sql: `
        SELECT inventory_path, date
        FROM vod_index
        WHERE date = ?`,
      args: [date],
    })
  },
  ['inventories'],
  { revalidate: false },
)

export default async function Vod({
  searchParams,
  params,
}: PageProps<'/[date]'>) {
  const { date } = await params

  const rows = await getInventories(date)

  return (
    <div>
      <VodPlayer />
      {rows.map((row) => (
        <ThumbStrip
          key={row.inventory_path}
          inventoryPath={row.inventory_path}
        />
      ))}
    </div>
  )
}
