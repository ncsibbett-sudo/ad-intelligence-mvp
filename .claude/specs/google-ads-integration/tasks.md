# Implementation Plan

- [x] 1. Set up project structure and type definitions
  - Create `/lib/google/` directory structure
  - Add Google-specific TypeScript interfaces to `/lib/google/types.ts`
  - Add Google configuration constants to `/lib/constants.ts`
  - _Requirements: 3.2, 5.2_

- [x] 2. Create database migration for Google Ads fields
  - Write Supabase migration to add Google credential columns to users table
  - Add columns: google_refresh_token, google_access_token, google_token_expires_at, google_customer_id, google_account_name
  - Create index on google_customer_id for performance
  - _Requirements: 3.1_

- [x] 3. Implement Google Ads API client
- [x] 3.1 Create token management functionality
  - Implement `refreshAccessToken()` method using Google OAuth token endpoint
  - Handle token expiration and automatic refresh
  - Write unit tests for token refresh success/failure scenarios
  - _Requirements: 1.2_

- [x] 3.2 Implement customer account retrieval
  - Implement `getAccessibleCustomers()` method to list user's Google Ads accounts
  - Implement `getCustomerInfo()` to get account details
  - Write unit tests for account retrieval
  - _Requirements: 1.3_

- [x] 3.3 Implement ad retrieval with GAQL queries
  - Implement `getAds()` method with filtering options (date range, campaign status)
  - Build GAQL query strings for ad and metrics retrieval
  - Map Google Ads API response to `GoogleAdData` interface
  - Convert metrics from micros to standard units
  - Write unit tests for ad retrieval and data mapping
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.4 Implement error handling and retry logic
  - Create `withRetry()` utility with exponential backoff
  - Implement `isRetryableError()` for status code checking
  - Add error logging with appropriate context
  - Write unit tests for retry behavior
  - _Requirements: 5.1_

- [x] 4. Create OAuth connect API route
- [x] 4.1 Implement authorization code exchange
  - Create `/app/api/google/connect/route.ts` GET handler
  - Extract authorization code from query parameters
  - Exchange code for access and refresh tokens via Google OAuth endpoint
  - Handle OAuth errors and invalid codes
  - _Requirements: 1.1_

- [x] 4.2 Implement credential storage
  - Fetch accessible customer accounts after token exchange
  - Store refresh token and default customer ID in Supabase
  - Handle multi-account scenarios (store first account as default)
  - Redirect to dashboard with success/error status
  - Write integration tests for complete OAuth flow
  - _Requirements: 1.1, 1.3, 6.1_

- [x] 5. Create ad import API route
- [x] 5.1 Implement import endpoint handler
  - Create `/app/api/google/import-ads/route.ts` POST handler
  - Authenticate user via Supabase Auth
  - Retrieve user's Google credentials from database
  - Parse filter parameters (dateRange, campaignStatus)
  - _Requirements: 2.1, 2.3_

- [x] 5.2 Implement ad mapping and storage
  - Initialize GoogleAdsClient with user's credentials
  - Fetch ads with applied filters
  - Map GoogleAdData to creatives table schema (concatenate headlines/descriptions to ad_copy)
  - Map performance metrics to JSON structure
  - Upsert creatives to database (update if ad_id exists)
  - Return import summary with counts
  - Write integration tests for import flow
  - _Requirements: 2.1, 2.2, 3.2, 5.2_

- [x] 6. Create disconnect API route
  - Create `/app/api/google/disconnect/route.ts` POST handler
  - Clear all Google credential fields for user
  - Return success confirmation
  - Write integration test for disconnect
  - _Requirements: 1.2, 6.1_

- [x] 7. Update dashboard UI for Google Ads
- [x] 7.1 Update connection status display
  - Modify dashboard to show Google Ads connection status
  - Display connected account name/ID when connected
  - Add "Connect Google Ads" button when not connected
  - Implement OAuth redirect URL construction with proper scopes
  - _Requirements: 4.1_

- [x] 7.2 Update import interface
  - Update `/app/dashboard/import/page.tsx` for Google Ads
  - Change labels and instructions to Google Ads terminology
  - Add filter controls for date range and campaign status
  - Show loading state during import
  - Display import results summary
  - _Requirements: 4.2_

- [x] 7.3 Remove Meta references from UI
  - Remove Meta/Facebook branding and text throughout app
  - Update help text to reference Google Ads concepts
  - Remove Meta connect button and related UI elements
  - _Requirements: 4.3_

- [x] 8. Add environment variable configuration
  - Add GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN to .env.example
  - Document required environment variables in README or setup guide
  - Add NEXT_PUBLIC_GOOGLE_ADS_ENABLED feature flag
  - _Requirements: 1.1_

- [x] 9. Create test fixtures and mocks
  - Create `/tests/fixtures/google/customers.json` with sample account data
  - Create `/tests/fixtures/google/ads.json` with sample ad responses
  - Create `/tests/fixtures/google/metrics.json` with performance data
  - Create `/tests/fixtures/google/errors.json` with error responses
  - Set up test environment variables
  - _Requirements: 5.1, 5.2_

- [x] 10. Write E2E tests for complete flows
  - Write E2E test for connect → import → view ads flow
  - Write E2E test for disconnect and reconnect
  - Write E2E test for import with filters
  - Verify ads appear correctly in dashboard after import
  - _Requirements: 2.1, 4.1, 4.2_

- [x] 11. Remove deprecated Meta integration code
  - Delete `/lib/meta/client.ts` and related files
  - Delete `/app/api/meta/` directory and routes
  - Remove Meta environment variables from .env.example
  - Write database migration to drop Meta columns (meta_access_token, meta_token_expires_at, meta_ad_account_id)
  - Update any remaining Meta references in codebase
  - _Requirements: 3.1, 4.3_

- [x] 12. Install required dependencies
  - Add google-auth-library package for OAuth handling
  - Add google-ads-api package for API communication (or implement REST calls directly)
  - Update package.json and run npm install
  - _Requirements: 1.1, 2.1_
