import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { signIn } from '~/lib/auth.client'
import { NeoBrutalButton, NeoBrutalCard, NeoBrutalInput } from '~/components/neo-brutal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { GoogleAuthButton } from '~/components/GoogleAuthButton'

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t('invalid_email')),
    password: z.string().min(8, t('password_min_length')),
  })

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle OAuth error from redirect
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      // Better Auth returns error codes like 'user_not_found' when disableImplicitSignUp is true
      if (oauthError === 'user_not_found' || oauthError === 'signup_disabled') {
        setError(t('oauth_no_account'))
      } else {
        setError(t('oauth_error'))
      }
    }
  }, [searchParams, t])

  const loginSchema = createLoginSchema(t)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        setError(t('invalid_credentials'))
        return
      }

      const redirectTo = searchParams.get('redirect') || '/'
      navigate(redirectTo)
    } catch {
      setError(t('login_error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neo-canvas flex items-center justify-center px-4">
      <NeoBrutalCard className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">
          {t('login_title')}
        </h1>

        <GoogleAuthButton mode="login" callbackURL={searchParams.get('redirect') || '/'} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t-2 border-neo-dark" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-neo-panel px-2 text-sm font-mono">{t('or_divider')}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email_label')}</FormLabel>
                  <FormControl>
                    <NeoBrutalInput type="email" placeholder={t('email_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password_label')}</FormLabel>
                  <FormControl>
                    <NeoBrutalInput
                      type="password"
                      placeholder={t('password_placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="p-4 border-[3px] border-neo-accent bg-neo-accent/10 text-sm">
                {error}
              </div>
            )}

            <NeoBrutalButton type="submit" disabled={isLoading} variant="primary" className="w-full">
              {isLoading ? t('logging_in') : t('login_title')}
            </NeoBrutalButton>

            <p className="text-center text-sm mt-6">
              {t('no_account_prompt')}{' '}
              <Link to="/auth/signup" className="font-bold underline">
                {t('signup_link')}
              </Link>
            </p>
          </form>
        </Form>
      </NeoBrutalCard>
    </div>
  )
}
