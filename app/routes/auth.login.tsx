import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { signIn } from '~/lib/auth.client'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-silver bg-paper">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-3xl">{t('login_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleAuthButton mode="login" callbackURL={searchParams.get('redirect') || '/'} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-silver" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-paper px-4 text-slate">{t('or_divider')}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email_label')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('email_placeholder')}
                        className="bg-pearl border-silver focus:border-ink"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder={t('password_placeholder')}
                        className="bg-pearl border-silver focus:border-ink"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <div className="p-4 border border-ink bg-pearl text-sm">{error}</div>}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-ink text-paper font-medium hover:bg-graphite transition-colors"
              >
                {isLoading ? t('logging_in') : t('login_title')}
              </Button>

              <p className="text-center text-slate text-sm">
                {t('no_account_prompt')}{' '}
                <Link to="/auth/signup" className="text-ink hover:underline font-medium">
                  {t('signup_link')}
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
