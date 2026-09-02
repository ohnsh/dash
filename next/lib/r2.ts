import { type VODVideo, vodVideoSchema } from '@dash/vod/schema'
import { cacheLife } from 'next/cache'
import { type DashVideo, fromVODVideo, keyToInvPath } from './dash-video'
import { BUCKET_URL } from './vod-util'

export async function fetchInventory(
  inventoryPath: string,
): Promise<DashVideo[]> {
  'use cache'
  // this can be much longer for days other than the current day.
  // need to figure that out.
  cacheLife('minutes')

  // if we pass the URL object, it might prevent fetch de-duplication
  // the string will pass a strict equality test
  const url = new URL(inventoryPath, BUCKET_URL).toString()
  return fetch(url)
    .then((r) => r.json())
    .then((items) =>
      items
        .map(vodVideoSchema.parse)
        .map((vodVideo: VODVideo) => fromVODVideo(vodVideo, inventoryPath)),
    )
}

export const dashVideoFromKey = async (key: string) =>
  fetchInventory(keyToInvPath(key)).then((vids) =>
    vids.find(({ key: testKey }) => testKey === key),
  )
