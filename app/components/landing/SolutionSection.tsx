import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '~/components/neo-brutal'

export function SolutionSection() {
  const { t } = useTranslation()

  const solutions = [
    {
      icon: '⚡',
      titleKey: 'solution_speed_title',
      descKey: 'solution_speed_desc',
      highlight: '<500ms',
    },
    {
      icon: '🔒',
      titleKey: 'solution_privacy_title',
      descKey: 'solution_privacy_desc',
    },
    {
      icon: '🎨',
      titleKey: 'solution_design_title',
      descKey: 'solution_design_desc',
    },
    {
      icon: '📊',
      titleKey: 'solution_analytics_title',
      descKey: 'solution_analytics_desc',
      badge: 'PREMIUM',
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 bg-neo-canvas">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-neo-primary text-neo-dark text-xs font-bold px-3 py-1 border-2 border-neo-dark mb-4">
            {t('solution_badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neo-dark mb-4">
            {t('solution_title')}
          </h2>
          <p className="text-gray-700 max-w-xl mx-auto">{t('solution_subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((solution) => (
            <NeoBrutalCard key={solution.titleKey}>
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{solution.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-neo-dark">{t(solution.titleKey)}</h3>
                      {solution.badge ? (
                        <span className="bg-neo-accent text-white text-xs font-bold px-2 py-0.5 border border-neo-dark">
                          {solution.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-gray-600 text-sm">{t(solution.descKey)}</p>
                    {solution.highlight ? (
                      <span className="inline-block mt-3 bg-neo-control px-2 py-1 border border-neo-dark text-sm font-mono font-bold">
                        {solution.highlight}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </NeoBrutalCard>
          ))}
        </div>
      </div>
    </section>
  )
}
