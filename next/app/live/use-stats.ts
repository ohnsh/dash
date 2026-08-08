import { useCallback, useEffect, useState } from 'react'
import {
  DASHD_BASE,
  type DashdEvent,
  DashdEventSchema,
  type ErrorType,
  type Path,
  type UnpackResult,
  unpack,
} from './dashd'

type DResult = UnpackResult<'pathsList'>
type DError = ErrorType<'pathsList'> | 'non-api-error'

export default function useStats({
  init,
  endpoint = `${DASHD_BASE}/paths/list`,
  eventEndpoint = `${DASHD_BASE}/events`,
}: {
  init?: DResult
  endpoint?: string
  eventEndpoint?: string
}) {
  const [data, setData] = useState<Path[]>(init?.data?.items ?? [])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<DError | null>(null)
  const [events, setEvents] = useState<DashdEvent[]>([])

  const fetchStats = useCallback(() => {
    setLoading(true)
    fetch(endpoint)
      .then(unpack<'pathsList'>)
      .then((result) => {
        if (result.data) {
          setData(result.data.items ?? [])
          setError(null)
        } else {
          setError(result.error)
        }
      })
      .catch((err) => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [endpoint])

  useEffect(() => {
    if (!init) {
      fetchStats()
    }
  }, [init, fetchStats])

  useEffect(() => {
    const es = new EventSource(eventEndpoint)

    es.onerror = (_ev) => {
      // happens regularly; seemingly always an empty object:
      // console.error(ev)
    }

    es.addEventListener('init', (ev) => {
      console.log('SSE init:', ev.data)
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

      const event = DashdEventSchema.parse({ id, ...data })

      // cap size of history
      setEvents((prev) => [event, ...prev.slice(0, 49)])
      fetchStats()
    })

    return () => {
      es.close()
    }
  }, [fetchStats, eventEndpoint])

  return { data, error, loading, events }
}
