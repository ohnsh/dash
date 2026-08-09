export const BUCKET_URL = process.env.BUCKET_URL || 'https://vod.ohn.sh'

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
