import { useEffect, useState } from 'react'
import {
  DASHD_BASE,
  type ErrorType,
  type SuccessType,
  type UnpackResult,
  unpack,
} from './dashd'

interface DashdEvent {
  id: string
  data: Record<string, string>
}

type State =
  | {
      status: 'success'
      data: NonNullable<SuccessType<'pathsList'>['items']>
      error?: never
    }
  | { status: 'loading'; data?: never; error?: never }
  | {
      status: 'error'
      error: ErrorType<'pathsList'> | 'non-api-error'
      data?: never
    }

const resultToState = ({ data, error }: UnpackResult<'pathsList'>): State => {
  if (data) {
    return { status: 'success', data: data.items ?? [] }
  } else {
    return { status: 'error', error }
  }
}

let promise: Promise<Response>

const initState = { status: 'loading' } as const

// type Test2 = { [T in Operation]: Promise<UnpackResult<T>> }
// const promiseMap = new Map<string, Promise<UnpackResult<'pathsList'>>>()

export default function useStats(
  init?: UnpackResult<'pathsList'>,
  endpoint = DASHD_BASE,
): State & { events: DashdEvent[] } {
  const [state, setState] = useState<State>(
    init ? resultToState(init) : initState,
  )
  const [events, setEvents] = useState<DashdEvent[]>([])
  const { status, data, error } = state

  function wireUp(promise: Promise<Response>) {
    promise.then(unpack<'pathsList'>).then((result) => {
      setState(resultToState(result))
    })
  }

  if (!promise) {
    promise = fetch(`${endpoint}/paths/list`)
    wireUp(promise)
  }

  useEffect(() => {
    const es = new EventSource('https://d.ohn.sh/mx/events')

    // es.addEventListener('message', (ev) => {
    //   console.log(ev.data)
    // })

    // es.addEventListener('open', (ev) => {
    //   console.log(ev)
    // })

    es.onerror = (ev) => {
      console.error(ev)
    }

    es.addEventListener('init', (ev) => {
      console.log(ev.data)
    })

    es.addEventListener('mmtx-hook', (ev) => {
      const params = new URLSearchParams(ev.data)
      if (params.get('reader_type') === 'rtspSession') {
        // for patched streams, this is the internal half of a pair
        // of connections (the other being an hlsSession)
        return
      }
      // UUID used internally by MediaMTX
      params.delete('reader_id')

      const data = Object.fromEntries(params.entries())
      // just putzing around. Not as long as crypto.randomUUID output
      const id = crypto.getRandomValues(new Uint8Array(8)).toBase64()

      setEvents((events) => [{ id, data }, ...events])
    })

    return () => {
      es.close()
    }
  }, [])

  if (status === 'loading') {
    return { status, events }
  }
  if (status === 'success') {
    return { status, data, events }
  }
  return { status, error, events }
}
