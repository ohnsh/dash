import { useCallback, useEffect, useRef, useState } from 'react'
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
  | { status: 'init'; data?: never; error?: never }
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

const initState = { status: 'init' } as const

interface PromiseRef {
  promise: Promise<UnpackResult<'pathsList'>>
  stale: boolean
}

export default function useStats(
  init?: UnpackResult<'pathsList'>,
  endpoint = DASHD_BASE,
): State & { events: DashdEvent[] } {
  const [state, setState] = useState<State>(
    init ? resultToState(init) : initState,
  )
  const [events, setEvents] = useState<DashdEvent[]>([])
  const promiseRef = useRef<PromiseRef | null>(null)
  const { status, data, error } = state

  const fetchStats = useCallback(() => {
    if (promiseRef.current?.promise) {
      promiseRef.current.stale = true
      return
    }

    console.log('setting state to loading')
    setState({ status: 'loading' })
    const promise = fetch(`${endpoint}/paths/list`).then(unpack<'pathsList'>)
    promise.then((result) => {
      console.log('setting state to', resultToState(result))
      setState(resultToState(result))
      const stale = promiseRef.current?.stale ?? false
      promiseRef.current = null
      if (stale) {
        fetchStats()
      }
    })
  }, [endpoint])

  if (status === 'init' && !init) {
    fetchStats()
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
      // shorter than crypto.randomUUID output
      const id = crypto.getRandomValues(new Uint8Array(8)).toBase64()

      setEvents((events) => [{ id, data }, ...events])
      fetchStats()
    })

    return () => {
      es.close()
    }
  }, [fetchStats])

  if (status === 'loading') {
    return { status, events }
  }
  if (status === 'success') {
    return { status, data, events }
  }
  if (status === 'init') {
    return { status, events }
  }
  return { status, error, events }
}
