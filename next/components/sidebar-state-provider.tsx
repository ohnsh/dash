'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface SidebarContext {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContext | undefined>(undefined)

export default function SidebarStateProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])
  const open = useCallback(() => {
    setIsOpen(true)
  }, [])
  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarState() {
  const context = useContext(SidebarContext)

  if (!context) {
    throw new Error(
      'Must call useSidebarState from a descendant of <SidebarStateProvider>',
    )
  }

  return context
}
