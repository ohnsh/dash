// mdx.d.ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'

  const component: ComponentType<any>
  export default component
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TURSO_DATABASE_URL: string
      TURSO_AUTH_TOKEN: string
    }
  }
}
