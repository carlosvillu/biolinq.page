import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'

interface LivePreviewProps {
  username: string
}

export function LivePreview({ username }: LivePreviewProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const iframeSrc = `/${username}?preview=1&t=${refreshKey}`

  const handleRefresh = () => {
    setIsLoading(true)
    setLoadError(false)
    setRefreshKey((prev) => prev + 1)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setLoadError(true)
  }

  return (
    <div className="hidden lg:flex flex-col items-center sticky top-8 h-[calc(100vh-4rem)]">
      {/* Header with indicator and refresh button */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full border border-neo-dark animate-pulse" />
        <span className="font-mono text-sm">{t('dashboard_live_preview')}</span>
        <button
          onClick={handleRefresh}
          aria-label={t('dashboard_refresh_preview')}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Phone Frame */}
      <div className="relative w-[320px] h-[640px] border-[4px] border-neo-dark rounded-[2.5rem] bg-neo-dark shadow-hard-lg overflow-hidden p-2">
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-neo-dark border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500 font-mono">
                  {t('dashboard_preview_loading')}
                </span>
              </div>
            </div>
          )}

          {/* Error state */}
          {loadError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <p className="text-sm text-red-500 font-mono text-center px-4">
                {t('dashboard_preview_error')}
              </p>
            </div>
          )}

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={iframeSrc}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={t('dashboard_live_preview')}
          />
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neo-dark rounded-b-xl z-20" />
      </div>
    </div>
  )
}
