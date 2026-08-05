// import InventoryList from './inv-list'

export default async function VODLayout({
  children,
}: {
  children: React.ReactElement
}) {
  return <div className="vod-layout">{children}</div>
  // <section className="sidebar">
  //   <InventoryList />
  // </section>
}
