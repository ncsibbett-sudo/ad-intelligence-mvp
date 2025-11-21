-- Migration: Add Google Ads integration fields to users table
-- Date: 2024-11-20
-- Description: Adds columns for storing Google Ads OAuth credentials and customer information
--              This is Phase 1 of the Google Ads migration - Meta fields are retained for backward compatibility

-- Add Google Ads credential columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_customer_id TEXT,
ADD COLUMN IF NOT EXISTS google_account_name TEXT;

-- Create index on google_customer_id for improved query performance
CREATE INDEX IF NOT EXISTS idx_users_google_customer_id ON public.users(google_customer_id);

-- Add comment to document the columns
COMMENT ON COLUMN public.users.google_refresh_token IS 'Google OAuth refresh token (long-lived, encrypted at rest)';
COMMENT ON COLUMN public.users.google_access_token IS 'Google OAuth access token (short-lived, 1 hour expiry)';
COMMENT ON COLUMN public.users.google_token_expires_at IS 'Timestamp when the access token expires';
COMMENT ON COLUMN public.users.google_customer_id IS 'Google Ads customer ID (format: 1234567890)';
COMMENT ON COLUMN public.users.google_account_name IS 'Descriptive name of the connected Google Ads account';
