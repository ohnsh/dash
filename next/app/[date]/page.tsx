import { notFound } from 'next/navigation'
import VODView from '@/components/vod-view'

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

  return <VODView vKey={v} date={date} />
}
