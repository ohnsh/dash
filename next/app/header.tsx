'use client'

export default function Header({
  toggleSidebar,
}: {
  toggleSidebar: () => void
}) {
  return (
    <header>
      <h1>
        <a href="/">
          <code>dash</code>
        </a>
      </h1>
    </header>
  )
}
