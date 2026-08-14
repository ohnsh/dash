import { desc, gte } from 'drizzle-orm'
import VODPlayer from '@/components/vod-player'
import { db, invs } from '@/lib/turso'
import { fetchInventory } from '@/lib/vod-new'

const MIN_SPEECH_S = 1
const NUM_INVS = 50

export default async function Home({ searchParams }: PageProps<'/'>) {
  const rows = await db
    .select()
    .from(invs)
    .where(gte(invs.speechTotal, MIN_SPEECH_S))
    .limit(NUM_INVS)
    .orderBy(desc(invs.date))

  const { inventoryPath } = rows[0]
  const inventory = await fetchInventory(inventoryPath)

  inventory.find((r) => r)

  return <VODPlayer />
}
