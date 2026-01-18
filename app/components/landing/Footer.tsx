import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t-[3px] border-neo-dark bg-neo-canvas py-8">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Links */}
        <div className="flex gap-6 text-sm font-medium">
          <Link to="/terms" className="hover:underline">
            {t('footer_terms')}
          </Link>
          <Link to="/privacy" className="hover:underline">
            {t('footer_privacy')}
          </Link>
        </div>

        {/* Copyright */}
        <p className="font-mono text-sm text-gray-700">© 2026 BioLinq. {t('footer_rights')}</p>
      </div>
    </footer>
  )
}
