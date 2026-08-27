import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

//
const nextConfig: NextConfig = {
  cacheComponents: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  allowedDevOrigins: ['mak.local'],
  experimental: {
    useTypeScriptCli: true,
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
