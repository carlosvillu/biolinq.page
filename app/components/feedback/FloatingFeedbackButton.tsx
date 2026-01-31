import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FeedbackModal } from './FeedbackModal'

export function FloatingFeedbackButton() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 left-6 z-[60] group"
        aria-label={t('feedback_button_aria')}
      >
        {/* Shadow Layer */}
        <div className="absolute inset-0 bg-neo-dark rounded-full translate-x-1 translate-y-1 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />

        {/* Button Face */}
        <div className="relative z-10 w-14 h-14 bg-neo-primary border-[3px] border-neo-dark rounded-full flex items-center justify-center text-2xl transition-transform duration-200 ease-out group-hover:-translate-y-px group-hover:-translate-x-px active:translate-x-[2px] active:translate-y-[2px]">
          💬
        </div>
      </button>

      <FeedbackModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
