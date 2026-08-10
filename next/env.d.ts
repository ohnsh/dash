declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TURSO_DATABASE_URL: string
      TURSO_AUTH_TOKEN: string
    }
  }
}

// crucial for Typescript to actually use this augmentation.
export {}
