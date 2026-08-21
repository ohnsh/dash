import Bun from 'bun'
import { appendFile } from 'node:fs/promises'
import withCORS from './with-cors'

const MMTX_API_URL = import.meta.env.MMTX_API_URL || 'http://localhost:9997/v3'
const SENSOR_DATA_FILE = '/mnt/data/sensor-data.json'

const eventStreamMap = new Map<string, ReadableStreamDefaultController>()

// run with `bun --port=4100`, `BUN_PORT=4100`, `PORT=4100`, or `NODE_PORT=4100`

Bun.serve({
  routes: {
    '/mx/diag': withCORS(async (req, server) => {
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
    }),

    '/mx/snapshot/:snap': withCORS(async (req, server) => {
      console.log('snapshot route')
      const { snap } = req.params
      const map = {
        wuuk: {
          url: 'http://ing-wuuk.local/x/ch0.jpg',
          token: import.meta.env.WUUK_API_KEY,
        },
        'wuuk-patch': {
          url: 'http://ing-wuuk.local/x/ch0.jpg',
          token: import.meta.env.WUUK_API_KEY,
        },
        wyze1: {
          url: 'http://ing-wyze-1.local/x/ch0.jpg',
          token: import.meta.env.WYZE1_API_KEY,
        },
        wyze2: {
          url: 'http://ing-wyze-2.local/x/ch0.jpg',
          token: import.meta.env.WYZE2_API_KEY,
        },
      }
      const isKey = (key: string): key is keyof typeof map => key in map

      if (!snap?.endsWith('.jpg')) {
        return Response.json(
          { error: 'Request URL must end in .jpg' },
          { status: 404 },
        )
      }

      const cam = snap.replace(/\.jpg$/, '')
      if (!isKey(cam)) {
        return Response.json(
          { error: `No camera named ${cam}` },
          { status: 404 },
        )
      }

      // promising javascript mdns implementations:
      // https://github.com/mafintosh/multicast-dns
      // https://github.com/onlxltd/bonjour-service

      const { url, token } = map[cam]
      if (!token) {
        return Response.json(
          { error: `No API key available for ${cam}` },
          { status: 401 },
        )
      }

      const urlObj = new URL(url)
      urlObj.searchParams.set('token', token)
      // thingino apparently used to do auth this way:
      // { headers: { 'X-API-Key': token } }
      const upstream = await fetch(urlObj)

      // By default, Cloudflare caches static assets like jpegs for a few hours.
      // It does not respect request `Cache-Control: no-cache` headers, but it does
      // respect cache-control headers in responses from the origin (implemented
      // below). Another option is a cache-busting query parameter in the request (works
      // transparently through this route handler).
      const headers = new Headers(upstream.headers)
      headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, max-age=0',
      )
      headers.set('Pragma', 'no-cache')
      headers.set('Expires', '0')

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      })
    }),

    '/mx/paths/list': withCORS(() => fetch(`${MMTX_API_URL}/paths/list`)),

    '/mx/paths/get/:stream': withCORS((req) => {
      const { stream } = req.params
      return fetch(`${MMTX_API_URL}/paths/get/${stream}`)
      // const resp = await fetch(`${MMTX_API_URL}/paths/get/${stream}`)
      // return new Response(resp.body, resp)
    }),

    '/mx/status': withCORS(async () => {
      const fetchJson = (path: string) =>
        fetch(`${MMTX_API_URL}/${path}/list`).then((r) => r.json())

      const hlssessions = await fetchJson('hlssessions')
      const webrtcsessions = await fetchJson('webrtcsessions')
      const rtspconns = await fetchJson('rtspconns')
      // const rtmpConnResp = await fetch(`${MMTX_API_URL}/rtmpconns/list`)

      return Response.json({ hlssessions, webrtcsessions, rtspconns })
    }),

    '/mx/events': withCORS((req, server) => {
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
    }),

    '/priv/hook': (req) => {
      const query = new URL(req.url).searchParams
      query.set('timestamp', new Date().toISOString())
      // const path = url.searchParams.get('path') // $MTX_PATH
      // const reader_type = url.searchParams.get('reader_type') // $MTX_READER_TYPE
      // const reader_id = url.searchParams.get('reader_id') // $MTX_READER_ID

      // console.log(`/priv/hook called with ${url.search}`)
      for (const sc of eventStreamMap.values()) {
        sc.enqueue(`event: mmtx-hook\ndata: ${query.toString()}\n\n`)
      }
      return new Response('thx.')
    },

    '/mx/sensor': {
      POST: async (req) => {
        const auth = req.headers.get('Authorization')
        if (!auth || !checkAuthHeader(auth)) {
          console.log(`Unauthorized POST /sensor (${auth})`)

          return new Response(null, {
            status: 401,
            statusText: 'Unauthorized',
            headers: { 'WWW-Authenticate': 'Bearer' },
          })
        }

        const data = await req.json()
        appendFile(SENSOR_DATA_FILE, JSON.stringify(data) + '\n')

        return new Response(null, { status: 204 })
      },
    },
  },
})

const checkAuthHeader = (auth: string) =>
  auth === `Bearer ${import.meta.env.SENSOR_PUSH_TOKEN}`
