import { useTranslation } from 'react-i18next'

export function ComparisonSection() {
  const { t } = useTranslation()

  const rows = [
    {
      labelKey: 'comparison_price_label',
      othersKey: 'comparison_price_others',
      biolinqKey: 'comparison_price_biolinq',
    },
    {
      labelKey: 'comparison_speed_label',
      othersKey: 'comparison_speed_others',
      biolinqKey: 'comparison_speed_biolinq',
    },
    {
      labelKey: 'comparison_setup_label',
      othersKey: 'comparison_setup_others',
      biolinqKey: 'comparison_setup_biolinq',
    },
    {
      labelKey: 'comparison_ownership_label',
      othersKey: 'comparison_ownership_others',
      biolinqKey: 'comparison_ownership_biolinq',
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12 text-neo-dark">
          {t('comparison_title')}
        </h2>

        <div className="border-3 border-neo-dark shadow-neo overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neo-dark text-white">
                <th className="py-4 px-4 text-left font-bold text-sm">{t('comparison_feature')}</th>
                <th className="py-4 px-4 text-center font-bold text-sm">
                  {t('comparison_others')}
                </th>
                <th className="py-4 px-4 text-center font-bold text-sm bg-neo-primary text-neo-dark">
                  {t('comparison_biolinq')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.labelKey} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-4 px-4 font-medium text-neo-dark border-t border-neo-dark">
                    {t(row.labelKey)}
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600 border-t border-neo-dark">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-neo-accent">✗</span>
                      <span className="text-sm">{t(row.othersKey)}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center bg-neo-primary/20 border-t border-neo-dark">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm font-medium text-neo-dark">{t(row.biolinqKey)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
