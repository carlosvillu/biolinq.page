import type { Theme } from '~/lib/themes'

type WatermarkProps = {
  theme: Theme
}

export function Watermark({ theme }: WatermarkProps) {
  const isDarkTheme = theme.id === 'dark_mode'

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <a
        href="https://biolinq.page"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5
          text-xs font-mono rounded-full transition-opacity
          opacity-60 hover:opacity-100"
        style={{
          backgroundColor: isDarkTheme ? 'var(--theme-card-bg)' : 'var(--theme-text)',
          color: isDarkTheme ? 'var(--theme-text)' : 'var(--theme-card-bg)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--theme-border)',
        }}
      >
        <span>Powered by</span>
        <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>
          BioLinq
        </span>
      </a>
    </div>
  )
}
