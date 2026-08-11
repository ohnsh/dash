'use client'

import { useSidebarState } from '@/components/sidebar-state-provider'

const HAMBURGER = '☰'

export default function Header() {
  const { isOpen, toggle } = useSidebarState()

  return (
    <header className="flex justify-between">
      <h1>
        <a href="/">dash</a>
      </h1>
      <button type="button" onClick={toggle}>
        {isOpen ? 'close ✕' : `menu ${HAMBURGER}`}
      </button>
    </header>
  )
}
