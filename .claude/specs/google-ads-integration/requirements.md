# Requirements Document

## Introduction

This feature replaces the existing Meta (Facebook) Ads integration with Google Ads integration, allowing users to connect their Google Ads accounts, import their ad campaigns and creatives, and view performance metrics within the Ad Intelligence platform. The integration will use Google Ads API to authenticate users via OAuth 2.0, retrieve ad data, and sync performance metrics to the existing creatives database schema.

## Requirements

### 1. Google Ads Account Connection

#### 1.1 OAuth Authentication Flow
**User Story:** As a user, I want to connect my Google Ads account using OAuth, so that I can securely authorize the app to access my ad data.

**Acceptance Criteria:**
1. WHEN a user clicks "Connect Google Ads" THEN the system SHALL redirect to Google's OAuth consent screen with appropriate scopes
2. WHEN Google returns an authorization code THEN the system SHALL exchange it for access and refresh tokens
3. WHEN tokens are received THEN the system SHALL store the refresh token encrypted in the database
4. IF the OAuth flow fails THEN the system SHALL display a clear error message and redirect to dashboard
5. WHEN connection succeeds THEN the system SHALL retrieve and store the user's Google Ads customer ID

#### 1.2 Token Management
**User Story:** As a user, I want my Google Ads connection to remain active without frequent re-authentication, so that I can access my data reliably.

**Acceptance Criteria:**
1. WHEN an access token expires THEN the system SHALL automatically refresh it using the stored refresh token
2. IF the refresh token is invalid or revoked THEN the system SHALL notify the user to reconnect their account
3. WHEN a user disconnects their account THEN the system SHALL delete all stored Google tokens

#### 1.3 Account Selection
**User Story:** As a user with multiple Google Ads accounts, I want to select which account to use, so that I can import ads from the correct account.

**Acceptance Criteria:**
1. WHEN a user has multiple Google Ads customer accounts THEN the system SHALL display a selection interface
2. WHEN a user selects an account THEN the system SHALL store the selected customer ID as their default
3. WHEN a user wants to switch accounts THEN the system SHALL allow changing the selected account from settings

### 2. Ad Import Functionality

#### 2.1 Import User's Ads
**User Story:** As a user, I want to import my Google Ads campaigns and ads, so that I can analyze their performance in the platform.

**Acceptance Criteria:**
1. WHEN a user initiates ad import THEN the system SHALL retrieve all active ads from their Google Ads account
2. WHEN ads are retrieved THEN the system SHALL map Google Ad data to the creatives table schema
3. WHEN importing ads THEN the system SHALL store: ad ID, campaign name, ad group name, headlines, descriptions, final URLs, and display URL
4. IF an ad already exists in the database THEN the system SHALL update its data rather than create a duplicate
5. WHEN import completes THEN the system SHALL display a summary of imported/updated ads

#### 2.2 Performance Metrics Sync
**User Story:** As a user, I want to see performance metrics for my imported Google Ads, so that I can analyze their effectiveness.

**Acceptance Criteria:**
1. WHEN importing ads THEN the system SHALL retrieve performance metrics: impressions, clicks, cost, conversions, CTR, and average CPC
2. WHEN metrics are retrieved THEN the system SHALL store them in the creatives.performance JSON field
3. WHEN a user views an imported ad THEN the system SHALL display available performance metrics
4. IF metrics are unavailable for an ad THEN the system SHALL display "No data available" for those fields

#### 2.3 Import Filtering
**User Story:** As a user, I want to filter which ads to import, so that I can focus on relevant campaigns.

**Acceptance Criteria:**
1. WHEN initiating import THEN the system SHALL allow filtering by date range
2. WHEN initiating import THEN the system SHALL allow filtering by campaign status (active, paused, all)
3. WHEN filters are applied THEN the system SHALL only import ads matching the criteria

### 3. Database Schema Updates

#### 3.1 User Table Modifications
**User Story:** As a system, I need to store Google Ads credentials securely, so that users can maintain persistent connections.

