import { type VODVideo, vodVideoSchema } from '@dash/vod/schema'
import { BUCKET_URL, timestampFromFilename } from './vod-new'

export const MIN_CONFIDENCE = 0.85

export function toDashVideo(video: VODVideo, inventoryPath: string) {
  const pathData = invPathToData(inventoryPath)
  const key = `${pathData.keyPath}/${video.name}`
  const src = `${pathData.baseURL}/${video.name}`
  const thumb = `${pathData.baseURL}/${video.assets[0]}`
  const timestamp = timestampFromFilename(video.name)

  return { key, timestamp, src, thumb, ...pathData, ...video }
}

export function invPathToData(inventoryPath: string) {
  const segments = inventoryPath.split('/')
  const [yearMo, day, cam] = segments
  const date = `${yearMo}-${day}`
  // leave out literal 'inventory.json'
  const keyPath = segments.slice(0, -1).join('/')
  const baseURL = `${BUCKET_URL}/${keyPath}`

  return { date, cam, keyPath, baseURL }
}

export type DashVideo = ReturnType<typeof toDashVideo>

export async function fetchInventory(
  inventoryPath: string,
): Promise<DashVideo[]> {
  return fetch(new URL(inventoryPath, BUCKET_URL))
    .then((r) => r.json())
    .then((items) =>
      items
        .map(vodVideoSchema.parse)
        .map((vodVideo: VODVideo) => toDashVideo(vodVideo, inventoryPath)),
    )
}
