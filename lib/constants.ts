/**
 * Application-wide constants
 * Centralized location for all magic strings and numbers
 */

// Freemium Tier Limits
export const FREE_TIER_ANALYSIS_LIMIT = 5;
export const PRO_TIER_PRICE = 29; // USD per month

// Payment Status
export const PAYMENT_STATUS = {
  FREE: 'free',
  PAID: 'paid',
} as const;

// Payment Transaction Status
export const PAYMENT_TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

// Creative Source Types
export const CREATIVE_SOURCE = {
  OWN: 'own',
  COMPETITOR: 'competitor',
} as const;

// API Routes
export const API_ROUTES = {
  ANALYZE: '/api/analyze',
  STRIPE_CHECKOUT: '/api/stripe/checkout',
  STRIPE_WEBHOOK: '/api/stripe/webhook',
  GOOGLE_CONNECT: '/api/google/connect',
  GOOGLE_IMPORT_ADS: '/api/google/import-ads',
  GOOGLE_DISCONNECT: '/api/google/disconnect',
} as const;

// App Routes
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  DASHBOARD: '/dashboard',
  DASHBOARD_IMPORT: '/dashboard/import',
  DASHBOARD_ANALYZE: (id: string) => `/dashboard/analyze/${id}`,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  ANALYSIS_FAILED: 'Analysis failed',
  ANALYSIS_LIMIT_REACHED: 'You have reached your free analysis limit. Upgrade to Pro for unlimited analyses.',
  CHECKOUT_FAILED: 'Failed to create checkout session',
  WEBHOOK_INVALID_SIGNATURE: 'Invalid signature',
  WEBHOOK_HANDLER_FAILED: 'Webhook handler failed',
  USER_PROFILE_FAILED: 'Failed to get user profile',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: 'Analysis complete',
  PAYMENT_SUCCESS: 'Payment successful! You now have unlimited analyses.',
  WEBHOOK_RECEIVED: 'Webhook received',
} as const;

// Stripe Webhook Events
export const STRIPE_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
} as const;

// Google Ads API Configuration
export const GOOGLE_CONFIG = {
  API_VERSION: 'v17',
  OAUTH_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
  ADS_API_ENDPOINT: 'https://googleads.googleapis.com',
  SCOPES: ['https://www.googleapis.com/auth/adwords'],
  REDIRECT_URI: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/google/connect',
  TOKEN_EXPIRY_SECONDS: 3600, // 1 hour
} as const;

// AI Analysis Configuration
export const AI_CONFIG = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_AD_COPY_LENGTH: 5000,
  MAX_CTA_LENGTH: 100,
} as const;

// Database Table Names (for reference)
export const DB_TABLES = {
  USERS: 'users',
  CREATIVES: 'creatives',
  ANALYSIS: 'analysis',
  PAYMENTS: 'payments',
} as const;

// HTTP Status Codes (common ones)
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Type exports for constant objects
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type PaymentTransactionStatus = typeof PAYMENT_TRANSACTION_STATUS[keyof typeof PAYMENT_TRANSACTION_STATUS];
export type CreativeSource = typeof CREATIVE_SOURCE[keyof typeof CREATIVE_SOURCE];
export type StripeEvent = typeof STRIPE_EVENTS[keyof typeof STRIPE_EVENTS];
