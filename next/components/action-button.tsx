'use client'

import { useTransition } from 'react'
import css from './action-button.module.css'
import Spinner from './spinner'

export default function ActionButton({
  action,
  children,
}: {
  action: () => void | Promise<void>
  children: React.ReactNode
}) {
  const [isLoading, startTransition] = useTransition()

  return (
    <button
      className={css.actionButton}
      type="button"
      onClick={() => {
        startTransition(async () => {
          await action()
        })
      }}
      disabled={isLoading}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  )
}
