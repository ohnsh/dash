export const BUCKET_URL = process.env.BUCKET_URL || 'https://vod.ohn.sh'

// full keys begin with the date in year-mo/day format
const fullKeyPattern = /^\d{4}-\d{2}[/]\d{2}[/]/

export const keyToFullKey = (k: string, date?: string) => {
  if (fullKeyPattern.test(k)) {
    return k
  }
  if (!date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return undefined
  }
  const [year, mo, day] = date.split('-')
  return `${year}-${mo}/${day}/${k}`
}

export const keyToShortKey = (k: string) => k.replace(fullKeyPattern, '')

export const keyToSrc = (k: string, date?: string) => {
  const fullKey = keyToFullKey(k, date)
  return fullKey && `${BUCKET_URL}/${fullKey}`
}

// given URL info in the form of server page props, get the full key of the current video
export async function paramsToKey(
  searchParams: Promise<{ v?: string | string[] | undefined }>,
  params?: Promise<{ date?: string }>,
) {
  let { v } = await searchParams
  if (!v) {
    return undefined
  } else if (Array.isArray(v)) {
    v = v[0]
  }

  if (fullKeyPattern.test(v)) {
    return v
  }
  if (!params) {
    return undefined
  }
  const { date } = await params
  return keyToFullKey(v, date)
}
export const paramsToSrc = (...args: Parameters<typeof paramsToKey>) =>
  paramsToKey(...args).then((key) => key && `${BUCKET_URL}/${key}`)

export const dateInPathname = (pathname: string) =>
  /^[/]\d{4}-\d{2}-\d{2}/.test(pathname)

// given URL info on the client, get the full key of the current video
export function clientParamsToKey(v: string, pathname?: string) {
  if (fullKeyPattern.test(v)) {
    return v
  }
  if (!pathname || !dateInPathname(pathname)) {
    return undefined
  }
  const [, date] = pathname.split('/')
  return keyToFullKey(v, date)
}
export const clientParamsToSrc = (
  ...args: Parameters<typeof clientParamsToKey>
) => {
  const key = clientParamsToKey(...args)
  return key && `${BUCKET_URL}/${key}`
}

// function getSrc(pathname: string, v: string) {
//   const [, date] = pathname.split('/')
//   const [year, mo, day] = date.split('-')
//   const r2date = `${year}-${mo}/${day}`
//   // const r2date = date.replace(/-(?=\d{2}$)/, '/')

//   return `${BUCKET_URL}/${r2date}/${v}`
// }

export function invPathToComponents(inventoryPath: string) {
  const [yearMo, day, cam, ...rest] = inventoryPath.split('/')
  // leave out literal 'inventory.json'
  const trailer = rest.slice(0, -1)
  return { date: `${yearMo}-${day}`, cam, trailer }
}

// made seconds optional, even though I don't expect it to ever matter.
const filenameDateMatcher =
  /(?<=^|\D)(?<year>\d{4})[-_]?(?<month>\d{2})[-_]?(?<day>\d{2})[_T\W]{1,3}(?<hours>\d{2})[-_:]?(?<minutes>\d{2})[-_:]?(?<seconds>\d{2})?(?=\D|$)/

export function timestampFromFilename(filename: string) {
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
    return new Date(isoDate).toISOString()
  } catch {
    console.error(`failed to construct Date object from ${isoDate}`)
    return undefined
  }
}

export function tsToString(
  timestamp: string,
  opts: Parameters<Date['toLocaleString']>['1'],
): string {
  return new Date(timestamp).toLocaleString(undefined, {
    ...opts,
    timeZone: 'utc',
  })
}
