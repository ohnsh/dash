'use client'

const HAMBURGER = '☰'

export default function Header({
  isSidebarOpen,
  toggleSidebar,
}: {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}) {
  return (
    <header className="flex justify-between">
      <h1>
        <a href="/">dash</a>
      </h1>
      <button type="button" onClick={toggleSidebar}>
        {isSidebarOpen ? 'close ✕' : `menu ${HAMBURGER}`}
      </button>
    </header>
  )
}
