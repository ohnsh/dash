import { type VODVideo, vodVideoSchema } from '@dash/vod/schema'
import { BUCKET_URL, timestampFromFilename } from './vod-new'

export const MIN_CONFIDENCE = 0.85

const wyzeTimestamp = (date: string, filename: string) => {
  const hours = filename.slice(0, 2)
  const isoDate = `${date}T${hours}:00:00Z`
  try {
    return new Date(isoDate).toISOString()
  } catch {
    return undefined
  }
}

export function toDashVideo(video: VODVideo, inventoryPath: string) {
  const pathData = invPathToData(inventoryPath)
  const key = `${pathData.keyPath}/${video.name}`
  const src = `${pathData.baseURL}/${video.name}`
  const thumb = `${pathData.baseURL}/${video.assets[0]}`
  const timestamp =
    timestampFromFilename(video.name) ??
    wyzeTimestamp(pathData.date, video.name)

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
  // if we pass the URL object, it might prevent fetch de-duplication
  // the string will pass a strict equality test
  const url = new URL(inventoryPath, BUCKET_URL).toString()
  return fetch(url)
    .then((r) => r.json())
    .then((items) =>
      items
        .map(vodVideoSchema.parse)
        .map((vodVideo: VODVideo) => toDashVideo(vodVideo, inventoryPath)),
    )
}
