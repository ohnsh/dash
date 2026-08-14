export const BUCKET_URL = process.env.BUCKET_URL || 'https://vod.ohn.sh'

export async function paramsToSrc(
  searchParams: Promise<{ v?: string | string[] | undefined }>,
  params?: Promise<{ date?: string }>,
) {
  if (!params) return
  const { date } = await params
  let { v } = await searchParams
  if (Array.isArray(v)) {
    v = v[0]
  }

  // TODO: finish
  if (date) {
    const [year, mo, day] = date.split('-')
    const r2date = `${year}-${mo}/${day}`
    // const r2date = date.replace(/-(?=\d{2}$)/, '/')
    return `${BUCKET_URL}/${r2date}/${v}`
  }
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

export function tsToDateString(
  timestamp: string,
  ...[locale, opts]: Parameters<Date['toLocaleDateString']>
): string {
  return new Date(timestamp).toLocaleDateString(locale, {
    ...opts,
    timeZone: 'utc',
  })
}

export function tsToTimeString(
  timestamp: string,
  ...[locale, opts]: Parameters<Date['toLocaleTimeString']>
): string {
  return new Date(timestamp).toLocaleTimeString(locale, {
    ...opts,
    timeZone: 'utc',
  })
}
