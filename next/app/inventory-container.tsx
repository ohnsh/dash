import { desc } from 'drizzle-orm'
import { cacheLife } from 'next/cache'
import { cache } from 'react'
import InventoryProvider from '@/components/inventory-provider'
import { db, invs } from '@/lib/turso'

const queryInventories = cache(async () => {
  'use cache'
  cacheLife('minutes')

  return db.select().from(invs).orderBy(desc(invs.date)).limit(200)
})

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
