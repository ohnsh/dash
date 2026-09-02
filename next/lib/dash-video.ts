import type { VODVideo } from '@dash/vod/schema'
import { BUCKET_URL, tsFromFilename } from './vod-util'

const wyzeTimestamp = (date: string, filename: string) => {
  const hours = filename.slice(0, 2)
  const isoDate = `${date}T${hours}:00:00Z`
  try {
    return new Date(isoDate).toISOString()
  } catch {
    return undefined
  }
}

export function fromVODVideo(video: VODVideo, inventoryPath: string) {
  const pathData = invPathToData(inventoryPath)
  const key = `${pathData.keyPath}/${video.name}`
  const src = `${pathData.baseURL}/${video.name}`
  const thumb = `${pathData.baseURL}/${video.assets[0]}`
  const timestamp =
    tsFromFilename(video.name) ?? wyzeTimestamp(pathData.date, video.name)

  return { key, timestamp, src, thumb, ...pathData, ...video }
}

export type DashVideo = ReturnType<typeof fromVODVideo>

export const keyToInvPath = (key: string) =>
  key.replace(/[^/]+$/, 'inventory.json')

export function invPathToData(inventoryPath: string) {
  const segments = inventoryPath.split('/')
  const [yearMo, day, cam] = segments
  const date = `${yearMo}-${day}`
  // leave out literal 'inventory.json'
  const keyPath = segments.slice(0, -1).join('/')
  const baseURL = `${BUCKET_URL}/${keyPath}`

  return { date, cam, keyPath, baseURL }
}
