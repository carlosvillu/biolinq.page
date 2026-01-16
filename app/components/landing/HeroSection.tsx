import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          [PROJECT_NAME]
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          A modern SaaS template with authentication, database, and i18n built-in.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/auth/signup">{t('signup')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/auth/login">{t('login')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
