import { and, desc, eq, gte } from 'drizzle-orm'
import { cacheLife } from 'next/cache'
import { db, invs } from './turso'

const NUM_INVS = 10

export async function getInventories({
  minSpeech,
  date,
}: {
  minSpeech?: number
  date?: string
} = {}) {
  'use cache'
  // consider using 'minutes' which revalidates every minute and expires every hour
  cacheLife({ stale: 300, revalidate: 300, expire: 1800 })

  return db
    .select()
    .from(invs)
    .where(
      and(
        minSpeech ? gte(invs.speechTotal, minSpeech) : undefined,
        date ? eq(invs.date, date) : undefined,
      ),
    )
    .limit(NUM_INVS)
    .orderBy(desc(invs.date))
}
