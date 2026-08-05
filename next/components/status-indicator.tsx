// Accessible status indicator
// classes `text-online` and `text-offline` made available through tailwind @theme
// config. ● = 'black circle', which is smaller than ⚫︎ 'medium black circle' used in
// stats tables.
export function StatusIndicator({
  online,
  onText = 'Online',
  offText = 'Offline',
  size = 'small',
}: {
  online: boolean
  onText?: string
  offText?: string
  size?: 'small' | 'medium'
}) {
  return online ? (
    <span role="img" aria-label={onText}>
      <span className="text-online" title={onText} aria-hidden>
        {size === 'small' ? '●' : '⚫︎'}
      </span>
    </span>
  ) : (
    <span role="img" aria-label={offText}>
      <span className="text-offline" title={offText} aria-hidden>
        {size === 'small' ? '○' : '⚪︎'}
      </span>
    </span>
  )
}
