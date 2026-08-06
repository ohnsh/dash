import type { BunRequest, Server } from 'bun'

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://mak.local:3000', // when testing from phone
  'https://dash.ohn.sh',
])

type BunHandler<T> = (
  req: BunRequest,
  server: Server<T>,
) => Response | Promise<Response>

// 1. The CORS Middleware Utility
export default function withCORS<T>(handler: BunHandler<T>): BunHandler<T> {
  return async (req, server) => {
    const origin = req.headers.get('origin')
    const isAllowed = origin && ALLOWED_ORIGINS.has(origin)
    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // logs pile up incredibly fast
    // console.log('Request IP:', server.requestIP(req))
    // console.log('X-Forwarded-For:', req.headers.get('X-Forwarded-For'))

    // Automatically handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // Call the actual route handler
    const response = await handler(req, server)

    // Append CORS headers to the handler's response automatically
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value)
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }
}
