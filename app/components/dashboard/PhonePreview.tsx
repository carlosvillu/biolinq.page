import { useTranslation } from 'react-i18next'
import { ProfilePreviewContent } from './ProfilePreviewContent'

interface Link {
  id: string
  title: string
  url: string
  emoji: string | null
  position: number
  totalClicks: number
  biolinkId: string
  createdAt: Date
  updatedAt: Date
}

interface PhonePreviewProps {
  userName?: string | null
  userImage?: string | null
  links: Link[]
}

export function PhonePreview({
  userName,
  userImage,
  links,
}: PhonePreviewProps) {
  const { t } = useTranslation()

  return (
    <div className="hidden lg:flex flex-col items-center sticky top-8 h-[calc(100vh-4rem)]">
      {/* Live preview indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full border border-neo-dark animate-pulse" />
        <span className="font-mono text-sm">{t('dashboard_live_preview')}</span>
      </div>

      {/* Phone Frame */}
      <div className="relative w-[320px] h-[640px] border-[4px] border-neo-dark rounded-[2.5rem] bg-neo-dark shadow-hard-lg overflow-hidden p-2">
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2rem] overflow-y-auto overflow-x-hidden">
          <ProfilePreviewContent
            userName={userName}
            userImage={userImage}
            links={links}
          />
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neo-dark rounded-b-xl z-20" />
      </div>
    </div>
  )
}
