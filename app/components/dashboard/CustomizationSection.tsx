import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { ThemeSelector } from './ThemeSelector'
import { ColorPickers } from './ColorPickers'
import { useThemeCustomization } from '~/hooks/useThemeCustomization'
import { getThemeById, type ThemeId } from '~/lib/themes'
import { cn } from '~/lib/utils'

interface CustomizationSectionProps {
  currentTheme: ThemeId
  customPrimaryColor: string | null
  customBgColor: string | null
  biolinkId: string
  isPremium: boolean
}

export function CustomizationSection({
  currentTheme,
  customPrimaryColor,
  customBgColor,
  biolinkId,
  isPremium,
}: CustomizationSectionProps) {
  const { t } = useTranslation()
  const fetcher = useFetcher()

  const {
    selectedTheme,
    primaryColor,
    bgColor,
    hasChanges,
    setTheme,
    setPrimaryColor,
    setBgColor,
    resetColors,
  } = useThemeCustomization({
    initialTheme: currentTheme,
    initialPrimaryColor: customPrimaryColor,
    initialBgColor: customBgColor,
  })

  const currentThemeConfig = getThemeById(selectedTheme)
  const isLocked = !isPremium
  const isSubmitting = fetcher.state === 'submitting'

  return (
    <NeoBrutalCard variant="white">
      <h3 className="text-lg font-bold mb-6">{t('customization_title')}</h3>

      {/* Content with blur for free users */}
      <div className="relative">
        <div className={cn(isLocked && 'opacity-50 blur-[1px] select-none pointer-events-none')}>
          <ThemeSelector
            selectedTheme={selectedTheme}
            onThemeChange={setTheme}
            disabled={isLocked}
          />

          <div className="border-t border-gray-200 my-6" />

          <ColorPickers
            primaryColor={primaryColor}
            bgColor={bgColor}
            onPrimaryChange={setPrimaryColor}
            onBgChange={setBgColor}
            onReset={resetColors}
            disabled={isLocked}
            defaultPrimaryColor={currentThemeConfig.colors.primary}
            defaultBgColor={currentThemeConfig.colors.background}
          />
        </div>

        {/* Premium overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark shadow-sm">
              PREMIUM
            </span>
          </div>
        )}
      </div>

      {/* Save button (outside blur) */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="updateTheme" />
          <input type="hidden" name="biolinkId" value={biolinkId} />
          <input type="hidden" name="theme" value={selectedTheme} />
          {primaryColor && <input type="hidden" name="primaryColor" value={primaryColor} />}
          {bgColor && <input type="hidden" name="bgColor" value={bgColor} />}

          <NeoBrutalButton
            type="submit"
            disabled={!hasChanges || isLocked || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t('saving') : t('customization_save')}
          </NeoBrutalButton>
        </fetcher.Form>
      </div>
    </NeoBrutalCard>
  )
}
