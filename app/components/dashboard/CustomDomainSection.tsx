import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { cn } from '~/lib/utils'
import { useAnalytics } from '~/hooks/useAnalytics'

interface CustomDomainSectionProps {
  biolinkId: string
  customDomain: string | null
  domainVerificationToken: string | null
  domainOwnershipVerified: boolean
  cnameVerified: boolean
  isPremium: boolean
}

export function CustomDomainSection({
  biolinkId,
  customDomain,
  domainVerificationToken,
  domainOwnershipVerified,
  cnameVerified,
  isPremium,
}: CustomDomainSectionProps) {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  const [domainInput, setDomainInput] = useState(customDomain ?? '')
  const { trackCustomDomainSet, trackCustomDomainVerified, trackCustomDomainRemoved } =
    useAnalytics()
  const prevFetcherDataRef = useRef<typeof fetcherData>(undefined)

  const isLocked = !isPremium
  const isSubmitting = fetcher.state !== 'idle'

  const fetcherData = fetcher.data as
    | {
        error?: string
        ownershipVerified?: boolean
        cnameVerified?: boolean
        verificationToken?: string
      }
    | undefined

  const currentOwnershipVerified = fetcherData?.ownershipVerified ?? domainOwnershipVerified
  const currentCnameVerified = fetcherData?.cnameVerified ?? cnameVerified
  const currentToken = fetcherData?.verificationToken ?? domainVerificationToken

  useEffect(() => {
    const prev = prevFetcherDataRef.current
    if (fetcherData && fetcherData !== prev) {
      if (fetcherData.verificationToken && !fetcherData.error) {
        trackCustomDomainSet(domainInput)
      }
      if (fetcherData.ownershipVerified === true && prev?.ownershipVerified !== true) {
        trackCustomDomainVerified('ownership')
      }
      if (fetcherData.cnameVerified === true && prev?.cnameVerified !== true) {
        trackCustomDomainVerified('cname')
      }
    }
    prevFetcherDataRef.current = fetcherData
  }, [fetcherData, domainInput, trackCustomDomainSet, trackCustomDomainVerified])

  return (
    <NeoBrutalCard variant="white">
      <h3 className="text-lg font-bold mb-2">{t('custom_domain_title')}</h3>
      <p className="text-sm text-gray-600 mb-6">{t('custom_domain_description')}</p>

      <div className="relative">
        <div className={cn(isLocked && 'opacity-50 blur-[1px] select-none pointer-events-none')}>
          {customDomain ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 border border-gray-300">
                  {customDomain}
                </span>

                {!currentOwnershipVerified && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 border border-yellow-300">
                    {t('custom_domain_ownership_pending')}
                  </span>
                )}
                {currentOwnershipVerified && !currentCnameVerified && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 border border-yellow-300">
                    {t('custom_domain_cname_pending')}
                  </span>
                )}
                {currentOwnershipVerified && currentCnameVerified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 border border-green-300">
                    {t('custom_domain_verified')}
                  </span>
                )}
              </div>

              {!currentOwnershipVerified && (
                <>
                  <div className="bg-blue-50 border border-blue-200 p-4">
                    <h4 className="font-bold text-sm mb-2">{t('custom_domain_ownership_title')}</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {t('custom_domain_ownership_instruction')}
                    </p>
                    <code className="block text-xs bg-white p-2 border border-gray-300 font-mono break-all">
                      TXT _biolinq-verify.{customDomain} → {currentToken}
                    </code>
                  </div>

                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="verifyDomainOwnership" />
                    <input type="hidden" name="biolinkId" value={biolinkId} />
                    <NeoBrutalButton type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting
                        ? t('custom_domain_verifying')
                        : t('custom_domain_verify_ownership')}
                    </NeoBrutalButton>
                  </fetcher.Form>

                  {fetcherData?.ownershipVerified === false && (
                    <p className="text-sm text-red-600">
                      {t('custom_domain_error_TXT_RECORD_NOT_FOUND')}
                    </p>
                  )}
                </>
              )}

              {currentOwnershipVerified && !currentCnameVerified && (
                <>
                  <div className="bg-green-50 border border-green-200 p-4">
                    <h4 className="font-bold text-sm mb-2">
                      {t('custom_domain_ownership_verified_title')}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {t('custom_domain_cname_instruction')}
                    </p>
                    <code className="block text-xs bg-white p-2 border border-gray-300 font-mono">
                      CNAME {customDomain} → biolinq.page
                    </code>
                  </div>

                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="verifyCNAME" />
                    <input type="hidden" name="biolinkId" value={biolinkId} />
                    <NeoBrutalButton type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting
                        ? t('custom_domain_verifying')
                        : t('custom_domain_verify_cname')}
                    </NeoBrutalButton>
                  </fetcher.Form>

                  {fetcherData?.cnameVerified === false && (
                    <p className="text-sm text-red-600">
                      {t('custom_domain_error_CNAME_NOT_FOUND')}
                    </p>
                  )}
                </>
              )}

              {currentOwnershipVerified && currentCnameVerified && (
                <div className="bg-green-50 border border-green-200 p-4">
                  <h4 className="font-bold text-sm mb-2">{t('custom_domain_live_title')}</h4>
                  <p className="text-sm text-gray-700">{t('custom_domain_live_message')}</p>
                </div>
              )}

              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="removeCustomDomain" />
                <input type="hidden" name="biolinkId" value={biolinkId} />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                  onClick={() => trackCustomDomainRemoved()}
                >
                  {t('custom_domain_remove')}
                </button>
              </fetcher.Form>
            </div>
          ) : (
            <fetcher.Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="setCustomDomain" />
              <input type="hidden" name="biolinkId" value={biolinkId} />

              <div>
                <label htmlFor="domain" className="block text-sm font-medium mb-1">
                  {t('custom_domain_label')}
                </label>
                <input
                  id="domain"
                  name="domain"
                  type="text"
                  placeholder="links.yourdomain.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-neo-dark bg-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{t('custom_domain_hint')}</p>
              </div>

              {fetcherData?.error && (
                <p className="text-sm text-red-600">
                  {t(`custom_domain_error_${fetcherData.error}`)}
                </p>
              )}

              <NeoBrutalButton
                type="submit"
                disabled={!domainInput || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? t('saving') : t('custom_domain_save')}
              </NeoBrutalButton>
            </fetcher.Form>
          )}
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark shadow-sm">
              PREMIUM
            </span>
          </div>
        )}
      </div>
    </NeoBrutalCard>
  )
}
