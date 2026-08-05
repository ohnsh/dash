export const BUCKET_URL = 'https://vod.ohn.sh'
export const ROOT_INV = `${BUCKET_URL}/root.txt`

// `/2026-07/27/_category/inventory.json` --> `2026/07/27/_category`
export const invPathToSlug = (invPath: string) =>
  invPath
    // remove leading slash and trailing path segment
    .replace(/^\/|\/[^/]*$/g, '')
    // replace first dash with slash
    .replace(/-/, '/')

export const getRootList = () =>
  fetch(ROOT_INV)
    .then((r) => r.text())
    .then((t) => t.split('\n').filter(Boolean))

export const vodSlugToR2URL = (vodSlug: string[]) => {
  // intentionally replace only the first '/'
  const path = [...vodSlug, 'inventory.json'].join('/').replace(/\//, '-')
  return new URL(path, BUCKET_URL)
}

export const vodSlugToComponents = (vodSlug: string[]) => {
  const [year, month, day, ...rest] = vodSlug

  // will be parsed as UTC, so it's important to use/display as UTC
  // (or the day will change)
  const utcDate = new Date(`${year}-${month}-${day}`)

  // check on the above because it's sort of an accident of JavaScript history
  if (utcDate.getUTCDate() !== Number(day)) {
    throw new Error(
      'Date constructor unexpectedly returned the wrong date, possibly because it parsed the slug using local time.',
    )
  }

  // remove leading _ from categories, render as `cat1/cat2` when nested
  const category = rest.map((seg) => seg.replace(/^_+/, '')).join('/')

  return { utcDate, category }
}

export const vodSlugToTitle = (vodSlug: string[]) => {
  const { utcDate, category } = vodSlugToComponents(vodSlug)
  const dateString = utcDate.toLocaleDateString(undefined, {
    dateStyle: 'medium',
    timeZone: 'utc',
  })

  // `timeZone: 'utc'` is crucial to ensure that the day in the slug
  // is the one displayed.
  return `${dateString} — ${category}`
}
