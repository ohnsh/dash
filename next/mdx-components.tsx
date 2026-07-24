import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'

const components: MDXComponents = {
  h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
  ul: ({ children }) => <ul className="list-disc pl-6 py-4">{children}</ul>,
  a: ({ children, ...props }) => (
    <a className="text-accent underline" {...props}>
      {children}
    </a>
  ),
  Link: ({ children, ...props }) => (
    <Link className="text-accent underline" {...props}>
      {children}
    </Link>
  ),
  blockquote: ({ children }) => (
    <blockquote className="ml-5">{children}</blockquote>
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
