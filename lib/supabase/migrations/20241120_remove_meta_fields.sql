-- Migration: Remove Meta (Facebook) Ads integration fields from users table
-- Date: 2024-11-20
-- Description: Removes deprecated Meta/Facebook Ads columns as part of transition to Google Ads

-- Remove Meta Ads credential columns from users table
ALTER TABLE public.users
DROP COLUMN IF EXISTS meta_access_token,
DROP COLUMN IF EXISTS meta_token_expires_at,
DROP COLUMN IF EXISTS meta_ad_account_id;

-- Add comment to document the change
COMMENT ON TABLE public.users IS 'User accounts with Google Ads integration (Meta integration removed 2024-11-20)';
