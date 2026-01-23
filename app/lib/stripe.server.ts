import Stripe from 'stripe'

// Runtime validation of required environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripePriceId = process.env.STRIPE_PRICE_ID
if (!stripePriceId) {
  throw new Error('Missing STRIPE_PRICE_ID environment variable')
}

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!stripeWebhookSecret) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
}

// Initialize Stripe client
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

export const STRIPE_PRICE_ID = stripePriceId
export const STRIPE_WEBHOOK_SECRET = stripeWebhookSecret
