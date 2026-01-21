import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '~/components/neo-brutal'

export function ProblemSection() {
  const { t } = useTranslation()

  const problems = [
    {
      icon: '💸',
      titleKey: 'problem_subscriptions_title',
      descKey: 'problem_subscriptions_desc',
    },
    {
      icon: '🐌',
      titleKey: 'problem_speed_title',
      descKey: 'problem_speed_desc',
    },
    {
      icon: '🔊',
      titleKey: 'problem_noise_title',
      descKey: 'problem_noise_desc',
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 bg-neo-panel">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4 text-neo-dark">
          {t('problem_title')}
        </h2>
        <p className="text-gray-700 text-center mb-12 max-w-xl mx-auto">{t('problem_subtitle')}</p>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <NeoBrutalCard key={problem.titleKey}>
              <div className="text-center">
                <span className="text-4xl mb-4 block">{problem.icon}</span>
                <h3 className="text-lg font-bold text-neo-dark mb-2">{t(problem.titleKey)}</h3>
                <p className="text-gray-600 text-sm">{t(problem.descKey)}</p>
              </div>
            </NeoBrutalCard>
          ))}
        </div>
      </div>
    </section>
  )
}
