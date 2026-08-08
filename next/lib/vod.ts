export const BUCKET_URL = 'https://vod.ohn.sh'
// export const ROOT_INV = `${BUCKET_URL}/root.txt`

/**
 * `/2026-07/27/_category/inventory.json` --> `2026/07/27/_category`
 *
 * @deprecated Use r2PathToSlug instead.
 */
export const invPathToSlug = (invPath: string) =>
  invPath
    // remove leading slash and trailing path segment
    .replace(/^\/|\/[^/]*$/g, '')
    // replace first dash with slash
    .replace(/-/, '/')
    // this is what we're doing for slugs
    .split('/')

export const r2PathToSlug = (r2path: string) => {
  // path after camdir is irrelevant to Next routing
  const [yearMo, day, cam] = r2path.split('/')
  return [...yearMo.split('-'), day, cam]
}

// Using libsql now
// export const getRootList = () =>
//   fetch(ROOT_INV)
//     .then((r) => r.text())
//     .then((t) => t.split('\n').filter(Boolean))

export const slugToR2URL = (slug: string[]) => {
  // basically replace the first '/' with '-'
  const [year, month, ...rest] = slug
  const path = `${year}-${month}/${rest.join('/')}`
  return new URL(path, BUCKET_URL)
}

export const slugToComponents = (vodSlug: string[]) => {
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

export const slugToTitle = (vodSlug: string[]) => {
  const { utcDate, category } = slugToComponents(vodSlug)
  const dateString = utcDate.toLocaleDateString(undefined, {
    dateStyle: 'medium',
    timeZone: 'utc',
  })

  // `timeZone: 'utc'` is crucial to ensure that the day in the slug
  // is the one displayed.
  return `${dateString} — ${category}`
}
