import Playlist from './playlist'
import { type Meta, MetaSchema } from '../schema'
import { vodSlugToR2URL } from '../util'

export default async function Vod({ searchParams, params }: PageProps<'/vod/[...vodSlug]'>) {
  let { v = '' } = await searchParams
  const { vodSlug } = await params
  const invURL = vodSlugToR2URL(vodSlug)

  v = Array.isArray(v) ? v[0] : v

  if (!invURL) {
    throw new Error('No inventory available')
  }

  const inventory = await fetch(invURL)
    .then((r) => r.json() as Promise<Record<string,Meta>>)
    .then((j) => Object.values(j).map((i) => i.type === 'hls' ? i : MetaSchema.parse(i)))

  return (
    <Playlist slug={vodSlug} inventory={inventory} />
  )
}
