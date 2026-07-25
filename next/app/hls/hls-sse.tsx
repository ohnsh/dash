'use client'

import { useEffect, useRef } from 'react'

export default function HlsStatStream({ stream }: { stream: string }) {
  const evRef = useRef<EventSource>(null)

  useEffect(() => {
    const es = new EventSource('https://d.ohn.sh/mx/events')
    evRef.current = es

    es.addEventListener('message', (ev) => {
      console.log(ev.data)
    })

    es.addEventListener('init', (ev) => {
      console.log(ev.data)
    })

    return () => {
      es.close()
      evRef.current = null
    }
  }, [])

  return <div></div>
}
