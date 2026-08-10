import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

//
const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  allowedDevOrigins: ['mak.local'],
  experimental: {
    useTypeScriptCli: true,
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/live',
      },
    ]
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
