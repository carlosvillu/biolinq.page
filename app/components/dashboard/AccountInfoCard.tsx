import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { PremiumBadge } from './PremiumBadge'
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard'

interface AccountInfoCardProps {
  user: {
    email: string
    name: string | null
    image: string | null
    isPremium: boolean
    createdAt: Date
  }
  biolink: {
    username: string
    customDomain: string | null
  }
}

export function AccountInfoCard({ user, biolink }: AccountInfoCardProps) {
  const { t } = useTranslation()
  const { copy, copied } = useCopyToClipboard({ copiedResetMs: 2000 })

  // Compute BioLink URL
  const bioLinkUrl = biolink.customDomain
    ? `https://${biolink.customDomain}`
    : `https://biolinq.page/${biolink.username}`

  // Format creation date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(user.createdAt))

  return (
    <NeoBrutalCard variant="white">
      <div className="space-y-6">
        {/* Avatar Section */}
        {user.image && (
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-neo-dark rounded-full translate-x-1 translate-y-1" />
              <img
                src={user.image}
                alt={user.name || user.email}
                className="relative z-10 w-20 h-20 rounded-full border-[3px] border-neo-dark"
              />
            </div>
          </div>
        )}

        {/* User Info Section */}
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
              {t('account_info_email')}
            </label>
            <p className="text-base font-medium text-neo-dark">{user.email}</p>
          </div>

          {/* Name */}
          {user.name && (
            <div>
              <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                {t('account_info_name')}
              </label>
              <p className="text-base font-medium text-neo-dark">{user.name}</p>
            </div>
          )}

          {/* Created At */}
          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
              {t('account_info_created')}
            </label>
            <p className="text-base font-medium text-neo-dark">{formattedDate}</p>
          </div>

          {/* Premium Status */}
          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t('account_info_premium_status')}
            </label>
            <PremiumBadge isPremium={user.isPremium} />
          </div>
        </div>

        {/* BioLink URL Section */}
        <div className="border-t-[3px] border-neo-dark pt-6">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            {t('account_biolink_label')}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-medium text-neo-dark break-all">{bioLinkUrl}</p>
            <NeoBrutalButton
              variant="secondary"
              size="sm"
              onClick={() => copy(bioLinkUrl)}
            >
              {copied ? t('account_copy_url_copied') : t('account_copy_url')}
            </NeoBrutalButton>
          </div>
        </div>

        {/* Actions Section */}
        <div className="border-t-[3px] border-neo-dark pt-6">
          <NeoBrutalButton variant="secondary" size="md" asChild>
            <Link to="/dashboard">{t('account_back_to_dashboard')}</Link>
          </NeoBrutalButton>
        </div>
      </div>
    </NeoBrutalCard>
  )
}
