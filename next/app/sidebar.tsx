import css from './layout.module.css'
import Content from './sidebar.mdx'

export default async function Sidebar() {
  return (
    <aside className={css.sidebar}>
      <Content />
    </aside>
  )
}
