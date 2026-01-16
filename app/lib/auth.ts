import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db, schema } from '~/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
    usePlural: true,
  }),

  basePath: '/api/auth',

  trustedOrigins: [
    'https://[project-name].netlify.app', // production
    'http://localhost:2025', // dev server
    'http://localhost:4000', // test worker 0
    'http://localhost:4001', // test worker 1
    'http://localhost:4002', // test worker 2
    'http://localhost:4003', // test worker 3
    'http://localhost:4004', // test worker 4
    'http://localhost:4005', // test worker 5
    'http://localhost:4006', // test worker 6
    'http://localhost:4007', // test worker 7
    'http://localhost:4008', // test worker 8
    'http://localhost:4009', // test worker 9
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      disableImplicitSignUp: true,
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  onAPIError: {
    errorURL: '/auth/login',
  },
})

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
