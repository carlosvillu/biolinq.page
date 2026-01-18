import { z } from 'zod'

type TranslationFn = (key: string) => string

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

export const createUsernameSchema = (t: TranslationFn) =>
  z
    .string()
    .trim()
    .min(3, t('username_too_short'))
    .max(20, t('username_too_long'))
    .regex(USERNAME_REGEX, t('username_invalid_chars'))
    .transform((value) => value.toLowerCase())
