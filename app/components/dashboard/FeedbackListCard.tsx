import { useTranslation } from 'react-i18next'
import type { Feedback } from '~/db/schema/feedback'

interface FeedbackListCardProps {
  feedbacks: Feedback[]
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays}d ago`
  } else if (diffHours > 0) {
    return `${diffHours}h ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`
  }
  return 'Just now'
}

export function FeedbackListCard({ feedbacks }: FeedbackListCardProps) {
  const { t } = useTranslation()

  return (
    <section className="border-t-[3px] border-neo-dark pt-8 mt-8">
      <h2 className="text-xl font-bold text-neo-dark mb-2">{t('admin_feedback_title')}</h2>
      <p className="text-gray-700 mb-6">{t('admin_feedback_subtitle', { count: feedbacks.length })}</p>

      {feedbacks.length === 0 ? (
        <div className="bg-white border-[3px] border-neo-dark rounded p-6 text-center">
          <p className="text-gray-500 italic">{t('admin_feedback_empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white border-[3px] border-neo-dark rounded p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{feedback.emoji}</span>
                <span className="text-sm text-neo-dark/60">
                  {formatRelativeTime(feedback.createdAt)}
                </span>
              </div>

              <p className={`text-neo-dark ${!feedback.text ? 'italic text-neo-dark/50' : ''}`}>
                {feedback.text || t('admin_feedback_no_comment')}
              </p>

              {feedback.username && (
                <p className="text-xs text-neo-dark/50 mt-2">
                  {t('admin_feedback_from_page', { page: `/${feedback.username}` })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
