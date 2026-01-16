import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '~/components/ThemeToggle'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-silver py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-serif text-xl italic">[PROJECT_NAME]</span>
          <div className="flex items-center gap-8 text-sm text-slate">
            <a href="#" className="hover:text-ink transition-colors">
              {t('footer_terms')}
            </a>
            <a href="#" className="hover:text-ink transition-colors">
              {t('footer_privacy')}
            </a>
            <a href="#" className="hover:text-ink transition-colors">
              {t('footer_contact')}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <p className="text-sm text-slate">{t('footer_copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
