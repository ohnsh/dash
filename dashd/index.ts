import Bun from 'bun'

const MMTX_API_URL = 'http://localhost:9997/v3'

const eventStreamMap = new Map<string, ReadableStreamDefaultController>()

Bun.serve({
  hostname: '0.0.0.0',
  routes: {
    '/mx/diag': async (req, server) => {
      //subscriberCount
      const { address, url, pendingRequests, pendingWebSockets } = server
      const resp = {
        address,
        url,
        pendingRequests,
        pendingWebSockets,
      }
      const sseSubscribers = eventStreamMap.size
      const realSourceIP = req.headers.get('CF-Connecting-IP')
      const requestIP = server.requestIP(req)
      return Response.json({ ...resp, realSourceIP, requestIP, sseSubscribers })
    },
    '/mx/streams': async (_req) => {
      const resp = await fetch(`${MMTX_API_URL}/paths/list`)
      return new Response(resp.body, resp)
    },
    '/mx/streams-alt': async (_req) => {
      const resp = await fetch(`${MMTX_API_URL}/paths/list`)
      const json = await resp.json()

      return Response.json(json, resp)
    },
    '/mx/streams/:stream': async (req) => {
      const { stream } = req.params
      return fetch(`${MMTX_API_URL}/paths/get/${stream}`)
      // const resp = await fetch(`${MMTX_API_URL}/paths/get/${stream}`)
      // return new Response(resp.body, resp)
    },
    '/mx/status': async (_req) => {
      const resp = await fetch(`${MMTX_API_URL}/hlssessions/list`)
      return new Response(resp.body, resp)
    },
    '/mx/events': (req, server) => {
      server.timeout(req, 0)
      let uuid: string

      const stream = new ReadableStream({
        start(controller) {
          uuid = crypto.randomUUID()
          eventStreamMap.set(uuid, controller)
          controller.enqueue('event: init\ndata: SSE stream initialized\n\n')
        },
        cancel() {
          // The controller is already closed when `cancel` is called
          // const controller = eventStreamMap.get(uuid)
          eventStreamMap.delete(uuid)
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    },
    '/priv/hook': (req) => {
      const url = new URL(req.url)
      // const path = url.searchParams.get('path') // $MTX_PATH
      // const reader_type = url.searchParams.get('reader_type') // $MTX_READER_TYPE
      // const reader_id = url.searchParams.get('reader_id') // $MTX_READER_ID

      console.log(`/priv/hook called with ${url.search}`)
      for (const sc of eventStreamMap.values()) {
        sc.enqueue(`event: mmtx-hook\ndata: ${url.search}\n\n`)
      }
      return new Response('Ok.')
    },
  },
})