**Acceptance Criteria:**
1. WHEN the migration runs THEN the system SHALL add columns: google_refresh_token, google_access_token, google_token_expires_at, google_customer_id
2. WHEN the migration runs THEN the system SHALL remove deprecated Meta columns: meta_access_token, meta_token_expires_at, meta_ad_account_id
3. WHEN storing tokens THEN the system SHALL encrypt sensitive credential data

#### 3.2 Creatives Table Compatibility
**User Story:** As a system, I need to store Google Ads data in the existing creatives schema, so that the AI analysis features continue to work.

**Acceptance Criteria:**
1. WHEN storing Google Ads THEN the system SHALL use the existing creatives table structure
2. WHEN storing ad copy THEN the system SHALL concatenate headlines and descriptions into the ad_copy field
3. WHEN storing performance data THEN the system SHALL map Google metrics to the existing performance JSON structure

### 4. UI/UX Updates

#### 4.1 Dashboard Integration
**User Story:** As a user, I want the dashboard to reflect Google Ads integration, so that I have a clear understanding of my connected account.

**Acceptance Criteria:**
1. WHEN a user views the dashboard THEN the system SHALL display Google Ads connection status
2. WHEN connected THEN the system SHALL display the connected Google Ads account name/ID
3. WHEN not connected THEN the system SHALL display a "Connect Google Ads" button

#### 4.2 Import Interface
**User Story:** As a user, I want clear instructions for importing Google Ads, so that I can successfully import my ad data.

**Acceptance Criteria:**
1. WHEN a user navigates to import THEN the system SHALL display Google Ads-specific instructions
2. WHEN import is in progress THEN the system SHALL display a loading state with progress indication
3. WHEN import fails THEN the system SHALL display actionable error messages

#### 4.3 Remove Meta References
**User Story:** As a user, I want consistent branding that reflects Google Ads, so that the interface is not confusing.

**Acceptance Criteria:**
1. WHEN the feature is deployed THEN the system SHALL remove all Meta/Facebook branding and references
2. WHEN displaying help text THEN the system SHALL reference Google Ads terminology and concepts

### 5. Error Handling and Edge Cases

#### 5.1 API Error Handling
**User Story:** As a user, I want clear feedback when errors occur, so that I can understand and resolve issues.

**Acceptance Criteria:**
1. IF Google Ads API returns a rate limit error THEN the system SHALL retry with exponential backoff
2. IF Google Ads API returns an authentication error THEN the system SHALL prompt user to reconnect
3. IF Google Ads API returns a permission error THEN the system SHALL display specific missing permission details
4. WHEN any API error occurs THEN the system SHALL log the error details for debugging

#### 5.2 Data Validation
**User Story:** As a system, I need to validate imported data, so that the database maintains integrity.

**Acceptance Criteria:**
1. WHEN importing ads THEN the system SHALL validate required fields before database insertion
2. IF an ad has missing required data THEN the system SHALL skip that ad and log a warning
3. WHEN import completes with skipped ads THEN the system SHALL report how many ads were skipped and why

### 6. Security Requirements

#### 6.1 Credential Security
**User Story:** As a user, I want my Google credentials stored securely, so that my account is protected.

**Acceptance Criteria:**
1. WHEN storing refresh tokens THEN the system SHALL encrypt them at rest
2. WHEN transmitting tokens THEN the system SHALL use HTTPS only
3. WHEN a user deletes their account THEN the system SHALL delete all associated Google credentials

#### 6.2 Scope Minimization
**User Story:** As a user, I want the app to request only necessary permissions, so that my data exposure is minimized.

**Acceptance Criteria:**
1. WHEN requesting OAuth consent THEN the system SHALL request only the google-ads scope
2. WHEN accessing data THEN the system SHALL only retrieve ad and performance data, not billing or user profile data

## Non-Functional Requirements

### Performance
- Ad import should complete within 30 seconds for accounts with up to 100 ads
- Token refresh should complete within 2 seconds
- API calls should implement appropriate timeouts (10 seconds default)

### Reliability
- Failed imports should be retryable without data corruption
- Token refresh failures should not block other user operations

### Compatibility
- Must work with Google Ads API v17 or later
- Must support all Google Ads account types (Standard, Manager accounts)
