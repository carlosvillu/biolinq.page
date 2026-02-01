import { desc } from 'drizzle-orm'
import { db } from '~/db'
import { feedbacks, ALLOWED_EMOJIS, type AllowedEmoji, type Feedback } from '~/db/schema/feedback'

export interface CreateFeedbackInput {
  emoji: AllowedEmoji
  text?: string | null
  userId?: string | null
  username?: string | null
  page?: string | null
}

export type CreateFeedbackResult =
  | { success: true; feedbackId: string }
  | { success: false; error: 'INVALID_EMOJI' }

export async function createFeedback(input: CreateFeedbackInput): Promise<CreateFeedbackResult> {
  if (!ALLOWED_EMOJIS.includes(input.emoji as AllowedEmoji)) {
    return { success: false, error: 'INVALID_EMOJI' }
  }

  const [feedback] = await db
    .insert(feedbacks)
    .values({
      emoji: input.emoji,
      text: input.text ?? null,
      userId: input.userId ?? null,
      username: input.username ?? null,
      page: input.page ?? null,
    })
    .returning({ id: feedbacks.id })

  return { success: true, feedbackId: feedback.id }
}

export async function getAllFeedbacks(): Promise<Feedback[]> {
  return db.select().from(feedbacks).orderBy(desc(feedbacks.createdAt))
}
