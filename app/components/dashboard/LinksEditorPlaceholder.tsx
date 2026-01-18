import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'

interface LinksEditorPlaceholderProps {
  linkCount: number
}

export function LinksEditorPlaceholder({
  linkCount,
}: LinksEditorPlaceholderProps) {
  const { t } = useTranslation()

  return (
    <NeoBrutalCard variant="panel">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {t('dashboard_my_links')} ({linkCount}/5)
          </h2>
        </div>

        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 font-mono">
            {t('dashboard_links_coming_soon')}
          </p>
        </div>
      </div>
    </NeoBrutalCard>
  )
}
