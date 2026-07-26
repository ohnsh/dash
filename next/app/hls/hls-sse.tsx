'use client'

import { useEffect, useState } from 'react'
import DefList from '@/components/definition-list'

interface DashdEvent {
  id: string
  data: Record<string, string>
}

export default function HlsStatStream() {
  const [events, setEvents] = useState<DashdEvent[]>([])

  useEffect(() => {
    const es = new EventSource('https://d.ohn.sh/mx/events')

    // es.addEventListener('message', (ev) => {
    //   console.log(ev.data)
    // })

    // es.addEventListener('open', (ev) => {
    //   console.log(ev)
    // })

    // should consider using simple messages instead of events

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

      setEvents((events) => [...events, { id, data }])
    })

    return () => {
      es.close()
    }
  }, [])

  return (
    <div>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <DefList entries={Object.entries(event.data)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
