import Bun from 'bun'

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'https://dash.ohn.sh',
])

// 1. The CORS Middleware Utility
export default function withCORS<T>(
  handler: (
    req: Request,
    server: Bun.Server<T>,
  ) => Promise<Response> | Response,
) {
  return async (req: Request, server: Bun.Server<T>) => {
    const origin = req.headers.get('origin')
    const isAllowed = origin && ALLOWED_ORIGINS.has(origin)
    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

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
