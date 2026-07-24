import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'

const components: MDXComponents = {
  // h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
  Link: ({ children, ...props }) => <Link {...props}>{children}</Link>,
}

export function useMDXComponents(): MDXComponents {
  return components
}
