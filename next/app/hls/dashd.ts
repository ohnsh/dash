import { z } from 'zod'
import type { components, operations } from '@/mediamtx-openapi'

export const DASHD_BASE = 'https://d.ohn.sh/mx'

type StatusCode<Op extends keyof operations> = keyof operations[Op]['responses']

export type ContentByStatus<
  Op extends keyof operations,
  Status extends StatusCode<Op> = StatusCode<Op>,
> =
  Status extends StatusCode<Op>
    ? operations[Op]['responses'][Status] extends {
        content: { 'application/json': infer T }
      }
      ? T
      : never
    : never

export type Path = components['schemas']['Path']

export interface TResponse<T> extends Response {
  json: () => Promise<T>
}

export function isOk<Op extends keyof operations>(
  response: Response,
): response is TResponse<SuccessType<Op>> {
  return response.ok
}

export function isError<Op extends keyof operations>(
  response: Response,
): response is TResponse<ErrorType<Op>> {
  return !response.ok
}

type SuccessCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | '2XX'

type ErrorCode<Op extends keyof operations> = Exclude<
  StatusCode<Op>,
  SuccessCode
>

export type SuccessType<Op extends keyof operations> = ContentByStatus<
  Op,
  Extract<StatusCode<Op>, SuccessCode>
>

export type ErrorType<Op extends keyof operations> = ContentByStatus<
  Op,
  ErrorCode<Op>
>

export type Operation = keyof operations

export type UnpackResult<Op extends keyof operations> =
  | { data: SuccessType<Op>; error?: never }
  | { error: ErrorType<Op>; data?: never }
  | { error: 'non-api-error'; data?: never }

export async function unpack<Op extends keyof operations>(
  response: Response,
): Promise<UnpackResult<Op>> {
  if (isOk<Op>(response)) {
    return { data: await response.json() }
  } else if (isError<Op>(response)) {
    try {
      return { error: await response.json() }
    } catch (_err) {
      return { error: 'non-api-error' }
    }
  } else {
    throw response
  }
}

export const DashdEventSchema = z.object({
  id: z.string(),
  event: z.enum(['read', 'close']),
  path: z.string(),
  reader_type: z.string(),
  timestamp: z.coerce.date(),
})

export type DashdEvent = z.infer<typeof DashdEventSchema>
