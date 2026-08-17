// import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { db, invs } from '@/lib/turso'
import VODView from '@/components/vod-view'
import { eq } from 'drizzle-orm'

// this can be optimized, especially for days that are over
// const getInventories = unstable_cache(
//   ['inventories'],
//   { revalidate: false },
const getInventories = async (date: string) =>
  db.select().from(invs).where(eq(invs.date, date))

const validateDate = (date: string) => /\d{4}-\d{2}-\d{2}/.test(date)

export default async function Vod({
  params,
  searchParams,
}: PageProps<'/[date]'>) {
  const { date } = await params
  let { v } = await searchParams
  if (Array.isArray(v)) v = v[0]

  if (!validateDate(date)) {
    notFound()
  }

  const rows = await getInventories(date)
  if (rows.length === 0) {
    notFound()
  }

  return <VODView rows={rows} vKey={v} date={date} />
}
