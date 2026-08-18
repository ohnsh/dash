export const pathMap = {
  wuuk: 'wuuk-patch',
  wyze1: 'wyze1-patch',
  wyze2: 'wyze2',
  // desk: 'desk',
  // quad: 'quad',
} as const

export type StreamKey = keyof typeof pathMap

export const isValidStream = (name: unknown): name is StreamKey =>
  typeof name === 'string' && Object.hasOwn(pathMap, name)

export const cls = (...classes: Array<string | string[] | undefined>) =>
  classes.flat().filter(Boolean).join(' ')
