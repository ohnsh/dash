import { cache } from 'react'
import InventoryProvider from '@/components/inventory-provider'
import { dbQuery } from '@/lib/turso'

const queryInventories = cache(
  async () =>
    await dbQuery(`
      SELECT inventory_path, date
      FROM vod_index
      ORDER BY date DESC
      LIMIT 100
   `).then((rows) =>
      // clean up records to make them serializable by Next
      rows.map(({ date, inventory_path }) => ({ date, inventory_path })),
    ),
)

export default async function InventoryContainer({
  children,
}: {
  children: React.ReactNode
}) {
  const inventories = await queryInventories()
  return (
    <InventoryProvider inventories={inventories}>{children}</InventoryProvider>
  )
}
