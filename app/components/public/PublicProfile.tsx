import { useTranslation } from 'react-i18next'
import type { Biolink } from '~/db/schema/biolinks'
import type { Link } from '~/db/schema/links'
import { PublicLinkCard } from './PublicLinkCard'
import { Watermark } from './Watermark'

type PublicProfileProps = {
  user: {
    name: string | null
    image: string | null
    isPremium: boolean
  }
  biolink: Pick<Biolink, 'username'>
  links: Link[]
}

export function PublicProfile({ user, biolink, links }: PublicProfileProps) {
  const { t } = useTranslation()
  const displayName = user.name ?? biolink.username

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-24 h-24 rounded-full border-[3px] border-dark shadow-[4px_4px_0_0_rgba(0,0,0,1)]
            overflow-hidden bg-white flex items-center justify-center mb-4"
          >
            {user.image ? (
              <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-dark">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-center text-dark">{displayName}</h1>

          <p className="font-mono text-sm text-gray-600">@{biolink.username}</p>
        </div>

        <div className="space-y-4">
          {links.map((link) => (
            <PublicLinkCard key={link.id} link={link} />
          ))}

          {links.length === 0 && (
            <p className="text-center text-gray-500 py-8">{t('public_no_links')}</p>
          )}
        </div>
      </div>

      {!user.isPremium && <Watermark />}
    </main>
  )
}
