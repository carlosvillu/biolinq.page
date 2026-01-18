import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Link } from '~/db/schema/links'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { LinkItem } from './LinkItem'
import { AddLinkDialog } from './AddLinkDialog'

interface LinksListProps {
  links: Link[]
  biolinkId: string
  maxLinks: number
  error?: string
}

export function LinksList({
  links,
  biolinkId,
  maxLinks,
  error,
}: LinksListProps) {
  const { t } = useTranslation()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const canAddMore = links.length < maxLinks

  return (
    <>
      <NeoBrutalCard variant="panel">
        <header className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {t('dashboard_my_links')} ({links.length}/{maxLinks})
          </h2>
        </header>

        {error ? (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          {links.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('dashboard_no_links')}
            </div>
          ) : (
            links.map((link) => <LinkItem key={link.id} link={link} />)
          )}
        </div>

        <div className="mt-6">
          <NeoBrutalButton
            onClick={() => setAddDialogOpen(true)}
            disabled={!canAddMore}
            className="w-full"
          >
            + {t('dashboard_add_link')}
          </NeoBrutalButton>
        </div>
      </NeoBrutalCard>

      <AddLinkDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        biolinkId={biolinkId}
      />
    </>
  )
}
