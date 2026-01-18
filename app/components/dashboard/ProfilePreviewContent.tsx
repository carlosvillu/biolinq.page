import { useTranslation } from 'react-i18next'

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

interface ProfilePreviewContentProps {
  userName?: string | null
  userImage?: string | null
  links: Link[]
}

export function ProfilePreviewContent({
  userName,
  userImage,
  links,
}: ProfilePreviewContentProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full min-h-full flex flex-col p-6 items-center">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full border-[3px] border-neo-dark overflow-hidden mb-4 shadow-hard">
        {userImage ? (
          <img
            src={userImage}
            alt={userName || 'User'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold">
            {userName?.charAt(0) || '?'}
          </div>
        )}
      </div>

      {/* Name */}
      <h1 className="text-xl font-black mb-1">{userName || 'Your Name'}</h1>
      <p className="text-sm text-gray-600 mb-8 text-center max-w-[200px]">
        {t('dashboard_preview_bio_placeholder')}
      </p>

      {/* Links */}
      <div className="w-full space-y-4 flex-1">
        {links.map((link) => (
          <div
            key={link.id}
            className="block w-full bg-white border-[3px] border-neo-dark p-3 text-center font-bold shadow-[4px_4px_0_0_#000]"
          >
            {link.emoji} {link.title}
          </div>
        ))}

        {links.length === 0 && (
          <div className="text-center text-gray-400 text-sm font-mono py-8">
            {t('dashboard_preview_no_links')}
          </div>
        )}
      </div>

      {/* Watermark */}
      <div className="mt-8 text-[10px] text-gray-400 font-mono text-center">
        Made with BioLinq.page
      </div>
    </div>
  )
}
