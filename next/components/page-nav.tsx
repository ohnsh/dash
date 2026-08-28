'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { HTMLAttributes } from 'react'
import css from './page-nav.module.css'

export function PageNav(props: HTMLAttributes<HTMLElement>) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  let page = Number(searchParams.get('page') || '1')
  page = Number.isInteger(page) ? Math.max(page, 1) : 1

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    if (params.get('page') === `${page}`) return
    params.set('page', `${page}`)
    router.push(`${pathname}?${params}`, { scroll: false })
  }

  return (
    <nav aria-label="Paging controls" className={css.container} {...props}>
      <span>Page {page}</span>
      <button
        type="button"
        onClick={() => {
          setPage(Math.max(page - 1, 1))
        }}
        disabled={page <= 1}
      >
        ❮
      </button>
      <button
        type="button"
        onClick={() => {
          setPage(page + 1)
        }}
      >
        ❯
      </button>
    </nav>
  )
}
