-- Rollback Migration: Remove Google Ads integration fields from users table
-- Date: 2024-11-20
-- Description: Removes Google Ads columns added in 20241120_add_google_ads_fields.sql
--              Use this to rollback the Google Ads integration if needed

-- Drop the index first
DROP INDEX IF EXISTS idx_users_google_customer_id;

-- Remove Google Ads credential columns from users table
ALTER TABLE public.users
DROP COLUMN IF EXISTS google_refresh_token,
DROP COLUMN IF EXISTS google_access_token,
DROP COLUMN IF EXISTS google_token_expires_at,
DROP COLUMN IF EXISTS google_customer_id,
DROP COLUMN IF EXISTS google_account_name;
