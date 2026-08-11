'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { IndexRow } from '@/lib/turso'

export type InventoryMap = Record<string, string[] | undefined>

export interface InventoryContext {
  inventoryMap: InventoryMap | undefined
  setInventories: (i: IndexRow[]) => void
  toggleFilter: () => void
}

const InventoryContext = createContext<InventoryContext | undefined>(undefined)

const defaultFilter = (i: IndexRow[]) =>
  i.filter(({ inventory_path }) => !inventory_path.includes('/_wyze_bed'))

export default function InventoryProvider({
  inventories: initialInventories,
  filter = defaultFilter,
  children,
}: {
  inventories?: IndexRow[]
  filter?: (i: IndexRow[]) => IndexRow[]
  children: React.ReactNode
}) {
  const [inventories, setInventories] = useState<IndexRow[] | undefined>(
    initialInventories,
  )
  const [isFiltered, setIsFiltered] = useState(true)

  const inventoryMap = useMemo(() => {
    const filtered =
      isFiltered && inventories ? filter(inventories) : inventories
    return filtered?.reduce<InventoryMap>((prev, current) => {
      const day = prev[current.date] ?? []
      day.push(current.inventory_path)
      prev[current.date] ??= day
      return prev
    }, {})
  }, [isFiltered, inventories, filter])

  const toggleFilter = useCallback(() => {
    setIsFiltered((prev) => !prev)
  }, [])

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'KeyB') {
        // toggleFilter()
        setIsFiltered((prev) => !prev)
      }
    }

    window.addEventListener('keydown', keyHandler)

    return () => {
      window.removeEventListener('keydown', keyHandler)
    }
  }, [])

  return (
    <InventoryContext.Provider
      value={{
        inventoryMap,
        toggleFilter,
        setInventories,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)

  if (!context) {
    throw new Error(
      'useInventory must be called from a descendant of InventoryProvider',
    )
  }

  return context
}
