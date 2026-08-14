import { type VODVideo, vodVideoSchema } from 'dash-vod/schema'

export const BUCKET_URL = process.env.BUCKET_URL || 'https://vod.ohn.sh'

export async function fetchInventory(
  inventoryPath: string,
): Promise<VODVideo[]> {
  return fetch(new URL(inventoryPath, BUCKET_URL))
    .then((r) => r.json())
    .then((items) => items.map(vodVideoSchema.parse))
}

export function invPathToComponents(inventoryPath: string) {
  const [yearMo, day, cam, ...rest] = inventoryPath.split('/')
  return { date: `${yearMo}-${day}`, cam, rest }
}

export function invPathToBaseUrl(inventoryPath: string) {
  const path = inventoryPath.replace(/\/[^/]+$/, '')
  return new URL(path, BUCKET_URL)
}

export function thumbUrl(inventoryPath: string, assetPath: string) {
  return `${invPathToBaseUrl(inventoryPath)}/${assetPath}`
}

// made seconds optional, even though I don't expect it to ever matter.
const filenameDateMatcher =
  /(?<=^|\D)(?<year>\d{4})[-_]?(?<month>\d{2})[-_]?(?<day>\d{2})[_T\W]{1,3}(?<hours>\d{2})[-_:]?(?<minutes>\d{2})[-_:]?(?<seconds>\d{2})?(?=\D|$)/

function dateObjectFromFilename(filename: string) {
  const match = filename.match(filenameDateMatcher)
  if (!match?.groups) {
    console.error(`getTimestamp could not match ${filename}`)
    return undefined
  }
  const { year, month, day, hours, minutes, seconds } = match.groups
  // timestamps in filenames are usually in local time and usually don't specify a
  // timezone. if we pretend they're UTC, call UTC methods on the date object, and display
  // them without a time zone, the result will match the original (parsed) value. it might
  // make more sense to parse and interpret in local time.
  const isoDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
  try {
    return new Date(isoDate)
  } catch {
    console.error(`failed to construct Date object from ${isoDate}`)
    return undefined
  }
}

type StyleParam = 'full' | 'long' | 'medium' | 'short'

export function timeFromFilename(
  filename: string,
  { timeStyle = 'short' }: { timeStyle?: StyleParam } = {},
) {
  const date = dateObjectFromFilename(filename)
  return date?.toLocaleTimeString('en-US', { timeZone: 'utc', timeStyle })
}

export function dateFromFilename(
  filename: string,
  {
    timeStyle = 'medium',
    dateStyle = 'medium',
  }: { timeStyle?: StyleParam; dateStyle?: StyleParam } = {},
) {
  const date = dateObjectFromFilename(filename)
  return date?.toLocaleString('en-US', {
    timeZone: 'utc',
    timeStyle,
    dateStyle,
  })
}
