import { useTranslation } from 'react-i18next'
import { NeoBrutalButton } from '~/components/neo-brutal'

export function FinalCTASection() {
  const { t } = useTranslation()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="py-16 md:py-24 px-4 bg-neo-primary">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neo-dark mb-4">
          {t('final_cta_title')}
        </h2>
        <p className="text-neo-dark/80 mb-8 max-w-lg mx-auto">{t('final_cta_subtitle')}</p>

        <NeoBrutalButton
          type="button"
          variant="secondary"
          className="text-lg px-8 py-4"
          onClick={scrollToTop}
        >
          {t('final_cta_button')}
        </NeoBrutalButton>

        <p className="mt-6 text-sm text-neo-dark/70 font-medium">{t('final_cta_note')}</p>
      </div>
    </section>
  )
}
