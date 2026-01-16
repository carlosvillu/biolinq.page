import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { signUp } from '~/lib/auth.client'
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

const createSignupSchema = (t: (key: string) => string) =>
  z
    .object({
      email: z.string().email(t('invalid_email')),
      password: z.string().min(8, t('password_min_length')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwords_dont_match'),
      path: ['confirmPassword'],
    })

type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>

export default function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()

  const signupSchema = createSignupSchema(t)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.email.split('@')[0],
      })

      if (result.error) {
        setError(result.error.message || t('signup_error'))
        return
      }

      navigate('/')
    } catch {
      setError(t('signup_error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{t('signup_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleAuthButton mode="signup" callbackURL={searchParams.get('redirect') || '/'} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">{t('or_divider')}</span>
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
                      <Input type="email" placeholder={t('email_placeholder')} {...field} />
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
                        placeholder={t('password_placeholder_signup')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirm_password_label')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('confirm_password_placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-4 border border-destructive bg-destructive/10 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? t('creating_account') : t('signup_title')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('have_account_prompt')}{' '}
                <Link to="/auth/login" className="hover:underline font-medium">
                  {t('login_link')}
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
