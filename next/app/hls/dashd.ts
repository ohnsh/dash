import type { components, operations } from '@/mediamtx-openapi'

export const DASHD_BASE = 'https://d.ohn.sh/mx'

type StatusCode<Op extends keyof operations> = keyof operations[Op]['responses']

export type ContentByStatus<
  Op extends keyof operations,
  Status extends StatusCode<Op> = StatusCode<Op>,
> = operations[Op]['responses'][Status] extends {
  content: { 'application/json': infer T }
}
  ? T
  : never

export type PathsList = components['schemas']['PathList']['items']
// export type Path = components['schemas']['Path']

export interface TResponse<T> extends Response {
  json: () => Promise<T>
}

export function isOk<Op extends keyof operations>(
  response: Response,
): response is TResponse<ContentByStatus<Op, SuccessCode>> {
  return response.ok
}

export function isError<Op extends keyof operations>(
  response: Response,
): response is TResponse<ContentByStatus<Op, ErrorCode<Op>>> {
  return !response.ok
}

type SuccessCode = 200
type ErrorCode<Op extends keyof operations> = Exclude<
  StatusCode<Op>,
  SuccessCode
>

export type SuccessType<Op extends keyof operations> = ContentByStatus<
  Op,
  SuccessCode
>
export type ErrorType<Op extends keyof operations> = ContentByStatus<
  Op,
  ErrorCode<Op>
>

export type Operation = keyof operations

export type UnpackResult<Op extends keyof operations> =
  | { data: SuccessType<Op>; error?: never }
  | { error: ErrorType<Op>; data?: never }

export async function unpack<Op extends keyof operations>(
  response: Response,
): Promise<UnpackResult<Op>> {
  if (isOk<Op>(response)) {
    return { data: await response.json() }
  } else if (isError<Op>(response)) {
    return { error: await response.json() }
  } else {
    throw response
  }
}
