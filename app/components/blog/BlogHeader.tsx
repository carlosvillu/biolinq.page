import { useTranslation } from 'react-i18next'

export function BlogHeader() {
  const { t } = useTranslation()

  return (
    <header className="bg-panel border-b-[3px] border-dark">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="font-bold text-4xl md:text-5xl tracking-tighter text-dark">
          {t('blog_title')}
        </h1>
        <p className="text-xl text-dark/80 mt-4">{t('blog_description')}</p>
      </div>
    </header>
  )
}
