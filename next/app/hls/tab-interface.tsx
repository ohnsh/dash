import { useState } from 'react'
import css from './tab-interface.module.css'

export function TabInterface({
  children,
}: {
  children: React.ReactElement<TabProps>[]
}) {
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    const defaultIndex = children.findIndex((tab) => tab.props.default)
    return defaultIndex !== -1 ? defaultIndex : 0
  })

  return (
    <div className={css.tabInterface}>
      <div role="tablist">
        {children.map((tab, index) => (
          <button
            role="tab"
            type="button"
            aria-selected={activeTabIndex === index || undefined}
            key={tab.props.name}
            onClick={() => setActiveTabIndex(index)}
          >
            {tab.props.name}
          </button>
        ))}
      </div>
      <div role="tabpanel">{children[activeTabIndex]}</div>
    </div>
  )
}

interface TabProps {
  name: string
  default?: boolean
  children: React.ReactNode | React.ReactNode[]
}

export function Tab({ children }: TabProps) {
  return children
}
